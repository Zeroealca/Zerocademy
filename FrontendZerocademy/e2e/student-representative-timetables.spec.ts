import { expect, test } from "@playwright/test";
import {
  cleanupBrowserFixture,
  prepareStudentTimetableFixture,
  type BrowserFixture,
} from "./schedule-structure-browser-fixture";

let fixture: Required<BrowserFixture>;
async function login(
  page: import("@playwright/test").Page,
  account: { email: string; password: string },
) {
  const response = await page.request.post("/v1/auth/login", {
    data: { email: account.email, password: account.password },
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
    session,
  );
  await page.goto("/dashboard");
}
async function api(
  page: import("@playwright/test").Page,
  url: string,
  init?: RequestInit,
) {
  return page.evaluate(
    async ({ url, init }) => {
      const state = JSON.parse(localStorage.getItem("zerocademy-auth") ?? "{}");
      const response = await fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${state.state?.accessToken}`,
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
test.describe("DEMY-143 student and representative timetables", () => {
  test.beforeEach(() => {
    fixture = prepareStudentTimetableFixture();
  });
  test.afterEach(() => {
    cleanupBrowserFixture();
  });
  test("HTTP: returns only enrolled published student slots", async ({
    page,
  }) => {
    await login(page, fixture.studentA);
    const weekly = await api(
      page,
      `/v1/timetables/student/me?academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    expect(weekly.status).toBe(200);
    expect(JSON.stringify(weekly.body)).toContain("Matemática");
    expect(JSON.stringify(weekly.body)).not.toContain("Institution B Science");
    const otherPeriod = await api(
      page,
      "/v1/timetables/student/me?academicPeriodId=00000000-0000-0000-0000-000000000000",
    );
    expect(otherPeriod.status).toBe(200);
    expect((otherPeriod.body as { data: unknown[] }).data).toEqual([]);
    const mutation = await api(
      page,
      `/v1/timetables/${fixture.timetableId}/unpublish`,
      {
        method: "POST",
        body: JSON.stringify({ expectedVersion: 2 }),
      },
    );
    expect(mutation.status).toBe(403);
    const today = await api(
      page,
      `/v1/timetables/student/me/today?academicPeriodId=${fixture.activeAcademicPeriodId}`,
      { headers: { "x-zerocademy-e2e-now": "2026-10-18T12:00:00-05:00" } },
    );
    expect(today.status).toBe(200);
    expect((today.body as { data: unknown[] }).data).toEqual([]);
  });
  test("HTTP: isolates published timetables between institutions", async ({
    page,
  }) => {
    await login(page, fixture.studentA);
    const studentA = await api(
      page,
      `/v1/timetables/student/me?academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    const studentABody = JSON.stringify(studentA.body);
    expect(studentA.status).toBe(200);
    expect(studentABody).toContain("Matemática");
    expect(studentABody).not.toContain("Institution B Science");

    await login(page, fixture.studentB);
    const studentB = await api(
      page,
      `/v1/timetables/student/me?academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    const studentBBody = JSON.stringify(studentB.body);
    expect(studentB.status).toBe(200);
    expect(studentBBody).toContain("Institution B Science");
    expect(studentBBody).not.toContain("Matemática");

    await login(page, fixture.representativeA);
    const linkedStudent = await api(
      page,
      `/v1/timetables/representative?studentId=${fixture.studentA.id}&academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    expect(linkedStudent.status).toBe(200);
    expect(JSON.stringify(linkedStudent.body)).toContain("Matemática");

    const unlinkedStudent = await api(
      page,
      `/v1/timetables/representative?studentId=${fixture.studentB.id}&academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    expect(unlinkedStudent.status).toBe(404);
    expect(JSON.stringify(unlinkedStudent.body)).not.toContain(
      "Institution B Science",
    );
  });
  test("HTTP: representative is limited to active linked students", async ({
    page,
  }) => {
    await login(page, fixture.representativeA);
    const first = await api(
      page,
      `/v1/timetables/representative?studentId=${fixture.representativeA.studentIds[0]}&academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    const second = await api(
      page,
      `/v1/timetables/representative?studentId=${fixture.studentB.id}&academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    const invalid = await api(
      page,
      `/v1/timetables/representative?studentId=00000000-0000-0000-0000-000000000000`,
    );
    expect(first.status).toBe(200);
    expect(JSON.stringify(first.body)).toContain("Matemática");
    expect(second.status).toBe(404);
    expect(invalid.status).toBe(404);
  });
  test("HTTP: empty and inactive identities cannot broaden timetable access", async ({
    page,
  }) => {
    await login(page, fixture.unenrolledStudent);
    const noEnrollment = await api(
      page,
      `/v1/timetables/student/me?academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    expect(noEnrollment.status).toBe(200);
    expect((noEnrollment.body as { data: unknown[] }).data).toEqual([]);
    await login(page, fixture.noTimetableStudent);
    const noTimetable = await api(
      page,
      `/v1/timetables/student/me?academicPeriodId=${fixture.activeAcademicPeriodId}`,
    );
    expect(noTimetable.status).toBe(200);
    expect((noTimetable.body as { data: unknown[] }).data).toEqual([]);
    await login(page, fixture.inactiveRepresentative);
    const inactive = await api(
      page,
      `/v1/timetables/representative?studentId=${fixture.studentA.id}`,
    );
    expect(inactive.status).toBe(404);
    await login(page, fixture.unlinkedRepresentative);
    const unlinked = await api(
      page,
      `/v1/timetables/representative?studentId=${fixture.studentA.id}`,
    );
    expect(unlinked.status).toBe(404);
    await login(page, fixture.admin);
    const unauthorized = await api(page, "/v1/timetables/student/me");
    expect(unauthorized.status).toBe(403);
  });
  test("browser: student and representative views are read-only", async ({
    page,
  }) => {
    await login(page, fixture.studentA);
    await page.goto("/timetables");
    await expect(
      page.getByRole("heading", { name: "Mi horario" }),
    ).toBeVisible();
    await expect(page.getByText("Matemática")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Publicar|Generar|Añadir/ }),
    ).toHaveCount(0);
    await login(page, fixture.representativeA);
    await page.goto("/timetables");
    await expect(page.getByLabel("Estudiante")).toBeVisible();
    await expect(page.getByText("Matemática")).toBeVisible();
    await page.getByRole("tab", { name: "Hoy" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("tab", { name: "Hoy" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  test("browser: mobile views keep timetable grids contained and show empty states", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, fixture.studentA);
    await page.goto("/timetables");
    const grid = page.getByRole("region", {
      name: "Cuadrícula del horario semanal",
    });
    await expect(grid).toBeVisible();
    await grid.focus();
    await expect(grid).toBeFocused();
    const dimensions = await grid.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
    const pageWidth = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth);
    await page.getByRole("tab", { name: "Hoy" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("No hay clases publicadas para hoy."),
    ).toBeVisible();
    await login(page, fixture.noTimetableStudent);
    await page.goto("/timetables");
    await expect(
      page.getByText("No hay un horario semanal publicado para este período."),
    ).toBeVisible();
  });
});
