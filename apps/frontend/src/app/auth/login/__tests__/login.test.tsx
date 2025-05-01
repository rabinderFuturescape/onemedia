import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import Login from '../page';
import { signIn } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login page correctly', () => {
    render(
      <SessionProvider session={null}>
        <Login />
      </SessionProvider>
    );

    // Check for heading
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    
    // Check for login button
    expect(screen.getByRole('button', { name: /sign in with onesso/i })).toBeInTheDocument();
  });

  it('calls signIn when the login button is clicked', async () => {
    render(
      <SessionProvider session={null}>
        <Login />
      </SessionProvider>
    );

    const loginButton = screen.getByRole('button', { name: /sign in with onesso/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('onesso', { callbackUrl: '/' });
    });
  });

  it('displays loading state when signing in', async () => {
    // Mock the signIn function to not resolve immediately
    (signIn as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(true), 100);
    }));

    render(
      <SessionProvider session={null}>
        <Login />
      </SessionProvider>
    );

    const loginButton = screen.getByRole('button', { name: /sign in with onesso/i });
    fireEvent.click(loginButton);

    // Check for loading state
    expect(loginButton).toBeDisabled();
    expect(loginButton.textContent).toContain('Signing in');
  });

  it('redirects to home page when already authenticated', async () => {
    // Mock useSession to return authenticated status
    const useSessionMock = jest.requireMock('next-auth/react').useSession;
    useSessionMock.mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    });

    // Mock router
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }));

    render(
      <SessionProvider session={{ user: { name: 'Test User' } }}>
        <Login />
      </SessionProvider>
    );

    // Should redirect to home page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
