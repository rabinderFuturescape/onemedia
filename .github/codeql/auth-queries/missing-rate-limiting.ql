/**
 * @name Missing Rate Limiting on Auth Endpoints
 * @description Authentication endpoints should implement rate limiting to prevent brute force attacks.
 * @kind problem
 * @problem.severity warning
 * @security-severity 6.0
 * @precision medium
 * @id typescript/missing-rate-limiting
 * @tags security
 *       external/cwe/cwe-307
 */

import javascript
import semmle.javascript.frameworks.Express
import semmle.javascript.frameworks.NestJS

/**
 * Identifies authentication-related route handlers
 */
class AuthRouteHandler extends HTTP::RouteHandler {
  AuthRouteHandler() {
    // Match route paths related to authentication
    exists(string path |
      this.getRouteHandler().getParameter(0).toString().matches("%" + path + "%") and
      (
        path = "/login" or
        path = "/auth/login" or
        path = "/register" or
        path = "/auth/register" or
        path = "/signin" or
        path = "/signup" or
        path = "/reset-password" or
        path = "/forgot-password"
      )
    )
    or
    // Match controller methods with auth-related names
    exists(NestJS::Controller controller |
      this = controller.getARouteHandler() and
      (
        this.getName().matches("%login%") or
        this.getName().matches("%register%") or
        this.getName().matches("%signin%") or
        this.getName().matches("%signup%") or
        this.getName().matches("%resetPassword%") or
        this.getName().matches("%forgotPassword%")
      )
    )
  }
}

/**
 * Identifies rate limiting middleware or guards
 */
predicate hasRateLimiting(AuthRouteHandler handler) {
  // Check for rate limiting middleware
  exists(CallExpr call |
    call.getCalleeName().matches(["%rateLimit%", "%throttle%", "%RateLimit%", "%Throttle%"]) and
    call.getParent*() = handler
  )
  or
  // Check for rate limiting decorators in NestJS
  exists(Decorator decorator |
    decorator.getExpression().toString().matches(["%RateLimit%", "%Throttle%", "%UseGuards%"]) and
    decorator.getParent*() = handler
  )
  or
  // Check for custom rate limiting implementation
  exists(CallExpr call |
    call.getCalleeName().matches(["%checkRateLimit%", "%isRateLimited%", "%rateLimiter%"]) and
    call.getParent*() = handler
  )
}

from AuthRouteHandler handler
where not hasRateLimiting(handler)
select handler, "Authentication endpoint without rate limiting protection."
