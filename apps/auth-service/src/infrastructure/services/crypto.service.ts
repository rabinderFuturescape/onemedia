import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  fixedEncryption(value: string): string {
    // encryption algorithm
    const algorithm = 'aes-256-cbc';

    // create a cipher object
    const cipher = crypto.createCipher(algorithm, process.env.JWT_SECRET);

    // encrypt the plain text
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  }

  fixedDecryption(encryptedValue: string): string {
    // encryption algorithm
    const algorithm = 'aes-256-cbc';

    // create a decipher object
    const decipher = crypto.createDecipher(algorithm, process.env.JWT_SECRET);

    // decrypt the encrypted text
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
