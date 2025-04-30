// This is a minimal type definition file for Node.js
// It's used to satisfy TypeScript when it can't find the @types/node package

declare namespace NodeJS {
  interface Process {
    env: ProcessEnv;
  }
  
  interface ProcessEnv {
    [key: string]: string | undefined;
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}

declare var process: NodeJS.Process;

declare module 'process' {
  export = process;
}
