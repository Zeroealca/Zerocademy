import { PrismaClient, Role } from '@prisma/client';
import { ALL_PERMISSIONS, PERMISSIONS } from './permission-catalog';
import { synchronizePermissionCatalog } from './permission-catalog-sync';
import { ROLE_ALLOWED_PERMISSIONS } from './role-permissions';

type PersistedPermission = { id: string; key: string };
type PersistedRelationship = { role: Role; permissionId: string };

function createPrismaMock(initialRelationships: PersistedRelationship[] = []): {
  prisma: PrismaClient;
  permissions: PersistedPermission[];
  relationships: PersistedRelationship[];
} {
  const permissions: PersistedPermission[] = [];
  const relationships = [...initialRelationships];

  const transaction = {
    permission: {
      upsert: ({ where }: { where: { key: string } }) => {
        const existing = permissions.find(
          (permission) => permission.key === where.key,
        );
        if (existing) {
          return Promise.resolve(existing);
        }

        const created = {
          id: `permission-${permissions.length}`,
          key: where.key,
        };
        permissions.push(created);
        return Promise.resolve(created);
      },
      findMany: () => Promise.resolve(permissions),
    },
    roleAllowedPermission: {
      deleteMany: ({
        where,
      }: {
        where: { role: Role; permissionId: { notIn: string[] } };
      }) => {
        for (let index = relationships.length - 1; index >= 0; index -= 1) {
          const relationship = relationships[index];
          if (
            relationship.role === where.role &&
            !where.permissionId.notIn.includes(relationship.permissionId)
          ) {
            relationships.splice(index, 1);
          }
        }
        return Promise.resolve({ count: 0 });
      },
      createMany: ({
        data,
      }: {
        data: PersistedRelationship[];
        skipDuplicates: boolean;
      }) => {
        for (const relationship of data) {
          if (
            !relationships.some(
              (existing) =>
                existing.role === relationship.role &&
                existing.permissionId === relationship.permissionId,
            )
          ) {
            relationships.push(relationship);
          }
        }
        return Promise.resolve({ count: 0 });
      },
    },
  };

  return {
    prisma: {
      $transaction: <T>(callback: (client: typeof transaction) => Promise<T>) =>
        callback(transaction),
    } as unknown as PrismaClient,
    permissions,
    relationships,
  };
}

describe('permission catalog persistence synchronization', () => {
  it('persists every canonical permission key and the expected role boundaries', async () => {
    const database = createPrismaMock();

    const result = await synchronizePermissionCatalog(database.prisma);

    expect(result.permissions).toBe(ALL_PERMISSIONS.length);
    expect(
      new Set(database.permissions.map((permission) => permission.key)).size,
    ).toBe(ALL_PERMISSIONS.length);
    expect(result.roleRelationships).toBe(
      Object.values(ROLE_ALLOWED_PERMISSIONS).reduce(
        (total, permissions) => total + permissions.length,
        0,
      ),
    );
  });

  it('is idempotent and never creates duplicate rows', async () => {
    const database = createPrismaMock();

    await synchronizePermissionCatalog(database.prisma);
    await synchronizePermissionCatalog(database.prisma);

    expect(database.permissions).toHaveLength(ALL_PERMISSIONS.length);
    expect(
      new Set(
        database.relationships.map(
          ({ role, permissionId }) => `${role}:${permissionId}`,
        ),
      ).size,
    ).toBe(database.relationships.length);
  });

  it('reconciles stale role relationships without deleting catalog history', async () => {
    const database = createPrismaMock([
      { role: Role.TEACHER, permissionId: 'stale-permission-id' },
    ]);

    await synchronizePermissionCatalog(database.prisma);

    expect(database.relationships).not.toContainEqual({
      role: Role.TEACHER,
      permissionId: 'stale-permission-id',
    });
    expect(database.permissions).toHaveLength(ALL_PERMISSIONS.length);
  });

  it('cannot broaden a role from persisted data outside the code-defined boundary', async () => {
    const database = createPrismaMock([
      { role: Role.STUDENT, permissionId: 'permission-0' },
    ]);

    await synchronizePermissionCatalog(database.prisma);

    const studentPermissionKeys = database.relationships
      .filter((relationship) => relationship.role === Role.STUDENT)
      .map(
        (relationship) =>
          database.permissions.find(
            (permission) => permission.id === relationship.permissionId,
          )?.key,
      );

    expect(studentPermissionKeys).toEqual(
      expect.arrayContaining([...ROLE_ALLOWED_PERMISSIONS[Role.STUDENT]]),
    );
    expect(studentPermissionKeys).not.toContain(
      PERMISSIONS.INSTITUTIONS.CREATE,
    );
    expect(studentPermissionKeys).toHaveLength(
      ROLE_ALLOWED_PERMISSIONS[Role.STUDENT].length,
    );
  });
});
