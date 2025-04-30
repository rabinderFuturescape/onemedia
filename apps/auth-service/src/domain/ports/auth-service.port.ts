import { Provider } from '@prisma/client';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';

export interface AuthServicePort {
  validateUser(email: string, password: string): Promise<User | null>;
  login(user: User): Promise<Token>;
  register(userData: Partial<User>, ip: string, userAgent: string): Promise<User>;
  validateToken(token: string): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<Token>;
  forgotPassword(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  activateAccount(token: string): Promise<string | null>;
  validateProviderAuth(provider: Provider, code: string): Promise<User | null>;
  generateProviderAuthLink(provider: Provider, query?: any): string;
}
