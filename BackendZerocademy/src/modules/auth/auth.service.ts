import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toAuthUserResponseDto,
  userWithProfilesSelect,
} from './mappers/auth-user.mapper';
import { AUTH_CONTEXT } from './constants';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenService } from './token.service';
import {
  AuthenticatedUser,
  JwtAccessPayload,
} from './types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly logger: AppLoggerService,
  ) {}

  async login(
    dto: LoginDto,
    ip?: string,
  ): Promise<AuthTokensResponseDto> {
    this.logger.log({
      context: AUTH_CONTEXT,
      event: 'LOGIN_ATTEMPT',
      email: dto.email,
      ip,
      message: 'Login attempt started',
    });

    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        deletedAt: null,
      },
      select: {
        ...userWithProfilesSelect,
        passwordHash: true,
      },
    });

    if (!user || !user.isActive) {
      this.logger.warn({
        context: AUTH_CONTEXT,
        event: 'LOGIN_FAILED',
        email: dto.email,
        ip,
        message: 'Invalid credentials or inactive account',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      this.logger.warn({
        context: AUTH_CONTEXT,
        event: 'LOGIN_FAILED',
        email: dto.email,
        userId: user.id,
        ip,
        message: 'Password verification failed',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      const tokens = await this.issueTokensForUser(user);

      this.logger.log({
        context: AUTH_CONTEXT,
        event: 'LOGIN_SUCCESS',
        userId: user.id,
        email: user.email,
        ip,
        message: 'User authenticated successfully',
      });

      return {
        ...tokens,
        user: toAuthUserResponseDto(user),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error({
        context: AUTH_CONTEXT,
        event: 'LOGIN_ERROR',
        email: dto.email,
        userId: user.id,
        ip,
        message: err.message,
        stack: err.stack,
        metadata: {
          errorName: err.name,
          phase: 'issue_tokens',
        },
      });
      throw error;
    }
  }

  async refresh(
    dto: RefreshTokenDto,
    ip?: string,
  ): Promise<AuthTokensResponseDto> {
    let payload;

    try {
      payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      this.logger.warn({
        context: AUTH_CONTEXT,
        event: 'REFRESH_FAILED',
        ip,
        message: 'Invalid refresh token signature',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.tokenService.hashToken(dto.refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        id: payload.tokenId,
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { select: userWithProfilesSelect },
      },
    });

    if (!storedToken || storedToken.user.deletedAt || !storedToken.user.isActive) {
      this.logger.warn({
        context: AUTH_CONTEXT,
        event: 'REFRESH_FAILED',
        userId: payload.sub,
        ip,
        message: 'Refresh token not found or user inactive',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokensForUser(storedToken.user);

    this.logger.log({
      context: AUTH_CONTEXT,
      event: 'TOKEN_REFRESHED',
      userId: storedToken.user.id,
      ip,
      message: 'Access token refreshed',
    });

    return {
      ...tokens,
      user: toAuthUserResponseDto(storedToken.user),
    };
  }

  async logout(dto: RefreshTokenDto, userId: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(dto.refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    this.logger.log({
      context: AUTH_CONTEXT,
      event: 'LOGOUT',
      userId,
      message: 'User logged out — refresh token revoked',
    });
  }

  async getCurrentUser(user: AuthenticatedUser): Promise<AuthUserResponseDto> {
    const record = await this.prisma.user.findFirst({
      where: {
        id: user.id,
        deletedAt: null,
        isActive: true,
      },
      select: userWithProfilesSelect,
    });

    if (!record) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return toAuthUserResponseDto(record);
  }

  private async issueTokensForUser(
    user: Parameters<typeof toAuthUserResponseDto>[0] & { passwordHash?: string },
  ): Promise<Omit<AuthTokensResponseDto, 'user'>> {
    const authUser = toAuthUserResponseDto(user);

    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      profileId: authUser.profileId,
      profileType: authUser.profileType,
      institutionId: authUser.institutionId,
    };

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: 'pending',
        expiresAt: this.getRefreshExpiryDate(),
      },
    });

    const tokens = this.tokenService.buildAuthTokens(accessPayload, {
      sub: user.id,
      tokenId: refreshTokenRecord.id,
    });

    const tokenHash = this.tokenService.hashToken(tokens.refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { tokenHash },
    });

    return tokens;
  }

  private getRefreshExpiryDate(): Date {
    const expiresIn = this.configService.get('jwt.refreshExpiresIn', {
      infer: true,
    });
    const days = parseInt(expiresIn.replace(/\D/g, ''), 10) || 7;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
