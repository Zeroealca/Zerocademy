const EXACT_MESSAGES: Record<string, string> = {
  "Request failed": "La solicitud falló",
  Error: "Error",
  Unauthorized: "No autorizado",
  UNAUTHORIZED: "No autorizado",
  Forbidden: "Acceso denegado",
  FORBIDDEN: "Acceso denegado",
  "Not Found": "No encontrado",
  NOT_FOUND: "No encontrado",
  "Bad Request": "Solicitud incorrecta",
  BAD_REQUEST: "Solicitud incorrecta",
  Conflict: "Conflicto",
  CONFLICT: "Conflicto",
  "Internal Server Error": "Error interno del servidor",
  "Internal server error": "Error interno del servidor",
  INTERNAL_SERVER_ERROR: "Error interno del servidor",
  "Payload Too Large": "El archivo es demasiado grande",
  PAYLOAD_TOO_LARGE: "El archivo es demasiado grande",
  "Unprocessable Entity": "No se pudo procesar la solicitud",
  UNPROCESSABLE_ENTITY: "No se pudo procesar la solicitud",
  "Validation failed": "La validación falló",
  "Access denied": "Acceso denegado",
  "Insufficient permissions": "Permisos insuficientes",
  "Insufficient role permissions": "Permisos insuficientes para este rol",
  "Invalid credentials": "Correo o contraseña incorrectos",
  "Invalid refresh token": "Sesión inválida o expirada",
  "User not found or inactive": "Usuario no encontrado o inactivo",
  "User not found": "Usuario no encontrado",
  "Email already exists": "Este correo ya está registrado",
  "Only a super admin can change another super admin role":
    "Solo un superadministrador puede cambiar el rol de otro superadministrador",
  "Insufficient permissions to view super admins":
    "No tienes permisos para ver superadministradores",
  "Course not found or inactive": "Curso no encontrado o inactivo",
  "Course does not belong to the selected academic period":
    "El curso no pertenece al período académico seleccionado",
  "Academic period not found": "Período académico no encontrado",
  "Academic period not found for this institution":
    "Período académico no encontrado para esta institución",
  "Academic period is not accessible": "El período académico no está disponible",
  "Academic period does not belong to your institution":
    "El período académico no pertenece a tu institución",
  "Your role cannot select an academic period context":
    "Tu rol no puede seleccionar un período académico",
  "Course not found": "Curso no encontrado",
  "Course access denied": "Acceso denegado al curso",
  "Course is not active": "El curso no está activo",
  "Deactivate the course before deleting it":
    "Desactiva el curso antes de eliminarlo",
  "Student not found": "Estudiante no encontrado",
  "Student not found or inactive": "Estudiante no encontrado o inactivo",
  "Student profile not found": "Perfil de estudiante no encontrado",
  "Student enrollment not found": "Matrícula del estudiante no encontrada",
  "Active enrollment not found": "No se encontró una matrícula activa",
  "Enrollment not found": "Matrícula no encontrada",
  "Enrollment is not active": "La matrícula no está activa",
  "Student is already enrolled in this course for the period":
    "El estudiante ya está matriculado en este curso para el período",
  "Institution not found": "Institución no encontrada",
  "Institution code must be unique": "El código de la institución debe ser único",
  "An institution with this code already exists":
    "Ya existe una institución con este código",
  "Institution code must be 3–50 lowercase alphanumeric characters (hyphens allowed, not at edges)":
    "El código debe tener entre 3 y 50 caracteres en minúsculas, números o guiones (sin guiones al inicio o al final)",
  "Academic operations require an active institution":
    "Las operaciones académicas requieren una institución activa",
  "Region is not compatible with the Costa/Galápagos academic regime":
    "La región no es compatible con el régimen Costa/Galápagos",
  "Region is not compatible with the Sierra/Amazonía academic regime":
    "La región no es compatible con el régimen Sierra/Amazonía",
  "Cannot delete an institution with linked academic or profile records":
    "No se puede eliminar una institución con registros académicos o perfiles asociados",
  "Logo file is required": "El archivo del logo es obligatorio",
  "Invalid image type. Allowed: PNG, JPEG, WebP, GIF":
    "Tipo de imagen no válido. Permitidos: PNG, JPEG, WebP, GIF",
  "Logo file must be 5 MB or smaller": "El logo debe pesar 5 MB o menos",
  "Grade level not found": "Grado no encontrado",
  "Academic level not found": "Nivel académico no encontrado",
  "A grade level with this code already exists for the academic level":
    "Ya existe un grado con este código en el nivel académico",
  "System grade levels cannot be tied to an institution":
    "Los grados del sistema no pueden estar vinculados a una institución",
  "Cannot assign a grade level to an inactive academic level":
    "No se puede asignar un grado a un nivel académico inactivo",
  "Deactivate child courses before deactivating this grade level":
    "Desactiva los cursos asociados antes de desactivar este grado",
  "Cannot delete a grade level that has courses":
    "No se puede eliminar un grado que tiene cursos",
  "An academic level with this code already exists for the given scope":
    "Ya existe un nivel académico con este código en el ámbito indicado",
  "System academic levels cannot be tied to an institution":
    "Los niveles académicos del sistema no pueden estar vinculados a una institución",
  "Deactivate child grade levels before deactivating this academic level":
    "Desactiva los grados asociados antes de desactivar este nivel académico",
  "Cannot delete an academic level that has grade levels":
    "No se puede eliminar un nivel académico que tiene grados",
  "Grade level must be active to assign a course":
    "El grado debe estar activo para asignar un curso",
  "A course with this section already exists for the selected period and grade":
    "Ya existe un curso con este paralelo para el período y grado seleccionados",
  "A subject with this code already exists":
    "Ya existe una materia con este código",
  "System subjects cannot belong to an institution":
    "Las materias del sistema no pueden pertenecer a una institución",
  "System subjects cannot be restricted to specific grade levels at creation":
    "Las materias del sistema no pueden limitarse a grados específicos al crearlas",
  "One or more grade levels were not found or are inactive":
    "Uno o más grados no se encontraron o están inactivos",
  "Subject not found": "Materia no encontrada",
  "Subject not found in course": "La materia no se encontró en el curso",
  "Subject access denied": "Acceso denegado a la materia",
  "Subject is not active": "La materia no está activa",
  "Subject is not linked to the grade level of the selected course":
    "La materia no está vinculada al grado del curso seleccionado",
  "Remove teacher assignments before deactivating this subject":
    "Quita las asignaciones docentes antes de desactivar esta materia",
  "Cannot delete a subject that has teacher assignments":
    "No se puede eliminar una materia que tiene asignaciones docentes",
  "Teacher not found": "Docente no encontrado",
  "Teacher account is not active": "La cuenta del docente no está activa",
  "Teacher assignment not found": "Asignación docente no encontrada",
  "Teacher assignment is not assigned to you":
    "Esta asignación docente no te corresponde",
  "Teacher profile is required": "Se requiere un perfil de docente",
  "This teacher is already assigned to this subject for the selected course and period":
    "Este docente ya está asignado a esta materia en el curso y período seleccionados",
  "National ID already registered": "Esta cédula ya está registrada",
  "Email or national ID already exists":
    "El correo o la cédula ya están registrados",
  "Invalid email format": "Formato de correo electrónico inválido",
  "Password is required and must be at least 8 characters":
    "La contraseña es obligatoria y debe tener al menos 8 caracteres",
  "firstName and lastName are required": "El nombre y el apellido son obligatorios",
  "nationalId is required": "La cédula es obligatoria",
  "birthDate must use YYYY-MM-DD format when provided":
    "La fecha de nacimiento debe usar el formato AAAA-MM-DD",
  "gender must be MALE, FEMALE, OTHER, UNSPECIFIED, or empty":
    "El género debe ser MALE, FEMALE, OTHER, UNSPECIFIED o estar vacío",
  "Import failed for row": "No se pudo importar esta fila",
  "startDate must be before endDate":
    "La fecha de inicio debe ser anterior a la fecha de fin",
  "Term order values must be unique within a period":
    "El orden de los trimestres debe ser único dentro del período",
  "Cannot activate: date range overlaps another active period for this regime":
    "No se puede activar: el rango de fechas se superpone con otro período activo de este régimen",
  "Archived periods cannot be activated":
    "Los períodos archivados no se pueden activar",
  "Deactivate the period before deleting it":
    "Desactiva el período antes de eliminarlo",
  "Deactivate the period before editing core calendar fields":
    "Desactiva el período antes de editar las fechas del calendario",
  "Deactivate the period before archiving":
    "Desactiva el período antes de archivarlo",
  "Only active periods can be deactivated":
    "Solo se pueden desactivar los períodos activos",
  "Invalid date value": "La fecha no es válida",
  "Cannot modify terms on an archived period":
    "No se pueden modificar trimestres de un período archivado",
  "Academic term not found": "Trimestre no encontrado",
  "A term with this order already exists for the period":
    "Ya existe un trimestre con este orden en el período",
  "User account must be active": "La cuenta de usuario debe estar activa",
  "Super admins are not assigned via institution memberships":
    "Los superadministradores no se asignan mediante membresías institucionales",
  "Membership role does not match user account role":
    "El rol de la membresía no coincide con el rol de la cuenta",
  "User is already a member of this institution":
    "El usuario ya es miembro de esta institución",
  "Institution membership not found": "Membresía institucional no encontrada",
  "Students only": "Solo disponible para estudiantes",
  "Teachers must specify a course scope":
    "Los docentes deben indicar un curso",
  "Admin access required": "Se requiere acceso de administrador",
  "Assessment not found": "Evaluación no encontrada",
  "Assessment access denied": "Acceso denegado a la evaluación",
  "Grade not found": "Nota no encontrada",
  "Grade access denied": "Acceso denegado a la nota",
  "Students cannot access grade entry sheets":
    "Los estudiantes no pueden acceder al registro de notas",
  "Only teachers can update grades": "Solo los docentes pueden actualizar notas",
  "Only teachers can register grades": "Solo los docentes pueden registrar notas",
  "Only teachers can update assessments":
    "Solo los docentes pueden actualizar evaluaciones",
  "Only teachers can delete assessments":
    "Solo los docentes pueden eliminar evaluaciones",
  "Only teachers can manage assessments and grades":
    "Solo los docentes pueden gestionar evaluaciones y notas",
  "Cannot delete an assessment that has grade records":
    "No se puede eliminar una evaluación que tiene notas registradas",
  "Score cannot be negative": "La nota no puede ser negativa",
  "Invalid assessment or enrollment reference":
    "La evaluación o la matrícula no son válidas",
  "Subject does not match the teacher assignment":
    "La materia no coincide con la asignación docente",
  "Academic period does not match the teacher assignment":
    "El período académico no coincide con la asignación docente",
  "Institution does not match the teacher assignment":
    "La institución no coincide con la asignación docente",
  "Academic term does not belong to the selected academic period":
    "El trimestre no pertenece al período académico seleccionado",
  "Assessment category not found": "Categoría de evaluación no encontrada",
  "Assessment category not found or inactive":
    "Categoría de evaluación no encontrada o inactiva",
  "Assessment category does not belong to the institution":
    "La categoría de evaluación no pertenece a la institución",
  "Assessment category name already exists for this institution":
    "Ya existe una categoría de evaluación con este nombre en la institución",
  "Weight must be greater than 0 and at most 100":
    "El peso debe ser mayor que 0 y como máximo 100",
  "Enrollment does not belong to the assessment course and period":
    "La matrícula no pertenece al curso y período de la evaluación",
  "A grade already exists for this student on this assessment":
    "Ya existe una nota de este estudiante en esta evaluación",
  "Institution academic evaluation configuration is not set":
    "La configuración de evaluación académica de la institución no está definida",
  "Grade submission failed": "No se pudo guardar la nota",
  "Grade validation failed": "La validación de la nota falló",
  "Grading scheme not found": "Esquema de calificación no encontrado",
  "Grade scale not found": "Escala de calificación no encontrada",
  "Grade scale code or order already exists":
    "El código o el orden de la escala ya existen",
  "Grading scheme constraint violation":
    "Conflicto en el esquema de calificación",
  "Grading scheme must be a global template":
    "El esquema de calificación debe ser una plantilla global",
  "Selected grading scheme is not active":
    "El esquema de calificación seleccionado no está activo",
  "Minimum score must be less than maximum score":
    "La nota mínima debe ser menor que la máxima",
  "Passing score must be within the grading range":
    "La nota de aprobación debe estar dentro del rango",
  "Decimal places must be an integer between 0 and 4":
    "Los decimales deben ser un número entero entre 0 y 4",
  "Only global platform grading schemes can be updated via this route":
    "Solo se pueden actualizar esquemas globales de plataforma por esta vía",
  "Global grading schemes must be updated via the platform route":
    "Los esquemas globales deben actualizarse desde la configuración de plataforma",
  "Cannot deactivate a grading scheme linked to an institution configuration":
    "No se puede desactivar un esquema vinculado a la configuración de una institución",
  "Cannot delete a grading scheme referenced by institution configuration":
    "No se puede eliminar un esquema usado en la configuración de una institución",
  "Platform evaluation defaults not found":
    "No se encontró la configuración predeterminada de evaluación",
  "Platform evaluation defaults not initialized. Run initialize-ecuador-defaults first.":
    "La configuración predeterminada de evaluación no está inicializada",
  "Evaluation term not found": "Período de evaluación no encontrado",
  "Evaluation term name or order already exists for this period":
    "El nombre o el orden del período de evaluación ya existen",
  "Duplicate order values in reorder payload":
    "Hay valores de orden duplicados en el reordenamiento",
  "Reorder items must belong to the same institution and academic period":
    "Los elementos reordenados deben pertenecer a la misma institución y período académico",
  "Academic period does not belong to this institution":
    "El período académico no pertenece a esta institución",
  "Academic period regime does not match this institution":
    "El régimen del período no coincide con el de esta institución",
  "copyTeacherAssignments requires copyCourses to be enabled":
    "Para copiar asignaciones docentes debes copiar también los cursos",
  "Source academic period not found": "Período académico de origen no encontrado",
  "Source period does not belong to this institution":
    "El período de origen no pertenece a esta institución",
  "Source period regime does not match this institution":
    "El régimen del período de origen no coincide con el de esta institución",
  "Source and target academic periods must be different":
    "El período de origen y el de destino deben ser distintos",
  "Provide either toAcademicPeriodId or createTargetPeriod, not both":
    "Indica un período destino existente o crea uno nuevo, no ambos",
  "Target period id or createTargetPeriod is required":
    "Debes indicar un período destino o crear uno nuevo",
  "Target academic period not found": "Período académico destino no encontrado",
  "Target period does not belong to this institution":
    "El período destino no pertenece a esta institución",
  "Target period regime does not match this institution":
    "El régimen del período destino no coincide con el de esta institución",
  "You must be an active admin member of this institution":
    "Debes ser un administrador activo de esta institución",
  "must be an email": "debe ser un correo electrónico válido",
  "must be a string": "debe ser texto",
  "must be a number": "debe ser un número",
  "must be an integer number": "debe ser un número entero",
  "must be a boolean": "debe ser verdadero o falso",
  "must be a UUID": "debe ser un identificador válido",
  "must be a valid enum value": "debe ser un valor permitido",
  "should not be empty": "no puede estar vacío",
  "should not exist": "no está permitido",
  "Invalid UUID": "Identificador inválido",
  "Invalid uuid": "Identificador inválido",
  "Invalid email": "Correo electrónico inválido",
  "Invalid email address": "Correo electrónico inválido",
  "must be a valid ISO 8601 date string": "debe ser una fecha válida",
  "Too Many Requests": "Demasiadas solicitudes",
  TOO_MANY_REQUESTS: "Demasiadas solicitudes",
  "Service Unavailable": "Servicio no disponible",
  SERVICE_UNAVAILABLE: "Servicio no disponible",
};

