import { Injectable } from '@nestjs/common';
import { ProvidersInterface, ProviderUser } from './providers.interface';

@Injectable()
export class FacebookProvider implements ProvidersInterface {
  generateLink(query?: any): string {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    
    const url = new URL('https://www.facebook.com/v12.0/dialog/oauth');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('scope', 'email');
    
    if (query && query.state) {
      url.searchParams.append('state', query.state);
    }
    
    return url.toString();
  }

  async getToken(code: string): Promise<string> {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    
    const response = await fetch(
      `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}`,
      {
        method: 'GET',
      }
    );
    
    if (!response.ok) {
      return '';
    }
    
    const data = await response.json();
    return data.access_token;
  }

  async getUser(token: string): Promise<ProviderUser | null> {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
      {
        method: 'GET',
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture?.data?.url,
    };
  }
}
