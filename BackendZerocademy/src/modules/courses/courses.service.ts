import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { COURSES_CONTEXT } from './constants';
import {
  assertAcademicPeriodExists,
  assertGradeLevelExistsAndActive,
  assertUniqueCourseSection,
  normalizeCourseSection,
} from './course.validation';
import { CourseListResponseDto } from './dto/course-list-response.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { toCourseResponseDto } from './mappers/course.mapper';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(query: ListCoursesQueryDto): Promise<CourseListResponseDto> {
    const where = this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, courses] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ section: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      data: courses.map(toCourseResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<CourseResponseDto> {
    const course = await this.findCourseOrThrow(id);
    return toCourseResponseDto(course);
  }

  async create(dto: CreateCourseDto): Promise<CourseResponseDto> {
    const period = await assertAcademicPeriodExists(
      this.prisma,
      dto.academicPeriodId,
    );
    await assertGradeLevelExistsAndActive(this.prisma, dto.gradeLevelId);

    const section = normalizeCourseSection(dto.section);
    await assertUniqueCourseSection(this.prisma, {
      academicPeriodId: dto.academicPeriodId,
      gradeLevelId: dto.gradeLevelId,
      section,
    });

    const course = await this.prisma.course.create({
      data: {
        name: dto.name.trim(),
        section,
        capacity: dto.capacity,
        institutionId: period.institutionId,
        academicPeriodId: dto.academicPeriodId,
        gradeLevelId: dto.gradeLevelId,
        isActive: true,
      },
    });

    this.logger.log({
      context: COURSES_CONTEXT,
      event: 'COURSE_CREATED',
      message: 'Course created',
      metadata: {
        courseId: course.id,
        academicPeriodId: course.academicPeriodId,
        gradeLevelId: course.gradeLevelId,
        section: course.section,
      },
    });

    return toCourseResponseDto(course);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const existing = await this.findCourseOrThrow(id);

    const academicPeriodId = dto.academicPeriodId ?? existing.academicPeriodId;
    const gradeLevelId = dto.gradeLevelId ?? existing.gradeLevelId;
    const section = dto.section
      ? normalizeCourseSection(dto.section)
      : existing.section;

    let institutionId = existing.institutionId;
    if (dto.academicPeriodId) {
      const period = await assertAcademicPeriodExists(
        this.prisma,
        dto.academicPeriodId,
      );
      institutionId = period.institutionId;
    }

    if (dto.gradeLevelId) {
      await assertGradeLevelExistsAndActive(this.prisma, dto.gradeLevelId);
    }

    const keysChanged =
      academicPeriodId !== existing.academicPeriodId ||
      gradeLevelId !== existing.gradeLevelId ||
      section !== existing.section;

    if (keysChanged) {
      await assertUniqueCourseSection(
        this.prisma,
        { academicPeriodId, gradeLevelId, section },
        id,
      );
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.section !== undefined ? { section } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.academicPeriodId !== undefined ? { academicPeriodId } : {}),
        ...(dto.gradeLevelId !== undefined ? { gradeLevelId } : {}),
        ...(dto.academicPeriodId !== undefined ? { institutionId } : {}),
      },
    });

    this.logger.log({
      context: COURSES_CONTEXT,
      event: 'COURSE_UPDATED',
      message: 'Course updated',
      metadata: { courseId: course.id },
    });

    return toCourseResponseDto(course);
  }

  async activate(id: string): Promise<CourseResponseDto> {
    const existing = await this.findCourseOrThrow(id);

    if (existing.isActive) {
      return toCourseResponseDto(existing);
    }

    await assertGradeLevelExistsAndActive(this.prisma, existing.gradeLevelId);

    const course = await this.prisma.course.update({
      where: { id },
      data: { isActive: true },
    });

    this.logger.log({
      context: COURSES_CONTEXT,
      event: 'COURSE_ACTIVATED',
      message: 'Course activated',
      metadata: { courseId: id },
    });

    return toCourseResponseDto(course);
  }

  async deactivate(id: string): Promise<CourseResponseDto> {
    const existing = await this.findCourseOrThrow(id);

    if (!existing.isActive) {
      return toCourseResponseDto(existing);
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log({
      context: COURSES_CONTEXT,
      event: 'COURSE_DEACTIVATED',
      message: 'Course deactivated',
      metadata: { courseId: id },
    });

    return toCourseResponseDto(course);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findCourseOrThrow(id);

    if (existing.isActive) {
      throw new BadRequestException('Deactivate the course before deleting it');
    }

    await this.prisma.course.delete({ where: { id } });

    this.logger.log({
      context: COURSES_CONTEXT,
      event: 'COURSE_DELETED',
      message: 'Course deleted',
      metadata: { courseId: id },
    });
  }

  private buildListWhere(query: ListCoursesQueryDto): Prisma.CourseWhereInput {
    const where: Prisma.CourseWhereInput = {};

    if (query.institutionId) {
      where.institutionId = query.institutionId;
    }

    if (query.academicPeriodId) {
      where.academicPeriodId = query.academicPeriodId;
    }

    if (query.gradeLevelId) {
      where.gradeLevelId = query.gradeLevelId;
    }

    if (query.academicLevelId) {
      where.gradeLevel = { academicLevelId: query.academicLevelId };
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      const sectionSearch = query.search.trim().toUpperCase();
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { section: { contains: sectionSearch, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async findCourseOrThrow(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }
}
