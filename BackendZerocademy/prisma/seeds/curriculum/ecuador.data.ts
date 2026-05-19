import type {
  AcademicLevelSeedRow,
  GradeLevelSeedRow,
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
    name: 'Bachillerato General Unificado',
    order: 3,
    description: 'Unified general baccalaureate (grades 1–3 BGU, Ecuador)',
  },
];

const inicialGrades: GradeLevelSeedRow[] = [
  { code: 'INI-1', name: 'Inicial 1', order: 1 },
  { code: 'INI-2', name: 'Inicial 2', order: 2 },
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

const egbGrades: GradeLevelSeedRow[] = egbGradeNames.map((name, index) => ({
  code: `EGB-${index + 1}`,
  name,
  order: index + 1,
}));

const bguGrades: GradeLevelSeedRow[] = [
  { code: 'BGU-1', name: 'Primero de BGU', order: 1 },
  { code: 'BGU-2', name: 'Segundo de BGU', order: 2 },
  { code: 'BGU-3', name: 'Tercero de BGU', order: 3 },
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

const INICIAL = ['INI-1', 'INI-2'] as const;
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
    gradeLevelCodes: [...INICIAL, ...EGB_ALL, ...BGU_ALL],
  },
  {
    subjectCode: 'MATEMATICA',
    gradeLevelCodes: [...INICIAL, ...EGB_ALL, ...BGU_ALL],
  },
  {
    subjectCode: 'CIENCIAS_NAT',
    gradeLevelCodes: [...INICIAL, ...EGB_ALL, ...BGU_1],
  },
  {
    subjectCode: 'ESTUDIOS_SOC',
    gradeLevelCodes: [...INICIAL, ...EGB_ALL, ...BGU_1],
  },
  {
    subjectCode: 'ED_FISICA',
    gradeLevelCodes: [...INICIAL, ...EGB_ALL, ...BGU_ALL],
  },
  {
    subjectCode: 'ED_CULTURAL_ART',
    gradeLevelCodes: [...INICIAL, ...EGB_ALL, ...BGU_ALL],
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
