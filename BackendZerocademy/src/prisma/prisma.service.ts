import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { AppConfig } from '../config/configuration';

const PRISMA_CONTEXT = 'PrismaService';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logQueries: boolean;

  constructor(config: ConfigService<AppConfig, true>) {
    const logQueries = config.get('prismaLogQueries', { infer: true });

    super({
      log: logQueries
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
    });

    this.logQueries = logQueries;
  }

  async onModuleInit(): Promise<void> {
    if (this.logQueries) {
      this.$on('query' as never, (event: Prisma.QueryEvent) => {
        const params =
          event.params && event.params !== '[]'
            ? ` params=${event.params}`
            : '';

        console.log(
          `[${PRISMA_CONTEXT}] ${event.duration}ms ${event.query}${params}`,
        );
      });
    }

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
