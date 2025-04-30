import { Injectable } from '@nestjs/common';
import { ProvidersInterface, ProviderUser } from './providers.interface';

@Injectable()
export class LinkedInProvider implements ProvidersInterface {
  generateLink(query?: any): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    const scope = 'r_liteprofile r_emailaddress';
    
    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
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
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
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
    // Get profile data
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!profileResponse.ok) {
      return null;
    }
    
    const profileData = await profileResponse.json();
    
    // Get email data
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!emailResponse.ok) {
      return null;
    }
    
    const emailData = await emailResponse.json();
    const email = emailData.elements[0]['handle~'].emailAddress;
    
    // Get profile picture
    let picture = null;
    try {
      const pictureResponse = await fetch('https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams))', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (pictureResponse.ok) {
        const pictureData = await pictureResponse.json();
        if (pictureData.profilePicture && 
            pictureData.profilePicture['displayImage~'] && 
            pictureData.profilePicture['displayImage~'].elements && 
            pictureData.profilePicture['displayImage~'].elements.length > 0) {
          picture = pictureData.profilePicture['displayImage~'].elements[0].identifiers[0].identifier;
        }
      }
    } catch (error) {
      // Ignore picture fetch errors
    }
    
    return {
      id: profileData.id,
      email,
      name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
      picture,
    };
  }
}
