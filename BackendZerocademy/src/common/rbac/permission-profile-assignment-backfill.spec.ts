import { PrismaClient, Role } from '@prisma/client';
import { SYSTEM_PERMISSION_PROFILES } from './permission-profile-catalog';
import { backfillMembershipBaselinePermissionProfiles } from './permission-profile-assignment-backfill';

describe('membership baseline permission profile backfill', () => {
  it('assigns only null ADMIN/TEACHER memberships using User.role', async () => {
    const updates: { id: string; permissionProfileId: string }[] = [];
    const prisma = {
      permissionProfile: {
        findMany: () =>
          Promise.resolve(
            SYSTEM_PERMISSION_PROFILES.map((profile) => ({
              id: `id:${profile.key}`,
              key: profile.key,
              role: profile.role,
            })),
          ),
      },
      institutionMembership: {
        findMany: () =>
          Promise.resolve([
            { id: 'm-admin', user: { role: Role.ADMIN } },
            { id: 'm-teacher', user: { role: Role.TEACHER } },
            { id: 'm-student', user: { role: Role.STUDENT } },
          ]),
        update: ({
          where,
          data,
        }: {
          where: { id: string };
          data: { permissionProfileId: string };
        }) => {
          updates.push({
            id: where.id,
            permissionProfileId: data.permissionProfileId,
          });
          return Promise.resolve(null);
        },
      },
    } as unknown as PrismaClient;

    const result = await backfillMembershipBaselinePermissionProfiles(prisma);

    expect(result).toEqual({ scanned: 3, assigned: 2, skipped: 1 });
    expect(updates).toEqual([
      { id: 'm-admin', permissionProfileId: 'id:ADMIN_BASELINE' },
      { id: 'm-teacher', permissionProfileId: 'id:TEACHER_BASELINE' },
    ]);
  });
});
