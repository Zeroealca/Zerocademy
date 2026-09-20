/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application's error contract. */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import type { AppConfig } from '../../config/configuration';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { institutionLogoDiskPath } from '../institutions/institution-logo.storage';
import { REPORT_CARDS_CONTEXT } from './constants';
import type { ReportCardQueryDto } from './dto/report-card-query.dto';
import type { ReportCardResponseDto } from './dto/report-card-response.dto';
import { ReportCardsService } from './report-cards.service';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 42;

@Injectable()
export class ReportCardsPdfService {
  constructor(
    private readonly reportCardsService: ReportCardsService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly logger: AppLoggerService,
  ) {}

  async getMyPdf(
    actor: AuthenticatedUser,
    query: ReportCardQueryDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    return this.createPdf(
      await this.reportCardsService.getMyReportCard(actor, query),
      actor,
    );
  }

  async getStudentPdf(
    actor: AuthenticatedUser,
    studentId: string,
    query: ReportCardQueryDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    return this.createPdf(
      await this.reportCardsService.getStudentReportCard(
        actor,
        studentId,
        query,
      ),
      actor,
    );
  }

  private async createPdf(
    reportCard: ReportCardResponseDto,
    actor: AuthenticatedUser,
  ): Promise<{ buffer: Buffer; filename: string }> {
    this.logger.log({
      context: REPORT_CARDS_CONTEXT,
      event: 'REPORT_CARD_PDF_REQUESTED',
      message: 'Report card PDF requested',
      userId: actor.id,
      metadata: {
        enrollmentId: reportCard.enrollmentId,
        academicPeriodId: reportCard.academicPeriod.id,
      },
    });
    try {
      const buffer = await this.render(reportCard);
      this.logger.log({
        context: REPORT_CARDS_CONTEXT,
        event: 'REPORT_CARD_PDF_GENERATED',
        message: 'Report card PDF generated',
        userId: actor.id,
        metadata: {
          enrollmentId: reportCard.enrollmentId,
          bytes: buffer.length,
        },
      });
      return { buffer, filename: this.filenameFor(reportCard) };
    } catch (error) {
      this.logger.error({
        context: REPORT_CARDS_CONTEXT,
        event: 'REPORT_CARD_PDF_FAILED',
        message:
          error instanceof Error ? error.message : 'PDF rendering failed',
        userId: actor.id,
        metadata: { enrollmentId: reportCard.enrollmentId },
      });
      throw new InternalServerErrorException(
        'Report card PDF generation failed',
      );
    }
  }

