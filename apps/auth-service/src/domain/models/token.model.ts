export class Token {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  
  constructor(partial: Partial<Token>) {
    Object.assign(this, partial);
  }
}
