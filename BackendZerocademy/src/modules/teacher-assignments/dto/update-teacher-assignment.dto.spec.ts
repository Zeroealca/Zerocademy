import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTeacherAssignmentDto } from './update-teacher-assignment.dto';

describe('Assignment editable fields', () => {
  const id = '11111111-1111-4111-8111-111111111111';

  it('accepts only course and subject changes', async () => {
    const dto = plainToInstance(UpdateTeacherAssignmentDto, { courseId: id, subjectId: id });
    expect(await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).toEqual([]);
  });

  it.each(['teacherId', 'institutionId', 'academicPeriodId'])('rejects changes to %s', async (field) => {
    const dto = plainToInstance(UpdateTeacherAssignmentDto, { [field]: id });
    expect(await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: field })]),
    );
  });
});
