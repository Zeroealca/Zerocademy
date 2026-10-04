import type {
  AcademicLevelSeedRow,
  GradeLevelSeedRow,
  SubLevelSeedRow,
  SubjectAssignmentSeedRow,
  SubjectSeedRow,
} from '../types';

/** Catalog key for country-specific seed bundles (extensible). */
export const ECUADOR_CATALOG_KEY = 'ecuador';

/**
 * Ecuadorian system academic levels — display names in Spanish (MINEDUC terminology).
 */
export const ecuadorAcademicLevels: AcademicLevelSeedRow[] = [
  {
    code: 'INICIAL',
    name: 'Educación Inicial',
    order: 1,
    description:
      'Early childhood education stage (Ecuador national catalog reference)',
  },
  {
    code: 'EGB',
    name: 'Educación General Básica',
    order: 2,
    description: 'General basic education (grades 1–10, Ecuador)',
  },
  {
    code: 'BGU',
    name: 'Bachillerato',
    order: 3,
    description:
      'Tercer nivel del Sistema Nacional de Educación (grados 1.º a 3.º)',
  },
];

/**
 * Zerocademy catalog codes for official groupings. They are stable application
 * identifiers, not MINEDUC-issued machine codes.
 */
export const ecuadorSubLevelsByAcademicLevelCode: Record<
  string,
  SubLevelSeedRow[]
> = {
  INICIAL: [
    { code: 'INICIAL_1', name: 'Inicial 1', order: 1 },
    { code: 'INICIAL_2', name: 'Inicial 2', order: 2 },
  ],
  EGB: [
    { code: 'EGB_PREPARATORIA', name: 'Preparatoria', order: 1 },
    { code: 'EGB_ELEMENTAL', name: 'Básica Elemental', order: 2 },
    { code: 'EGB_MEDIA', name: 'Básica Media', order: 3 },
    { code: 'EGB_SUPERIOR', name: 'Básica Superior', order: 4 },
  ],
  BGU: [{ code: 'BACHILLERATO', name: 'Bachillerato', order: 1 }],
};

const inicialGrades: GradeLevelSeedRow[] = [
  { code: 'INI-1', name: 'Inicial 1', order: 1, subLevelCode: 'INICIAL_1' },
  { code: 'INI-2', name: 'Inicial 2', order: 2, subLevelCode: 'INICIAL_2' },
];

const egbGradeNames = [
  'Primero de EGB',
  'Segundo de EGB',
  'Tercero de EGB',
  'Cuarto de EGB',
  'Quinto de EGB',
  'Sexto de EGB',
  'Séptimo de EGB',
  'Octavo de EGB',
  'Noveno de EGB',
  'Décimo de EGB',
] as const;

const egbGrades: GradeLevelSeedRow[] = egbGradeNames.map((name, index) => {
  const grade = index + 1;
  const subLevelCode =
    grade === 1
      ? 'EGB_PREPARATORIA'
      : grade <= 4
        ? 'EGB_ELEMENTAL'
        : grade <= 7
          ? 'EGB_MEDIA'
          : 'EGB_SUPERIOR';

  return { code: `EGB-${grade}`, name, order: grade, subLevelCode };
});

const bguGrades: GradeLevelSeedRow[] = [
  {
    code: 'BGU-1',
    name: 'Primero de Bachillerato',
    order: 1,
    subLevelCode: 'BACHILLERATO',
  },
  {
    code: 'BGU-2',
    name: 'Segundo de Bachillerato',
    order: 2,
    subLevelCode: 'BACHILLERATO',
  },
  {
    code: 'BGU-3',
    name: 'Tercero de Bachillerato',
    order: 3,
    subLevelCode: 'BACHILLERATO',
  },
];

export const ecuadorGradesByLevelCode: Record<string, GradeLevelSeedRow[]> = {
  INICIAL: inicialGrades,
  EGB: egbGrades,
  BGU: bguGrades,
};

/** All grade codes in the Ecuador catalog (for validation). */
export const ecuadorAllGradeCodes: string[] = [
  ...inicialGrades.map((grade) => grade.code),
  ...egbGrades.map((grade) => grade.code),
  ...bguGrades.map((grade) => grade.code),
];

/** Explicit GradeLevel → SubLevel mappings used by seeds and DEMY-146 backfill. */
export type EcuadorGradeSubLevelMapping = {
  academicLevelCode: string;
  gradeCode: string;
  subLevelCode: string;
};

export const ecuadorCanonicalGradeSubLevelMappings: EcuadorGradeSubLevelMapping[] =
  Object.entries(ecuadorGradesByLevelCode).flatMap(
    ([academicLevelCode, grades]) =>
      grades
        .filter(
          (grade): grade is GradeLevelSeedRow & { subLevelCode: string } =>
            typeof grade.subLevelCode === 'string',
        )
        .map((grade) => ({
          academicLevelCode,
          gradeCode: grade.code,
          subLevelCode: grade.subLevelCode,
        })),
  );

