import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimetablesPage } from "./timetables-page";

const ids = {
  institution: "f9d5db21-68a1-43ec-8a2a-6c055ffa5ca0",
  period: "6fdcba42-f1b1-4c28-bad9-47b89c9cb9e0",
  first: "2ebd23f2-7e55-49f2-b9be-b779c83c3c13",
  second: "da7ce04e-e12b-47b3-9c7a-942c771d2c34",
};

const mutation = () => ({ mutateAsync: vi.fn(), isPending: false, error: null });
const mutations = {
  saveWeekdays: mutation(),
  createBlock: mutation(),
  updateBlock: mutation(),
  deleteBlock: mutation(),
  reorder: mutation(),
};

const state = {
  role: "ADMIN" as "ADMIN" | "TEACHER",
  contextLoading: false,
  contextError: false,
  loading: false,
  error: null as Error | null,
  structure: {
    id: "structure-id",
    institutionId: ids.institution,
    academicPeriodId: ids.period,
    enabledWeekdays: ["MON", "TUE"] as const,
    blocks: [
      { id: ids.first, position: 1, name: "Primera hora", startTime: "08:00", endTime: "08:40", kind: "TEACHING" as const },
      { id: ids.second, position: 2, name: "Recreo", startTime: "08:40", endTime: "09:00", kind: "BREAK" as const },
    ],
    capacity: { enabledWeekdays: ["MON", "TUE"], teachingBlocksPerConfiguredDay: 1, weeklyTeachingSlotsPerCourse: 2, breakBlocksPerConfiguredDay: 1, nonTeachingBlocksPerConfiguredDay: 0, structurallyReady: true },
  },
  status: "ACTIVE" as "ACTIVE" | "CLOSED" | "ARCHIVED",
  validation: { structurallyReady: true, issues: [] as Array<{ status: string; severity: "ERROR"; message: string; scheduleBlockId: string | null }> },
};

vi.mock("@/stores/use-auth-store", () => ({
  useAuthStore: (selector: (value: { user: { role: typeof state.role } }) => unknown) => selector({ user: { role: state.role } }),
}));
vi.mock("@/features/academic-periods/hooks/use-academic-period-context", () => ({
  useAcademicPeriodContext: () => ({
    data: state.contextError || state.contextLoading ? undefined : { institutionId: ids.institution, effectivePeriod: { id: ids.period, status: state.status, regime: "COSTA_GALAPAGOS" } },
    isLoading: state.contextLoading,
    isError: state.contextError,
  }),
}));
vi.mock("@/features/timetables/hooks/use-schedule-structure", () => ({
  useScheduleStructure: () => ({ data: state.structure, isLoading: state.loading, isError: Boolean(state.error), error: state.error, refetch: vi.fn() }),
  useScheduleStructureValidation: () => ({ data: state.validation }),
  useScheduleStructureMutations: () => mutations,
}));

function reset(): void {
  state.role = "ADMIN";
  state.contextLoading = false;
  state.contextError = false;
  state.loading = false;
  state.error = null;
  state.status = "ACTIVE";
  state.structure.blocks = [
    { id: ids.first, position: 1, name: "Primera hora", startTime: "08:00", endTime: "08:40", kind: "TEACHING" },
    { id: ids.second, position: 2, name: "Recreo", startTime: "08:40", endTime: "09:00", kind: "BREAK" },
  ];
  state.validation = { structurallyReady: true, issues: [] };
  Object.values(mutations).forEach((value) => value.mutateAsync.mockReset());
}

describe("TimetablesPage", () => {
  beforeEach(reset);
  afterEach(cleanup);

  it("denies non-admin users", () => {
    state.role = "TEACHER";
    render(<TimetablesPage />);
    expect(screen.getByRole("heading", { name: "Acceso denegado" })).toBeInTheDocument();
  });

  it("explains a missing academic context", () => {
    state.contextError = true;
    render(<TimetablesPage />);
    expect(screen.getByText("Selecciona un período académico")).toBeInTheDocument();
  });

  it("renders loading and request-error states", () => {
    state.loading = true;
    const { rerender } = render(<TimetablesPage />);
    expect(screen.getByText("Cargando la estructura horaria…")).toBeInTheDocument();
    state.loading = false;
    state.error = new Error("network");
    rerender(<TimetablesPage />);
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("renders the configured context, weekdays, blocks, and capacity", () => {
    render(<TimetablesPage />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Costa - Galápagos")).toBeInTheDocument();
    expect(screen.getByText("Primera hora")).toBeInTheDocument();
    expect(screen.getByText("Capacidad semanal por curso: 2 bloques lectivos.")).toBeInTheDocument();
    expect(screen.getByLabelText("Lunes")).toBeChecked();
  });

  it("shows an accessible empty state", () => {
    state.structure.blocks = [];
    render(<TimetablesPage />);
    expect(screen.getByText(/Aún no hay bloques configurados/)).toBeInTheDocument();
    expect(screen.getByText(/Añade períodos de clase/)).toBeInTheDocument();
  });

  it("saves the complete weekday selection", async () => {
    const user = userEvent.setup();
    render(<TimetablesPage />);
    await user.click(screen.getByLabelText("Miércoles"));
    await user.click(screen.getByRole("button", { name: "Guardar días" }));
    expect(mutations.saveWeekdays.mutateAsync).toHaveBeenCalledWith(["MON", "TUE", "WED"]);
  });

  it("creates a typed block and prevents an invalid time range", async () => {
    const user = userEvent.setup();
    render(<TimetablesPage />);
    await user.click(screen.getByRole("button", { name: "Añadir bloque" }));
    const end = screen.getByLabelText("Fin");
    fireEvent.change(end, { target: { value: "06:59" } });
    expect(screen.getByText("La hora de fin debe ser posterior a la hora de inicio.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    fireEvent.change(end, { target: { value: "08:00" } });
    await user.selectOptions(screen.getByLabelText("Tipo"), "NON_TEACHING");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(mutations.createBlock.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ kind: "NON_TEACHING", endTime: "08:00" }));
  });

  it("edits, reorders, and confirms deletion of a block", async () => {
    const user = userEvent.setup();
    const confirmation = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TimetablesPage />);
    await user.click(screen.getAllByRole("button", { name: "Editar bloque" })[0]);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Inicio" } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(mutations.updateBlock.mutateAsync).toHaveBeenCalledWith({ id: ids.first, payload: expect.objectContaining({ name: "Inicio" }) });
    await user.click(screen.getAllByRole("button", { name: "Bajar bloque" })[0]);
    expect(mutations.reorder.mutateAsync).toHaveBeenCalledWith([ids.second, ids.first]);
    await user.click(screen.getAllByRole("button", { name: "Eliminar bloque" })[0]);
    expect(confirmation).toHaveBeenCalled();
    expect(mutations.deleteBlock.mutateAsync).toHaveBeenCalledWith(ids.first);
    confirmation.mockRestore();
  });

  it("presents backend validation feedback", () => {
    state.validation = { structurallyReady: false, issues: [{ status: "OVERLAPPING_BLOCKS", severity: "ERROR", message: "Los bloques se superponen.", scheduleBlockId: ids.first }] };
    render(<TimetablesPage />);
    expect(screen.getByText("Los bloques se superponen.")).toBeInTheDocument();
  });

  it.each(["CLOSED", "ARCHIVED"] as const)("keeps %s periods read-only", (status) => {
    state.status = status;
    render(<TimetablesPage />);
    expect(screen.getByText(/modo de solo lectura/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Añadir bloque" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar días" })).toBeDisabled();
  });
});
