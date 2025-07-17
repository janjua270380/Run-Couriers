import  React, { useState } from 'react';
import { AlertCircle, CheckCircle, Database, Play } from 'lucide-react';

export function GoogleSheetsDebugPanel() {
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testRegistration = async () => {
    setIsLoading(true);
    const testUser = {
      id: `test_${Date.now()}`,
      name: 'Test User Debug',
      email: `debug${Date.now()}@test.com`,
      password: 'testpass123',
      company: 'Debug Company',
      phone: '+44123456789',
      accountType: 'customer'
    };

    try {
      const scriptUrl = localStorage.getItem('googleSheetsScriptUrl') || 
                       (localStorage.getItem('googleScriptId') ? 
                        `https://script.google.com/macros/s/${localStorage.getItem('googleScriptId')}/exec` : '');
      
      if (!scriptUrl) {
        throw new Error('No Google Sheets script URL configured');
      }

      console.log('Testing with URL:', scriptUrl);
      console.log('Test data:', testUser);

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
          action: 'register',
          ...testUser
        }),
        redirect: 'follow'
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        result = { error: 'Invalid JSON response', rawResponse: responseText };
      }

      setDebugResults(prev => [...prev, {
        timestamp: new Date().toLocaleString(),
        success: response.ok && result.result === 'success',
        status: response.status,
        result,
        testData: testUser
      }]);

    } catch (error) {
      console.error('Debug test error:', error);
      setDebugResults(prev => [...prev, {
        timestamp: new Date().toLocaleString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testData: testUser
      }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Database className="w-5 h-5 text-purple-600" />
        Google Sheets Debug Panel
      </h2>
      
      <button
        onClick={testRegistration}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
      >
        <Play className="w-4 h-4" />
        Test Registration
      </button>

      <div className="mt-6 space-y-4">
        {debugResults.map((debug, index) => (
          <div key={index} className={`p-4 rounded-lg border ${debug.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-2">
              {debug.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{debug.timestamp}</p>
                <p className="text-sm text-gray-600">Status: {debug.status || 'Error'}</p>
                
                {debug.result && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">Response Details</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(debug.result, null, 2)}
                    </pre>
                  </details>
                )}
                
                {debug.error && (
                  <p className="text-sm text-red-600 mt-1">Error: {debug.error}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 