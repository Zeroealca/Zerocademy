import { expect, test } from "@playwright/test";
import {
  cleanupBrowserFixture,
  prepareBrowserFixture,
  prepareTeacherTimetableFixture,
  type BrowserFixture,
} from "./schedule-structure-browser-fixture";

let fixture: BrowserFixture;

async function login(
  page: import("@playwright/test").Page,
  account: { email: string; password: string },
) {
  const response = await page.request.post("/v1/auth/login", {
    data: account,
  });
  expect(response.status()).toBe(201);
  const session = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    user: unknown;
  };
  await page.addInitScript(
    (state) =>
      localStorage.setItem(
        "zerocademy-auth",
        JSON.stringify({ state, version: 0 }),
      ),
    {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    },
  );
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
}

type ApiInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function api(
  page: import("@playwright/test").Page,
  url: string,
  init?: ApiInit,
) {
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
          "Content-Type": "application/json",
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

test.describe("DEMY-142 teacher timetables", () => {
  test.beforeEach(() => {
    fixture = prepareBrowserFixture();
  });
  test.afterEach(() => {
    cleanupBrowserFixture();
  });

  test("shows only the teacher's published weekly timetable and remains read-only", async ({
    page,
  }) => {
    await test.step("admin authentication", async () => {
      await login(page, fixture.admin);
    });
    await test.step("publish fixture timetable", async () => {
      const draft = await api(page, `/v1/timetables/${fixture.timetableId}`);
      expect(draft.status).toBe(200);
      const published = await api(
        page,
        `/v1/timetables/${fixture.timetableId}/publish`,
        {
          method: "POST",
          body: JSON.stringify({
            expectedVersion: (draft.body as { version: number }).version,
          }),
        },
      );
      expect(published.status).toBe(200);
    });
    await test.step("teacher authentication", async () => {
      await login(page, fixture.teacher);
    });
    await test.step("teacher timetable rendering", async () => {
      await page.goto("/timetables");
      await expect(
        page.getByRole("heading", { name: "Mi horario" }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Cuadrícula de mi horario semanal" }),
      ).toBeVisible();
      await expect(page.getByText("Matemática")).toBeVisible();
      await expect(page.getByText("08:00 – 08:40")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Publicar horario" }),
      ).toHaveCount(0);
      const own = await api(
        page,
        `/v1/timetables/me?academicPeriodId=${fixture.activeAcademicPeriodId}`,
      );
      expect(own.status).toBe(200);
      expect(
        (own.body as { data: Array<{ slots: unknown[] }> }).data[0]?.slots,
      ).toHaveLength(1);
      const mutation = await api(
        page,
        `/v1/timetables/${fixture.timetableId}/unpublish`,
        { method: "POST", body: JSON.stringify({ expectedVersion: 2 }) },
      );
      expect(mutation.status).toBe(403);
    });
  });

  test("hides drafts and exposes accessible Today empty state on non-instructional days", async ({
    page,
  }) => {
    await login(page, fixture.admin);
    const published = await api(page, `/v1/timetables/${fixture.timetableId}`);
    expect(published.status).toBe(200);
    const current = published.body as { status: string; version: number };
    const publish =
      current.status === "DRAFT"
        ? await api(page, `/v1/timetables/${fixture.timetableId}/publish`, {
            method: "POST",
            body: JSON.stringify({ expectedVersion: current.version }),
          })
        : published;
    expect(publish.status).toBe(200);
    const unpublished = await api(
      page,
      `/v1/timetables/${fixture.timetableId}/unpublish`,
      {
        method: "POST",
        body: JSON.stringify({
          expectedVersion: (publish.body as { version: number }).version,
        }),
      },
    );
    expect(unpublished.status).toBe(200);
    await login(page, fixture.teacher);
    await page.goto("/timetables");
    await expect(
      page.getByText(
        "No tienes un horario semanal publicado para este período.",
      ),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Hoy" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("No tienes clases publicadas para hoy."),
    ).toBeVisible();
  });
});

test.describe("DEMY-142 teacher timetable acceptance scenarios", () => {
  let teacherFixture: Required<BrowserFixture>;

  test.beforeEach(() => {
    teacherFixture = prepareTeacherTimetableFixture();
  });
  test.afterEach(() => {
    cleanupBrowserFixture();
  });

  async function publishOwnDraft(page: import("@playwright/test").Page) {
    await login(page, teacherFixture.admin);
    const draft = await api(
      page,
      `/v1/timetables/${teacherFixture.timetableId}`,
    );
    expect(draft.status).toBe(200);
    const body = draft.body as { status: string; version: number };
    if (body.status === "PUBLISHED") return;
    const published = await api(
      page,
      `/v1/timetables/${teacherFixture.timetableId}/publish`,
      {
        method: "POST",
        body: JSON.stringify({ expectedVersion: body.version }),
      },
    );
    expect(published.status).toBe(200);
  }

  const todayAt = (
    page: import("@playwright/test").Page,
    academicPeriodId: string,
    date: string,
  ) =>
    api(page, `/v1/timetables/me/today?academicPeriodId=${academicPeriodId}`, {
      headers: { "x-zerocademy-e2e-now": date },
    });

  const useE2eToday = (page: import("@playwright/test").Page, date: string) =>
    page.route("**/v1/timetables/me/today**", (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-zerocademy-e2e-now": date,
        },
      }),
    );

  const waitForE2eToday = (
    page: import("@playwright/test").Page,
    date: string,
  ) =>
    page.waitForResponse(
      (response) =>
        response.url().includes("/v1/timetables/me/today") &&
        response.status() === 200 &&
        response.request().headers()["x-zerocademy-e2e-now"] === date,
    );

  test("isolates published schedules between two authenticated teachers", async ({
    browser,
  }) => {
    const first = await browser.newContext();
    const second = await browser.newContext();
    const adminPage = await first.newPage();
    await publishOwnDraft(adminPage);
    const firstPage = await first.newPage();
    const secondPage = await second.newPage();
    await login(firstPage, teacherFixture.teacher);
    await login(secondPage, teacherFixture.secondTeacher);
    await Promise.all([
      firstPage.goto("/timetables"),
      secondPage.goto("/timetables"),
    ]);
    await expect(firstPage.getByText("Matemática").first()).toBeVisible();
    await expect(firstPage.getByText("Ciencias")).toHaveCount(0);
    await expect(secondPage.getByText("Ciencias").first()).toBeVisible();
    await expect(secondPage.getByText("Matemática")).toHaveCount(0);
    const [firstSchedule, secondSchedule] = await Promise.all([
      api(
        firstPage,
        `/v1/timetables/me?academicPeriodId=${teacherFixture.activeAcademicPeriodId}`,
      ),
      api(
        secondPage,
        `/v1/timetables/me?academicPeriodId=${teacherFixture.activeAcademicPeriodId}`,
      ),
    ]);
    expect(firstSchedule.status).toBe(200);
    expect(secondSchedule.status).toBe(200);
    expect(JSON.stringify(firstSchedule.body)).toContain("Matemática");
    expect(JSON.stringify(firstSchedule.body)).not.toContain("Ciencias");
    expect(JSON.stringify(secondSchedule.body)).toContain("Ciencias");
    expect(JSON.stringify(secondSchedule.body)).not.toContain("Matemática");
  });

  test("does not expose a foreign institution timetable to a teacher", async ({
    browser,
  }) => {
    const own = await browser.newContext();
    const foreign = await browser.newContext();
    const ownPage = await own.newPage();
    const foreignPage = await foreign.newPage();
    await login(ownPage, teacherFixture.teacher);
    await login(foreignPage, teacherFixture.foreignTeacher);
    const [ownSchedule, foreignSchedule, forbidden] = await Promise.all([
      api(
        ownPage,
        `/v1/timetables/me?academicPeriodId=${teacherFixture.activeAcademicPeriodId}`,
      ),
      api(
        foreignPage,
        `/v1/timetables/me?academicPeriodId=${teacherFixture.activeAcademicPeriodId}`,
      ),
      api(
        ownPage,
        `/v1/institutions/${teacherFixture.foreignInstitutionId}/academic-periods/${teacherFixture.activeAcademicPeriodId}/timetables`,
      ),
    ]);
    expect(ownSchedule.status).toBe(200);
    expect(foreignSchedule.status).toBe(200);
    expect(forbidden.status).toBe(403);
    expect(JSON.stringify(ownSchedule.body)).not.toContain("Historia privada");
    expect(JSON.stringify(foreignSchedule.body)).toContain("Historia privada");
    await ownPage.goto("/timetables");
    await expect(ownPage.getByText("Historia privada")).toHaveCount(0);
  });

  test("filters the authenticated teacher timetable by academic period", async ({
    page,
  }) => {
    await publishOwnDraft(page);
    await login(page, teacherFixture.teacher);
    const [active, secondary] = await Promise.all([
      api(
        page,
        `/v1/timetables/me?academicPeriodId=${teacherFixture.activeAcademicPeriodId}`,
      ),
      api(
        page,
        `/v1/timetables/me?academicPeriodId=${teacherFixture.secondaryAcademicPeriodId}`,
      ),
    ]);
    expect(active.status).toBe(200);
    expect(secondary.status).toBe(200);
    const activeData = active.body as {
      data: Array<{ id: string; slots: unknown[] }>;
    };
    const secondaryData = secondary.body as {
      data: Array<{ id: string; slots: unknown[] }>;
    };
    expect(activeData.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: teacherFixture.timetableId }),
      ]),
    );
    expect(
      activeData.data.some(
        (item) => item.id === teacherFixture.secondaryTimetableId,
      ),
    ).toBe(false);
    expect(secondaryData.data).toEqual([
      {
        id: teacherFixture.secondaryTimetableId,
        institutionId: teacherFixture.institutionId,
        academicPeriodId: teacherFixture.secondaryAcademicPeriodId,
        academicPeriodName: expect.any(String),
        slots: expect.any(Array),
      },
    ]);
    expect(secondaryData.data[0]!.slots).toHaveLength(1);
  });

  test("orders Today classes chronologically with a Playwright-controlled browser clock", async ({
    page,
  }) => {
    await publishOwnDraft(page);
    await page.clock.install({ time: new Date("2026-10-19T12:00:00-05:00") });
    await login(page, teacherFixture.teacher);
    await useE2eToday(page, "2026-10-19T12:00:00-05:00");
    const todayResponse = waitForE2eToday(page, "2026-10-19T12:00:00-05:00");
    await page.goto("/timetables");
    await page.getByRole("tab", { name: "Hoy" }).click();
    await todayResponse;
    const today = await todayAt(
      page,
      teacherFixture.activeAcademicPeriodId,
      "2026-10-19T12:00:00-05:00",
    );
    expect(today.status).toBe(200);
    const labels = await page
      .locator("#teacher-today-panel li p:first-child")
      .allTextContents();
    expect(labels).toEqual(["08:00 – 08:40", "10:00 – 10:40"]);
    await expect(
      page.getByRole("columnheader", { name: /Lunes \(hoy\)/ }),
    ).toHaveCount(0);
  });

  test("rejects every teacher timetable mutation and renders no administrative controls", async ({
    page,
  }) => {
    await login(page, teacherFixture.teacher);
    const draft = await api(
      page,
      `/v1/timetables/${teacherFixture.timetableId}`,
    );
    expect(draft.status).toBe(403);
    const attempts = await Promise.all([
      api(page, `/v1/timetables/${teacherFixture.timetableId}/publish`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: 1 }),
      }),
      api(page, `/v1/timetables/${teacherFixture.timetableId}/unpublish`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: 1 }),
      }),
      api(page, `/v1/timetables/${teacherFixture.timetableId}/slots`, {
        method: "PUT",
        body: JSON.stringify({ expectedVersion: 1, slots: [] }),
      }),
      api(page, `/v1/timetables/${teacherFixture.timetableId}`, {
        method: "DELETE",
      }),
    ]);
    attempts.forEach((attempt) => expect(attempt.status).toBe(403));
    await page.goto("/timetables");
    await expect(
      page.getByRole("button", {
        name: /Publicar horario|Anular publicación|Editar horario|Generar propuesta|Añadir bloque/,
      }),
    ).toHaveCount(0);
  });

  test("keeps the weekly timetable usable in a mobile Chromium viewport with contained grid scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await publishOwnDraft(page);
    await login(page, teacherFixture.teacher);
    await useE2eToday(page, "2026-10-19T12:00:00-05:00");
    await page.goto("/timetables");
    const grid = page.getByRole("region", {
      name: "Cuadrícula de mi horario semanal",
    });
    await expect(grid).toBeVisible();
    await expect(grid.getByText("Matemática").first()).toBeVisible();
    await grid.focus();
    await expect(grid).toBeFocused();
    const dimensions = await grid.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
    const documentWidth = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(documentWidth.scrollWidth).toBeLessThanOrEqual(
      documentWidth.clientWidth,
    );
  });

  test("shows mobile Today navigation and class information", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await publishOwnDraft(page);
    await login(page, teacherFixture.teacher);
    await useE2eToday(page, "2026-10-19T12:00:00-05:00");
    const todayResponse = waitForE2eToday(page, "2026-10-19T12:00:00-05:00");
    await page.goto("/timetables");
    await page.getByRole("tab", { name: "Hoy" }).click();
    await todayResponse;
    await expect(page.getByRole("tab", { name: "Hoy" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const today = await todayAt(
      page,
      teacherFixture.activeAcademicPeriodId,
      "2026-10-19T12:00:00-05:00",
    );
    expect(today.status).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Clases de hoy" }),
    ).toBeVisible();
    await expect(page.getByText("Matemática").first()).toBeVisible();
    await expect(page.getByText(/08:00 – 08:40/)).toBeVisible();
    await page.unroute("**/v1/timetables/me/today**");
    await useE2eToday(page, "2026-10-18T12:00:00-05:00");
    const weekendResponse = waitForE2eToday(page, "2026-10-18T12:00:00-05:00");
    await page.reload();
    await page.getByRole("tab", { name: "Hoy" }).click();
    await weekendResponse;
    await expect(
      page.getByText("No tienes clases publicadas para hoy."),
    ).toBeVisible();
  });

  test("supports keyboard focus and Enter or Space tab activation", async ({
    page,
  }) => {
    await publishOwnDraft(page);
    await login(page, teacherFixture.teacher);
    await page.goto("/timetables");
    const weekly = page.getByRole("tab", { name: "Semana" });
    const today = page.getByRole("tab", { name: "Hoy" });
    await weekly.focus();
    await expect(weekly).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(today).toBeFocused();
    await page.keyboard.press("Space");
    await expect(today).toHaveAttribute("aria-selected", "true");
    await weekly.focus();
    await page.keyboard.press("Enter");
    await expect(weekly).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("region", { name: "Cuadrícula de mi horario semanal" }),
    ).toBeVisible();
  });
});
