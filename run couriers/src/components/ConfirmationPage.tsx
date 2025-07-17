import  { useState } from 'react';
import { ArrowLeft, Zap, Calendar, Truck, AlertCircle, Bike, Clock, Mail, Phone, FileText, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Address {
  name: string;
  address: string;
  street?: string;
  city?: string;
  town?: string;
  county?: string;
  building?: string;
  postcode: string;
}

interface ConfirmationPageProps {
  collection: Address;
  delivery: Address;
  price: {
    base: number;
    vat: number;
    total: number;
  };
  selectedDate: Date;
  isUrgent: boolean;
  parcelCount: number;
  vehicleType: 'bike' | 'van' | null;
  onIsUrgentChange: (value: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
  isSaving?: boolean;
  error?: string;
}

export function ConfirmationPage({
  collection,
  delivery,
  price,
   selectedDate,
  isUrgent,
  parcelCount,
  vehicleType, 
  onIsUrgentChange,
  onBack,
  onConfirm,
  isSaving,
  error
}: ConfirmationPageProps) {
   const { user } = useAuth();
  
  const normalizedParcelCount = parseInt(parcelCount?.toString()) || 1;
  
  const [contactInfo, setContactInfo] = useState({ 
    email: user?.email || '',
    phone: user?.phone || ''
  });
  
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  const [contactError, setContactError] = useState('');
  
  // Format address function to avoid repetition
  const formatAddress = (address: Address) => {
    const parts = [];
    
    if (address.building) parts.push(address.building);
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.town && address.town !== address.city) parts.push(address.town);
    
    return parts.join(', ');
  };
  
  const handleConfirmClick = () => {
    // Validate contact info
    if (!contactInfo.email.trim()) {
      setContactError('Email address is required');
      return;
    }
    
    if (!contactInfo.phone.trim()) {
      setContactError('Phone number is required');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email.trim())) {
      setContactError('Please enter a valid email address');
      return;
    }
    
    // Basic phone validation
    const phoneRegex = /^[\d\s\+\-\(\)]{7,15}$/;
    if (!phoneRegex.test(contactInfo.phone.trim())) {
      setContactError('Please enter a valid phone number');
      return;
    }
    
    // Store contact info in local storage
    localStorage.setItem('lastContactInfo', JSON.stringify(contactInfo));
    
    // Pass contact info and additional info through a global window property
    // (In a real app we would use a cleaner method)
    window.bookingContactInfo = contactInfo;
    window.bookingAdditionalInfo = additionalInfo;
    
    // Proceed with confirmation
    onConfirm();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isSaving}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Confirm Your Booking
        </h2>
      </div>

           {/* Vehicle type indicator */}
      <div className="bg-blue-100 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          {vehicleType === 'bike' ? (
            <Bike className="w-6 h-6 text-blue-700" />
          ) : (
            <Truck className="w-6 h-6 text-blue-700" />
          )}
          <span className="font-medium text-blue-900">
            {vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
          </span>
        </div>
      </div>
 

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Collection Details</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Name/Department:</span><br />
                {collection.name}
              </p>
              
              <p className="text-sm">
                <span className="font-medium">Postcode:</span><br />
                {collection.postcode}
              </p>
              
              <p className="text-sm">
                <span className="font-medium">Address:</span><br />
                {collection.building ? `${collection.building}, ` : ''}{formatAddress(collection)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Delivery Details</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Name/Department:</span><br />
                {delivery.name}
              </p>
              
              <p className="text-sm">
                <span className="font-medium">Postcode:</span><br />
                {delivery.postcode}
              </p>
              
              <p className="text-sm">
                <span className="font-medium">Address:</span><br />
                {delivery.building ? `${delivery.building}, ` : ''}{formatAddress(delivery)}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
               <div className="p-4 rounded-lg"> 
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            Contact Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="contactEmail"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => {
                    setContactInfo(prev => ({ ...prev, email: e.target.value }));
                    setContactError('');
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSaving}
                  placeholder="For delivery notifications"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="contactPhone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => {
                    setContactInfo(prev => ({ ...prev, phone: e.target.value }));
                    setContactError('');
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSaving}
                  placeholder="For delivery updates"
                />
              </div>
            </div>
            
            {contactError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{contactError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information Section */}
                      <div className="p-4 rounded-lg border border-gray-200"> 
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Additional Information
          </h3> 
          
                   <div className="flex items-start gap-3">
            <div className="flex-1"> 
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (Optional)
              </label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={4}
                disabled={isSaving}
                placeholder="Add any special instructions for the courier or delivery driver. For example: access codes, delivery preferences, package handling instructions, etc."
              ></textarea>
              <p className="mt-1 text-xs text-gray-600">
                This information will be shared with the courier to ensure smooth delivery.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="urgent"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                checked={isUrgent}
                onChange={(e) => onIsUrgentChange(e.target.checked)}
                disabled={isSaving}
              />
              <label htmlFor="urgent" className="flex items-center gap-2 text-sm font-medium text-blue-900">
                <Zap className="w-4 h-4" />
                Urgent Delivery
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Collection Date:</span>
              </p>
              <p className="text-base ml-6">
                {selectedDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-sm text-blue-800 flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Collection Time:</span>
              </p>
              <p className="text-base ml-6">
                {selectedDate.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
              <p className="text-sm text-blue-800 flex items-center gap-2 mt-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Number of Parcels:</span>
              </p>
                           <p className="text-base ml-6">
                {normalizedParcelCount} {normalizedParcelCount === 1 ? 'parcel' : 'parcels'}
              </p> 
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Base Price:</span><br />
                £{price.base.toFixed(2)}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-medium">VAT (20%):</span><br />
                £{price.vat.toFixed(2)}
              </p>
              <p className="text-lg font-bold text-blue-900">
                Total: £{price.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleConfirmClick}
          disabled={isSaving}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
              Saving Booking...
            </>
          ) : (
            <>
              {vehicleType === 'bike' ? (
                <Bike className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
              Confirm and Book Collection
            </>
          )}
        </button>
      </div>
    </div>
  );
}
 