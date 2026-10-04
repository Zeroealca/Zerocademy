import {
  ecuadorCanonicalGradeSubLevelMappings,
  ecuadorSubLevelsByAcademicLevelCode,
} from '../../../prisma/seeds/curriculum/ecuador.data';

function mappingsForSubLevel(subLevelCode: string): string[] {
  return ecuadorCanonicalGradeSubLevelMappings
    .filter((mapping) => mapping.subLevelCode === subLevelCode)
    .map((mapping) => mapping.gradeCode)
    .sort();
}

describe('Ecuador canonical GradeLevel → SubLevel mapping', () => {
  it('maps EGB grades into the approved sublevel buckets', () => {
    expect(mappingsForSubLevel('EGB_PREPARATORIA')).toEqual(['EGB-1']);
    expect(mappingsForSubLevel('EGB_ELEMENTAL')).toEqual([
      'EGB-2',
      'EGB-3',
      'EGB-4',
    ]);
    expect(mappingsForSubLevel('EGB_MEDIA')).toEqual([
      'EGB-5',
      'EGB-6',
      'EGB-7',
    ]);
    expect(mappingsForSubLevel('EGB_SUPERIOR')).toEqual([
      'EGB-10',
      'EGB-8',
      'EGB-9',
    ]);
  });

  it('maps Bachillerato grades to the BGU Bachillerato sublevel', () => {
    expect(mappingsForSubLevel('BACHILLERATO')).toEqual([
      'BGU-1',
      'BGU-2',
      'BGU-3',
    ]);
  });

  it('maps Inicial grades one-to-one with their sublevels', () => {
    expect(mappingsForSubLevel('INICIAL_1')).toEqual(['INI-1']);
    expect(mappingsForSubLevel('INICIAL_2')).toEqual(['INI-2']);
  });

  it('keeps every mapped grade under a catalogued sublevel code', () => {
    const cataloguedSubLevelCodes = new Set(
      Object.values(ecuadorSubLevelsByAcademicLevelCode).flatMap((rows) =>
        rows.map((row) => row.code),
      ),
    );

    for (const mapping of ecuadorCanonicalGradeSubLevelMappings) {
      expect(cataloguedSubLevelCodes.has(mapping.subLevelCode)).toBe(true);
      expect(
        ecuadorSubLevelsByAcademicLevelCode[mapping.academicLevelCode]?.some(
          (row) => row.code === mapping.subLevelCode,
        ),
      ).toBe(true);
    }
  });
});
