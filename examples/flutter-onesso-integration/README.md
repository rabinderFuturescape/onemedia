# Flutter onesso Integration Example

This is a simple example of how to integrate the onesso authentication service with a Flutter application.

## Getting Started

1. Install dependencies:

```bash
flutter pub get
```

2. Run the application:

```bash
flutter run
```

## How It Works

This example demonstrates:

1. **Login with onesso**: Redirecting to the onesso authentication service for login.
2. **Token Handling**: Processing the token received after successful authentication.
3. **User Information**: Fetching and displaying user information using the token.
4. **Logout**: Clearing the token and user state.
5. **Deep Linking**: Handling deep links for mobile applications.

## Integration Points

- **Login**: The application redirects to `http://localhost:3002/api/auth/login/onesso` for authentication.
- **Token Handling**: After successful authentication, the onesso service redirects back to the application with a token in the URL.
- **User Information**: The application uses the token to fetch user information from `http://localhost:3002/api/auth/me`.
- **Token Storage**: The token is stored in SharedPreferences for persistence.

## Configuration

You can configure the onesso service URL by modifying the `_onessoBaseUrl` variable in the code.

## Deep Linking Setup

For mobile applications, you need to set up deep linking to handle the redirect from the onesso service:

### Android

Add the following to your `android/app/src/main/AndroidManifest.xml` file:

```xml
<activity
    android:name=".MainActivity"
    ...>
    <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
    </intent-filter>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="onesso"
            android:host="login" />
    </intent-filter>
</activity>
```

### iOS

Add the following to your `ios/Runner/Info.plist` file:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLName</key>
        <string>com.example.flutterOnessoIntegration</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>onesso</string>
        </array>
    </dict>
</array>
```

## Next Steps

- Add role-based access control
- Implement multi-tenancy support
- Add token refresh functionality
- Enhance error handling
- Implement biometric authentication for token access
