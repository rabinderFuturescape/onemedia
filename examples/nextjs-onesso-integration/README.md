# Next.js onesso Integration Example

This is a simple example of how to integrate the onesso authentication service with a Next.js application.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

This example demonstrates:

1. **Login with onesso**: Redirecting to the onesso authentication service for login.
2. **Token Handling**: Processing the token received after successful authentication.
3. **User Information**: Fetching and displaying user information using the token.
4. **Logout**: Clearing the token and user state.

## Integration Points

- **Login**: The application redirects to `http://localhost:3002/api/auth/login/onesso` for authentication.
- **Token Handling**: After successful authentication, the onesso service redirects back to the application with a token in the URL.
- **User Information**: The application uses the token to fetch user information from `http://localhost:3002/api/auth/me`.

## Configuration

You can configure the onesso service URL by modifying the following variables in the code:

- `ONESSO_URL`: The base URL of the onesso service (default: `http://localhost:3002`).
- `ONESSO_LOGIN_ENDPOINT`: The endpoint for login (default: `/api/auth/login/onesso`).
- `ONESSO_USER_INFO_ENDPOINT`: The endpoint for fetching user information (default: `/api/auth/me`).

## Next Steps

- Add role-based access control
- Implement multi-tenancy support
- Add token refresh functionality
- Enhance error handling
