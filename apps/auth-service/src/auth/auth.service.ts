import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { UserRepositoryPort } from '../domain/ports/user-repository.port';
import { TokenServicePort } from '../domain/ports/token-service.port';
import { User } from '../domain/models/user.model';
import { Token } from '../domain/models/token.model';
import { CryptoService } from '../infrastructure/services/crypto.service';
import { ProvidersFactory } from './providers/providers.factory';
import * as dayjs from 'dayjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('UserRepositoryPort')
    private userRepository: UserRepositoryPort,
    @Inject('TokenServicePort')
    private tokenService: TokenServicePort,
    private cryptoService: CryptoService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email, Provider.LOCAL);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await this.cryptoService.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  async login(user: User): Promise<Token> {
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(process.env.JWT_EXPIRATION_SECONDS || '86400'),
    };
  }

  async register(userData: Partial<User>, ip: string, userAgent: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(
      userData.email,
      userData.providerName,
    );
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password if provider is LOCAL
    if (userData.providerName === Provider.LOCAL && userData.password) {
      userData.password = await this.cryptoService.hashPassword(userData.password);
    }
    
    // Set activated status based on provider
    userData.activated = userData.providerName !== Provider.LOCAL;
    
    // Add IP and user agent
    userData['ip'] = ip;
    userData['agent'] = userAgent;
    
    return this.userRepository.create(userData);
  }

  async validateToken(token: string): Promise<User | null> {
    const payload = this.tokenService.verifyToken(token);
    
    if (!payload) {
      return null;
    }
    
    return this.userRepository.findById(payload.sub);
  }

  async refreshToken(refreshToken: string): Promise<Token> {
    const payload = this.tokenService.verifyToken(refreshToken);
    
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return this.login(user);
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email, Provider.LOCAL);
    
    if (!user) {
      return false;
    }
    
    // Generate reset token logic would go here
    // Send email with reset link
    
    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Verify reset token
    const payload = this.tokenService.verifyToken(token);
    
    if (!payload) {
      return false;
    }
    
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
      return false;
    }
    
    // Hash new password
    const hashedPassword = await this.cryptoService.hashPassword(newPassword);
    
    // Update user password
    await this.userRepository.update(user.id, { password: hashedPassword });
    
    return true;
  }

  async activateAccount(token: string): Promise<string | null> {
    const payload = this.tokenService.verifyToken(token);
    
    if (!payload) {
      return null;
    }
    
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
      return null;
    }
    
    await this.userRepository.activateUser(user.id);
    
    // Return new token
    return this.tokenService.generateAccessToken(user);
  }

  async validateProviderAuth(provider: Provider, code: string): Promise<User | null> {
    const providerInstance = ProvidersFactory.loadProvider(provider);
    const token = await providerInstance.getToken(code);
    
    if (!token) {
      return null;
    }
    
    const providerUser = await providerInstance.getUser(token);
    
    if (!providerUser) {
      return null;
    }
    
    // Check if user exists
    let user = await this.userRepository.findByProvider(providerUser.id, provider);
    
    if (!user) {
      // Create new user
      user = await this.userRepository.create({
        email: providerUser.email,
        name: providerUser.name,
        providerName: provider,
        providerId: providerUser.id,
        activated: true,
      });
    }
    
    return user;
  }

  generateProviderAuthLink(provider: Provider, query?: any): string {
    const providerInstance = ProvidersFactory.loadProvider(provider);
    return providerInstance.generateLink(query);
  }
}
