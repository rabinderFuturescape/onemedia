import { FC, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  flowchart: {
    curve: 'basis',
    padding: 20,
  },
  themeVariables: {
    primaryColor: '#ff69b4',
    primaryTextColor: '#fff',
    primaryBorderColor: '#333',
    lineColor: '#fff',
    secondaryColor: '#bbbbff',
    tertiaryColor: '#ff6666',
    successColor: '#66ff66',
  },
});

const authFlowDiagram = `
flowchart TB
    Start((Start)) --> UserInput{Authentication Type}

    %% Local Authentication
    UserInput -->|Local| LocalAuth[Email/Password Input]
    LocalAuth --> BackendProxy[Backend Proxy]
    BackendProxy --> AuthService[Auth Microservice]
    AuthService --> ValidateLocal{Validate Credentials}
    ValidateLocal -->|Invalid| ErrorLocal[Return Error]
    ValidateLocal -->|Valid| GenerateTokens[Generate JWT Tokens]

    %% Social Authentication
    UserInput -->|Social| SocialAuth[Select Provider]
    SocialAuth --> BackendProxy
    BackendProxy --> AuthService
    AuthService --> OAuthFlow{OAuth Flow}
    OAuthFlow -->|Generate URL| RedirectOAuth[Redirect to Provider]
    RedirectOAuth --> HandleCallback[Handle OAuth Callback]
    HandleCallback --> ValidateCallback{Validate Response}
    ValidateCallback -->|Invalid| ErrorSocial[Return Error]
    ValidateCallback -->|Valid| ExchangeToken[Exchange Code for Token]
    ExchangeToken --> FetchUserInfo[Fetch User Info]

    %% Wallet Authentication
    UserInput -->|Wallet| WalletAuth[Connect Wallet]
    WalletAuth --> BackendProxy
    BackendProxy --> AuthService
    AuthService --> GenerateChallenge[Generate Challenge]
    GenerateChallenge --> SignMessage[Sign Message]
    SignMessage --> VerifySignature{Verify Signature}
    VerifySignature -->|Invalid| ErrorWallet[Return Error]
    VerifySignature -->|Valid| ValidateWallet[Validate Wallet]

    %% API Key Authentication
    UserInput -->|API Key| APIAuth[API Key Input]
    APIAuth --> BackendProxy
    BackendProxy --> AuthService
    AuthService --> ValidateAPIKey{Validate Key}
    ValidateAPIKey -->|Invalid| ErrorAPI[Return Error]
    ValidateAPIKey -->|Valid| CheckScope[Check API Scope]

    %% Common Flow
    GenerateTokens --> StoreUser[Store/Update User]
    FetchUserInfo --> StoreUser
    ValidateWallet --> StoreUser
    CheckScope --> StoreUser

    StoreUser --> CreateSession[Create Session]
    CreateSession --> SetCookies[Set Secure Cookies]
    SetCookies --> ReturnToBackend[Return to Backend]
    ReturnToBackend --> ReturnResponse[Return Response to Client]

    %% Error Handling
    ErrorLocal --> ErrorHandler[Error Handler]
    ErrorSocial --> ErrorHandler
    ErrorWallet --> ErrorHandler
    ErrorAPI --> ErrorHandler
    ErrorHandler --> LogError[Log Error]
    LogError --> ReturnErrorToBackend[Return Error to Backend]
    ReturnErrorToBackend --> ReturnErrorResponse[Return Error Response to Client]

    %% Middleware
    ReturnResponse --> AuthMiddleware{Auth Middleware}
    AuthMiddleware --> TokenValidation[Token Validation]
    TokenValidation --> AuthService
    AuthService --> ValidateToken{Validate Token}
    ValidateToken -->|Invalid| ReturnInvalid[Return Invalid]
    ReturnInvalid --> Unauthorized[Return 401]
    ValidateToken -->|Valid| ReturnValid[Return Valid]
    ReturnValid --> PermissionCheck{Check Permissions}
    PermissionCheck -->|Allowed| AccessGranted[Grant Access]
    PermissionCheck -->|Denied| Forbidden[Return 403]

    classDef process fill:#f9f,stroke:#333,stroke-width:2px
    classDef condition fill:#bbf,stroke:#333,stroke-width:2px
    classDef error fill:#f66,stroke:#333,stroke-width:2px
    classDef success fill:#6f6,stroke:#333,stroke-width:2px
    classDef service fill:#bbffbb,stroke:#333,stroke-width:2px

    class Start,ReturnResponse,AccessGranted success
    class UserInput,ValidateLocal,OAuthFlow,ValidateCallback,VerifySignature,ValidateAPIKey,AuthMiddleware,PermissionCheck,ValidateToken condition
    class ErrorLocal,ErrorSocial,ErrorWallet,ErrorAPI,Unauthorized,Forbidden error
    class LocalAuth,SocialAuth,WalletAuth,APIAuth,GenerateTokens,StoreUser,CreateSession,SetCookies process
    class AuthService,BackendProxy service
`;

export const AuthFlowDiagram: FC = () => {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (diagramRef.current) {
      mermaid.render('auth-flow-diagram', authFlowDiagram).then((result) => {
        if (diagramRef.current) {
          diagramRef.current.innerHTML = result.svg;
        }
      });
    }
  }, []);

  return (
    <div className="w-full overflow-x-auto bg-customColor32 p-4 rounded-lg">
      <div
        ref={diagramRef}
        className="min-w-[1000px]"
      />
    </div>
  );
};