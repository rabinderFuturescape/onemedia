import { Module } from '@nestjs/common';
import { GoogleProvider } from './google.provider';
import { TwitterProvider } from './twitter.provider';
import { GithubProvider } from './github.provider';
import { FacebookProvider } from './facebook.provider';
import { DiscordProvider } from './discord.provider';
import { LinkedInProvider } from './linkedin.provider';
import { BlueskyProvider } from './bluesky.provider';
import { SlackProvider } from './slack.provider';
import { TikTokProvider } from './tiktok.provider';

@Module({
  providers: [
    GoogleProvider,
    TwitterProvider,
    GithubProvider,
    FacebookProvider,
    DiscordProvider,
    LinkedInProvider,
    BlueskyProvider,
    SlackProvider,
    TikTokProvider,
  ],
  exports: [
    GoogleProvider,
    TwitterProvider,
    GithubProvider,
    FacebookProvider,
    DiscordProvider,
    LinkedInProvider,
    BlueskyProvider,
    SlackProvider,
    TikTokProvider,
  ],
})
export class ProvidersModule {}
