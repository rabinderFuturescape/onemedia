/**
 * @name Insecure Cookie Settings
 * @description Authentication cookies should have secure, httpOnly, and sameSite attributes set.
 * @kind problem
 * @problem.severity warning
 * @security-severity 6.0
 * @precision high
 * @id typescript/insecure-cookie-settings
 * @tags security
 *       external/cwe/cwe-1004
 */

import javascript

/**
 * Identifies cookie setting operations
 */
class CookieOperation extends CallExpr {
  CookieOperation() {
    // Express/response cookie methods
    this.getCalleeName() = "cookie"
    or
    // Cookie libraries
    exists(MemberAccess ma |
      ma = this.getCallee() and
      ma.getPropertyName() = "cookie"
    )
  }
  
  /**
   * Gets the options object for this cookie operation
   */
  ObjectExpr getOptionsObject() {
    result = this.getArgument(2)
  }
}

/**
 * Checks if a cookie has secure settings
 */
predicate hasSecureCookieSettings(CookieOperation cookieOp) {
  exists(ObjectExpr options |
    options = cookieOp.getOptionsObject() and
    // Check for secure flag
    exists(Property secureProp |
      secureProp = options.getAProperty() and
      secureProp.getName() = "secure" and
      secureProp.getInit().toString() = "true"
    ) and
    // Check for httpOnly flag
    exists(Property httpOnlyProp |
      httpOnlyProp = options.getAProperty() and
      httpOnlyProp.getName() = "httpOnly" and
      httpOnlyProp.getInit().toString() = "true"
    ) and
    // Check for sameSite (not 'none')
    exists(Property sameSiteProp |
      sameSiteProp = options.getAProperty() and
      sameSiteProp.getName() = "sameSite" and
      not sameSiteProp.getInit().toString().toLowerCase() = "'none'"
    )
  )
}

/**
 * Identifies auth-related cookie names
 */
predicate isAuthCookie(CookieOperation cookieOp) {
  exists(string cookieName |
    cookieName = cookieOp.getArgument(0).toString().toLowerCase() and
    (
      cookieName.matches(["%auth%", "%token%", "%jwt%", "%session%", "%id%", "%user%"])
    )
  )
}

from CookieOperation cookieOp
where 
  isAuthCookie(cookieOp) and
  not hasSecureCookieSettings(cookieOp)
select cookieOp, "Authentication cookie set without secure, httpOnly, or proper sameSite attributes."
