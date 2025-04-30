// In app.module.ts
import * as csurf from 'csurf';

// In middleware configuration
app.use(csurf({ cookie: { 
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
}}));

// In controllers, add CSRF token to forms
@Get('csrf-token')
getCsrfToken(@Req() req) {
  return { csrfToken: req.csrfToken() };
}