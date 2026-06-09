const EXACT_MESSAGES: Record<string, string> = {
  "Request failed": "La solicitud falló",
  Error: "Error",
  Unauthorized: "No autorizado",
  Forbidden: "Acceso denegado",
  "Not Found": "No encontrado",
  "Bad Request": "Solicitud incorrecta",
  "Internal Server Error": "Error interno del servidor",
  "Course not found or inactive": "Curso no encontrado o inactivo",
  "Course does not belong to the selected academic period":
    "El curso no pertenece al período académico seleccionado",
  "Academic period not found": "Período académico no encontrado",
  "Course not found": "Curso no encontrado",
  "Student not found": "Estudiante no encontrado",
  "Student profile not found": "Perfil de estudiante no encontrado",
  "Institution not found": "Institución no encontrada",
  "Grade level not found": "Grado no encontrado",
  "Insufficient permissions": "Permisos insuficientes",
  "Invalid email format": "Formato de correo electrónico inválido",
  "Password is required and must be at least 8 characters":
    "La contraseña es obligatoria y debe tener al menos 8 caracteres",
  "firstName and lastName are required": "El nombre y el apellido son obligatorios",
  "nationalId is required": "La cédula es obligatoria",
  "birthDate must use YYYY-MM-DD format when provided":
    "La fecha de nacimiento debe usar el formato AAAA-MM-DD",
  "gender must be MALE, FEMALE, OTHER, UNSPECIFIED, or empty":
    "El género debe ser MALE, FEMALE, OTHER, UNSPECIFIED o estar vacío",
};

const PATTERN_MESSAGES: Array<{ pattern: RegExp; template: string }> = [
  {
    pattern:
      /^Expected (\d+) comma-separated fields before ';', received (\d+)$/,
    template:
      "Se esperaban $1 campos separados por coma antes de ';', se recibieron $2",
  },
  {
    pattern: /^Duplicate email in CSV: (.+)$/,
    template: "Correo duplicado en el archivo: $1",
  },
  {
    pattern: /^Duplicate nationalId in CSV: (.+)$/,
    template: "Cédula duplicada en el archivo: $1",
  },
];

export function localizeApiMessage(message: string): string {
  const trimmed = message.trim();
  const exact = EXACT_MESSAGES[trimmed];
  if (exact) {
    return exact;
  }

  for (const { pattern, template } of PATTERN_MESSAGES) {
    const match = trimmed.match(pattern);
    if (match) {
      return template.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? "");
    }
  }

  return trimmed;
}
