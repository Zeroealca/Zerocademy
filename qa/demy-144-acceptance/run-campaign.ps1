param()

$ErrorActionPreference = 'Stop'
$root = 'D:\Programacion\Zerocademy'
$evidenceRoot = Join-Path $root 'qa\demy-144-acceptance'
$compose = @('-f', 'docker-compose.yml', '-f', 'qa/docker-compose.e2e.yml')
$targets = @(
  @{ target = 'e2e/timetables-lifecycle-authorization.spec.ts'; project = 'desktop'; expectedCount = 10 },
  @{ target = 'e2e/timetables-responsive.spec.ts'; project = 'mobile'; expectedCount = 1 },
  @{ target = 'e2e/timetables-weekly-grid.spec.ts'; project = 'desktop'; expectedCount = 1 },
  @{ target = 'e2e/timetables.spec.ts'; project = 'desktop'; expectedCount = 4 },
  @{ target = 'e2e/teacher-timetables.spec.ts'; project = 'desktop'; expectedCount = 10 },
  @{ target = 'e2e/student-representative-timetables.spec.ts'; project = 'desktop'; expectedCount = 6 },
  @{ target = 'e2e/student-representative-timetables.spec.ts'; project = 'mobile'; expectedCount = 6 },
  @{ target = 'e2e/demy-144-class-sessions.spec.ts'; project = 'desktop'; expectedCount = 4 },
  @{ target = 'e2e/demy-144-class-sessions.spec.ts'; project = 'mobile'; expectedCount = 4 }
)

function Invoke-Compose([string[]]$arguments) {
  & docker compose @compose @arguments
  if ($LASTEXITCODE -ne 0) { throw "Compose command failed: $($arguments -join ' ')" }
}

function Get-E2ePreflight {
  $identity = & docker compose @compose exec -T backend node -e 'const u=new URL(process.env.DATABASE_URL); console.log(JSON.stringify({host:u.hostname,database:u.pathname.slice(1),clock:process.env.E2E_TEST_CLOCK_ENABLED,command:process.argv0}))'
  if ($LASTEXITCODE -ne 0) { throw 'Cannot read backend E2E identity.' }
  $configured = ($identity | Where-Object { $_ -match '^\{' } | Select-Object -Last 1) | ConvertFrom-Json
  $database = (& docker compose @compose exec -T postgres psql -U zerocademy -d zerocademy_e2e -Atc 'SELECT current_database();').Trim()
  if ($LASTEXITCODE -ne 0) { throw 'Cannot read live E2E database.' }
  $migration = (& docker compose @compose exec -T postgres psql -U zerocademy -d zerocademy_e2e -Atc "SELECT count(*) FROM _prisma_migrations WHERE migration_name = '20261026123000_class_session_timetable_origin' AND finished_at IS NOT NULL;").Trim()
  if ($LASTEXITCODE -ne 0) { throw 'Cannot verify DEMY-144 migration.' }
  $inspect = (& docker inspect zerocademy-backend --format '{{json .Config.Cmd}}|{{json .Config.Entrypoint}}').Trim()
  if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect E2E backend startup command.' }
  if ($configured.host -ne 'postgres' -or $configured.database -ne 'zerocademy_e2e' -or $configured.clock -ne 'true' -or $database -ne 'zerocademy_e2e' -or $migration -ne '1' -or $inspect -notmatch 'start:dev') {
    throw 'Refusing mutable campaign: E2E database, clock, migration, or backend startup command is invalid.'
  }
  return [ordered]@{ configuredHost = $configured.host; configuredDatabase = $configured.database; liveDatabase = $database; clock = $configured.clock; migrationApplied = $migration; backendStartup = $inspect }
}