const ENGLISH_LABELS: Record<string, string> = {
  "Assessment category": "la categoría de evaluación",
  "Assessment category template": "la plantilla de categoría de evaluación",
  "Evaluation term": "el período de evaluación",
  "Evaluation term template": "la plantilla de período de evaluación",
  primaryColor: "color primario",
  secondaryColor: "color secundario",
  ADMIN: "administrador",
  TEACHER: "docente",
  STUDENT: "estudiante",
  REPRESENTATIVE: "representante",
  SUPER_ADMIN: "superadministrador",
};

const PATTERN_MESSAGES: Array<{
  pattern: RegExp;
  replace: (match: RegExpMatchArray) => string;
}> = [
  {
    pattern:
      /^Expected (\d+) comma-separated fields before ';', received (\d+)$/,
    replace: (match) =>
      `Se esperaban ${match[1]} campos separados por coma antes de ';', se recibieron ${match[2]}`,
  },
  {
    pattern: /^Duplicate email in CSV: (.+)$/,
    replace: (match) => `Correo duplicado en el archivo: ${match[1]}`,
  },
  {
    pattern: /^Duplicate nationalId in CSV: (.+)$/,
    replace: (match) => `Cédula duplicada en el archivo: ${match[1]}`,
  },
  {
    pattern: /^Score cannot exceed the assessment maximum \((.+)\)$/,
    replace: (match) =>
      `La nota no puede superar el máximo de la evaluación (${match[1]})`,
  },
  {
    pattern: /^Score must be between (.+) and (.+)$/,
    replace: (match) => `La nota debe estar entre ${match[1]} y ${match[2]}`,
  },
  {
    pattern: /^Score must have at most (\d+) decimal places$/,
    replace: (match) =>
      `La nota debe tener como máximo ${match[1]} decimales`,
  },
  {
    pattern: /^Grade scale "(.+)" has an invalid range$/,
    replace: (match) => `La escala "${match[1]}" tiene un rango inválido`,
  },
  {
    pattern:
      /^Grade scale "(.+)" must fit within the grading scheme range$/,
    replace: (match) =>
      `La escala "${match[1]}" debe estar dentro del rango del esquema`,
  },
  {
    pattern: /^Grade scales "(.+)" and "(.+)" overlap$/,
    replace: (match) =>
      `Las escalas "${match[1]}" y "${match[2]}" se superponen`,
  },
  {
    pattern:
      /^(.+) weights must sum to 100 \(current sum: (.+)\)$/,
    replace: (match) =>
      `Los pesos de ${localizeLabel(match[1] ?? "")} deben sumar 100 (suma actual: ${match[2]})`,
  },
  {
    pattern: /^(.+) weight must be greater than 0 and at most 100$/,
    replace: (match) =>
      `El peso de ${localizeLabel(match[1] ?? "")} debe ser mayor que 0 y como máximo 100`,
  },
  {
    pattern: /^(.+) name or order already exists$/,
    replace: (match) =>
      `El nombre o el orden de ${localizeLabel(match[1] ?? "")} ya existen`,
  },
  {
    pattern: /^(.+): startDate must be before endDate$/,
    replace: (match) =>
      `${match[1]}: la fecha de inicio debe ser anterior a la fecha de fin`,
  },
  {
    pattern: /^(.+) dates must fall within the academic period range$/,
    replace: (match) =>
      `Las fechas de ${match[1]} deben estar dentro del período académico`,
  },
  {
    pattern: /^Terms "(.+)" and "(.+)" have overlapping dates$/,
    replace: (match) =>
      `Los trimestres "${match[1]}" y "${match[2]}" tienen fechas superpuestas`,
  },
  {
    pattern: /^(.+) must be a valid hex color \(e\.g\. #1E40AF\)$/,
    replace: (match) =>
      `El ${localizeLabel(match[1] ?? "")} debe ser un color hexadecimal válido (p. ej. #1E40AF)`,
  },
  {
    pattern: /^Insufficient permissions to assign role (.+)$/,
    replace: (match) =>
      `No tienes permisos para asignar el rol ${localizeLabel(match[1] ?? "")}`,
  },
  {
    pattern: /^User account role must be (.+) for this membership$/,
    replace: (match) =>
      `El rol de la cuenta debe ser ${localizeLabel(match[1] ?? "")} para esta membresía`,
  },
  {
    pattern: /^Role (.+) does not support academic profile provisioning$/,
    replace: (match) =>
      `El rol ${localizeLabel(match[1] ?? "")} no admite un perfil académico`,
  },
  {
    pattern: /^property (.+) should not exist$/,
    replace: (match) => `El campo ${match[1]} no está permitido`,
  },
  {
    pattern: /^(.+) should not exist$/,
    replace: (match) => `El campo ${match[1]} no está permitido`,
  },
  {
    pattern: /^must be longer than or equal to (\d+) characters$/,
    replace: (match) =>
      `debe tener al menos ${match[1]} caracteres`,
  },
  {
    pattern: /^must be shorter than or equal to (\d+) characters$/,
    replace: (match) =>
      `debe tener como máximo ${match[1]} caracteres`,
  },
  {
    pattern: /^must not be less than (.+)$/,
    replace: (match) => `no puede ser menor que ${match[1]}`,
  },
  {
    pattern: /^must not be greater than (.+)$/,
    replace: (match) => `no puede ser mayor que ${match[1]}`,
  },
  {
    pattern: /^Unique constraint failed on the fields: \((.+)\)$/,
    replace: () => "Ya existe un registro con esos datos",
  },
  {
    pattern:
      /^Too small: expected string to have >=(\d+) characters$/,
    replace: (match) =>
      `Debe tener al menos ${match[1]} caracteres`,
  },
  {
    pattern:
      /^Too big: expected string to have <=(\d+) characters$/,
    replace: (match) =>
      `No puede superar ${match[1]} caracteres`,
  },
  {
    pattern: /^Too small: expected number to be >=(.+)$/,
    replace: (match) => `Debe ser al menos ${match[1]}`,
  },
  {
    pattern: /^Too big: expected number to be <=(.+)$/,
    replace: (match) => `No puede ser mayor que ${match[1]}`,
  },
  {
    pattern: /^Invalid input: expected (.+), received (.+)$/,
    replace: () => "El valor ingresado no es válido",
  },
  {
    pattern: /^each value in (.+) must be a UUID$/,
    replace: () => "Cada valor debe ser un identificador válido",
  },
];

function localizeLabel(label: string): string {
  return ENGLISH_LABELS[label] ?? label;
}

export function localizeApiMessage(message: string): string {
  const trimmed = message.trim();
  const exact = EXACT_MESSAGES[trimmed];
  if (exact) {
    return exact;
  }

  for (const { pattern, replace } of PATTERN_MESSAGES) {
    const match = trimmed.match(pattern);
    if (match) {
      return replace(match);
    }
  }

  return trimmed;
}
