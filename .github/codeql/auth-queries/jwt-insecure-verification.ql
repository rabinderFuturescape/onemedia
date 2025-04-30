/**
 * @name Insecure JWT Verification
 * @description JWT tokens should be properly verified with a secure algorithm and secret.
 * @kind problem
 * @problem.severity error
 * @security-severity 8.0
 * @precision high
 * @id typescript/insecure-jwt-verification
 * @tags security
 *       external/cwe/cwe-327
 */

import javascript

/**
 * Identifies calls to JWT verify functions
 */
class JwtVerifyCall extends CallExpr {
  JwtVerifyCall() {
    exists(DataFlow::ModuleImportNode jwt |
      jwt.getPath() = "jsonwebtoken" and
      this.getCalleeName() = "verify"
    )
    or
    exists(DataFlow::ModuleImportNode jwt |
      jwt.getPath() = "jwt-decode" and
      this.getCalleeName() = "decode"
    )
  }
}

/**
 * Identifies JWT verification without algorithm specification
 */
predicate isInsecureJwtVerification(JwtVerifyCall call) {
  // Check if the algorithm is not specified or is set to 'none'
  exists(ObjectExpr options |
    call.getNumArgument() >= 3 and
    options = call.getArgument(2) and
    not exists(Property alg |
      alg = options.getAProperty() and
      alg.getName() = "algorithms"
    )
  )
  or
  // Check for jwt-decode which doesn't verify signatures
  exists(DataFlow::ModuleImportNode jwt |
    jwt.getPath() = "jwt-decode" and
    call.getCalleeName() = "decode"
  )
}

from JwtVerifyCall call
where isInsecureJwtVerification(call)
select call, "JWT token verification without algorithm specification or using insecure methods."
