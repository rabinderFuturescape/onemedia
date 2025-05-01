import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import Profile from '../page';
import { ToastProvider } from '@/components/ui/Toast';

// Mock API responses
const server = setupServer(
  // Mock user profile data
  rest.get('/api/user/self', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'USER',
        tier: 'PRO',
      })
    );
  }),
  
  // Mock profile update
  rest.patch('/api/user/self', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '123',
        name: req.body.name || 'John Doe',
        email: req.body.email || 'john.doe@example.com',
        role: 'USER',
        tier: 'PRO',
      })
    );
  })
);

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      accessToken: 'mock-token',
    },
    status: 'authenticated',
  })),
}));

// Setup and teardown MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Profile Page Integration', () => {
  it('loads and displays user profile data', async () => {
    render(
      <SessionProvider session={{
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        accessToken: 'mock-token',
      }}>
        <ToastProvider>
          <Profile />
        </ToastProvider>
      </SessionProvider>
    );

    // Check for loading state first
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    // Check that email is displayed
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
  });

  it('updates user profile data', async () => {
    render(
      <SessionProvider session={{
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        accessToken: 'mock-token',
      }}>
        <ToastProvider>
          <Profile />
        </ToastProvider>
      </SessionProvider>
    );

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    // Change name
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Check for loading state
    expect(saveButton).toBeDisabled();

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Override the update endpoint to return an error
    server.use(
      rest.patch('/api/user/self', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Invalid input data',
            errors: {
              name: 'Name is required',
            },
          })
        );
      })
    );

    render(
      <SessionProvider session={{
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        accessToken: 'mock-token',
      }}>
        <ToastProvider>
          <Profile />
        </ToastProvider>
      </SessionProvider>
    );

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    // Change name to empty string
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid input data/i)).toBeInTheDocument();
    });
  });
});
