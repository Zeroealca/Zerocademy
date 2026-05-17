import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token issued at login',
    minLength: 20,
  })
  @IsString()
  @MinLength(20)
  refreshToken: string;
}
