import  React, { useState } from 'react'; 
import { User, Users, Play, CheckCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  type: 'customer' | 'worker';
  success: boolean;
  message: string;
  timestamp: Date;
}

export function AccountTestingPanel() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testAccountCreation = async (type: 'customer' | 'worker') => {
    setIsLoading(true);
    
    const testData = {
      type,
      name: `Test ${type} ${Date.now()}`,
      email: `test${type}${Date.now()}@test.com`,
      phone: '+44123456789',
      company: type === 'customer' ? 'Test Company Ltd' : undefined,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('https://hooks.jdoodle.net/proxy?url=https://script.google.com/macros/s/AKfycbxfbaAydzWNLIOYB5fE3Yn9VMn8Qyl_Xt5H5UmWeZ2nWUOCqoJ_M_0FWz7_ziljfhW7Kg/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createAccount',
          ...testData
        })
      });

      const result = await response.text();
      
      setTestResults(prev => [...prev, {
        type,
        success: response.ok,
        message: response.ok ? `${type} account created successfully in Google Sheets` : `Failed: ${result}`,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      setTestResults(prev => [...prev, {
        type,
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-600" />
        Account Creation Testing
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => testAccountCreation('customer')}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 disabled:opacity-50"
        >
          <User className="w-5 h-5 text-blue-600" />
          <span>Test Customer Account</span>
          <Play className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => testAccountCreation('worker')}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 disabled:opacity-50"
        >
          <Users className="w-5 h-5 text-purple-600" />
          <span>Test Worker Account</span>
          <Play className="w-4 h-4" />
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Test Results:</h3>
          {testResults.map((result, index) => (
            <div key={index} className={`flex items-start gap-2 p-3 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{result.type.charAt(0).toUpperCase() + result.type.slice(1)} Test</p>
                <p className="text-sm text-gray-600">{result.message}</p>
                <p className="text-xs text-gray-500">{result.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This will create test accounts in your Google Sheets. Check the "Customers" and "Workers" tabs to verify they appear in the correct locations.
        </p>
      </div>
    </div>
  );
}
 