import   { CheckCircle, ArrowRight, Clock, Truck, Bike, AlertCircle, Database, Package, X } from 'lucide-react'; 
import { Link } from './Link';

interface SuccessMessageProps {
  onReset: () => void;
  bookingId: string;
  vehicleType: 'bike' | 'van' | null;
  parcelCount: number;
}

export function SuccessMessage({ onReset, bookingId, vehicleType, parcelCount }: SuccessMessageProps) {
  // Calculate the time when booking will be confirmed (30 minutes from now)
  const confirmedTime = new Date();
  confirmedTime.setMinutes(confirmedTime.getMinutes() + 30);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800">Booking Request Submitted!</h2>
        
        <div className="flex items-center gap-2 text-blue-600">
          {vehicleType === 'bike' ? (
            <Bike className="w-6 h-6" />
          ) : (
            <Truck className="w-6 h-6" />
          )}
          <span className="font-medium">{parcelCount} {parcelCount === 1 ? 'Parcel' : 'Parcels'}</span>
        </div>
        
        {vehicleType === 'van' && (
          <div className="w-full max-w-md h-40 overflow-hidden rounded-lg">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/7b7ceb4e-9cdc-4cbb-68d6-4d5564a70a00/public"
              alt="Delivery van"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {vehicleType === 'bike' && (
          <div className="w-full max-w-md h-40 overflow-hidden rounded-lg">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/1bdf6e9e-0cc1-43ab-a69d-bdd924148700/public"
              alt="Delivery bike scooter"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        <div className="bg-blue-50 p-4 rounded-md text-left w-full max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-800">Booking Information</h3>
          </div>
          <p className="text-sm text-gray-600">
            Your collection booking has been submitted successfully. <br />
            <span className="font-medium">Booking ID: {bookingId}</span>
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
            <Package className="w-4 h-4" />
            <span>{parcelCount} {parcelCount === 1 ? 'parcel' : 'parcels'} to be collected</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your booking has been saved and can be viewed in your account dashboard.
          </p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-md text-left w-full max-w-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-800">Awaiting Approval</h3>
            <p className="text-sm text-gray-700 mt-1">
              Your booking is currently pending approval from our team. You'll receive confirmation when it's approved.
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md textext-left w-full max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Modification Window</h3>
          </div>
          
          <p className="text-sm text-gray-700 mb-3">
            You can modify or cancel this booking freely until:
            <span className="block font-medium text-blue-800 mt-1">
              {confirmedTime.toLocaleTimeString()} ({confirmedTime.toLocaleDateString()})
            </span>
          </p>
          
          <p className="text-sm text-gray-700">
            After this time, your booking will be automatically confirmed but you will still be able to cancel if needed.
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md text-left w-full max-w-md">
          <h3 className="font-semibold text-gray-800 mb-2">What happens next?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Our admin team will review your booking</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>You'll receive an email once your booking is approved, declined, or outsourced</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                {vehicleType === 'bike' 
                  ? 'Our courier will contact you before collection'
                  : 'Our driver will contact you before arrival'}
              </span>
            </li>
          </ul>
        </div>
        
        <div className="flex gap-4 w-full max-w-md">
          <Link
            to="/bookings"
            className="flex-1 bg-gray-100 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-200 transition-colors"
          >
            View My Bookings
          </Link>
          <button
            onClick={onReset}
            className="flex-1 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            Book Another Collection
          </button>
        </div>
      </div>
    </div>
  );
}
 