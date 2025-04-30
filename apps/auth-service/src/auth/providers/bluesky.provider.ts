import { Injectable } from '@nestjs/common';
import { ProvidersInterface, ProviderUser } from './providers.interface';
import { BskyAgent } from '@atproto/api';
import * as dayjs from 'dayjs';

@Injectable()
export class BlueskyProvider implements ProvidersInterface {
  generateLink(query?: any): string {
    // Bluesky doesn't have a traditional OAuth flow
    // Instead, we'll return a URL to a custom login page
    const redirectUri = process.env.BLUESKY_REDIRECT_URI;
    
    const url = new URL(redirectUri);
    
    if (query && query.state) {
      url.searchParams.append('state', query.state);
    }
    
    return url.toString();
  }

  async getToken(code: string): Promise<string> {
    try {
      // Decode the base64 encoded credentials
      const body = JSON.parse(Buffer.from(code, 'base64').toString());
      
      const agent = new BskyAgent({
        service: body.service || 'https://bsky.social',
      });
      
      const { success, data } = await agent.login({
        identifier: body.identifier,
        password: body.password,
      });
      
      if (!success) {
        return '';
      }
      
      // Return the access token
      return data.accessJwt;
    } catch (error) {
      console.error('Bluesky authentication error:', error);
      return '';
    }
  }

  async getUser(token: string): Promise<ProviderUser | null> {
    try {
      const agent = new BskyAgent({
        service: 'https://bsky.social',
      });
      
      // Set the session with the token
      agent.session = {
        accessJwt: token,
        refreshJwt: '',
        handle: '',
        did: '',
        email: '',
        emailConfirmed: false,
      };
      
      // Get the user's DID
      const { data: session } = await agent.getSession();
      
      // Get the user's profile
      const { data: profile } = await agent.getProfile({
        actor: session.did,
      });
      
      return {
        id: session.did,
        email: `${profile.handle}@bsky.social`, // Bluesky doesn't expose email
        name: profile.displayName || profile.handle,
        picture: profile.avatar,
      };
    } catch (error) {
      console.error('Error getting Bluesky user:', error);
      return null;
    }
  }
}
