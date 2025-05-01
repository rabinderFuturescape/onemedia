'use client';

import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import Link from 'next/link';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useMemo, useState } from 'react';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { LoginUserDto } from '@gitroom/nestjs-libraries/dtos/auth/login.user.dto';
import { GithubProvider } from '@gitroom/frontend/components/auth/providers/github.provider';
import interClass from '@gitroom/react/helpers/inter.font';
import { GoogleProvider } from '@gitroom/frontend/components/auth/providers/google.provider';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { FarcasterProvider } from '@gitroom/frontend/components/auth/providers/farcaster.provider';
import WalletProvider from '@gitroom/frontend/components/auth/providers/wallet.provider';
import { OnessoProvider } from '@gitroom/frontend/components/auth/providers/onesso.provider';
import { signIn } from 'next-auth/react';

type Inputs = {
  email: string;
  password: string;
  providerToken: '';
  provider: 'LOCAL';
};

export function Login() {
  const [loading, setLoading] = useState(false);
  const { isGeneral, neynarClientId, billingEnabled } = useVariables();
  const resolver = useMemo(() => {
    return classValidatorResolver(LoginUserDto);
  }, []);

  const form = useForm<Inputs>({
    resolver,
    defaultValues: {
      providerToken: '',
      provider: 'LOCAL',
    },
  });

  const fetchData = useFetch();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    try {
      // Use NextAuth credentials provider
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.ok) {
        // Redirect to main application dashboard
        // The middleware will redirect from / to either /launches or /analytics
        console.log('Login successful, redirecting to dashboard...');
        window.location.href = '/';
      } else {
        form.setError('email', {
          message: result?.error || 'Invalid credentials',
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      form.setError('email', {
        message: 'An unexpected error occurred',
      });
      setLoading(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <h1 className="text-3xl font-bold text-left mb-4 cursor-pointer">
            Sign In
          </h1>
        </div>

        {!isGeneral ? (
          <GithubProvider />
        ) : (
          <div className="gap-[5px] flex flex-col">
            <OnessoProvider />
            <GoogleProvider />
            {!!neynarClientId && <FarcasterProvider />}
            {billingEnabled && <WalletProvider />}
          </div>
        )}
        <div className="h-[20px] mb-[24px] mt-[24px] relative">
          <div className="absolute w-full h-[1px] bg-fifth top-[50%] -translate-y-[50%]" />
          <div
            className={`absolute z-[1] ${interClass} justify-center items-center w-full left-0 top-0 flex`}
          >
            <div className="bg-customColor15 px-[16px]">OR</div>
          </div>
        </div>

        <div className="text-textColor">
          <Input
            label="Email"
            {...form.register('email')}
            type="email"
            placeholder="Email Address"
          />
          <Input
            label="Password"
            {...form.register('password')}
            autoComplete="off"
            type="password"
            placeholder="Password"
          />
        </div>
        <div className="text-center mt-6">
          <div className="w-full flex">
            <Button
              type="submit"
              className="flex-1 rounded-[4px]"
              loading={loading}
            >
              Sign in
            </Button>
          </div>
          <p className="mt-4 text-sm">
            Don{"'"}t Have An Account?{' '}
            <Link href="/auth" className="underline cursor-pointer">
              {' '}
              Sign Up
            </Link>
          </p>
          <p className="mt-4 text-sm text-red-600">
            <Link href="/auth/forgot" className="underline cursor-pointer">
              Forgot password
            </Link>
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
