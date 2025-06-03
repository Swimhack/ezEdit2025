import React from 'react';
import SftpTester from '../../components/sftp/SftpTester';

/**
 * SFTP Test Page
 * 
 * This page hosts the SFTP tester component for development and testing purposes.
 */
const SftpTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SFTP Connection Testing</h1>
          <p className="text-gray-600">
            Test SFTP connections and file operations with this utility page.
          </p>
        </div>
        
        <SftpTester />
      </div>
    </div>
  );
};

export default SftpTestPage;
