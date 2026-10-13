import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

type QaAccount = {
  key: string;
  email: string;
  password: string;
  institution: { id: string | null } | null;
  academicContext: { academicPeriodId?: string | null } | null;
};
type QaConfig = { accounts: QaAccount[] };

const qa = JSON.parse(readFileSync(path.resolve(__dirname, "../../qa/qa-users.local.json"), "utf8")) as QaConfig;
const admin = qa.accounts.find((account) => account.key === "adminPrimary");

if (!admin) throw new Error("The local QA admin fixture is required for browser E2E.");
if (!admin.institution?.id) throw new Error("The local QA admin fixture is missing institution context.");
const adminAccount = admin;

async function login(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(adminAccount.email);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/dashboard$/);
}

async function currentStructurePath(page: import("@playwright/test").Page): Promise<string> {
  const context = await page.evaluate(async () => {
    const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}");
    return (await fetch("/v1/academic-periods/context", { headers: { Authorization: `Bearer ${stored.state?.accessToken}` } })).json();
  });
  const periodId = context.effectivePeriod?.id as string | undefined;
  if (!periodId) throw new Error("The authenticated admin has no effective academic period.");
  return `/v1/institutions/${adminAccount.institution!.id}/academic-periods/${periodId}/schedule-structure`;
}

