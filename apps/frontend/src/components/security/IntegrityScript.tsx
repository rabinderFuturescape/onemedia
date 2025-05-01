'use client';

import React from 'react';
import Script, { ScriptProps } from 'next/script';

interface IntegrityScriptProps extends Omit<ScriptProps, 'src'> {
  src: string;
  integrity: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Component for loading external scripts with Subresource Integrity (SRI)
 * This helps prevent unauthorized modifications to scripts from CDNs
 */
export function IntegrityScript({
  src,
  integrity,
  crossOrigin = 'anonymous',
  ...props
}: IntegrityScriptProps) {
  return (
    <Script
      src={src}
      integrity={integrity}
      crossOrigin={crossOrigin}
      {...props}
    />
  );
}

/**
 * Example usage:
 * 
 * <IntegrityScript
 *   src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
 *   integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz"
 *   strategy="lazyOnload"
 * />
 */
