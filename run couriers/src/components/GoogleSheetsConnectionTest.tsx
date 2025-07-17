import  React, { useState } from 'react';
import { testGoogleSheetsConnection, saveBookingToGoogleSheets } from '../utils/googleSheetsApi';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface GoogleSheetsConnectionTestProps {
  onClose: () => void;
}

export function GoogleSheetsConnectionTest({ onClose }: GoogleSheetsConnectionTestProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingBooking, setIsTestingBooking] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [bookingResult, setBookingResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);
    
    try {
      const result = await testGoogleSheetsConnection();
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({
        success: false,
        error: `Connection test failed: ${(error as Error).message}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestBooking = async () => {
    setIsTestingBooking(true);
    setBookingResult(null);
    
    try {
      const testBooking = {
        bookingId: `test_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        collectionName: "Test Collection",
        collectionAddress: "123 Test Street",
        collectionPostcode: "SW1A 1AA",
        deliveryName: "Test Delivery", 
        deliveryAddress: "456 Test Avenue",
        deliveryPostcode: "SW1A 2BB",
        date: new Date().toLocaleDateString(),
        deliveryTime: "10:00",
        isUrgent: false,
        vehicleType: "van",
        parcelCount: 1,
        basePrice: "10.00",
        vat: "2.00",
        totalPrice: "12.00",
        userId: "test_user",
        status: "test",
        contactEmail: "test@example.com",
        contactPhone: "01234567890",
        additionalInfo: "This is a test booking - you can delete this row"
      };
      
      const result = await saveBookingToGoogleSheets(testBooking);
      setBookingResult(result);
    } catch (error) {
      setBookingResult({
        success: false,
        error: `Booking test failed: ${(error as Error).message}`
      });
    } finally {
      setIsTestingBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Google Sheets Connection Test
        </h2>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isTestingConnection ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                "Test Connection"
              )}
            </button>
            
            {connectionResult && (
              <div className={`mt-2 p-3 rounded-md ${connectionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <p className={connectionResult.success ? 'text-green-800' : 'text-red-800'}>
                      {connectionResult.success ? connectionResult.message : connectionResult.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleTestBooking}
              disabled={isTestingBooking || !connectionResult?.success}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isTestingBooking ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                "Test Booking Save"
              )}
            </button>
            
            {bookingResult && (
              <div className={`mt-2 p-3 rounded-md ${bookingResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {bookingResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <p className={bookingResult.success ? 'text-green-800' : 'text-red-800'}>
                      {bookingResult.success ? 'Test booking saved successfully!' : bookingResult.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
 