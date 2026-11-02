import { expect, test, type Page } from "@playwright/test";
import {
  cleanupBrowserFixture,
  prepareStudentTimetableFixture,
  prepareTeacherTimetableFixture,
  type BrowserFixture,
} from "./schedule-structure-browser-fixture";

const monday = "2026-10-19T12:00:00-05:00";

type Account = { email: string; password: string };

async function login(page: Page, account: Account): Promise<void> {
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
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function api(
  page: Page,
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

async function publish(page: Page, fixture: Required<BrowserFixture>) {
  await login(page, fixture.admin);
  const draft = await api(page, `/v1/timetables/${fixture.timetableId}`);
  expect(draft.status).toBe(200);
  const current = draft.body as { status: string; version: number };
  if (current.status === "PUBLISHED") return;
  const response = await api(page, `/v1/timetables/${fixture.timetableId}/publish`, {
    method: "POST",
    body: JSON.stringify({ expectedVersion: current.version }),
  });
  expect(response.status).toBe(200);
}

async function useMonday(page: Page): Promise<void> {
  await page.clock.install({ time: new Date(monday) });
  await page.route("**/v1/timetables/me/today**", (route) =>
    route.continue({
      headers: {
        ...route.request().headers(),
        "x-zerocademy-e2e-now": monday,
      },
    }),
  );
}

async function showToday(page: Page): Promise<void> {
  await page.goto("/timetables");
  await page.getByRole("tab", { name: "Hoy" }).click();
  await expect(page.getByRole("heading", { name: "Clases de hoy" })).toBeVisible();
}

test.describe("DEMY-144 class sessions from Teacher Today", () => {
  let fixture: Required<BrowserFixture>;

  test.beforeEach(() => {
    fixture = prepareTeacherTimetableFixture();
  });
  test.afterEach(() => {
    cleanupBrowserFixture();
  });

  test("opens each published slot once and navigates to its scheduled standalone session", async ({
    page,
  }) => {
    await publish(page, fixture);
    await useMonday(page);
    await login(page, fixture.teacher);
    await showToday(page);

    const documentWidth = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(documentWidth.scrollWidth).toBeLessThanOrEqual(
      documentWidth.clientWidth,
    );

    const firstOpen = page.waitForResponse((response) =>
      response.url().includes("/from-timetable-slot") && response.status() === 201,
    );
    const firstButton = page.getByRole("button", { name: "Abrir sesión" }).first();
    await firstButton.focus();
    await expect(firstButton).toBeFocused();
    await page.keyboard.press("Enter");
    const firstBody = (await (await firstOpen).json()) as {
      classSession: {
        id: string;
        teacherAssignmentId: string;
        status: string;
        lessonPlanId: string | null;
      };
      created: boolean;
    };
    expect(firstBody.created).toBe(true);
    expect(firstBody.classSession.status).toBe("SCHEDULED");
    expect(firstBody.classSession.lessonPlanId).toBeNull();
    await expect(page).toHaveURL(
      new RegExp(`/class-sessions/[^/]+/${firstBody.classSession.id}$`),
    );
    await expect(page.getByRole("heading", { name: "Sesión de clase" })).toBeVisible();
    await expect(page.getByText("Programada").last()).toBeVisible();
    await expect(page.getByText("Matemática").first()).toBeVisible();
    await expect(page.getByText("08:00 – 08:40")).toBeVisible();

    await page.getByRole("link", { name: "Volver a mi horario" }).click();
    await showToday(page);
    const reopened = page.waitForResponse((response) =>
      response.url().includes("/from-timetable-slot") && response.status() === 201,
    );
    await page.getByRole("button", { name: "Abrir sesión" }).first().click();
    const reopenedBody = (await (await reopened).json()) as {
      classSession: { id: string };
      created: boolean;
    };
    expect(reopenedBody).toEqual({
      classSession: expect.objectContaining({ id: firstBody.classSession.id }),
      created: false,
    });

    await page.getByRole("link", { name: "Volver a mi horario" }).click();
    await showToday(page);
    const secondOpen = page.waitForResponse((response) =>
      response.url().includes("/from-timetable-slot") && response.status() === 201,
    );
    await page.getByRole("button", { name: "Abrir sesión" }).nth(1).click();
    const secondBody = (await (await secondOpen).json()) as {
      classSession: { id: string };
    };
    expect(secondBody.classSession.id).not.toBe(firstBody.classSession.id);

    const sessions = await api(
      page,
      `/v1/teacher-assignments/${firstBody.classSession.teacherAssignmentId}/class-sessions`,
    );
    expect(sessions.status).toBe(200);
    expect(sessions.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstBody.classSession.id }),
        expect.objectContaining({ id: secondBody.classSession.id }),
      ]),
    );
    expect((sessions.body as unknown[]).length).toBe(2);
  });

  test("keeps completed and cancelled occurrences historical in the standalone page", async ({
    page,
  }) => {
    await publish(page, fixture);
    await useMonday(page);
    await login(page, fixture.teacher);
    await showToday(page);
    const opened = page.waitForResponse((response) =>
      response.url().includes("/from-timetable-slot") && response.status() === 201,
    );
    await page.getByRole("button", { name: "Abrir sesión" }).first().click();
    const session = (await (await opened).json()) as {
      classSession: { id: string; teacherAssignmentId: string };
    };

    const completed = await api(
      page,
      `/v1/teacher-assignments/${session.classSession.teacherAssignmentId}/class-sessions/${session.classSession.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "COMPLETED", occurredOn: "2026-10-19" }),
      },
    );
    expect(completed.status).toBe(200);
    await page.goto(
      `/class-sessions/${session.classSession.teacherAssignmentId}/${session.classSession.id}`,
    );
    await expect(page.getByText("Completada").last()).toBeVisible();

    const cancelled = await api(
      page,
      `/v1/teacher-assignments/${session.classSession.teacherAssignmentId}/class-sessions/${session.classSession.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED", scheduledDate: "2026-10-19" }),
      },
    );
    expect(cancelled.status).toBe(200);
    await page.goto(
      `/class-sessions/${session.classSession.teacherAssignmentId}/${session.classSession.id}`,
    );
    await expect(
      page.getByText("Cancelada; no se crea un reemplazo automáticamente."),
    ).toBeVisible();
  });

  test("renders loading and not-found session states", async ({ page }) => {
    await publish(page, fixture);
    await login(page, fixture.teacher);
    await page.route("**/class-sessions/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.continue();
    });
    await page.goto(
      "/class-sessions/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000",
    );
    await expect(page.getByRole("heading", { name: "Cargando sesión…" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sesión no disponible" })).toBeVisible();
  });
});

test.describe("DEMY-144 class session controls remain absent for read-only audiences", () => {
  let fixture: Required<BrowserFixture>;

  test.beforeEach(() => {
    fixture = prepareStudentTimetableFixture();
  });
  test.afterEach(() => {
    cleanupBrowserFixture();
  });

  test("does not expose session creation controls to students or representatives", async ({
    page,
  }) => {
    await login(page, fixture.studentA);
    await page.goto("/timetables");
    await expect(page.getByRole("heading", { name: "Mi horario" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir sesión" })).toHaveCount(0);

    await login(page, fixture.representativeA);
    await page.goto("/timetables");
    await expect(page.getByLabel("Estudiante")).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir sesión" })).toHaveCount(0);
  });
});
