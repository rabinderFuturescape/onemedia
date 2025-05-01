// Mock for next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font-class',
    style: { fontFamily: 'Inter' },
  }),
}));
