import { Gender } from '@prisma/client';
import {
  STUDENT_CSV_FIELD_COUNT,
  STUDENT_CSV_HEADER_LINE,
  STUDENT_CSV_VALID_GENDERS,
} from './student-csv.constants';

export interface ParsedStudentCsvRow {
  rowNumber: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate?: string;
  gender?: Gender;
  phone?: string;
  address?: string;
  emergencyContact?: string;
}

export interface CsvParseFailure {
  rowNumber: number;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isHeaderLine(line: string): boolean {
  const normalized = line.endsWith(';') ? line.slice(0, -1) : line;
  return (
    normalized.toLowerCase() ===
    STUDENT_CSV_HEADER_LINE.slice(0, -1).toLowerCase()
  );
}

function parseOptionalGender(value: string): Gender | undefined {
  if (!value) {
    return undefined;
  }

  const upper = value.toUpperCase();
  if (STUDENT_CSV_VALID_GENDERS.includes(upper as Gender)) {
    return upper as Gender;
  }

  return undefined;
}

export function parseStudentCsvContent(content: string): {
  rows: ParsedStudentCsvRow[];
  failures: CsvParseFailure[];
} {
  const rows: ParsedStudentCsvRow[] = [];
  const failures: CsvParseFailure[] = [];

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  lines.forEach((line, index) => {
    const rowNumber = index + 1;

    if (isHeaderLine(line)) {
      return;
    }

    const normalized = line.endsWith(';') ? line.slice(0, -1) : line;
    const parts = normalized.split(',').map((part) => part.trim());

    if (parts.length !== STUDENT_CSV_FIELD_COUNT) {
      failures.push({
        rowNumber,
        message: `Se esperaban ${STUDENT_CSV_FIELD_COUNT} campos separados por comas antes de ';' y se recibieron ${parts.length}`,
      });
      return;
    }

    const [
      email,
      password,
      firstName,
      lastName,
      nationalId,
      birthDateRaw,
      genderRaw,
      phone,
      address,
      emergencyContact,
    ] = parts;

    if (!EMAIL_REGEX.test(email)) {
      failures.push({ rowNumber, message: 'El correo electrónico no tiene un formato válido' });
      return;
    }

    if (!password || password.length < 8) {
      failures.push({
        rowNumber,
        message: 'La contraseña es obligatoria y debe tener al menos 8 caracteres',
      });
      return;
    }

    if (!firstName || !lastName) {
      failures.push({
        rowNumber,
        message: 'El nombre y el apellido son obligatorios',
      });
      return;
    }

    if (!nationalId) {
      failures.push({ rowNumber, message: 'La cédula o identificación nacional es obligatoria' });
      return;
    }

    if (birthDateRaw && !DATE_REGEX.test(birthDateRaw)) {
      failures.push({
        rowNumber,
        message: 'La fecha de nacimiento debe usar el formato AAAA-MM-DD cuando se proporciona',
      });
      return;
    }

    const gender = parseOptionalGender(genderRaw);
    if (genderRaw && !gender) {
      failures.push({
        rowNumber,
        message:
          'El género debe ser MALE, FEMALE, OTHER, UNSPECIFIED o estar vacío',
      });
      return;
    }

    rows.push({
      rowNumber,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      nationalId,
      birthDate: birthDateRaw || undefined,
      gender,
      phone: phone || undefined,
      address: address || undefined,
      emergencyContact: emergencyContact || undefined,
    });
  });

  return { rows, failures };
}

export function findDuplicateCsvRows(
  rows: ParsedStudentCsvRow[],
): CsvParseFailure[] {
  const failures: CsvParseFailure[] = [];
  const emails = new Set<string>();
  const nationalIds = new Set<string>();

  for (const row of rows) {
    if (emails.has(row.email)) {
      failures.push({
        rowNumber: row.rowNumber,
        message: `Duplicate email in CSV: ${row.email}`,
      });
    } else {
      emails.add(row.email);
    }

    if (nationalIds.has(row.nationalId)) {
      failures.push({
        rowNumber: row.rowNumber,
        message: `Duplicate nationalId in CSV: ${row.nationalId}`,
      });
    } else {
      nationalIds.add(row.nationalId);
    }
  }

  return failures;
}
