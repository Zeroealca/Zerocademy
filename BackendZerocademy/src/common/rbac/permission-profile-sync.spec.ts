import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from './permission-catalog';
import { SYSTEM_PERMISSION_PROFILES } from './permission-profile-catalog';
import { synchronizeSystemPermissionProfiles } from './permission-profile-sync';

describe('system permission profile synchronization', () => {
  it('creates and idempotently reconciles only the code-defined compositions', async () => {
    const profiles: { id: string; key: string }[] = [];
    const permissions = ALL_PERMISSIONS.map((key, index) => ({
      id: `${index}`,
      key,
    }));
    const relationships: {
      permissionProfileId: string;
      permissionId: string;
    }[] = [{ permissionProfileId: 'stale', permissionId: '0' }];
    const tx = {
      permissionProfile: {
        upsert: ({ where }: { where: { key: string } }) => {
          if (!profiles.some((profile) => profile.key === where.key))
            profiles.push({ id: where.key, key: where.key });
          return Promise.resolve(null);
        },
        findMany: () => Promise.resolve(profiles),
      },
      permission: { findMany: () => Promise.resolve(permissions) },
      permissionProfilePermission: {
        deleteMany: ({
          where,
        }: {
          where: {
            permissionProfileId: string;
            permissionId: { notIn: string[] };
          };
        }) => {
          for (let i = relationships.length - 1; i >= 0; i -= 1)
            if (
              relationships[i].permissionProfileId ===
                where.permissionProfileId &&
              !where.permissionId.notIn.includes(relationships[i].permissionId)
            )
              relationships.splice(i, 1);
          return Promise.resolve({ count: 0 });
        },
        createMany: ({
          data,
        }: {
          data: { permissionProfileId: string; permissionId: string }[];
        }) => {
          for (const row of data)
            if (
              !relationships.some(
                (current) =>
                  current.permissionProfileId === row.permissionProfileId &&
                  current.permissionId === row.permissionId,
              )
            )
              relationships.push(row);
          return Promise.resolve({ count: 0 });
        },
      },
    };
    const prisma = {
      $transaction: <T>(callback: (client: typeof tx) => Promise<T>) =>
        callback(tx),
    } as unknown as PrismaClient;
    await synchronizeSystemPermissionProfiles(prisma);
    await synchronizeSystemPermissionProfiles(prisma);
    expect(profiles.map((profile) => profile.key)).toEqual(
      SYSTEM_PERMISSION_PROFILES.map((profile) => profile.key),
    );
    expect(
      new Set(
        relationships.map(
          (row) => `${row.permissionProfileId}:${row.permissionId}`,
        ),
      ).size,
    ).toBe(relationships.length);
    expect(
      relationships.some((row) => row.permissionProfileId === 'stale'),
    ).toBe(true);
  });
});
