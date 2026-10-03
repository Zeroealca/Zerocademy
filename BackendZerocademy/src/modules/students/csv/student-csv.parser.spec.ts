import { parseStudentCsvContent } from './student-csv.parser';

describe('parseStudentCsvContent', () => {
  it('reports invalid rows with Spanish validation messages', () => {
    const { failures } = parseStudentCsvContent(
      'email,password,firstName,lastName,nationalId,birthDate,gender,phone,address,emergencyContact\n' +
        'correo-invalido,Clave123!,Ana,Prueba,1710034062,,,,,',
    );

    expect(failures).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        message: 'El correo electrónico no tiene un formato válido',
      }),
    ]);
  });

  it('parses a valid row with optional empty fields', () => {
    const { rows, failures } = parseStudentCsvContent(
      'qa.csv.student@zerocademy.edu,Clave123!,Ana,Prueba,1710034062,,,,,',
    );

    expect(failures).toEqual([]);
    expect(rows).toEqual([
      expect.objectContaining({
        email: 'qa.csv.student@zerocademy.edu',
        firstName: 'Ana',
        nationalId: '1710034062',
      }),
    ]);
  });
});
