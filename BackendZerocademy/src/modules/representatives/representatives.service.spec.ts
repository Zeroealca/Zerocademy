import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { RepresentativesService } from './representatives.service';

const admin: AuthenticatedUser = {
  id: 'admin-user',
  email: 'admin@example.test',
  firstName: 'Admin',
  lastName: 'One',
  role: Role.ADMIN,
  profileType: 'admin',
  profileId: 'admin-profile',
  institutionId: 'institution-1',
};

const representative: AuthenticatedUser = {
  id: 'rep-user',
  email: 'rep@example.test',
  firstName: 'Rep',
  lastName: 'One',
  role: Role.REPRESENTATIVE,
  profileType: 'representative',
};

const otherRepresentative: AuthenticatedUser = {
  id: 'rep-other',
  email: 'rep-other@example.test',
  firstName: 'Rep',
  lastName: 'Other',
  role: Role.REPRESENTATIVE,
  profileType: 'representative',
};

function buildService(prisma: unknown, logger = { log: jest.fn() }) {
  return new RepresentativesService(prisma as never, logger as never);
}

describe('RepresentativesService authorization', () => {
  it('lists only active relationships for the authenticated representative', async () => {
    const prisma = {
      representativeStudent: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'rel-1',
            representativeUserId: representative.id,
            studentId: 'student-1',
            relationshipType: 'MOTHER',
            isPrimary: true,
            isActive: true,
            representativeUser: {
              id: representative.id,
              firstName: 'Rep',
              lastName: 'One',
              email: representative.email,
            },
            student: {
              id: 'student-1',
              userId: 'student-user',
              institutionId: 'institution-1',
              user: { firstName: 'Ana', lastName: 'Demo' },
              enrollments: [],
            },
          },
        ]),
      },
    };
    const service = buildService(prisma);

    const result = await service.getMyStudents(representative);

    expect(prisma.representativeStudent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { representativeUserId: representative.id, isActive: true },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        studentId: 'student-1',
        fullName: 'Ana Demo',
        representativeFullName: 'Rep One',
      }),
    ]);
  });

  it('scopes getMyStudents to the authenticated representative only', async () => {
    const prisma = {
      representativeStudent: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = buildService(prisma);

    await expect(service.getMyStudents(otherRepresentative)).resolves.toEqual(
      [],
    );
    expect(prisma.representativeStudent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          representativeUserId: otherRepresentative.id,
          isActive: true,
        },
      }),
    );
  });

  it('hides students outside the administrator institution', async () => {
    const prisma = {
      studentProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-foreign',
          userId: 'student-user',
          institutionId: 'other-institution',
        }),
      },
    };
    const service = buildService(prisma);

    await expect(
      service.listForStudent(admin, 'student-foreign'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects associating a representative from another institution', async () => {
    const prisma = {
      studentProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-1',
          userId: 'student-user',
          institutionId: 'institution-1',
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          representativeProfile: { institutionId: 'other-institution' },
        }),
      },
    };
    const service = buildService(prisma);

    await expect(
      service.create(admin, 'student-1', {
        representativeUserId: 'foreign-rep',
        relationshipType: 'FATHER' as never,
        isPrimary: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivates a relationship without deleting the historical row', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'rel-1' });
    const prisma = {
      representativeStudent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'rel-1',
          studentId: 'student-1',
        }),
        update,
      },
      studentProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-1',
          userId: 'student-user',
          institutionId: 'institution-1',
        }),
      },
    };
    const service = buildService(prisma);

    await service.deactivate(admin, 'rel-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'rel-1' },
      data: { isActive: false, isPrimary: false },
    });
  });

  it('surfaces duplicate associations as conflict', async () => {
    const prisma = {
      studentProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-1',
          userId: 'student-user',
          institutionId: 'institution-1',
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          representativeProfile: { institutionId: 'institution-1' },
        }),
      },
      $transaction: jest
        .fn()
        .mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          }),
        ),
    };
    const service = buildService(prisma);

    await expect(
      service.create(admin, 'student-1', {
        representativeUserId: representative.id,
        relationshipType: 'MOTHER' as never,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
