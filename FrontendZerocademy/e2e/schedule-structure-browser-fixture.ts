import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export type BrowserFixture = {
  institutionId: string;
  activeAcademicPeriodId: string;
  closedAcademicPeriodId: string;
  archivedAcademicPeriodId: string;
  admin: { email: string; password: string };
  teacher: { email: string; password: string };
};

const repositoryRoot = path.resolve(__dirname, "../..");
const containerPath = "/app/qa/schedule-structure-browser-fixture.local.json";
const hostPath = path.join(repositoryRoot, "qa/schedule-structure-browser-fixture.local.json");

function runFixture(action?: "cleanup"): void {
  const args = [
    "compose", "exec", "-T", "-e", `SCHEDULE_BROWSER_FIXTURE_PATH=${containerPath}`,
    "backend", "node", "BackendZerocademy/test/helpers/schedule-structure-browser-fixture-cli.js",
  ];
  if (action) args.push(action);
  execFileSync("docker", args, { cwd: repositoryRoot, stdio: "inherit" });
}

export function prepareBrowserFixture(): BrowserFixture {
  runFixture();
  return JSON.parse(readFileSync(hostPath, "utf8")) as BrowserFixture;
}

export function cleanupBrowserFixture(): void {
  runFixture("cleanup");
}
