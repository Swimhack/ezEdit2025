import React from 'react';
import IntegrationTester from '../../components/integration-test/IntegrationTester';

/**
 * Integration Test Page
 * 
 * Page for testing SFTP client and LLM integrations
 */
const IntegrationTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <IntegrationTester />
      </div>
    </div>
  );
};

export default IntegrationTestPage;
