import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type BrowserFixture = {
  institutionId: string;
  activeAcademicPeriodId: string;
  plannedAcademicPeriodId: string;
  closedAcademicPeriodId: string;
  archivedAcademicPeriodId: string;
  admin: { email: string; password: string };
  teacher: { email: string; password: string };
};

const repositoryRoot = path.resolve(__dirname, "../..");
const fixtureFileName = `schedule-structure-browser-fixture-${process.pid}-${randomUUID()}.local.json`;
const containerPath = `/app/qa/${fixtureFileName}`;
const hostPath = path.join(repositoryRoot, "qa", fixtureFileName);
const fixtureFilePattern = /^schedule-structure-browser-fixture-(\d+)(?:-[0-9a-f-]+)?\.local\.json$/;

function runFixture(pathInContainer: string, action?: "cleanup"): void {
  const args = [
    "compose", "exec", "-T", "-e", `SCHEDULE_BROWSER_FIXTURE_PATH=${pathInContainer}`,
    "backend", "node", "BackendZerocademy/test/helpers/schedule-structure-browser-fixture-cli.js",
  ];
  if (action) args.push(action);
  execFileSync("docker", args, { cwd: repositoryRoot, stdio: "inherit" });
}

function isRunningProcess(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function cleanupInterruptedFixtures(): void {
  for (const name of readdirSync(path.join(repositoryRoot, "qa"))) {
    const match = fixtureFilePattern.exec(name);
    if (!match || isRunningProcess(Number(match[1]))) continue;

    runFixture(`/app/qa/${name}`, "cleanup");
  }
}

export function prepareBrowserFixture(): BrowserFixture {
  // Reclaim only fixture files left by terminated workers. Active workers are
  // deliberately preserved, so this remains safe if Playwright is later made
  // parallel.
  cleanupInterruptedFixtures();
  if (existsSync(hostPath)) runFixture(containerPath, "cleanup");
  runFixture(containerPath);
  return JSON.parse(readFileSync(hostPath, "utf8")) as BrowserFixture;
}

export function cleanupBrowserFixture(): void {
  if (!existsSync(hostPath)) return;
  runFixture(containerPath, "cleanup");
}
