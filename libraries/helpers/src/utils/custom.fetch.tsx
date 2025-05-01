'use client';

import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useRef,
  useState,
} from 'react';
import { customFetch, Params } from './custom.fetch.func';
import { useVariables } from '@gitroom/react/helpers/variable.context';

const FetchProvider = createContext(
  customFetch(
    // @ts-ignore
    {
      baseUrl: '',
      beforeRequest: () => {},
      afterRequest: () => {
        return true;
      },
    } as Params
  )
);

export const FetchWrapperComponent: FC<Params & { children: ReactNode }> = (
  props
) => {
  const { children, ...params } = props;
  const { isSecured } = useVariables();

  // Ensure baseUrl is set correctly
  const updatedParams = {
    ...params,
    baseUrl: params.baseUrl || (
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:4200/api/mock'
        : params.baseUrl
    )
  };

  // Log the baseUrl for debugging
  if (typeof window !== 'undefined') {
    console.log('FetchWrapperComponent baseUrl:', updatedParams.baseUrl);
  }

  // @ts-ignore
  const fetchData = useRef(
    customFetch(updatedParams, undefined, undefined, isSecured)
  );

  return (
    // @ts-ignore
    <FetchProvider.Provider value={fetchData.current}>
      {children}
    </FetchProvider.Provider>
  );
};

export const useFetch = () => {
  return useContext(FetchProvider);
};