function Get-HistoricalFixtures {
  $output = & docker compose @compose exec -T postgres psql -U zerocademy -d zerocademy_e2e -Atc "SELECT coalesce(json_agg(row_to_json(t) ORDER BY t.id), '[]'::json)::text FROM (SELECT id, code FROM institutions WHERE code LIKE 'BROWSER-FIXTURE-%') t;"
  if ($LASTEXITCODE -ne 0) { throw 'Cannot list historical BROWSER fixtures.' }
  return ($output | Select-Object -Last 1 | ConvertFrom-Json)
}

function Get-SourceFingerprint {
  $paths = @(
    'BackendZerocademy/src',
    'BackendZerocademy/test/helpers/schedule-structure-browser-fixture-cli.js',
    'FrontendZerocademy/src',
    'FrontendZerocademy/e2e',
    'FrontendZerocademy/playwright.config.ts',
    'qa/docker-compose.e2e.yml',
    'docker-compose.yml',
    'package.json',
    'package-lock.json',
    'qa/demy-144-acceptance/run-campaign.ps1'
  )
  $files = foreach ($relative in $paths) {
    $absolute = Join-Path $root $relative
    if (Test-Path -LiteralPath $absolute -PathType Leaf) { Get-Item -LiteralPath $absolute }
    elseif (Test-Path -LiteralPath $absolute -PathType Container) { Get-ChildItem -LiteralPath $absolute -File -Recurse }
  }
  $entries = $files | Sort-Object FullName | ForEach-Object {
    $relative = $_.FullName.Substring($root.Length + 1).Replace('\', '/')
    "$relative`t$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash)"
  }
  $sha256 = [Security.Cryptography.SHA256]::Create()
  try { (($sha256.ComputeHash([Text.Encoding]::UTF8.GetBytes(($entries -join "`n"))) | ForEach-Object { $_.ToString('x2') }) -join '') }
  finally { $sha256.Dispose() }
}

function Get-Inventory {
  $inventory = @()
  foreach ($scenario in $targets) {
    $listing = npm exec --workspace frontend-zerocademy -- playwright test $scenario.target "--project=$($scenario.project)" --list 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Inventory listing failed for $($scenario.target) / $($scenario.project)." }
    $text = $listing -join "`n"
    $match = [regex]::Match($text, 'Total:\s+(\d+)\s+test(?:s)?')
    if (-not $match.Success) { throw "Cannot parse inventory for $($scenario.target) / $($scenario.project)." }
    $count = [int]$match.Groups[1].Value
    if ($count -ne $scenario.expectedCount) { throw "Inventory mismatch for $($scenario.target) / $($scenario.project): expected $($scenario.expectedCount), got $count." }
    $inventory += [ordered]@{ target = $scenario.target; project = $scenario.project; count = $count; listing = $text }
  }
  return $inventory
}

function Assert-Cleanup([object[]]$historical) {
  $current = @(Get-HistoricalFixtures)
  $before = @($historical | ForEach-Object { $_.id } | Sort-Object)
  $after = @($current | ForEach-Object { $_.id } | Sort-Object)
  if (($before -join ',') -ne ($after -join ',')) { throw 'Historical BROWSER fixtures changed or campaign fixture leaked.' }
  $tempFiles = @(Get-ChildItem (Join-Path $root 'qa') -Filter 'schedule-structure-browser-fixture-*.local.json' -File -ErrorAction SilentlyContinue)
  if ($tempFiles.Count -ne 0) { throw 'Campaign fixture JSON artifact remains.' }
  return [ordered]@{ historicalFixtureIds = $after; temporaryFixtureJsonCount = $tempFiles.Count; campaignOwnedInstitutions = 0; campaignOwnedClassSessions = 0 }
}

Set-Location $root
New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
$lock = Join-Path $evidenceRoot 'campaign.lock'
if (Test-Path $lock) { throw 'Campaign lock exists; refusing concurrent execution.' }
New-Item -ItemType File -Path $lock | Out-Null

try {
  nvm use 22.12.0 | Out-Null
  $env:E2E_BASE_URL = 'http://127.0.0.1:3002'
  $head = (git rev-parse HEAD).Trim()
  $workingTree = @(git status --porcelain)
  $historical = @(Get-HistoricalFixtures)
  if ($historical.Count -ne 9) { throw "Expected 9 historical BROWSER fixtures, found $($historical.Count)." }
  $inventory = @(Get-Inventory)
  $total = ($inventory | Measure-Object count -Sum).Sum
  if ($total -ne 46) { throw "Expected complete inventory of 46 tests, found $total." }
  $sourceBefore = Get-SourceFingerprint
  $campaignId = "campaign-$(Get-Date -Format 'yyyyMMddTHHmmss')-$($head.Substring(0,12))"
  $evidence = Join-Path $evidenceRoot $campaignId
  New-Item -ItemType Directory -Path $evidence | Out-Null
  $metadata = [ordered]@{ campaignId = $campaignId; gitHead = $head; workingTreeStatus = $workingTree; sourceFingerprint = $sourceBefore; inventoryTotal = $total; inventory = $inventory; historicalFixtures = $historical; playwrightVersion = (& npm exec --workspace frontend-zerocademy -- playwright --version); browserProjects = @('desktop: Desktop Chrome / Chromium', 'mobile: Pixel 5 / Chromium'); startedAt = (Get-Date).ToString('o') }
  $metadata | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $evidence 'campaign-metadata.json')
  $inventory | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $evidence 'test-inventory.json')

  for ($pass = 1; $pass -le 3; $pass++) {
    $passDirectory = Join-Path $evidence "pass-$pass"
    New-Item -ItemType Directory -Path $passDirectory | Out-Null
    $preflight = Get-E2ePreflight
    $preflight | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $passDirectory 'preflight.json')
    $results = @()
    for ($index = 0; $index -lt $targets.Count; $index++) {
      $scenario = $targets[$index]
      $report = Join-Path $passDirectory ("scenario-{0:D2}.json" -f ($index + 1))
      $output = Join-Path $passDirectory ("output-{0:D2}" -f ($index + 1))
      $started = Get-Date
      npm exec --workspace frontend-zerocademy -- playwright test $scenario.target "--project=$($scenario.project)" --reporter=json "--output=$output" *> $report
      $exitCode = $LASTEXITCODE
      $json = Get-Content -Raw $report | ConvertFrom-Json
      $stats = $json.stats
      $result = [ordered]@{ target = $scenario.target; project = $scenario.project; expected = $stats.expected; skipped = $stats.skipped; unexpected = $stats.unexpected; flaky = $stats.flaky; exitCode = $exitCode; durationSeconds = [math]::Round(((Get-Date) - $started).TotalSeconds, 3) }
      $results += $result
      if ($exitCode -ne 0 -or $stats.expected -ne $scenario.expectedCount -or $stats.skipped -ne 0 -or $stats.unexpected -ne 0 -or $stats.flaky -ne 0) { throw "Pass $pass failed acceptance for $($scenario.target) / $($scenario.project)." }
    }
    $cleanup = Assert-Cleanup $historical
    [ordered]@{ pass = $pass; totalPassed = ($results | Measure-Object expected -Sum).Sum; results = $results; cleanup = $cleanup; completedAt = (Get-Date).ToString('o') } | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $passDirectory 'pass-result.json')
  }

  $sourceAfter = Get-SourceFingerprint
  if ($sourceAfter -ne $sourceBefore) { throw 'Source fingerprint changed during the three-pass campaign.' }
  $finalCleanup = Assert-Cleanup $historical
  [ordered]@{ classification = 'ACCEPTED'; totalTestsPerPass = $total; totalExecuted = $total * 3; sourceFingerprint = $sourceAfter; cleanup = $finalCleanup; completedAt = (Get-Date).ToString('o') } | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $evidence 'final-summary.json')
  Write-Output "ACCEPTED $evidence"
} finally {
  Remove-Item -LiteralPath $lock -Force -ErrorAction SilentlyContinue
}
