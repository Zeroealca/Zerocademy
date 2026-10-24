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

test.describe.serial("DEMY-140 responsive timetable workspace", () => {
  test.beforeAll(() => { fixture = prepareBrowserFixture(); });
  test.afterAll(() => { cleanupBrowserFixture(); });

  test("keeps the selector, read-only history, form controls, and actions usable at this viewport", async ({ page }) => {
    const name = `E2E responsive ${Date.now()}`;
    await login(page);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Horario semanal" })).toBeVisible();
    const selector = page.getByLabel("Período académico", { exact: true });
    const search = page.getByLabel("Buscar período académico", { exact: true });
    await search.fill("Closed");
    await expect(selector.locator(`option[value="${fixture.closedAcademicPeriodId}"]`)).toHaveCount(1);
    await selector.selectOption(fixture.closedAcademicPeriodId);
    await expect(page.getByText("Cerrado", { exact: true })).toBeVisible();
    await expect(page.getByText(/modo de solo lectura/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Añadir bloque" })).toBeDisabled();
    await search.fill("");
    await expect(selector.locator(`option[value="${fixture.activeAcademicPeriodId}"]`)).toHaveCount(1);
    await selector.selectOption(fixture.activeAcademicPeriodId);
    await page.getByRole("tab", { name: "Horario semanal" }).click();
    const generateProposal = page.getByRole("button", { name: "Generar propuesta" });
    await expect(generateProposal).toBeVisible();
    await expect(generateProposal).toBeEnabled();
    await generateProposal.focus();
    await expect(generateProposal).toBeFocused();
    await page.getByRole("tab", { name: "Estructura del horario" }).click();
    await expect(page.getByRole("button", { name: "Añadir bloque" })).toBeEnabled();
    await page.getByRole("button", { name: "Añadir bloque" }).click();
    await expect(page.getByLabel("Nombre")).toBeVisible();
    const form = page.getByLabel("Nombre").locator("xpath=ancestor::div[contains(@class, 'grid')][1]");
    const formBox = await form.boundingBox();
    expect(formBox).not.toBeNull();
    expect(formBox!.x).toBeGreaterThanOrEqual(0);
    expect(formBox!.x + formBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.getByRole("button", { name: "Cancelar" }).click();

    await page.getByRole("button", { name: "Añadir bloque" }).click();
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Inicio").fill("16:00");
    await page.getByLabel("Fin").fill("16:20");
    const created = page.waitForResponse((response) => response.url().includes("/schedule-structure/blocks") && response.request().method() === "POST" && response.status() === 201);
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await created;
    await expect(page.getByText(name)).toBeVisible();
    const row = page.getByText(name).locator("xpath=ancestor::div[contains(@class, 'items-center')][1]");
    page.once("dialog", (dialog) => dialog.accept());
    const removed = page.waitForResponse((response) => response.url().includes("/v1/schedule-blocks/") && response.request().method() === "DELETE" && response.status() === 204);
    await row.getByRole("button", { name: "Eliminar bloque" }).click();
    await removed;
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
});
