import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateChallengeDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' })
  address: string;
}