/**
 * Common Ecuadorian curriculum subjects / learning areas (Spanish names).
 */
export const ecuadorSubjects: SubjectSeedRow[] = [
  {
    code: 'LENGUA_LIT',
    name: 'Lengua y Literatura',
    description: 'Área de Lengua y Literatura',
  },
  {
    code: 'MATEMATICA',
    name: 'Matemática',
    description: 'Área de Matemática',
  },
  {
    code: 'CIENCIAS_NAT',
    name: 'Ciencias Naturales',
    description: 'Área de Ciencias Naturales',
  },
  {
    code: 'ESTUDIOS_SOC',
    name: 'Estudios Sociales',
    description: 'Área de Estudios Sociales',
  },
  {
    code: 'ED_FISICA',
    name: 'Educación Física',
    description: 'Área de Educación Física',
  },
  {
    code: 'ED_CULTURAL_ART',
    name: 'Educación Cultural y Artística',
    description: 'Área de Educación Cultural y Artística',
  },
  {
    code: 'INGLES',
    name: 'Inglés',
    description: 'Lengua extranjera — Inglés',
  },
  {
    code: 'FISICA',
    name: 'Física',
    description: 'Ciencia de la Física (BGU)',
  },
  {
    code: 'QUIMICA',
    name: 'Química',
    description: 'Ciencia de la Química (BGU)',
  },
  {
    code: 'BIOLOGIA',
    name: 'Biología',
    description: 'Ciencia de la Biología (BGU)',
  },
  {
    code: 'FILOSOFIA',
    name: 'Filosofía',
    description: 'Filosofía (BGU)',
  },
  {
    code: 'HISTORIA',
    name: 'Historia',
    description: 'Historia (BGU)',
  },
  {
    code: 'CIUDADANIA',
    name: 'Ciudadanía',
    description: 'Formación ciudadana (BGU)',
  },
  {
    code: 'EMPRENDIMIENTO',
    name: 'Emprendimiento y Gestión',
    description: 'Emprendimiento y gestión (BGU)',
  },
  {
    code: 'INFORMATICA',
    name: 'Informática',
    description: 'Tecnologías de la información',
  },
];

const EGB_LOWER = [
  'EGB-1',
  'EGB-2',
  'EGB-3',
  'EGB-4',
  'EGB-5',
  'EGB-6',
  'EGB-7',
] as const;
const EGB_UPPER = ['EGB-8', 'EGB-9', 'EGB-10'] as const;
const EGB_ALL = [...EGB_LOWER, ...EGB_UPPER] as const;
const BGU_1 = ['BGU-1'] as const;
const BGU_2_3 = ['BGU-2', 'BGU-3'] as const;
const BGU_ALL = ['BGU-1', 'BGU-2', 'BGU-3'] as const;

/**
 * Subject-to-grade assignments reflecting typical Ecuadorian distribution.
 * Institutions may customize links via API without changing this catalog.
 */
export const ecuadorSubjectAssignments: SubjectAssignmentSeedRow[] = [
  {
    subjectCode: 'LENGUA_LIT',
    gradeLevelCodes: [...EGB_ALL, ...BGU_ALL],
  },
  {
    subjectCode: 'MATEMATICA',
    gradeLevelCodes: [...EGB_ALL, ...BGU_ALL],
  },
  {
    subjectCode: 'CIENCIAS_NAT',
    gradeLevelCodes: [...EGB_ALL, ...BGU_1],
  },
  {
    subjectCode: 'ESTUDIOS_SOC',
    gradeLevelCodes: [...EGB_ALL, ...BGU_1],
  },
  {
    subjectCode: 'ED_FISICA',
    gradeLevelCodes: [...EGB_ALL, ...BGU_ALL],
  },
  {
    subjectCode: 'ED_CULTURAL_ART',
    gradeLevelCodes: [...EGB_ALL, ...BGU_ALL],
  },
  {
    subjectCode: 'INGLES',
    gradeLevelCodes: [...EGB_UPPER, ...BGU_ALL],
  },
  {
    subjectCode: 'FISICA',
    gradeLevelCodes: [...BGU_2_3],
  },
  {
    subjectCode: 'QUIMICA',
    gradeLevelCodes: [...BGU_2_3],
  },
  {
    subjectCode: 'BIOLOGIA',
    gradeLevelCodes: [...BGU_2_3],
  },
  {
    subjectCode: 'FILOSOFIA',
    gradeLevelCodes: [...BGU_ALL],
  },
  {
    subjectCode: 'HISTORIA',
    gradeLevelCodes: [...BGU_2_3],
  },
  {
    subjectCode: 'CIUDADANIA',
    gradeLevelCodes: [...BGU_2_3],
  },
  {
    subjectCode: 'EMPRENDIMIENTO',
    gradeLevelCodes: [...BGU_2_3],
  },
  {
    subjectCode: 'INFORMATICA',
    gradeLevelCodes: [...EGB_UPPER, ...BGU_ALL],
  },
];
