import  { useState } from 'react';
import { User, Shield, Users, Mail, Phone, Building, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { registerViaGoogleSheets, authenticateViaGoogleSheets, fetchUsersFromGoogleSheets } from '../utils/googleSheetsApi';

export function TestRegistration() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testData] = useState({
    customer: {
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'testpass123',
      phone: '123-456-7890',
      company: 'Test Company Ltd',
      accountType: 'customer'
    },
    admin: {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'adminpass123',
      phone: '098-765-4321',
      company: 'Admin Company',
      accountType: 'admin'
    },
    worker: {
      name: 'Test Worker',
      email: 'worker@test.com',
      password: 'workerpass123',
      phone: '555-123-4567',
      company: 'Worker Company',
      accountType: 'worker',
      workerPermissions: {
        canViewBookings: true,
        canManageJobs: true,
        canViewCustomers: true
      }
    }
  });

  const addTestResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, success, message, data, timestamp: new Date().toLocaleString() }]);
  };

  const runRegistrationTest = async (userType: 'customer' | 'admin' | 'worker') => {
    setIsLoading(true);
    const userData = testData[userType];
    
    try {
      addTestResult(`${userType} Registration`, true, `Starting ${userType} registration test...`);
      
      const result = await registerViaGoogleSheets(userData);
      
      if (result.success) {
        addTestResult(`${userType} Registration`, true, `Successfully registered ${userType}`, { userId: result.userId });
        
        // Test authentication
        const authResult = await authenticateViaGoogleSheets(userData.email, userData.password);
        
        if (authResult.success) {
          addTestResult(`${userType} Authentication`, true, `Successfully authenticated ${userType}`, authResult.user);
        } else {
          addTestResult(`${userType} Authentication`, false, `Authentication failed: ${authResult.error}`);
        }
      } else {
        addTestResult(`${userType} Registration`, false, `Registration failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`${userType} Registration`, false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    setIsLoading(false);
  };

  const testFetchUsers = async () => {
    setIsLoading(true);
    
    try {
      addTestResult('Fetch Users', true, 'Starting user fetch test...');
      
      const result = await fetchUsersFromGoogleSheets();
      
      if (result.success) {
        addTestResult('Fetch Users', true, `Successfully fetched ${result.users?.length || 0} users`, result.users);
      } else {
        addTestResult('Fetch Users', false, `Failed to fetch users: ${result.error}`);
      }
    } catch (error) {
      addTestResult('Fetch Users', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          Registration System Test
        </h2>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Test Instructions</h3>
        <p className="text-sm text-blue-700">
          This tool tests the registration system to ensure accounts are created in the correct Google Sheets tabs.
          Before running tests, make sure your Google Apps Script is deployed and the Script URL is configured.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => runRegistrationTest('customer')}
          disabled={isLoading}
          className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 disabled:opacity-50"
        >
          <User className="w-8 h-8 text-green-600 mb-2" />
          <span className="font-medium text-green-800">Test Customer</span>
          <span className="text-xs text-green-600">Registration</span>
        </button>

        <button
          onClick={() => runRegistrationTest('admin')}
          disabled={isLoading}
          className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 disabled:opacity-50"
        >
          <Shield className="w-8 h-8 text-red-600 mb-2" />
          <span className="font-medium text-red-800">Test Admin</span>
          <span className="text-xs text-red-600">Registration</span>
        </button>

        <button
          onClick={() => runRegistrationTest('worker')}
          disabled={isLoading}
          className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 disabled:opacity-50"
        >
          <Users className="w-8 h-8 text-purple-600 mb-2" />
          <span className="font-medium text-purple-800">Test Worker</span>
          <span className="text-xs text-purple-600">Registration</span>
        </button>

        <button
          onClick={testFetchUsers}
          disabled={isLoading}
          className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 disabled:opacity-50"
        >
          <Building className="w-8 h-8 text-blue-600 mb-2" />
          <span className="font-medium text-blue-800">Fetch Users</span>
          <span className="text-xs text-blue-600">From Sheets</span>
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Test Results</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.success)}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-800">{result.test}</h4>
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View Data
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Running tests...</span>
        </div>
      )}
    </div>
  );
}
 