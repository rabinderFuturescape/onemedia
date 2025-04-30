import { Provider } from '@prisma/client';
import { ProvidersInterface } from './providers.interface';
import { GoogleProvider } from './google.provider';
import { TwitterProvider } from './twitter.provider';
import { GithubProvider } from './github.provider';
import { FacebookProvider } from './facebook.provider';
import { DiscordProvider } from './discord.provider';
import { LinkedInProvider } from './linkedin.provider';
import { BlueskyProvider } from './bluesky.provider';
import { SlackProvider } from './slack.provider';
import { TikTokProvider } from './tiktok.provider';

export class ProvidersFactory {
  static loadProvider(provider: Provider): ProvidersInterface {
    switch (provider) {
      case Provider.GOOGLE:
        return new GoogleProvider();
      case Provider.TWITTER:
        return new TwitterProvider();
      case Provider.GITHUB:
        return new GithubProvider();
      case Provider.FACEBOOK:
        return new FacebookProvider();
      case Provider.DISCORD:
        return new DiscordProvider();
      case Provider.LINKEDIN:
        return new LinkedInProvider();
      case Provider.BLUESKY:
        return new BlueskyProvider();
      case Provider.SLACK:
        return new SlackProvider();
      case Provider.TIKTOK:
        return new TikTokProvider();
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }
}
