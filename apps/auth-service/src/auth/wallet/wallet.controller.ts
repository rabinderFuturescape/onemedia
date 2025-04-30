import { Controller, Post, Body, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { GenerateChallengeDto } from './dto/generate-challenge.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { Provider } from '@prisma/client';
import { TokenService } from '../../infrastructure/services/token.service';

@ApiTags('Wallet Authentication')
@Controller('auth/wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly logger: LoggerService,
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  @Post('challenge')
  @ApiOperation({ summary: 'Generate a challenge for wallet authentication' })
  @ApiResponse({ status: 201, description: 'Challenge generated successfully' })
  @ApiBody({ type: GenerateChallengeDto })
  async generateChallenge(@Body() generateChallengeDto: GenerateChallengeDto) {
    try {
      const { address } = generateChallengeDto;
      
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new BadRequestException('Invalid wallet address');
      }
      
      const challenge = this.walletService.generateChallenge(address);
      
      return {
        challenge,
      };
    } catch (error) {
      this.logger.error(`Error generating challenge: ${error.message}`, error.stack, 'WalletController');
      throw error;
    }
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a signed challenge for wallet authentication' })
  @ApiResponse({ status: 201, description: 'Signature verified successfully' })
  @ApiBody({ type: VerifySignatureDto })
  async verifySignature(@Body() verifySignatureDto: VerifySignatureDto) {
    try {
      const { address, signature } = verifySignatureDto;
      
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new BadRequestException('Invalid wallet address');
      }
      
      if (!signature) {
        throw new BadRequestException('Signature is required');
      }
      
      const isValid = this.walletService.verifySignature(address, signature);
      
      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }
      
      // Find or create user with this wallet address
      let user = await this.userRepository.findByProvider(address, Provider.WALLET);
      
      if (!user) {
        // Create a new user
        user = await this.userRepository.create({
          email: `${address.toLowerCase()}@wallet.auth`,
          providerName: Provider.WALLET,
          providerId: address.toLowerCase(),
          activated: true,
          name: `Wallet ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        });
      }
      
      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(user);
      const refreshToken = this.tokenService.generateRefreshToken(user);
      
      return {
        accessToken,
        refreshToken,
        expiresIn: parseInt(process.env.JWT_EXPIRATION_SECONDS || '86400'),
      };
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`, error.stack, 'WalletController');
      throw error;
    }
  }
}
