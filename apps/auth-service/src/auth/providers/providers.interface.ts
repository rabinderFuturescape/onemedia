export interface ProviderUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface ProvidersInterface {
  generateLink(query?: any): string;
  getToken(code: string): Promise<string>;
  getUser(token: string): Promise<ProviderUser | null>;
}
