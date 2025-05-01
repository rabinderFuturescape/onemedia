# Contributing to Postiz

Thank you for considering contributing to Postiz! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20.x
- npm 9.x
- Docker and Docker Compose
- Git

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/onemedia.git
   cd onemedia
   ```
3. Add the original repository as a remote:
   ```bash
   git remote add upstream https://github.com/rabinderFuturescape/onemedia.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development environment:
   ```bash
   docker-compose up -d
   ```

## Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/your-bugfix-name
   ```

2. Make your changes and commit them with a descriptive commit message:
   ```bash
   git commit -m "feat: add new feature"
   ```
   or
   ```bash
   git commit -m "fix: resolve issue with authentication"
   ```

3. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request from your fork to the original repository

## Pull Request Process

1. Ensure your code follows the [Coding Standards](#coding-standards)
2. Update the documentation if necessary
3. Add tests for your changes
4. Ensure all tests pass
5. Make sure your branch is up to date with the main branch:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
6. Create a pull request with a descriptive title and detailed description
7. Address any feedback from reviewers

## Coding Standards

### General Guidelines

- Follow the [Clean Code](https://github.com/ryanmcdermott/clean-code-javascript) principles
- Write self-documenting code with descriptive variable and function names
- Keep functions small and focused on a single responsibility
- Use TypeScript for type safety
- Follow the folder structure outlined in [FOLDER_STRUCTURE.md](../FOLDER_STRUCTURE.md)

### Frontend Guidelines

- Use functional components with hooks
- Use TypeScript for type safety
- Follow the [React Hooks](https://reactjs.org/docs/hooks-rules.html) rules
- Use CSS modules or Tailwind CSS for styling
- Use Next.js best practices for routing and data fetching

### Backend Guidelines

- Follow the [NestJS](https://docs.nestjs.com/) guidelines
- Use TypeScript for type safety
- Use dependency injection for better testability
- Follow RESTful API design principles
- Use DTOs for request/response validation

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(auth): add support for OAuth 2.0 refresh tokens
```

## Testing Guidelines

### Unit Testing

- Write unit tests for all new features and bug fixes
- Use Jest for testing
- Aim for high test coverage (at least 80%)
- Mock external dependencies

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should call onSubmit when the form is submitted', () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Integration Testing

- Write integration tests for critical flows
- Use Jest and Supertest for backend integration tests
- Use Cypress for frontend integration tests

### End-to-End Testing

- Write end-to-end tests for key user journeys
- Use Cypress for end-to-end testing
- Focus on critical user flows

## Documentation Guidelines

- Update documentation for all new features and changes
- Use clear and concise language
- Include code examples where appropriate
- Follow the [Google Developer Documentation Style Guide](https://developers.google.com/style)

## Issue Reporting

When reporting issues, please include:

1. A clear and descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots or logs (if applicable)
6. Environment information (browser, OS, etc.)

## Feature Requests

When requesting features, please include:

1. A clear and descriptive title
2. A detailed description of the feature
3. The problem it solves
4. Any alternatives you've considered
5. Additional context or screenshots

Thank you for contributing to Postiz!
