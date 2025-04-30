import { Injectable } from '@nestjs/common';
import { ProvidersInterface, ProviderUser } from './providers.interface';

@Injectable()
export class TikTokProvider implements ProvidersInterface {
  generateLink(query?: any): string {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    const scope = 'user.info.basic';
    
    const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
    url.searchParams.append('client_key', clientKey);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', scope);
    url.searchParams.append('redirect_uri', redirectUri);
    
    if (query && query.state) {
      url.searchParams.append('state', query.state);
    }
    
    return url.toString();
  }

  async getToken(code: string): Promise<string> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    
    if (!response.ok) {
      return '';
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('TikTok OAuth error:', data.error);
      return '';
    }
    
    return data.access_token;
  }

  async getUser(token: string): Promise<ProviderUser | null> {
    const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'profile_deep_link'],
      }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('TikTok API error:', data.error);
      return null;
    }
    
    return {
      id: data.data.user.open_id,
      email: `${data.data.user.open_id}@tiktok.com`, // TikTok doesn't provide email
      name: data.data.user.display_name,
      picture: data.data.user.avatar_url,
    };
  }
}
