import { Injectable } from '@nestjs/common';
import { ProvidersInterface, ProviderUser } from './providers.interface';

@Injectable()
export class TwitterProvider implements ProvidersInterface {
  generateLink(query?: any): string {
    // Implementation would depend on Twitter OAuth API
    return '';
  }

  async getToken(code: string): Promise<string> {
    // Implementation would depend on Twitter OAuth API
    return '';
  }

  async getUser(token: string): Promise<ProviderUser | null> {
    // Implementation would depend on Twitter OAuth API
    return null;
  }
}
