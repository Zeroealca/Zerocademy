# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: FrontendZerocademy\e2e\student-representative-timetables.spec.ts >> DEMY-143 student and representative timetables >> HTTP: isolates published timetables between institutions
- Location: FrontendZerocademy\e2e\student-representative-timetables.spec.ts:97:7

# Error details

```
Error: Command failed: docker compose exec -T -e SCHEDULE_BROWSER_FIXTURE_PATH=/app/qa/schedule-structure-browser-fixture-34680-20529501-5815-459b-9c1c-bc9674caa985.local.json backend node BackendZerocademy/test/helpers/schedule-structure-browser-fixture-cli.js cleanup
```

# Test source

```ts
  1   | import { execFileSync } from "node:child_process";
  2   | import { randomUUID } from "node:crypto";
  3   | import { existsSync, readdirSync, readFileSync } from "node:fs";
  4   | import path from "node:path";
  5   | 
  6   | export type BrowserFixture = {
  7   |   institutionId: string;
  8   |   activeAcademicPeriodId: string;
  9   |   plannedAcademicPeriodId: string;
  10  |   closedAcademicPeriodId: string;
  11  |   archivedAcademicPeriodId: string;
  12  |   timetableId: string;
  13  |   admin: { email: string; password: string };
  14  |   teacher: { email: string; password: string };
  15  |   secondTeacher?: { email: string; password: string };
  16  |   foreignInstitutionId?: string;
  17  |   foreignTeacher?: { email: string; password: string };
  18  |   foreignTimetableId?: string;
  19  |   secondaryAcademicPeriodId?: string;
  20  |   secondaryTimetableId?: string;
  21  |   studentA?: { email: string; password: string; id: string };
  22  |   studentB?: { email: string; password: string; id: string };
  23  |   representativeA?: { email: string; password: string; studentIds: string[] };
  24  |   institutionBId?: string;
  25  |   institutionATimetableId?: string;
  26  |   institutionBTimetableId?: string;
  27  |   fixtureUsers?: string[];
  28  |   inactiveRepresentative?: { email: string; password: string };
  29  |   unlinkedRepresentative?: { email: string; password: string };
  30  |   unenrolledStudent?: { email: string; password: string };
  31  |   noTimetableStudent?: { email: string; password: string };
  32  | };
  33  | 
  34  | const repositoryRoot = path.resolve(__dirname, "../..");
  35  | const fixtureFileName = `schedule-structure-browser-fixture-${process.pid}-${randomUUID()}.local.json`;
  36  | const containerPath = `/app/qa/${fixtureFileName}`;
  37  | const hostPath = path.join(repositoryRoot, "qa", fixtureFileName);
  38  | const fixtureFilePattern =
  39  |   /^schedule-structure-browser-fixture-(\d+)(?:-[0-9a-f-]+)?\.local\.json$/;
  40  | 
  41  | function runFixture(
  42  |   pathInContainer: string,
  43  |   action?: "cleanup",
  44  |   teacherTimetableFixture = false,
  45  |   studentTimetableFixture = false,
  46  | ): void {
  47  |   const args = [
  48  |     "compose",
  49  |     "exec",
  50  |     "-T",
  51  |     "-e",
  52  |     `SCHEDULE_BROWSER_FIXTURE_PATH=${pathInContainer}`,
  53  |     ...(teacherTimetableFixture ? ["-e", "TEACHER_TIMETABLE_FIXTURE=1"] : []),
  54  |     ...(studentTimetableFixture ? ["-e", "STUDENT_TIMETABLE_FIXTURE=1"] : []),
  55  |     "backend",
  56  |     "node",
  57  |     "BackendZerocademy/test/helpers/schedule-structure-browser-fixture-cli.js",
  58  |   ];
  59  |   if (action) args.push(action);
> 60  |   execFileSync("docker", args, { cwd: repositoryRoot, stdio: "inherit" });
      |               ^ Error: Command failed: docker compose exec -T -e SCHEDULE_BROWSER_FIXTURE_PATH=/app/qa/schedule-structure-browser-fixture-34680-20529501-5815-459b-9c1c-bc9674caa985.local.json backend node BackendZerocademy/test/helpers/schedule-structure-browser-fixture-cli.js cleanup
  61  | }
  62  | 
  63  | function isRunningProcess(pid: number): boolean {
  64  |   try {
  65  |     process.kill(pid, 0);
  66  |     return true;
  67  |   } catch {
  68  |     return false;
  69  |   }
  70  | }
  71  | 
  72  | function cleanupInterruptedFixtures(): void {
  73  |   for (const name of readdirSync(path.join(repositoryRoot, "qa"))) {
  74  |     const match = fixtureFilePattern.exec(name);
  75  |     if (!match || isRunningProcess(Number(match[1]))) continue;
  76  | 
  77  |     runFixture(`/app/qa/${name}`, "cleanup");
  78  |   }
  79  | }
  80  | 
  81  | export function prepareBrowserFixture(): BrowserFixture {
  82  |   // Reclaim only fixture files left by terminated workers. Active workers are
  83  |   // deliberately preserved, so this remains safe if Playwright is later made
  84  |   // parallel.
  85  |   cleanupInterruptedFixtures();
  86  |   if (existsSync(hostPath)) runFixture(containerPath, "cleanup");
  87  |   runFixture(containerPath);
  88  |   return JSON.parse(readFileSync(hostPath, "utf8")) as BrowserFixture;
  89  | }
  90  | 
  91  | export function prepareTeacherTimetableFixture(): Required<BrowserFixture> {
  92  |   cleanupInterruptedFixtures();
  93  |   if (existsSync(hostPath)) runFixture(containerPath, "cleanup", true);
  94  |   runFixture(containerPath, undefined, true);
  95  |   return JSON.parse(readFileSync(hostPath, "utf8")) as Required<BrowserFixture>;
  96  | }
  97  | 
  98  | export function prepareStudentTimetableFixture(): Required<BrowserFixture> {
  99  |   cleanupInterruptedFixtures();
  100 |   if (existsSync(hostPath)) runFixture(containerPath, "cleanup", false, true);
  101 |   runFixture(containerPath, undefined, false, true);
  102 |   return JSON.parse(readFileSync(hostPath, "utf8")) as Required<BrowserFixture>;
  103 | }
  104 | 
  105 | export function cleanupBrowserFixture(): void {
  106 |   if (!existsSync(hostPath)) return;
  107 |   runFixture(containerPath, "cleanup");
  108 | }
  109 | 
```