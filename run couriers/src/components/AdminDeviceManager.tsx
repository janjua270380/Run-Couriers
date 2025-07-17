import  React, { useState } from 'react';
import { Shield, Monitor, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { getCurrentDeviceFingerprint, getStoredAdminFingerprint, setAdminFingerprint } from '../utils/deviceFingerprint';

interface AdminDeviceManagerProps {
  onClose: () => void;
}

export function AdminDeviceManager({ onClose }: AdminDeviceManagerProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const currentFingerprint = getCurrentDeviceFingerprint();
  const storedFingerprint = getStoredAdminFingerprint();
  const isCurrentDeviceAuthorized = currentFingerprint === storedFingerprint;

  const handleResetDevice = () => {
    setAdminFingerprint(currentFingerprint);
    setShowConfirmReset(false);
    alert('Device authorization updated! This device is now the only authorized device for admin access.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Device Security Manager
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Current Device Status
            </h3>
            <div className="flex items-center gap-2">
              {isCurrentDeviceAuthorized ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Authorized</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">Not Authorized</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Device ID: {currentFingerprint.substring(0, 8)}...
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Security Information</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Admin access is restricted to one device only</li>
              <li>• Device authorization is based on browser fingerprint</li>
              <li>• Only you can authorize new devices</li>
            </ul>
          </div>

          {!isCurrentDeviceAuthorized && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Access Denied
              </h3>
              <p className="text-sm text-red-700">
                This device is not authorized for admin access. If this is your device, 
                you can authorize it below.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {isCurrentDeviceAuthorized ? 'Reset Device Authorization' : 'Authorize This Device'}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-yellow-50 p-3 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ This will make this device the ONLY authorized device for admin access.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Any other previously authorized devices will be deauthorized.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetDevice}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Confirm Authorization
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 