import { OfficialStudyPlanStatus, OfficialStudyPlanValuePolicy, type PrismaClient } from '@prisma/client';

const PLAN = {
  code: 'EC_ORDINARY_EGB', version: '2023-00008-A', name: 'Plan de estudios de Educación General Básica', applicabilityKey: 'ORDINARY_EGB',
  sourceTitle: 'Acuerdo MINEDUC-MINEDUC-2023-00008-A', sourceReference: 'MINEDUC-MINEDUC-2023-00008-A',
  sourceUrl: 'https://educacion.gob.ec/wp-content/uploads/downloads/2023/03/MINEDUC-MINEDUC-2023-00008-A.pdf',
  issuedOn: new Date('2023-03-10T00:00:00.000Z'), effectiveFrom: new Date('2023-03-10T00:00:00.000Z'), status: OfficialStudyPlanStatus.ACTIVE,
} as const;
const SUBJECT_PERIODS = [['LENGUA_LIT', 6], ['MATEMATICA', 6], ['ESTUDIOS_SOC', 4], ['CIENCIAS_NAT', 4], ['ED_CULTURAL_ART', 2], ['ED_FISICA', 2], ['INGLES', 3]] as const;
const GRADES = ['EGB-8', 'EGB-9', 'EGB-10'] as const;

/** Production-only curated catalog seed. It creates missing immutable facts and
 * fails rather than updating an existing version with different meaning. */
export async function seedOfficialStudyPlans(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.officialStudyPlan.findUnique({ where: { code_version: { code: PLAN.code, version: PLAN.version } } });
  const plan = existing ?? await prisma.officialStudyPlan.create({ data: PLAN });
  if (existing && (existing.sourceReference !== PLAN.sourceReference || existing.sourceUrl !== PLAN.sourceUrl || existing.applicabilityKey !== PLAN.applicabilityKey)) throw new Error('Official study-plan seed conflicts with immutable curated version');
  const grades = await prisma.gradeLevel.findMany({ where: { institutionId: null, code: { in: [...GRADES] } }, select: { id: true, code: true } });
  const subjects = await prisma.subject.findMany({ where: { institutionId: null, code: { in: SUBJECT_PERIODS.map(([code]) => code) } }, select: { id: true, code: true } });
  if (grades.length !== GRADES.length || subjects.length !== SUBJECT_PERIODS.length) throw new Error('Canonical EGB Superior grade or subject catalog is incomplete');
  const gradeByCode = new Map(grades.map((row) => [row.code, row]));
  const subjectByCode = new Map(subjects.map((row) => [row.code, row]));
  for (const gradeCode of GRADES) {
    const grade = gradeByCode.get(gradeCode)!;
    const group = await prisma.officialStudyPlanAllocationGroup.upsert({
      where: { officialStudyPlanId_gradeLevelId_key: { officialStudyPlanId: plan.id, gradeLevelId: grade.id, key: 'EGB_SUPERIOR_COMPLEMENTARY' } },
      create: { officialStudyPlanId: plan.id, gradeLevelId: grade.id, key: 'EGB_SUPERIOR_COMPLEMENTARY', name: 'Orientación, acompañamiento y lectura', valuePolicy: OfficialStudyPlanValuePolicy.REFERENCE_ONLY, minimumWeeklyPeriods: 3, sourceLocator: 'Anexo: Básica Superior, OVP + acompañamiento integral + animación a la lectura' },
      update: {},
    });
    if (group.minimumWeeklyPeriods !== 3 || group.valuePolicy !== OfficialStudyPlanValuePolicy.REFERENCE_ONLY) throw new Error('Official allocation-group seed conflicts with immutable curated version');
    for (const [subjectCode, minimumWeeklyPeriods] of SUBJECT_PERIODS) {
      const subject = subjectByCode.get(subjectCode)!;
      const entry = await prisma.officialStudyPlanEntry.upsert({
        where: { officialStudyPlanId_gradeLevelId_subjectId: { officialStudyPlanId: plan.id, gradeLevelId: grade.id, subjectId: subject.id } },
        create: { officialStudyPlanId: plan.id, gradeLevelId: grade.id, subjectId: subject.id, valuePolicy: OfficialStudyPlanValuePolicy.MINIMUM, minimumWeeklyPeriods, sourceLocator: 'Anexo: carga horaria semanal de Básica Superior' },
        update: {},
      });
      if (entry.minimumWeeklyPeriods !== minimumWeeklyPeriods || entry.valuePolicy !== OfficialStudyPlanValuePolicy.MINIMUM) throw new Error('Official study-plan entry seed conflicts with immutable curated version');
    }
  }
}
