import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  cleanupBrowserFixture,
  prepareBrowserFixture,
  type BrowserFixture,
} from "./schedule-structure-browser-fixture";

type QaConfig = {
  accounts: Array<{ key: string; institution: { id: string | null } | null }>;
};
const qa = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../qa/qa-users.local.json"), "utf8"),
) as QaConfig;
const institutionAId = qa.accounts.find(
  (account) => account.key === "adminPrimary",
)?.institution?.id;

let fixture: BrowserFixture;

async function login(
  page: import("@playwright/test").Page,
  account: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(account.email);
  await page
    .getByRole("textbox", { name: "Contraseña" })
    .fill(account.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL(/\/dashboard$/);
}

async function api(
  page: import("@playwright/test").Page,
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  return page.evaluate(
    async ({ url, init }) => {
      const stored = JSON.parse(
        localStorage.getItem("zerocademy-auth") ?? "{}",
      );
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${stored.state?.accessToken}`,
        },
      });
      return {
        status: response.status,
        body: await response.json().catch(() => null),
      };
    },
    { url, init },
  );
}

test.describe.serial("DEMY-140 lifecycle and authorization", () => {
  test.beforeAll(() => {
    fixture = prepareBrowserFixture();
  });
  test.afterAll(() => {
    cleanupBrowserFixture();
  });

  test("Institution B ADMIN mutates an ACTIVE structure through the UI and cleans up", async ({
    page,
  }) => {
    const name = `E2E active ${Date.now()}`;
    await login(page, fixture.admin);
    await page.goto("/timetables");
    await expect(
      page.getByRole("heading", { name: "Horario semanal" }),
    ).toBeVisible();
    await expect(page.getByText("Activo", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Añadir bloque" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Añadir bloque" }).click();
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Inicio").fill("15:00");
    await page.getByLabel("Fin").fill("15:20");
    const created = page.waitForResponse(
      (response) =>
        response.url().includes("/schedule-structure/blocks") &&
        response.request().method() === "POST" &&
        response.status() === 201,
    );
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await created;
    await page.reload();
    await expect(page.getByText(name)).toBeVisible();
    const structure = await api(
      page,
      `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.activeAcademicPeriodId}/schedule-structure`,
    );
    expect(structure.status).toBe(200);
    const block = (
      structure.body as { blocks: Array<{ id: string; name: string | null }> }
    ).blocks.find((item) => item.name === name);
    expect(block).toBeDefined();
    const removed = await api(page, `/v1/schedule-blocks/${block!.id}`, {
      method: "DELETE",
    });
    expect(removed.status).toBe(204);
  });

  test("ADMIN moves a draft slot, persists it, and recovers from a stale version", async ({
    page,
  }) => {
    await login(page, fixture.admin);
    await page.goto("/timetables");
    await page.getByRole("tab", { name: "Horario semanal" }).click();
    await page.getByRole("button", { name: "Editar horario" }).click();
    await page.getByLabel("Día").selectOption("TUE");
    const saved = page.waitForResponse(
      (response) =>
        /\/v1\/timetables\/[^/]+\/slots$/.test(
          new URL(response.url()).pathname,
        ) &&
        response.request().method() === "PUT" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await saved;
    const moved = await api(page, `/v1/timetables/${fixture.timetableId}`);
    expect(moved.status).toBe(200);
    const movedTimetable = moved.body as {
      version: number;
      slots: Array<{
        teacherAssignmentId: string;
        weekday: string;
        scheduleBlockId: string;
      }>;
    };
    expect(movedTimetable.slots).toEqual(
      expect.arrayContaining([expect.objectContaining({ weekday: "TUE" })]),
    );

    await page.reload();
    await page.getByRole("tab", { name: "Horario semanal" }).click();
    await page.getByRole("button", { name: "Editar horario" }).click();
    await page.getByLabel("Día").selectOption("MON");
    const concurrent = await api(
      page,
      `/v1/timetables/${fixture.timetableId}/slots`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedVersion: movedTimetable.version,
          slots: movedTimetable.slots.map(
            ({ teacherAssignmentId, weekday, scheduleBlockId }) => ({
              teacherAssignmentId,
              weekday,
              scheduleBlockId,
            }),
          ),
        }),
      },
    );
    expect(concurrent.status).toBe(200);
    const stale = page.waitForResponse(
      (response) =>
        /\/v1\/timetables\/[^/]+\/slots$/.test(
          new URL(response.url()).pathname,
        ) &&
        response.request().method() === "PUT" &&
        response.status() === 409,
    );
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await stale;
    await expect(
      page.getByText(
        "El horario cambió en otra sesión o ya no puede modificarse.",
      ),
    ).toBeVisible();
    await expect(page.getByLabel("Día")).toHaveValue("MON");
  });

  test("ADMIN generates, saves, validates, and discards a timetable draft", async ({
    page,
  }) => {
    await login(page, fixture.admin);
    const removed = await api(page, `/v1/timetables/${fixture.timetableId}`, {
      method: "DELETE",
    });
    expect(removed.status).toBe(204);
    await page.goto("/timetables");
    await page.getByRole("tab", { name: "Horario semanal" }).click();
    const generated = page.waitForResponse(
      (response) =>
        response.url().includes("/timetables/generate") &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Generar propuesta" }).click();
    await generated;
    await expect(
      page.getByRole("heading", { name: "Propuesta sin guardar" }),
    ).toBeVisible();
    await expect(page.getByText(/Matemática/)).toBeVisible();
    const saved = page.waitForResponse(
      (response) =>
        /\/timetables$/.test(new URL(response.url()).pathname) &&
        response.request().method() === "POST" &&
        response.status() === 201,
    );
    await page.getByRole("button", { name: "Guardar como borrador" }).click();
    await saved;
    await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
    const revalidated = page.waitForResponse(
      (response) =>
        response.url().includes("/validation") &&
        response.request().method() === "GET" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Revalidar borrador" }).click();
    await revalidated;
    page.once("dialog", (dialog) => dialog.accept());
    const discarded = page.waitForResponse(
      (response) =>
        /\/v1\/timetables\//.test(new URL(response.url()).pathname) &&
        response.request().method() === "DELETE" &&
        response.status() === 204,
    );
    await page.getByRole("button", { name: "Descartar borrador" }).click();
    await discarded;
    await expect(
      page.getByText(/Todavía no existe un horario generado/),
    ).toBeVisible();
  });

  test("ADMIN publishes a valid draft, sees read-only controls, and safely unpublishes it", async ({
    page,
  }, testInfo) => {
    await login(page, fixture.admin);
    const listed = await api(
      page,
      `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.activeAcademicPeriodId}/timetables`,
    );
    expect(listed.status).toBe(200);
    const existing = (listed.body as { data: Array<{ id: string }> }).data[0];
    if (existing) {
      const removed = await api(page, `/v1/timetables/${existing.id}`, {
        method: "DELETE",
      });
      expect(removed.status).toBe(204);
    }
    await page.goto("/timetables");
    await page.getByRole("tab", { name: "Horario semanal" }).click();
    const generated = page.waitForResponse(
      (response) =>
        response.url().includes("/timetables/generate") &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Generar propuesta" }).click();
    await generated;
    const saved = page.waitForResponse(
      (response) =>
        /\/timetables$/.test(new URL(response.url()).pathname) &&
        response.request().method() === "POST" &&
        response.status() === 201,
    );
    await page.getByRole("button", { name: "Guardar como borrador" }).click();
    const savedResponse = await saved;
    const timetableId = (await savedResponse.json()) as { id: string };
    const before = await api(page, `/v1/timetables/${timetableId.id}`);
    expect(before.status).toBe(200);
    const beforeTimetable = before.body as {
      version: number;
      slots: Array<{
        teacherAssignmentId: string;
        weekday: string;
        scheduleBlockId: string;
      }>;
    };
    await expect(
      page.getByRole("button", { name: "Publicar horario" }),
    ).toBeEnabled();
    await page.screenshot({
      path: testInfo.outputPath("draft.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Publicar horario" }).click();
    await expect(
      page.getByRole("alertdialog", { name: "Confirmar publicación" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await page.screenshot({
      path: testInfo.outputPath("publish-confirmation.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(
      page.getByRole("button", { name: "Publicar horario" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Publicar horario" }).click();
    await expect(
      page.getByRole("alertdialog", { name: "Confirmar publicación" }),
    ).toBeVisible();
    const published = page.waitForResponse(
      (response) =>
        /\/timetables\/[^/]+\/publish$/.test(
          new URL(response.url()).pathname,
        ) &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Sí, publicar" }).click();
    await published;
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Los horarios publicados son de solo lectura."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Editar horario" }),
    ).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("published-read-only.png"),
      fullPage: true,
    });
    const publishedState = await api(page, `/v1/timetables/${timetableId.id}`);
    expect(publishedState.status).toBe(200);
    const publishedTimetable = publishedState.body as {
      status: string;
      version: number;
      publishedAt: string | null;
      publishedByUserId: string | null;
      slots: unknown[];
    };
    expect(publishedTimetable).toMatchObject({
      status: "PUBLISHED",
      version: beforeTimetable.version + 1,
      publishedAt: expect.any(String),
      publishedByUserId: expect.any(String),
    });
    expect(publishedTimetable.slots).toEqual(beforeTimetable.slots);
    const rejectedEdit = await api(
      page,
      `/v1/timetables/${timetableId.id}/slots`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedVersion: publishedTimetable.version,
          slots: beforeTimetable.slots.map(
            ({ teacherAssignmentId, weekday, scheduleBlockId }) => ({
              teacherAssignmentId,
              weekday,
              scheduleBlockId,
            }),
          ),
        }),
      },
    );
    expect(rejectedEdit.status).toBe(409);
    await page.getByRole("button", { name: "Anular publicación" }).click();
    await expect(
      page.getByRole("alertdialog", {
        name: "Confirmar anulación de publicación",
      }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("unpublish-confirmation.png"),
      fullPage: true,
    });
    const unpublished = page.waitForResponse(
      (response) =>
        /\/timetables\/[^/]+\/unpublish$/.test(
          new URL(response.url()).pathname,
        ) &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Sí, anular publicación" }).click();
    await unpublished;
    await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Editar horario" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("draft-restored.png"),
      fullPage: true,
    });
    const draftState = await api(page, `/v1/timetables/${timetableId.id}`);
    expect(draftState.status).toBe(200);
    expect(draftState.body).toMatchObject({
      status: "DRAFT",
      version: publishedTimetable.version + 1,
      publishedAt: null,
      publishedByUserId: null,
      slots: beforeTimetable.slots,
    });
  });

  test("shows the real backend overlap error, preserves the form, and keeps persisted blocks unchanged", async ({
    page,
  }) => {
    const rejectedName = `E2E overlap ${Date.now()}`;
    await login(page, fixture.admin);
    await page.goto("/timetables");
    await page.getByRole("button", { name: "Añadir bloque" }).click();
    await page.getByLabel("Nombre").fill(rejectedName);
    await page.getByLabel("Inicio").fill("08:20");
    await page.getByLabel("Fin").fill("08:50");
    const rejected = page.waitForResponse(
      (response) =>
        response.url().includes("/schedule-structure/blocks") &&
        response.request().method() === "POST" &&
        response.status() === 400,
    );
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    const response = await rejected;
    await expect(response.json()).resolves.toMatchObject({
      statusCode: 400,
      error: "Bad Request",
      message: "Schedule block time range overlaps an existing block",
    });
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "El horario del bloque se superpone con un bloque existente",
    );
    await expect(page.getByLabel("Nombre")).toHaveValue(rejectedName);
    await expect(
      page.getByRole("button", { name: "Guardar", exact: true }),
    ).toBeEnabled();
    await page.reload();
    await expect(page.getByText(rejectedName)).toHaveCount(0);
    const structure = await api(
      page,
      `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.activeAcademicPeriodId}/schedule-structure`,
    );
    expect(structure.status).toBe(200);
    expect(
      (
        structure.body as { blocks: Array<{ name: string | null }> }
      ).blocks.some((block) => block.name === rejectedName),
    ).toBe(false);
  });

  test("recovers after a simulated network failure without reporting a false success", async ({
    page,
  }) => {
    await login(page, fixture.admin);
    await page.goto("/timetables");
    const monday = page.getByLabel("Lunes");
    await expect(monday).toBeVisible();
    if (await monday.isChecked()) await monday.uncheck();
    else await monday.check();
    await page.route("**/schedule-structure", (route) => route.abort("failed"));
    await page.getByRole("button", { name: "Guardar días" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "No se pudo completar la solicitud. Inténtalo de nuevo.",
    );
    await expect(
      page.getByRole("button", { name: "Guardar días" }),
    ).toBeEnabled();
    await page.unroute("**/schedule-structure");
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes("/schedule-structure") &&
        response.request().method() === "PUT" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Guardar días" }).click();
    await saved;
  });

  test("shows a safe message and recovers after a simulated unexpected server failure", async ({
    page,
  }) => {
    await login(page, fixture.admin);
    await page.goto("/timetables");
    const tuesday = page.getByLabel("Martes");
    await expect(tuesday).toBeVisible();
    if (await tuesday.isChecked()) await tuesday.uncheck();
    else await tuesday.check();
    await page.route("**/schedule-structure", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 500,
          message: "Internal server error",
          error: "Internal Server Error",
        }),
      }),
    );
    await page.getByRole("button", { name: "Guardar días" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Error interno del servidor",
    );
    await expect(
      page.getByRole("button", { name: "Guardar días" }),
    ).toBeEnabled();
    await page.unroute("**/schedule-structure");
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes("/schedule-structure") &&
        response.request().method() === "PUT" &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Guardar días" }).click();
    await saved;
  });

  test("PLANNED remains mutable while CLOSED and ARCHIVED are readable without mutations", async ({
    page,
  }) => {
    await login(page, fixture.admin);
    await page.goto("/timetables");
    const [planned, closed, archived, context] = await Promise.all([
      api(
        page,
        `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.plannedAcademicPeriodId}/schedule-structure`,
      ),
      api(
        page,
        `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.closedAcademicPeriodId}/schedule-structure`,
      ),
      api(
        page,
        `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.archivedAcademicPeriodId}/schedule-structure`,
      ),
      api(page, "/v1/academic-periods/context"),
    ]);
    expect(planned.status).toBe(200);
    expect(closed.status).toBe(200);
    expect(archived.status).toBe(200);
    expect(
      (context.body as { effectivePeriod: { id: string; status: string } })
        .effectivePeriod,
    ).toMatchObject({ id: fixture.activeAcademicPeriodId, status: "ACTIVE" });
    await expect(page.getByText("Activo", { exact: true })).toBeVisible();
    const mutations: string[] = [];
    page.on("request", (request) => {
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
        request.url().includes("schedule")
      )
        mutations.push(request.url());
    });
    const selector = page.getByLabel("Período académico", { exact: true });
    const search = page.getByLabel("Buscar período académico", { exact: true });
    await search.fill("Planned");
    await expect(
      selector.locator(`option[value="${fixture.plannedAcademicPeriodId}"]`),
    ).toHaveCount(1);
    await selector.selectOption(fixture.plannedAcademicPeriodId);
    await expect(page.getByText("Planificado", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Añadir bloque" }),
    ).toBeEnabled();
    await expect(
      page.getByText(
        (planned.body as { blocks: Array<{ name: string }> }).blocks[0]!.name,
      ),
    ).toBeVisible();
    await search.fill("Closed");
    await expect(
      selector.locator(`option[value="${fixture.closedAcademicPeriodId}"]`),
    ).toHaveCount(1);
    await selector.selectOption(fixture.closedAcademicPeriodId);
    await expect(page.getByText("Cerrado", { exact: true })).toBeVisible();
    await expect(page.getByText(/modo de solo lectura/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Añadir bloque" }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        (closed.body as { blocks: Array<{ name: string }> }).blocks[0]!.name,
      ),
    ).toBeVisible();
    await search.fill("Archived");
    await expect(
      selector.locator(`option[value="${fixture.archivedAcademicPeriodId}"]`),
    ).toHaveCount(1);
    await selector.selectOption(fixture.archivedAcademicPeriodId);
    await expect(page.getByText("Archivado", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Añadir bloque" }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        (archived.body as { blocks: Array<{ name: string }> }).blocks[0]!.name,
      ),
    ).toBeVisible();
    expect(mutations).toEqual([]);
    await search.fill("");
    await expect(
      selector.locator(`option[value="${fixture.activeAcademicPeriodId}"]`),
    ).toHaveCount(1);
    await selector.selectOption(fixture.activeAcademicPeriodId);
    await expect(page.getByText("Activo", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Añadir bloque" }),
    ).toBeEnabled();
    const contextAfter = await api(page, "/v1/academic-periods/context");
    expect(
      (
        contextAfter.body as {
          effectivePeriod: { id: string };
          selectedPeriod: unknown;
        }
      ).effectivePeriod.id,
    ).toBe(fixture.activeAcademicPeriodId);
    expect(
      (contextAfter.body as { selectedPeriod: unknown }).selectedPeriod,
    ).toBeNull();
  });

  test("a TEACHER has read-only timetable navigation without administrative controls", async ({
    page,
  }) => {
    const mutations: string[] = [];
    page.on("request", (request) => {
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
        request.url().includes("schedule")
      )
        mutations.push(request.url());
    });
    await login(page, fixture.teacher);
    await expect(
      page.getByRole("link", { name: "Horario semanal" }),
    ).toBeVisible();
    await page.goto("/timetables");
    await expect(
      page.getByRole("heading", { name: "Mi horario" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Añadir bloque" }),
    ).toHaveCount(0);
    expect(mutations).toEqual([]);
  });

  test("Institution B ADMIN sees only B context and cannot read Institution A's structure", async ({
    page,
  }) => {
    test.skip(
      !institutionAId,
      "The local QA Institution A account is required for cross-institution verification.",
    );
    await login(page, fixture.admin);
    await page.goto("/timetables");
    await expect(
      page.getByRole("heading", { name: "Horario semanal" }),
    ).toBeVisible();
    const own = await api(
      page,
      `/v1/institutions/${fixture.institutionId}/academic-periods/${fixture.activeAcademicPeriodId}/schedule-structure`,
    );
    const other = await api(
      page,
      `/v1/institutions/${institutionAId}/academic-periods/${fixture.activeAcademicPeriodId}/schedule-structure`,
    );
    expect(own.status).toBe(200);
    expect(other.status).toBe(404);
    const periods = await api(
      page,
      `/v1/academic-periods?page=1&limit=100&institutionId=${institutionAId}`,
    );
    expect(periods.status).toBe(200);
    expect(
      (
        periods.body as { data: Array<{ institutionId: string | null }> }
      ).data.every(
        (period) =>
          period.institutionId === null ||
          period.institutionId === fixture.institutionId,
      ),
    ).toBe(true);
  });
});
