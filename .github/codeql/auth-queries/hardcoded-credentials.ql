/**
 * @name Hardcoded Credentials
 * @description Hardcoded credentials in source code can lead to security vulnerabilities.
 * @kind problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision high
 * @id typescript/hardcoded-credentials
 * @tags security
 *       external/cwe/cwe-798
 */

import javascript

/**
 * Identifies variable names that might contain credentials
 */
predicate isSensitiveVariableName(string name) {
  name.toLowerCase().matches([
    "%password%", "%secret%", "%token%", "%key%", "%credential%", "%auth%",
    "%jwt%", "%apikey%", "%api_key%", "%private%"
  ])
}

/**
 * Identifies string literals that look like credentials
 */
predicate looksLikeCredential(StringLiteral str) {
  // JWT pattern
  str.getValue().regexpMatch("ey[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+")
  or
  // API key pattern (alphanumeric, at least 16 chars)
  str.getValue().regexpMatch("[A-Za-z0-9]{16,}")
  or
  // Base64 pattern
  str.getValue().regexpMatch("[A-Za-z0-9+/]{20,}={0,2}")
}

/**
 * Identifies hardcoded credentials in variable declarations
 */
from VariableDeclarator decl, StringLiteral str
where 
  decl.getInit() = str and
  (
    isSensitiveVariableName(decl.getName().toString()) and
    not str.getValue().matches(["%process.env%", "%env.%", "%config%"]) and
    not str.getValue() = ""
  )
  or
  looksLikeCredential(str)
select decl, "Potential hardcoded credential in variable '" + decl.getName() + "'."
