import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './auth-user-response.dto';

export class AuthTokensResponseDto {
  @ApiProperty({
    description: 'Short-lived JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Long-lived JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({ example: '15m' })
  accessTokenExpiresIn: string;

  @ApiProperty({ example: '7d' })
  refreshTokenExpiresIn: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}
