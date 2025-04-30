import { User } from '../models/user.model';
import { Token } from '../models/token.model';

export interface TokenServicePort {
  generateAccessToken(user: User): string;
  generateRefreshToken(user: User): string;
  verifyToken(token: string): any;
  decodeToken(token: string): any;
}
