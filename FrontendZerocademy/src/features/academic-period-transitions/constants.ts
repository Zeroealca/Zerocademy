export const TRANSITION_WIZARD_STEPS = [
  { id: "source", label: "Período origen" },
  { id: "target", label: "Período destino" },
  { id: "options", label: "Opciones" },
  { id: "preview", label: "Vista previa" },
] as const;

export const DEFAULT_TRANSITION_OPTIONS = {
  copyCourses: true,
  copyTeacherAssignments: false,
  copyTerms: true,
  activateTargetPeriod: true,
  closeSourcePeriod: true,
} as const;
