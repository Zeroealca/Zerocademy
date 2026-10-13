import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanupBrowserFixture, prepareBrowserFixture, type BrowserFixture } from "./schedule-structure-browser-fixture";

type QaConfig = { accounts: Array<{ key: string; institution: { id: string | null } | null }> };
const qa = JSON.parse(readFileSync(path.resolve(__dirname, "../../qa/qa-users.local.json"), "utf8")) as QaConfig;
const institutionAId = qa.accounts.find((account) => account.key === "adminPrimary")?.institution?.id;

let fixture: BrowserFixture;

async function login(page: import("@playwright/test").Page, account: { email: string; password: string }): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(account.email);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(account.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/dashboard$/);
}

async function api(page: import("@playwright/test").Page, url: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  return page.evaluate(async ({ url, init }) => {
    const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}");
    const response = await fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${stored.state?.accessToken}` } });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, { url, init });
}

test.describe.serial("DEMY-140 lifecycle and authorization", () => {
  test.beforeAll(() => { fixture = prepareBrowserFixture(); });
  test.afterAll(() => { cleanupBrowserFixture(); });

  test("Institution B ADMIN mutates an ACTIVE structure through the UI and cleans up", async ({ page }) => {
    const name = `E2E active ${Date.now()}`;
    await login(page, fixture.admin);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Horario semanal" })).toBeVisible();
    await expect(page.getByText("Activo", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Añadir bloque" })).toBeEnabled();
    await page.getByRole("button", { name: "Añadir bloque" }).click();
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Inicio").fill("15:00");
    await page.getByLabel("Fin").fill("15:20");
    const created = page.waitForResponse((response) => response.url().includes("/schedule-structure/blocks") && response.request().method() === "POST" && response.status() === 201);
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await created;
    await page.reload();
    await expect(page.getByText(name)).toBeVisible();
    const structure = await api(page, `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.activeAcademicPeriodId}/schedule-structure`);
    expect(structure.status).toBe(200);
    const block = (structure.body as { blocks: Array<{ id: string; name: string | null }> }).blocks.find((item) => item.name === name);
    expect(block).toBeDefined();
    const removed = await api(page, `/v1/schedule-blocks/${block!.id}`, { method: "DELETE" });
    expect(removed.status).toBe(204);
  });

  test("CLOSED and ARCHIVED fixture structures are readable but cannot be selected by the supported UI context", async ({ page }) => {
    await login(page, fixture.admin);
    await page.goto("/timetables");
    const [closed, archived, context] = await Promise.all([
      api(page, `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.closedAcademicPeriodId}/schedule-structure`),
      api(page, `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.archivedAcademicPeriodId}/schedule-structure`),
      api(page, "/v1/academic-periods/context"),
    ]);
    expect(closed.status).toBe(200);
    expect(archived.status).toBe(200);
    expect((context.body as { effectivePeriod: { id: string; status: string } }).effectivePeriod).toMatchObject({ id: fixture.activeAcademicPeriodId, status: "ACTIVE" });
    await expect(page.getByText("Activo", { exact: true })).toBeVisible();
    await expect(page.getByText("Cerrado")).toHaveCount(0);
    await expect(page.getByText("Archivado")).toHaveCount(0);
  });

  test("a non-ADMIN user has no timetable navigation or administrative route controls", async ({ page }) => {
    const mutations: string[] = [];
    page.on("request", (request) => { if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) && request.url().includes("schedule")) mutations.push(request.url()); });
    await login(page, fixture.teacher);
    await expect(page.getByRole("link", { name: "Horario semanal" })).toHaveCount(0);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Añadir bloque" })).toHaveCount(0);
    expect(mutations).toEqual([]);
  });

  test("Institution B ADMIN sees only B context and cannot read Institution A's structure", async ({ page }) => {
    test.skip(!institutionAId, "The local QA Institution A account is required for cross-institution verification.");
    await login(page, fixture.admin);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Horario semanal" })).toBeVisible();
    const own = await api(page, `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.activeAcademicPeriodId}/schedule-structure`);
    const other = await api(page, `/v1/institutions/${institutionAId}/academic-periods/${fixture.activeAcademicPeriodId}/schedule-structure`);
    expect(own.status).toBe(200);
    expect(other.status).toBe(404);
  });
});
