import { Injectable } from '@nestjs/common';
import { ProvidersInterface, ProviderUser } from './providers.interface';

@Injectable()
export class DiscordProvider implements ProvidersInterface {
  generateLink(query?: any): string {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;
    const scope = 'identify email';
    
    const url = new URL('https://discord.com/api/oauth2/authorize');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', scope);
    
    if (query && query.state) {
      url.searchParams.append('state', query.state);
    }
    
    return url.toString();
  }

  async getToken(code: string): Promise<string> {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;
    
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!response.ok) {
      return '';
    }
    
    const data = await response.json();
    return data.access_token;
  }

  async getUser(token: string): Promise<ProviderUser | null> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      email: data.email,
      name: data.username,
      picture: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : null,
    };
  }
}