test.describe("DEMY-140 schedule structure", () => {
  test("an institutional admin can open the schedule structure workspace", async ({ page }) => {
    await login(page);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Horario semanal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar días" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Añadir bloque" })).toBeVisible();
  });

  test("persists weekday and block mutations through the real API", async ({ page }) => {
    const suffix = `E2E UI ${Date.now()}`;
    const teaching = `${suffix} Clase`;
    const breakBlock = `${suffix} Recreo`;
    const nonTeaching = `${suffix} No lectivo`;

    await login(page);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Horario semanal" })).toBeVisible();
    const structurePath = await currentStructurePath(page);

    const initial = await page.evaluate(async (path) => { const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}"); return (await fetch(path, { headers: { Authorization: `Bearer ${stored.state?.accessToken}` } })).json(); }, structurePath);
    const monday = page.getByLabel("Lunes");
    if (await monday.isChecked()) await monday.uncheck(); else await monday.check();
    const weekdaysResponse = page.waitForResponse((response) => response.url().includes(structurePath) && response.request().method() === "PUT" && response.status() === 200);
    await page.getByRole("button", { name: "Guardar días" }).click();
    await weekdaysResponse;

    const create = async (name: string, kind: string, start: string, end: string) => {
      await page.getByRole("button", { name: "Añadir bloque" }).click();
      await page.getByLabel("Nombre").fill(name);
      await page.getByLabel("Inicio").fill(start);
      await page.getByLabel("Fin").fill(end);
      await page.getByLabel("Tipo").selectOption(kind);
      const response = page.waitForResponse((candidate) => candidate.url().includes(`${structurePath}/blocks`) && candidate.request().method() === "POST" && candidate.status() === 201);
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await response;
      await expect(page.getByText(name)).toBeVisible();
    };

    await create(teaching, "TEACHING", "12:00", "12:30");
    await create(breakBlock, "BREAK", "12:30", "12:45");
    await create(nonTeaching, "NON_TEACHING", "12:45", "13:00");

    const structure = await page.evaluate(async (path) => { const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}"); return (await fetch(path, { headers: { Authorization: `Bearer ${stored.state?.accessToken}` } })).json(); }, structurePath);
    const created = structure.blocks.filter((block: { name: string | null }) => block.name?.startsWith(suffix));
    expect(created).toHaveLength(3);
    expect(created.map((block: { kind: string }) => block.kind).sort()).toEqual(["BREAK", "NON_TEACHING", "TEACHING"]);

    await page.reload();
    await expect(page.getByText(teaching)).toBeVisible();
    await expect(page.getByText(breakBlock)).toBeVisible();
    await expect(page.getByText(nonTeaching)).toBeVisible();

    for (const block of created) {
      await page.evaluate(async (id) => { const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}"); await fetch(`/v1/schedule-blocks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${stored.state?.accessToken}` } }); }, block.id);
    }
    await page.evaluate(async ([path, enabledWeekdays]) => { const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}"); await fetch(path, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${stored.state?.accessToken}` }, body: JSON.stringify({ enabledWeekdays }) }); }, [structurePath, initial.enabledWeekdays]);
  });

  test("edits, reorders, cancels, and confirms deletion of a test-owned block", async ({ page }) => {
    const suffix = `E2E CRUD ${Date.now()}`;
    const first = `${suffix} Uno`;
    const second = `${suffix} Dos`;
    const createdNames = [first, second];

    await login(page);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Horario semanal" })).toBeVisible();
    const structurePath = await currentStructurePath(page);
    try {
      for (const [name, start, end] of [[first, "13:00", "13:20"], [second, "13:20", "13:40"]]) {
        await page.getByRole("button", { name: "Añadir bloque" }).click();
        await page.getByLabel("Nombre").fill(name);
        await page.getByLabel("Inicio").fill(start);
        await page.getByLabel("Fin").fill(end);
        const response = page.waitForResponse((candidate) => candidate.url().includes(`${structurePath}/blocks`) && candidate.request().method() === "POST" && candidate.status() === 201);
        await page.getByRole("button", { name: "Guardar", exact: true }).click();
        await response;
      }

      const firstRow = page.getByText(first).locator("xpath=ancestor::div[contains(@class, 'items-center')][1]");
      await firstRow.getByRole("button", { name: "Editar bloque" }).click();
      await page.getByLabel("Nombre").fill(`${first} Editado`);
      const update = page.waitForResponse((candidate) => candidate.url().includes("/v1/schedule-blocks/") && candidate.request().method() === "PATCH" && candidate.status() === 200);
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await update;
      await expect(page.getByText(`${first} Editado`)).toBeVisible();

      const editedRow = page.getByText(`${first} Editado`).locator("xpath=ancestor::div[contains(@class, 'items-center')][1]");
      const reorder = page.waitForResponse((candidate) => candidate.url().includes("/blocks/order") && candidate.request().method() === "PUT" && candidate.status() === 200);
      await editedRow.getByRole("button", { name: "Bajar bloque" }).click();
      await reorder;

      page.once("dialog", (dialog) => dialog.dismiss());
      await editedRow.getByRole("button", { name: "Eliminar bloque" }).click();
      await expect(page.getByText(`${first} Editado`)).toBeVisible();
      page.once("dialog", (dialog) => dialog.accept());
      const removal = page.waitForResponse((candidate) => candidate.url().includes("/v1/schedule-blocks/") && candidate.request().method() === "DELETE" && candidate.status() === 204);
      await editedRow.getByRole("button", { name: "Eliminar bloque" }).click();
      await removal;
      await expect(page.getByText(`${first} Editado`)).toHaveCount(0);
      await page.reload();
      await expect(page.getByText(`${first} Editado`)).toHaveCount(0);
    } finally {
      const structure = await page.evaluate(async (path) => { const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}"); return (await fetch(path, { headers: { Authorization: `Bearer ${stored.state?.accessToken}` } })).json(); }, structurePath);
      for (const block of structure.blocks.filter((item: { name: string | null }) => createdNames.some((name) => item.name?.startsWith(name.split(" ").slice(0, 3).join(" "))))) {
        await page.evaluate(async (id) => { const stored = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}"); await fetch(`/v1/schedule-blocks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${stored.state?.accessToken}` } }); }, block.id);
      }
    }
  });

  test("prevents an invalid client-side time range without creating a block", async ({ page }) => {
    await login(page);
    await page.goto("/timetables");
    await page.getByRole("button", { name: "Añadir bloque" }).click();
    await page.getByLabel("Nombre").fill(`E2E Invalid ${Date.now()}`);
    await page.getByLabel("Inicio").fill("14:00");
    await page.getByLabel("Fin").fill("13:59");
    await expect(page.getByText("La hora de fin debe ser posterior a la hora de inicio.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar", exact: true })).toBeDisabled();
  });
});
