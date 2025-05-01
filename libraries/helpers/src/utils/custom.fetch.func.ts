export interface Params {
  baseUrl: string;
  beforeRequest?: (url: string, options: RequestInit) => Promise<RequestInit>;
  afterRequest?: (
    url: string,
    options: RequestInit,
    response: Response
  ) => Promise<boolean>;
}
export const customFetch = (
  params: Params,
  auth?: string,
  showorg?: string,
  secured: boolean = true
) => {
  return async function newFetch(url: string, options: RequestInit = {}) {
    const newRequestObject = await params?.beforeRequest?.(url, options);
    const authNonSecuredCookie = typeof document === 'undefined' ? null : document.cookie
      .split(';')
      .find((p) => p.includes('auth='))
      ?.split('=')[1];

    const authNonSecuredOrg = typeof document === 'undefined' ? null : document.cookie
      .split(';')
      .find((p) => p.includes('showorg='))
      ?.split('=')[1];

    const authNonSecuredImpersonate = typeof document === 'undefined' ? null : document.cookie
      .split(';')
      .find((p) => p.includes('impersonate='))
      ?.split('=')[1];

    const fetchRequest = await fetch(params.baseUrl + url, {
      ...(secured ? { credentials: 'include' } : {}),
      ...(newRequestObject || options),
      headers: {
        ...(showorg
          ? { showorg }
          : authNonSecuredOrg
          ? { showorg: authNonSecuredOrg }
          : {}),
        ...(options.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        ...options?.headers,
        ...(auth
          ? { auth }
          : authNonSecuredCookie
          ? { auth: authNonSecuredCookie }
          : {}),
        ...(authNonSecuredImpersonate
          ? { impersonate: authNonSecuredImpersonate }
          : {}),
      },
      // @ts-ignore
      ...(!options.next && options.cache !== 'force-cache'
        ? { cache: options.cache || 'no-store' }
        : {}),
    });

    if (
      !params?.afterRequest ||
      (await params?.afterRequest?.(url, options, fetchRequest))
    ) {
      return fetchRequest;
    }

    // @ts-ignore
    return new Promise((res) => {}) as Response;
  };
};

export const fetchBackend = customFetch({
  get baseUrl() {
    // Use the mock API URL in development
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4200/api/mock';
    }
    return process.env.BACKEND_URL!;
  },
});
