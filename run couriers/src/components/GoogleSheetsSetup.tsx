import   { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, AlertCircle, Settings, ArrowLeft } from 'lucide-react'; 
import { getGoogleSheetsSetupCode, testGoogleSheetsConnection } from '../utils/googleSheetsApi';

export function GoogleSheetsSetup() {
  const [scriptUrl, setScriptUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetsScriptUrl');
    if (savedUrl) {
      setScriptUrl(savedUrl);
      setIsConnected(true);
    }
  }, []);

   const handleSaveUrl = () => {
    if (scriptUrl.trim()) {
      // Store both the full URL and extract script ID if it's a full URL
      localStorage.setItem('googleSheetsScriptUrl', scriptUrl.trim());
      
      // Extract script ID from URL if it's a full Apps Script URL
      const scriptIdMatch = scriptUrl.match(/\/macros\/s\/([^\/]+)\/exec/);
      if (scriptIdMatch) {
        localStorage.setItem('googleScriptId', scriptIdMatch[1]);
      }
      
      setIsConnected(true);
      setTestResult('URL saved! Please test the connection.');
    }
  };
 

  const handleTestConnection = async () => {
    if (!scriptUrl.trim()) {
      setTestResult('Please enter a script URL first');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testGoogleSheetsConnection();
      setTestResult(result.success ? result.message || 'Connection successful!' : result.error || 'Connection failed');
    } catch (error) {
      setTestResult('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getGoogleSheetsSetupCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
       <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => window.history.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Google Sheets Integration Setup
          </h2>
        </div> 
        <p className="text-gray-600">
          Set up Google Sheets to store your bookings and user data.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Script URL */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Step 1: Enter Your Google Apps Script URL
          </h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                Script URL configured
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Test Connection */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Step 2: Test Connection
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !scriptUrl.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult && (
              <div className={`p-3 rounded-md text-sm ${
                testResult.includes('successful') || testResult.includes('saved')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Setup Instructions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Step 3: Google Apps Script Code
          </h3>
          <p className="text-gray-600 mb-3">
            Copy this code and paste it into your Google Apps Script editor:
          </p>
          <div className="relative">
            <button
              onClick={copyCode}
              className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded-md hover:bg-gray-600 flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs max-h-96">
              {getGoogleSheetsSetupCode()}
            </pre>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Setup Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
            <li>Create a new Google Sheet at <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="underline">sheets.google.com</a></li>
            <li>Go to Extensions → Apps Script</li>
            <li>Delete default code and paste the code above</li>
            <li>Click Save and name your project</li>
            <li>Click Deploy → New deployment</li>
            <li>Choose "Web app" as type</li>
            <li>Set "Execute as" to "Me" and "Who has access" to "Anyone"</li>
            <li>Click Deploy and copy the Web App URL</li>
            <li>Paste the URL above and click Save</li>
            <li>Test the connection</li>
          </ol>
        </div>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Integration Required</span>
            </div>
            <p className="text-yellow-700 text-sm">
              User registration and booking storage require Google Sheets integration to be set up.
              Please complete the setup above to enable these features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
 