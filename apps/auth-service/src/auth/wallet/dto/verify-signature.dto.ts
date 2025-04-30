import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifySignatureDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address format' })
  address: string;

  @ApiProperty({
    description: 'Signature of the challenge',
    example: '0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be89200',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
