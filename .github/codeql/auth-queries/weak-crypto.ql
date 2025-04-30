/**
 * @name Weak Cryptographic Algorithm
 * @description Using weak cryptographic algorithms can lead to security vulnerabilities.
 * @kind problem
 * @problem.severity error
 * @security-severity 7.5
 * @precision high
 * @id typescript/weak-crypto
 * @tags security
 *       external/cwe/cwe-327
 */

import javascript

/**
 * Identifies calls to crypto functions with weak algorithms
 */
predicate isWeakCryptoAlgorithm(CallExpr call, string algorithm) {
  // Check for weak hash algorithms
  exists(string callee, string algoArg |
    callee = call.getCalleeName() and
    (
      callee = "createHash" or
      callee = "createHmac" or
      callee = "createCipher" or
      callee = "createCipheriv" or
      callee = "createDecipher" or
      callee = "createDecipheriv"
    ) and
    algoArg = call.getArgument(0).toString().toLowerCase() and
    (
      // Weak hash algorithms
      algoArg.matches(["%md5%", "%sha1%", "%md4%", "%md2%", "%ripemd%"]) or
      // Weak cipher algorithms
      algoArg.matches(["%des%", "%rc2%", "%rc4%", "%blowfish%"]) or
      // Weak cipher modes
      algoArg.matches(["%ecb%", "%cbc%"])
    ) and
    algorithm = algoArg
  )
  or
  // Check for weak JWT algorithms
  exists(ObjectExpr options, Property alg |
    call.getCalleeName() = "sign" and
    options = call.getArgument(2) and
    alg = options.getAProperty() and
    alg.getName() = "algorithm" and
    exists(string algValue |
      algValue = alg.getInit().toString().toLowerCase() and
      (
        algValue.matches(["%none%", "%hs256%", "%hs384%", "%hs512%"]) and
        algorithm = algValue
      )
    )
  )
}

from CallExpr call, string algorithm
where isWeakCryptoAlgorithm(call, algorithm)
select call, "Using weak cryptographic algorithm: " + algorithm
