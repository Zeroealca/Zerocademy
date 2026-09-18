import { ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES } from './ecuador-evaluation.data';
import { ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES as seedCategories } from '../../../prisma/seeds/ecuador-evaluation.data';

describe('Ecuador evaluation category defaults', () => {
  it('uses formative 70% and summative 30%', () => {
    expect(ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES.map(({ name, weight }) => ({ name, weight }))).toEqual([
      { name: 'Evaluación formativa', weight: 70 },
      { name: 'Evaluación sumativa', weight: 30 },
    ]);
    expect(ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES.reduce((total, category) => total + category.weight, 0)).toBe(100);
  });

  it('keeps seed and runtime defaults aligned', () => {
    expect(seedCategories).toEqual(ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES);
  });
});
