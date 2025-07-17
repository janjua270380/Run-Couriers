import  React, { useState, useEffect } from 'react';
import { Copy, CheckCircle, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { getGoogleSheetsSetupCode, getGoogleSheetsSetupInstructions } from '../utils/googleSheetsApi';

interface GoogleSheetIntegrationGuideProps {
  onClose?: () => void;
}

export function GoogleSheetIntegrationGuide({ onClose }: GoogleSheetIntegrationGuideProps) {
  const [scriptId, setScriptId] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load saved script ID from storage
  useEffect(() => {
    const savedScriptId = localStorage.getItem('googleScriptId') || 
                          sessionStorage.getItem('googleScriptId') || 
                          'AKfycbwxxhjbOq3xIOb_nugYbLDepvIUAshaSHuip68K1ChfhGcNTOKykFGvJCduJfMAHQvTcg';
    setScriptId(savedScriptId);
  }, []);

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(getGoogleSheetsSetupCode());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleScriptIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScriptId(e.target.value);
  };

  const saveScriptId = () => {
    localStorage.setItem('googleScriptId', scriptId);
    alert('Script ID saved!');
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      // Generate a cache-busting parameter to prevent caching issues
      const cacheBuster = `cb=${new Date().getTime()}`;
      
      // Direct URL to test connection
      const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec?action=testConnection&${cacheBuster}`;
      
      // Use JDoodle proxy for the request
      const proxyUrl = 'https://hooks.jdoodle.net/proxy';
      const encodedUrl = encodeURIComponent(scriptUrl);
      
      // Create fetch options with no redirect following (mode: 'cors' doesn't work with redirects)
      const response = await fetch(`${proxyUrl}?url=${encodedUrl}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*'
        }
      });
      
      // Check for common error status codes 
      if (response.status === 401 || response.status === 403) {
        setConnectionStatus({
          success: false,
          message: "Authorization required. Please try opening your script URL directly in a browser to authorize it first."
        });
        return;
      }
      
      if (response.status === 404) {
        setConnectionStatus({
          success: false,
          message: "Script not found. Please check your Script ID."
        });
        return;
      }
      
      if (response.status === 500) {
        setConnectionStatus({
          success: false,
          message: "Server error. Please try opening your script URL directly in a browser to authorize it first."
        });
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Handle successful response
      const responseText = await response.text();
      
      // Success could be a JSON response or plain text with "Delivery Booking Web App is active"
      if (responseText.includes('success') || responseText.includes('Delivery Booking Web App is active')) {
        setConnectionStatus({
          success: true,
          message: "Connection successful! Your Google Sheets integration is working properly."
        });
      } else {
        setConnectionStatus({
          success: false,
          message: "Unexpected response format. Please check your script setup."
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus({
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Google Sheets Integration Setup</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">1. Enter your Google Script ID</h3>
        
        <div className="mb-4">
          <label htmlFor="scriptId" className="block text-sm font-medium text-gray-700 mb-1">
            Script ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="scriptId"
              value={scriptId}
              onChange={handleScriptIdChange}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="e.g. AKfycbwXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            />
            <button
              onClick={saveScriptId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            This is the ID from your deployed Google Apps Script web app URL.
          </p>
        </div>
        
        <div className="mb-4">
          <button
            onClick={testConnection}
            disabled={isTestingConnection}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isTestingConnection ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </button>
          
          {connectionStatus && (
            <div className={`mt-3 p-3 rounded-md ${connectionStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {connectionStatus.success ? (
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" />
                  <span>{connectionStatus.message}</span>
                </div>
              ) : (
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-red-500" />
                  <div>
                    <p>{connectionStatus.message}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Tip:</span> When testing the connection, visit this URL directly in your browser first to authorize it. You should see "Delivery Booking Web App is active." as the response.
                    </p>
                    <a 
                      href={`https://script.google.com/macros/s/${scriptId}/exec`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-sm text-red-700 hover:text-red-900"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open script URL directly
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">2. Copy the Google Apps Script Code</h3>
        <p className="mb-3 text-gray-600">
          Copy this code and paste it into your Google Apps Script editor:
        </p>
        
        <div className="relative">
          <div className="absolute right-2 top-2">
            <button
              onClick={copyCodeToClipboard}
              className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-colors flex items-center"
            >
              {isCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Code
                </>
              )}
            </button>
          </div>
          
          <div className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {getGoogleSheetsSetupCode()}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">3. Follow these detailed setup instructions</h3>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: getGoogleSheetsSetupInstructions().replace(/\n/g, '<br>') }} />
          </div>
        </div>
      </div>
      
      {onClose && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
 