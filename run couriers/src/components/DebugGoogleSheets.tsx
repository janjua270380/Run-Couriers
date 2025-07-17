export  function DebugGoogleSheets() {
  const checkConfiguration = () => {
    const scriptUrl = localStorage.getItem('googleSheetsScriptUrl');
    const scriptId = localStorage.getItem('googleScriptId');
    
    console.log('Debug Google Sheets Configuration:');
    console.log('Script URL:', scriptUrl);
    console.log('Script ID:', scriptId);
    console.log('Full URL constructed:', scriptId ? `https://script.google.com/macros/s/${scriptId}/exec` : 'No URL');
    
    return {
      scriptUrl,
      scriptId,
      hasConfiguration: !!(scriptUrl || scriptId)
    };
  };

  const config = checkConfiguration();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Google Sheets Debug Information</h2>
      
      <div className="space-y-3">
        <div>
          <strong>Script URL:</strong> {config.scriptUrl || 'Not set'}
        </div>
        <div>
          <strong>Script ID:</strong> {config.scriptId || 'Not set'}
        </div>
        <div>
          <strong>Has Configuration:</strong> {config.hasConfiguration ? 'Yes' : 'No'}
        </div>
        
        {!config.hasConfiguration && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">
              No Google Sheets configuration found. Please set up your Google Apps Script URL in the Setup page.
            </p>
          </div>
        )}
        
        {config.hasConfiguration && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700">
              Configuration found. If bookings aren't saving, check your Apps Script deployment.
            </p>
          </div>
        )}
      </div>
      
      <button
        onClick={checkConfiguration}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Refresh Debug Info
      </button>
    </div>
  );
}
 