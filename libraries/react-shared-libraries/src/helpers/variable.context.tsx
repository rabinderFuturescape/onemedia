'use client';

import { createContext, FC, ReactNode, useContext, useEffect } from 'react';

interface VariableContextInterface {
  billingEnabled: boolean;
  isGeneral: boolean;
  frontEndUrl: string;
  plontoKey: string;
  storageProvider: 'local' | 'cloudflare',
  backendUrl: string;
  discordUrl: string;
  uploadDirectory: string;
  facebookPixel: string;
  telegramBotName: string;
  neynarClientId: string;
  isSecured: boolean;
  tolt: string;
}
const VariableContext = createContext({
  billingEnabled: false,
  isGeneral: true,
  frontEndUrl: '',
  storageProvider: 'local',
  plontoKey: '',
  backendUrl: '',
  discordUrl: '',
  uploadDirectory: '',
  isSecured: false,
  telegramBotName: '',
  facebookPixel: '',
  neynarClientId: '',
  tolt: '',
} as VariableContextInterface);

export const VariableContextComponent: FC<
  VariableContextInterface & { children: ReactNode }
> = (props) => {
  const { children, ...otherProps } = props;

  // Ensure backendUrl is set correctly in development
  const updatedProps = {
    ...otherProps,
    backendUrl: otherProps.backendUrl || (
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:4200/api/mock'
        : otherProps.backendUrl
    )
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Log the backendUrl for debugging
      console.log('VariableContextComponent backendUrl:', updatedProps.backendUrl);

      // @ts-ignore
      window.vars = updatedProps;
    }
  }, []);

  return (
    <VariableContext.Provider value={updatedProps}>
      {children}
    </VariableContext.Provider>
  );
};

export const useVariables = () => {
  return useContext(VariableContext);
}

export const loadVars = () => {
  // @ts-ignore
  return window.vars as VariableContextInterface;
}
