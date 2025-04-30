import { Injectable } from '@nestjs/common';
import { ProvidersInterface, ProviderUser } from './providers.interface';

@Injectable()
export class SlackProvider implements ProvidersInterface {
  generateLink(query?: any): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI;
    const scope = 'identity.basic,identity.email,identity.avatar';
    
    const url = new URL('https://slack.com/oauth/v2/authorize');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('user_scope', scope);
    url.searchParams.append('redirect_uri', redirectUri);
    
    if (query && query.state) {
      url.searchParams.append('state', query.state);
    }
    
    return url.toString();
  }

  async getToken(code: string): Promise<string> {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_REDIRECT_URI;
    
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!response.ok) {
      return '';
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Slack OAuth error:', data.error);
      return '';
    }
    
    return data.authed_user.access_token;
  }

  async getUser(token: string): Promise<ProviderUser | null> {
    const response = await fetch('https://slack.com/api/users.identity', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Slack API error:', data.error);
      return null;
    }
    
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      picture: data.user.image_192,
    };
  }
}
