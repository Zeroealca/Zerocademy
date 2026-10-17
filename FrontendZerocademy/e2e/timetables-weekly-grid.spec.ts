import { expect, test } from "@playwright/test";
import { cleanupBrowserFixture, prepareBrowserFixture, type BrowserFixture } from "./schedule-structure-browser-fixture";

let fixture: BrowserFixture;

async function login(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(fixture.admin.email);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(fixture.admin.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/dashboard$/);
}

test.describe.serial("DEMY-140 weekly timetable grid", () => {
  test.beforeAll(() => { fixture = prepareBrowserFixture(); });
  test.afterAll(() => { cleanupBrowserFixture(); });

  test("renders a real timetable as a read-only accessible weekly grid", async ({ page }) => {
    const mutations: string[] = [];
    page.on("request", (request) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) && request.url().includes("/v1/")) mutations.push(request.url());
    });
    await login(page);
    // Authentication legitimately sends POST /v1/auth/login. The read-only
    // assertion starts once the user has entered the timetable workspace.
    mutations.length = 0;
    await page.goto("/timetables");
    await page.getByRole("tab", { name: "Horario semanal" }).click();
    await expect(page.getByRole("heading", { name: "Horario semanal" })).toBeVisible();
    await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
    const grid = page.getByRole("region", { name: "Cuadrícula del horario semanal" });
    await expect(grid).toBeVisible();
    await expect(grid.getByRole("columnheader", { name: "Lunes" })).toBeVisible();
    await expect(grid.getByText(/Matemática schedule-browser-e2e/)).toBeVisible();
    await expect(grid.getByText(/Recreo/).first()).toBeVisible();
    await expect(grid.getByText(/No lectivo/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /generar|publicar|guardar/i })).toHaveCount(0);
    expect(mutations).toEqual([]);
  });
});
