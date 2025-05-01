import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import csurf from 'csurf';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware for adding security headers and protections
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityMiddleware');
  private readonly helmetMiddleware: any;
  private readonly csrfMiddleware: any;

  constructor() {
    // Configure Helmet middleware
    this.helmetMiddleware = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net', 'https://*.onesso.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", 'https://*.onesso.com', 'https://*.postiz.app', 'wss://*.postiz.app'],
          frameSrc: ["'self'", 'https://*.onesso.com'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding of cross-origin resources
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allow popups
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resource sharing
    });

    // Configure CSRF middleware
    this.csrfMiddleware = csurf({
      cookie: {
        key: 'XSRF-TOKEN',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Add request ID for tracking
    const requestId = uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Apply Helmet middleware
    this.helmetMiddleware(req, res, (err: any) => {
      if (err) {
        this.logger.error(`Helmet middleware error: ${err.message}`);
        return next(err);
      }

      // Skip CSRF for API endpoints and non-mutating methods
      if (
        req.path.startsWith('/api/') ||
        ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
      ) {
        return next();
      }

      // Apply CSRF middleware for other routes
      this.csrfMiddleware(req, res, (csrfErr: any) => {
        if (csrfErr) {
          this.logger.warn(`CSRF validation failed: ${csrfErr.message}`);
          return next(csrfErr);
        }

        // Add CSRF token to response
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
          httpOnly: false, // Client-side JavaScript needs to read this
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        next();
      });
    });
  }
}
