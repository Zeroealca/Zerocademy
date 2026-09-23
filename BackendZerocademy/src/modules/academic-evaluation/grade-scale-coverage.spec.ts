import { BadRequestException } from '@nestjs/common';
import { assertCompleteGradeScaleCoverage, GradeScaleInput } from './academic-evaluation.validation';

const ecuador: GradeScaleInput[] = [
  { code: 'NAAR', order: 4, minValue: 0, maxValue: 4 },
  { code: 'PAAR', order: 3, minValue: 4.01, maxValue: 6.99 },
  { code: 'AAR', order: 2, minValue: 7, maxValue: 8.99 },
  { code: 'DAR', order: 1, minValue: 9, maxValue: 10 },
];

describe('grade scale coverage', () => {
  it('accepts unordered bands covering every cent of the scheme', () => {
    expect(() => assertCompleteGradeScaleCoverage(ecuador, 0, 10)).not.toThrow();
  });

  it('rejects a gap between bands', () => {
    expect(() => assertCompleteGradeScaleCoverage(
      ecuador.map((scale) => scale.code === 'AAR' ? { ...scale, minValue: 7.01 } : scale),
      0, 10,
    )).toThrow(/gap before "AAR"/);
  });

  it('rejects incomplete edges and empty sets', () => {
    expect(() => assertCompleteGradeScaleCoverage(ecuador.slice(1), 0, 10)).toThrow(BadRequestException);
    expect(() => assertCompleteGradeScaleCoverage(ecuador.slice(0, -1), 0, 10)).toThrow(/maximum score/);
    expect(() => assertCompleteGradeScaleCoverage([], 0, 10)).toThrow(/entire/);
  });

  it('rejects overlaps and sub-cent precision', () => {
    expect(() => assertCompleteGradeScaleCoverage(
      ecuador.map((scale) => scale.code === 'AAR' ? { ...scale, minValue: 6.99 } : scale),
      0, 10,
    )).toThrow(/overlap/);
    expect(() => assertCompleteGradeScaleCoverage(
      ecuador.map((scale) => scale.code === 'AAR' ? { ...scale, minValue: 7.001 } : scale),
      0, 10,
    )).toThrow(/two decimal places/);
  });

  it('rejects duplicate codes and display orders', () => {
    expect(() => assertCompleteGradeScaleCoverage(
      ecuador.map((scale) => scale.code === 'AAR' ? { ...scale, code: 'dar' } : scale),
      0, 10,
    )).toThrow(/unique/);
    expect(() => assertCompleteGradeScaleCoverage(
      ecuador.map((scale) => scale.code === 'AAR' ? { ...scale, order: 1 } : scale),
      0, 10,
    )).toThrow(/unique/);
  });
});
