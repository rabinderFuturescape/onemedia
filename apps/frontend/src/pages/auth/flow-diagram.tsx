
import { FC } from 'react';
import { AuthFlowDiagram } from '@gitroom/frontend/components/auth/auth-flow-diagram';

const AuthFlowPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Flow Diagram</h1> 
      <div className="mb-4">
        <p className="text-gray-300 mb-2">
          This diagram illustrates the complete authentication flow including:
        </p>
        <ul className="list-disc list-inside text-gray-300 ml-4">
          <li>Local authentication (email/password)</li>
          <li>Social authentication (OAuth providers)</li>
          <li>Wallet authentication (Web3)</li>
          <li>API key authentication</li>
          <li>Middleware processing</li>
          <li>Permission checking</li>
          <li>Error handling</li>
        </ul>
      </div>
      <AuthFlowDiagram />
    </div>
  );
};

export default AuthFlowPage;
