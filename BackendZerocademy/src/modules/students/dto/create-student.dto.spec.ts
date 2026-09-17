import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStudentDto } from './create-student.dto';

describe('Optional student registration number', () => {
  const data = {
    email: 'student@example.test', password: 'StudentNew123!',
    firstName: 'Student', lastName: 'Test', nationalId: '1790000201',
  };

  it.each([undefined, '', '   '])('allows automatic generation for %p', async (registrationNumber) => {
    const dto = plainToInstance(CreateStudentDto, { ...data, registrationNumber });
    expect(dto.registrationNumber).toBeUndefined();
    expect(await validate(dto)).toEqual([]);
  });

  it('normalizes a manually entered number', async () => {
    const dto = plainToInstance(CreateStudentDto, { ...data, registrationNumber: ' qa-001 ' });
    expect(dto.registrationNumber).toBe('QA-001');
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects numbers longer than the supported limit', async () => {
    const dto = plainToInstance(CreateStudentDto, { ...data, registrationNumber: 'A'.repeat(65) });
    expect(await validate(dto)).toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'registrationNumber' }),
    ]));
  });
});
