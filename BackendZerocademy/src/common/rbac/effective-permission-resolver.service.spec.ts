import { Role } from '@prisma/client';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import { ALL_PERMISSIONS, PERMISSIONS } from './permission-catalog';
import {
  assertRolePermissionCatalogIntegrity,
  ROLE_ALLOWED_PERMISSIONS,
  ROLE_BASELINE_PERMISSIONS,
} from './role-permissions';

describe('Permission catalog and EffectivePermissionResolver', () => {
  const resolver = new EffectivePermissionResolver({} as never);

  it('has unique permission identifiers and valid role mappings', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
    expect(assertRolePermissionCatalogIntegrity).not.toThrow();
  });

  it.each(Object.values(Role))(
    'keeps the %s baseline within its allowed role boundary',
    (role) => {
      expect(
        ROLE_BASELINE_PERMISSIONS[role].every((permission) =>
          ROLE_ALLOWED_PERMISSIONS[role].includes(permission),
        ),
      ).toBe(true);
    },
  );

  it.each([
    [Role.SUPER_ADMIN, PERMISSIONS.INSTITUTIONS.CREATE],
    [Role.ADMIN, PERMISSIONS.COURSES.CREATE],
    [Role.TEACHER, PERMISSIONS.ACADEMIC_PLANNING.PUBLISH],
    [Role.STUDENT, PERMISSIONS.REPORT_CARDS.READ],
    [Role.REPRESENTATIVE, PERMISSIONS.ATTENDANCE_JUSTIFICATIONS.SUBMIT],
  ] as const)(
    'resolves the expected %s baseline capability',
    (role, permission) => {
      expect(resolver.can(role, permission)).toBe(true);
    },
  );

  it('preserves SUPER_ADMIN strict operational exclusions', () => {
    expect(resolver.can(Role.SUPER_ADMIN, PERMISSIONS.COURSES.CREATE)).toBe(
      false,
    );
    expect(
      resolver.can(Role.SUPER_ADMIN, PERMISSIONS.TEACHER_ASSIGNMENTS.UPDATE),
    ).toBe(false);
    expect(resolver.can(Role.SUPER_ADMIN, PERMISSIONS.STUDENTS.CREATE)).toBe(
      false,
    );
  });

  it('does not grant ADMIN teacher-owned academic planning or grade writes', () => {
    expect(resolver.can(Role.ADMIN, PERMISSIONS.ACADEMIC_PLANNING.UPDATE)).toBe(
      false,
    );
    expect(resolver.can(Role.ADMIN, PERMISSIONS.GRADES.WRITE)).toBe(false);
    expect(resolver.can(Role.ADMIN, PERMISSIONS.CLASS_SESSIONS.CREATE)).toBe(
      false,
    );
  });

  it('does not grant TEACHER administrative permissions', () => {
    expect(resolver.can(Role.TEACHER, PERMISSIONS.INSTITUTIONS.CREATE)).toBe(
      false,
    );
    expect(
      resolver.can(Role.TEACHER, PERMISSIONS.INSTITUTION_MEMBERSHIPS.CREATE),
    ).toBe(false);
  });

  it('keeps STUDENT and REPRESENTATIVE baselines system-controlled and separate', () => {
    expect(resolver.can(Role.STUDENT, PERMISSIONS.GRADES.WRITE)).toBe(false);
    expect(
      resolver.can(Role.STUDENT, PERMISSIONS.ATTENDANCE_JUSTIFICATIONS.SUBMIT),
    ).toBe(true);
    expect(
      resolver.can(
        Role.REPRESENTATIVE,
        PERMISSIONS.ATTENDANCE_JUSTIFICATIONS.SUBMIT,
      ),
    ).toBe(true);
    expect(
      resolver.can(
        Role.REPRESENTATIVE,
        PERMISSIONS.ACADEMIC_PERIODS.SELECT_CONTEXT,
      ),
    ).toBe(false);
  });

  it('supports resolve and canAny without database access or resource scope', () => {
    expect(resolver.resolve(Role.TEACHER)).toContain(
      PERMISSIONS.CLASS_SESSIONS.UPDATE,
    );
    expect(
      resolver.canAny(Role.TEACHER, [
        PERMISSIONS.INSTITUTIONS.DELETE,
        PERMISSIONS.CLASS_SESSIONS.UPDATE,
      ]),
    ).toBe(true);
    expect(
      resolver.canAny(Role.STUDENT, [
        PERMISSIONS.COURSES.CREATE,
        PERMISSIONS.GRADES.WRITE,
      ]),
    ).toBe(false);
  });
});