  private async render(reportCard: ReportCardResponseDto): Promise<Buffer> {
    const document = new PDFDocument({
      size: [A4_WIDTH, A4_HEIGHT],
      margins: {
        top: PAGE_MARGIN,
        right: PAGE_MARGIN,
        bottom: PAGE_MARGIN,
        left: PAGE_MARGIN,
      },
      info: {
        Title: `Report card - ${reportCard.academicPeriod.name}`,
        Author: reportCard.institution.name,
      },
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    const completed = new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });
    const primary = this.safeColor(
      reportCard.institution.primaryColor,
      '#1f4f73',
    );
    document.rect(0, 0, A4_WIDTH, 92).fill(primary);
    const logo = await this.loadLogo(
      reportCard.institution.id,
      reportCard.institution.logoUrl,
    );
    if (logo) document.image(logo, PAGE_MARGIN, 20, { fit: [58, 52] });
    document
      .fillColor('#ffffff')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(reportCard.institution.name, logo ? 112 : PAGE_MARGIN, 27, {
        width: 340,
      });
    document
      .fontSize(10)
      .font('Helvetica')
      .text('LIBRETA ACADÉMICA', logo ? 112 : PAGE_MARGIN, 51);
    document
      .fillColor('#202124')
      .fontSize(10)
      .text(
        `Período académico: ${reportCard.academicPeriod.name}`,
        PAGE_MARGIN,
        112,
      );
    document.text(
      `Generado: ${new Date().toISOString().slice(0, 10)}`,
      390,
      112,
      { width: 160, align: 'right' },
    );
    document
      .font('Helvetica-Bold')
      .text(reportCard.student.fullName, PAGE_MARGIN, 142);
    document
      .font('Helvetica')
      .text(
        `Identificación: ${reportCard.student.nationalId ?? reportCard.student.registrationNumber ?? 'No disponible'}`,
        PAGE_MARGIN,
        158,
      );
    document.text(
      `Grado: ${reportCard.enrollment.gradeLevelName}  |  Curso: ${reportCard.enrollment.courseName} ${reportCard.enrollment.section}`,
      PAGE_MARGIN,
      174,
    );
    let y = 208;
    const termCount = reportCard.subjects[0]?.terms.length ?? 0;
    const subjectWidth = Math.max(130, 230 - Math.max(0, termCount - 2) * 22);
    const remainingWidth = A4_WIDTH - PAGE_MARGIN * 2 - subjectWidth;
    const columnWidth = remainingWidth / (termCount + 2);
    const drawHeader = () => {
      document
        .fillColor(primary)
        .rect(PAGE_MARGIN, y, A4_WIDTH - PAGE_MARGIN * 2, 22)
        .fill();
      document
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('Materia', PAGE_MARGIN + 5, y + 7, { width: subjectWidth - 8 });
      let x = PAGE_MARGIN + subjectWidth;
      for (const term of reportCard.subjects[0]?.terms ?? []) {
        document.text(term.name, x + 3, y + 7, {
          width: columnWidth - 6,
          align: 'center',
        });
        x += columnWidth;
      }
      document.text('Promedio', x + 3, y + 7, {
        width: columnWidth - 6,
        align: 'center',
      });
      document.text('Escala', x + columnWidth + 3, y + 7, {
        width: columnWidth - 6,
        align: 'center',
      });
      y += 22;
    };
    drawHeader();
    for (const subject of reportCard.subjects) {
      if (y > A4_HEIGHT - 90) {
        document.addPage();
        y = PAGE_MARGIN;
        drawHeader();
      }
      const rowHeight = 25;
      document
        .fillColor('#202124')
        .font('Helvetica')
        .fontSize(8)
        .text(subject.name, PAGE_MARGIN + 5, y + 8, {
          width: subjectWidth - 8,
          ellipsis: true,
        });
      let x = PAGE_MARGIN + subjectWidth;
      for (const term of subject.terms) {
        document.text(this.displayAverage(term.average), x + 3, y + 8, {
          width: columnWidth - 6,
          align: 'center',
        });
        x += columnWidth;
      }
      document
        .font('Helvetica-Bold')
        .text(this.displayAverage(subject.average), x + 3, y + 8, {
          width: columnWidth - 6,
          align: 'center',
        });
      document
        .font('Helvetica')
        .text(
          subject.qualitativeResult?.code ?? '—',
          x + columnWidth + 3,
          y + 8,
          { width: columnWidth - 6, align: 'center' },
        );
      document
        .strokeColor('#d1d5db')
        .moveTo(PAGE_MARGIN, y + rowHeight)
        .lineTo(A4_WIDTH - PAGE_MARGIN, y + rowHeight)
        .stroke();
      y += rowHeight;
    }
    if (reportCard.subjects.length === 0)
      document
        .fillColor('#4b5563')
        .font('Helvetica')
        .fontSize(10)
        .text(
          'No hay materias o calificaciones disponibles para este período académico.',
          PAGE_MARGIN,
          y + 12,
        );
    y += 24;
    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(
        `Promedio general: ${this.displayAverage(reportCard.overallAverage)}`,
        PAGE_MARGIN,
        y,
      );
    document.text(
      `Resultado cualitativo: ${reportCard.overallQualitativeResult?.code ?? '—'}`,
      330,
      y,
      { width: 220, align: 'right' },
    );
    document
      .fillColor('#6b7280')
      .font('Helvetica')
      .fontSize(7)
      .text(
        'Este documento es un reporte informativo académico y no constituye un certificado oficial.',
        PAGE_MARGIN,
        A4_HEIGHT - 35,
        { width: A4_WIDTH - PAGE_MARGIN * 2, align: 'center' },
      );
    document.end();
    return completed;
  }

  private async loadLogo(
    institutionId: string,
    logoUrl: string | null,
  ): Promise<Buffer | null> {
    if (!logoUrl?.startsWith('/uploads/')) return null;
    try {
      const path = institutionLogoDiskPath(
        this.configService.get('uploadsDir', { infer: true }),
        institutionId,
      );
      return await sharp(await readFile(join(process.cwd(), path)))
        .png()
        .toBuffer();
    } catch {
      return null;
    }
  }
  private displayAverage(value: number | null): string {
    return value === null ? '—' : value.toFixed(2);
  }
  private safeColor(value: string | null, fallback: string): string {
    return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback;
  }
  private filenameFor(reportCard: ReportCardResponseDto): string {
    const slug =
      `${reportCard.student.fullName}-${reportCard.academicPeriod.name}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `report-card-${slug || 'student'}.pdf`;
  }
}
