import { Provider } from '@prisma/client';

export class User {
  id: string;
  email: string;
  password?: string;
  providerName: Provider;
  name?: string;
  lastName?: string;
  isSuperAdmin: boolean;
  providerId?: string;
  activated: boolean;
  pictureId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
