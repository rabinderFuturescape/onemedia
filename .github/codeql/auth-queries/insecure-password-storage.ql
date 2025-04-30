/**
 * @name Insecure Password Storage
 * @description Passwords should be hashed with a secure algorithm before storage.
 * @kind problem
 * @problem.severity error
 * @security-severity 8.0
 * @precision high
 * @id typescript/insecure-password-storage
 * @tags security
 *       external/cwe/cwe-256
 */

import javascript

/**
 * Identifies password-related variable names
 */
predicate isPasswordVariable(string name) {
  name.toLowerCase().matches(["%password%", "%pwd%", "%passwd%"])
}

/**
 * Identifies secure hashing functions
 */
predicate isSecureHashFunction(CallExpr call) {
  exists(string name |
    name = call.getCalleeName() and
    (
      name = "hash" or
      name = "hashSync" or
      name = "hashPassword" or
      name = "createHash" or
      name = "pbkdf2" or
      name = "pbkdf2Sync" or
      name = "scrypt" or
      name = "scryptSync" or
      name = "argon2" or
      name = "bcrypt"
    )
  )
}

/**
 * Identifies database operations that might store passwords
 */
from CallExpr dbOperation, DataFlow::ParameterNode param
where 
  // Look for database create or update operations
  (
    dbOperation.getCalleeName().matches(["create", "update", "insert", "save"]) and
    // With an object containing a password field
    exists(ObjectExpr obj, Property prop |
      dbOperation.getAnArgument() = obj and
      obj.getAProperty() = prop and
      isPasswordVariable(prop.getName().toString()) and
      // That is not hashed
      not exists(CallExpr hash |
        isSecureHashFunction(hash) and
        hash.getParent*() = prop
      )
    )
  )
  or
  // Look for password parameters that are used directly in database operations
  (
    exists(ParameterDeclaration paramDecl |
      paramDecl = param.getParameter() and
      isPasswordVariable(paramDecl.getName().toString()) and
      exists(CallExpr dbCall |
        dbCall.getCalleeName().matches(["create", "update", "insert", "save"]) and
        dbCall.getAnArgument() = param.asExpr()
      )
    )
  )
select dbOperation, "Potential insecure password storage without proper hashing."
