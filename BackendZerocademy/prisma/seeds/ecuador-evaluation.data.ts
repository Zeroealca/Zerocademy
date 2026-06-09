/** Re-export for seed scripts (mirrors src/modules/academic-evaluation/ecuador-evaluation.data.ts). */
export const ECUADOR_EVALUATION_CATALOG_KEY = 'ecuador-evaluation';

export const ECUADOR_DEFAULT_SCHEME_NAME = 'Ecuador Standard (0–10)';

export const ECUADOR_GRADING_SCHEME = {
  minScore: 0,
  maxScore: 10,
  passingScore: 7,
  decimalPlaces: 2,
} as const;

export const ECUADOR_DEFAULT_GRADE_SCALES = [
  {
    code: 'DAR',
    description: 'Dominates the required learning outcomes',
    minValue: 9,
    maxValue: 10,
    order: 1,
  },
  {
    code: 'AAR',
    description: 'Achieves the required learning outcomes',
    minValue: 7,
    maxValue: 8.99,
    order: 2,
  },
  {
    code: 'PAAR',
    description: 'Close to achieving the required learning outcomes',
    minValue: 4.01,
    maxValue: 6.99,
    order: 3,
  },
  {
    code: 'NAAR',
    description: 'Does not achieve the required learning outcomes',
    minValue: 0,
    maxValue: 4,
    order: 4,
  },
] as const;

export const ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES = [
  {
    name: 'Evaluación formativa',
    weight: 40,
    order: 1,
    description:
      'Seguimiento cotidiano del proceso de aprendizaje (tareas, participación, trabajo en clase)',
  },
  {
    name: 'Evaluación sumativa',
    weight: 60,
    order: 2,
    description:
      'Instrumentos de evaluación parcial y quimestral (pruebas, exámenes, proyectos evaluados)',
  },
] as const;

export const ECUADOR_EVALUATION_TERM_TEMPLATES = [
  {
    name: 'Primer quimestre',
    order: 1,
    weight: 50,
    description: 'Primer período de evaluación del año lectivo',
  },
  {
    name: 'Segundo quimestre',
    order: 2,
    weight: 50,
    description: 'Segundo período de evaluación del año lectivo',
  },
] as const;
