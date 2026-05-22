export const GENDER_LABELS: Record<
  "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED",
  string
> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
  OTHER: "Otro",
  UNSPECIFIED: "Sin especificar",
};

export const GENDERS = ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] as const;

/** Same fields and order as the student creation form. */
export const STUDENT_CSV_FIELDS = [
  {
    key: "email",
    label: "Correo electrónico",
    required: true,
    hint: "Cuenta de acceso del estudiante",
  },
  {
    key: "password",
    label: "Contraseña temporal",
    required: true,
    hint: "Mínimo 8 caracteres",
  },
  {
    key: "firstName",
    label: "Nombre",
    required: true,
  },
  {
    key: "lastName",
    label: "Apellido",
    required: true,
  },
  {
    key: "nationalId",
    label: "Cédula / ID nacional",
    required: true,
  },
  {
    key: "birthDate",
    label: "Fecha de nacimiento",
    required: false,
    hint: "YYYY-MM-DD (vacío si no aplica)",
  },
  {
    key: "gender",
    label: "Género",
    required: false,
    hint: "MALE, FEMALE, OTHER o UNSPECIFIED",
  },
  {
    key: "phone",
    label: "Teléfono",
    required: false,
  },
  {
    key: "address",
    label: "Dirección",
    required: false,
    hint: "Sin comas en el valor",
  },
  {
    key: "emergencyContact",
    label: "Contacto de emergencia",
    required: false,
    hint: "Sin comas en el valor",
  },
] as const;

export const STUDENT_CSV_HEADER = STUDENT_CSV_FIELDS.map((field) => field.key).join(
  ",",
);

export const STUDENT_CSV_HEADER_LINE = `${STUDENT_CSV_HEADER};`;

/** Example data rows only — paste below the header line documented on the page. */
export const CSV_EXAMPLE_ROWS = `student1@example.com,password123,Juan,Pérez,0912345678,2010-05-15,MALE,0991234567,Av. Principal 123,María Pérez (madre);
student2@example.com,password123,María,Gómez,0923456789,,FEMALE,,,`;
