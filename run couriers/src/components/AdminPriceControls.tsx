import  { useState, useEffect } from 'react';
import { Database, Save, CreditCard, AlertTriangle, Sliders, Truck, Bike, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminPriceControls({ onBack }: { onBack: () => void }) {
  const [prices, setPrices] = useState({
    baseRateVan: 3.20,
    baseRateBike: 2.80,
    londonMultiplier: 1.20,
    urgentMultiplier: 1.50,
    vatRate: 0.20,
    bikeDistanceLimit: 30,
    bikeMinimumCharge: 6.50
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  
  const { isAdmin, isWorker, workerPermissions } = useAuth();
  const canEdit = isAdmin || (isWorker && workerPermissions?.managePricing);

  // Load stored prices on component mount
  useEffect(() => {
    const storedPrices = localStorage.getItem('deliveryPrices');
    if (storedPrices) {
      setPrices(JSON.parse(storedPrices));
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Format values to ensure precision to pence/penny level
      const formattedPrices = {
        baseRateVan: parseFloat(prices.baseRateVan.toFixed(2)),
        baseRateBike: parseFloat(prices.baseRateBike.toFixed(2)),
        londonMultiplier: parseFloat(prices.londonMultiplier.toFixed(2)),
        urgentMultiplier: parseFloat(prices.urgentMultiplier.toFixed(2)),
        vatRate: parseFloat(prices.vatRate.toFixed(3)),
        bikeDistanceLimit: parseFloat(prices.bikeDistanceLimit.toFixed(1)),
        bikeMinimumCharge: parseFloat(prices.bikeMinimumCharge.toFixed(2))
      };
      
      // Save to localStorage with precise values
      localStorage.setItem('deliveryPrices', JSON.stringify(formattedPrices));
      
      // Update state with formatted values
      setPrices(formattedPrices);
      
      // Simulate network delay
      setTimeout(() => {
        setSaveStatus({ success: 'Pricing settings updated successfully' });
        setIsSaving(false);
      }, 800);
    } catch (error) {
      setSaveStatus({ error: 'Failed to save pricing settings' });
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (!canEdit) return;
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setPrices(prev => ({
        ...prev,
        [field]: numericValue
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-green-600" />
            Pricing Control Panel
          </h2>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <div className="flex items-start gap-2 text-blue-800">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {isAdmin ? 'Admin-Only Access' : 'Worker Access'}
            </p>
            <p className="text-sm mt-1">
              {canEdit 
                ? 'These pricing settings affect all new delivery calculations. Changes will apply immediately to new quotes but won\'t affect existing bookings. Prices can be set down to penny precision.'
                : 'You can view pricing settings, but only administrators can modify them.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Van Delivery Rates</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="baseRateVan" className="block text-sm font-medium text-gray-700 mb-1">
                Base Rate per Mile (£)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  id="baseRateVan"
                  step="0.01"
                  min="0"
                  className={`block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${canEdit ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'}`}
                  value={prices.baseRateVan}
                  onChange={(e) => handleInputChange('baseRateVan', e.target.value)}
                  disabled={!canEdit}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">/mile</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Current setting: £{prices.baseRateVan.toFixed(2)}/mile</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Bike className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Bike Courier Rates</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="baseRateBike" className="block text-sm font-medium text-gray-700 mb-1">
                Base Rate per Mile (£)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  id="baseRateBike"
                  step="0.01"
                  min="0"
                  className={`block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${canEdit ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'}`}
                  value={prices.baseRateBike}
                  onChange={(e) => handleInputChange('baseRateBike', e.target.value)}
                  disabled={!canEdit}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">/mile</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Current setting: £{prices.baseRateBike.toFixed(2)}/mile</p>
            </div>

            <div>
              <label htmlFor="bikeMinimumCharge" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Charge (£)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  id="bikeMinimumCharge"
                  step="0.01"
                  min="0"
                  className={`block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${canEdit ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'}`}
                  value={prices.bikeMinimumCharge}
                  onChange={(e) => handleInputChange('bikeMinimumCharge', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum charge: £{prices.bikeMinimumCharge.toFixed(2)}</p>
            </div>

            <div>
              <label htmlFor="bikeDistanceLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Distance (miles)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="bikeDistanceLimit"
                  step="0.1"
                  min="0"
                  className={`block w-full pr-12 sm:text-sm border-gray-300 rounded-md ${canEdit ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'}`}
                  value={prices.bikeDistanceLimit}
                  onChange={(e) => handleInputChange('bikeDistanceLimit', e.target.value)}
                  disabled={!canEdit}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">miles</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Maximum bike delivery distance: {prices.bikeDistanceLimit.toFixed(1)} miles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Pricing Modifiers</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="urgentMultiplier" className="block text-sm font-medium text-gray-700 mb-1">
                Urgent Delivery Multiplier
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="urgentMultiplier"
                  step="0.01"
                  min="1"
                  className={`block w-full sm:text-sm border-gray-300 rounded-md ${canEdit ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'}`}
                  value={prices.urgentMultiplier}
                  onChange={(e) => handleInputChange('urgentMultiplier', e.target.value)}
                  disabled={!canEdit}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">x</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Current setting: {prices.urgentMultiplier.toFixed(2)}x (50% surcharge = 1.50)</p>
            </div>

            <div>
              <label htmlFor="londonMultiplier" className="block text-sm font-medium text-gray-700 mb-1">
                London Area Multiplier
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="londonMultiplier"
                  step="0.01"
                  min="1"
                  className={`block w-full sm:text-sm border-gray-300 rounded-md ${canEdit ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'}`}
                  value={prices.londonMultiplier}
                  onChange={(e) => handleInputChange('londonMultiplier', e.target.value)}
                  disabled={!canEdit}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">x</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Current setting: {prices.londonMultiplier.toFixed(2)}x (20% surcharge = 1.20)</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Tax Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 mb-1">
                VAT Rate
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="vatRate"
                  step="0.001"
                  min="0"
                  max="1"
                  className={`block w-full pr-12 sm:text-sm border-gray-300 rounded-md ${canEdit ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50'}`}
                  value={prices.vatRate}
                  onChange={(e) => handleInputChange('vatRate', e.target.value)}
                  disabled={!canEdit}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {(prices.vatRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Current VAT rate: {(prices.vatRate * 100).toFixed(1)}% (0.200 = 20%)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Price Calculation Formula</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><span className="font-medium">Base Price</span> = Distance (miles) × Base Rate (£/mile)</p>
          <p>If delivery is in London, <span className="font-medium">Base Price</span> × London Multiplier</p>
          <p>If urgent delivery, <span className="font-medium">Base Price</span> × Urgent Multiplier</p>
          <p><span className="font-medium">VAT</span> = Base Price × VAT Rate</p>
          <p><span className="font-medium">Total Price</span> = Base Price + VAT</p>
          <p className="text-green-600 font-medium mt-2">All prices are calculated to penny precision.</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
               <div className="flex justify-end items-center">
          <div className="flex gap-3"> 
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={isSaving || !canEdit}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Pricing Settings
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        {saveStatus && (
          <div className={`mt-4 p-3 rounded-md ${saveStatus.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            <p className="text-sm">{saveStatus.error || saveStatus.success}</p>
          </div>
        )}
        
        {!canEdit && (
          <div className="mt-4 p-3 rounded-md bg-yellow-50 text-yellow-700">
            <p className="text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              You have read-only access to pricing settings. Contact an administrator to make changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
 