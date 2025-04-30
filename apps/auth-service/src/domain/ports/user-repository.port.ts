import { Provider } from '@prisma/client';
import { User } from '../models/user.model';

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string, provider: Provider): Promise<User | null>;
  findByProvider(providerId: string, provider: Provider): Promise<User | null>;
  create(user: Partial<User>): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
  activateUser(id: string): Promise<User>;
}
