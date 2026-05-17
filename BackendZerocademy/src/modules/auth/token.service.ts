import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { AppConfig } from '../../config/configuration';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { TOKEN_CONTEXT } from './constants';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
} from './types/authenticated-user.type';
import { AuthTokens } from './types/auth-tokens.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly logger: AppLoggerService,
  ) {}

  createAccessToken(payload: JwtAccessPayload): string {
    const { secret, accessExpiresIn } = this.configService.get('jwt', {
      infer: true,
    });

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
    });
  }

  createRefreshToken(payload: JwtRefreshPayload): string {
    const { refreshSecret, refreshExpiresIn } = this.configService.get('jwt', {
      infer: true,
    });

    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    const { secret } = this.configService.get('jwt', { infer: true });
    return this.jwtService.verify<JwtAccessPayload>(token, { secret });
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    const { refreshSecret } = this.configService.get('jwt', { infer: true });

    try {
      return this.jwtService.verify<JwtRefreshPayload>(token, {
        secret: refreshSecret,
      });
    } catch {
      this.logger.warn({
        context: TOKEN_CONTEXT,
        event: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token verification failed',
      });
      throw new Error('Invalid refresh token');
    }
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  buildAuthTokens(
    accessPayload: JwtAccessPayload,
    refreshPayload: JwtRefreshPayload,
  ): AuthTokens {
    const { accessExpiresIn, refreshExpiresIn } = this.configService.get(
      'jwt',
      { infer: true },
    );

    return {
      accessToken: this.createAccessToken(accessPayload),
      refreshToken: this.createRefreshToken(refreshPayload),
      accessTokenExpiresIn: accessExpiresIn,
      refreshTokenExpiresIn: refreshExpiresIn,
    };
  }
}
