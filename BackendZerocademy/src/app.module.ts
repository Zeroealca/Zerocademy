import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule as RbacKernelModule } from './common/rbac/rbac.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AcademicLevelsModule } from './modules/academic-levels/academic-levels.module';
import { AcademicPeriodsModule } from './modules/academic-periods/academic-periods.module';
import { CoursesModule } from './modules/courses/courses.module';
import { GradeLevelsModule } from './modules/grade-levels/grade-levels.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TeacherAssignmentsModule } from './modules/teacher-assignments/teacher-assignments.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { InstitutionMembershipsModule } from './modules/institution-memberships/institution-memberships.module';
import { AcademicPeriodTransitionsModule } from './modules/academic-period-transitions/academic-period-transitions.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { AcademicEvaluationModule } from './modules/academic-evaluation/academic-evaluation.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    RbacKernelModule,
    AuthModule,
    RbacModule,
    UsersModule,
    AcademicLevelsModule,
    AcademicPeriodsModule,
    CoursesModule,
    GradeLevelsModule,
    SubjectsModule,
    TeacherAssignmentsModule,
    InstitutionsModule,
    InstitutionMembershipsModule,
    AcademicPeriodTransitionsModule,
    StudentsModule,
    EnrollmentsModule,
    AcademicEvaluationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
