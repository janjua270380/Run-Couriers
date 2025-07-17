import  { useEffect, useState, useRef } from 'react';
import { useMap } from '../context/MapContext';
import  { AlertCircle, MapPin, User, Home, Truck, Building, ArrowRight, Calendar, Clock, X } from 'lucide-react'; 
import { ConfirmationPage } from './ConfirmationPage';
import { saveBooking } from '../utils/storage';
import { SuccessMessage } from './SuccessMessage';
import { useAuth } from '../context/AuthContext';
import { Address, Price } from '../types';
import { VehicleSelector } from './VehicleSelector';
import { InlineCalendar } from './InlineCalendar';

interface PricingCalculatorProps {
  onNeedLogin: () => void;
  onNeedRegister: () => void;
  onPriceUpdate: (price: Price, isUrgent: boolean) => void;
}

export function PricingCalculator({ onNeedLogin, onNeedRegister, onPriceUpdate }: PricingCalculatorProps) {
  const [collection, setCollection] = useState<Address>({ 
    name: '', 
    address: '', 
    street: '',
    city: '',
    town: '',
    county: '',
    building: '',
    postcode: '' 
  });
  
  const [delivery, setDelivery] = useState<Address>({ 
    name: '', 
    address: '', 
    street: '',
    city: '',
    town: '',
    county: '',
    building: '',
    postcode: '' 
  });
  
   const [price, setPrice] = useState<Price>({ base: 0, vat: 0, total: 0 }); 
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [parcelCount, setParcelCount] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [vehicleType, setVehicleType] = useState<'bike' | 'van' | null>(null);
  
  // For price configuration
  const [priceSettings, setPriceSettings] = useState({
    baseRateVan: 3.20,
    baseRateBike: 2.80,
    londonMultiplier: 1.20,
    urgentMultiplier: 1.50,
    vatRate: 0.20,
    bikeDistanceLimit: 30,
    bikeMinimumCharge: 6.50
  });
  
  // For autocomplete setup
  const collectionPostcodeRef = useRef<HTMLInputElement>(null);
  const deliveryPostcodeRef = useRef<HTMLInputElement>(null);
  
  const autocompleteCollectionPostcode = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteDeliveryPostcode = useRef<google.maps.places.Autocomplete | null>(null);

  const { calculateRoute } = useMap();
  const { user, isAuthenticated } = useAuth();

   // Send price update to parent component whenever price or isUrgent changes
  useEffect(() => {
    onPriceUpdate(price, isUrgent);
  }, [price.total, isUrgent]); 

  // Load price settings from localStorage
  useEffect(() => {
    const storedPrices = localStorage.getItem('deliveryPrices');
    if (storedPrices) {
      setPriceSettings(JSON.parse(storedPrices));
    }
  }, []);

   // Initialize Google Maps Places Autocomplete for postcodes
  useEffect(() => {
    const initializeAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          // Clean up existing autocomplete instances
          if (autocompleteCollectionPostcode.current) {
            google.maps.event.clearInstanceListeners(autocompleteCollectionPostcode.current);
          }
          if (autocompleteDeliveryPostcode.current) {
            google.maps.event.clearInstanceListeners(autocompleteDeliveryPostcode.current);
          }

          // For collection postcode
          if (collectionPostcodeRef.current) {
            autocompleteCollectionPostcode.current = new google.maps.places.Autocomplete(
              collectionPostcodeRef.current,
              { 
                componentRestrictions: { country: "gb" },
                types: ["geocode"]
              }
            );
            
            autocompleteCollectionPostcode.current.addListener("place_changed", () => {
              setTimeout(() => handlePostcodeSelected('collection'), 100);
            });
          }
          
          // For delivery postcode
          if (deliveryPostcodeRef.current) {
            autocompleteDeliveryPostcode.current = new google.maps.places.Autocomplete(
              deliveryPostcodeRef.current,
              { 
                componentRestrictions: { country: "gb" },
                types: ["geocode"]
              }
            );
            
            autocompleteDeliveryPostcode.current.addListener("place_changed", () => {
              setTimeout(() => handlePostcodeSelected('delivery'), 100);
            });
          }
        } catch (e) {
          console.error("Error initializing Google Places Autocomplete:", e);
        }
      }
    };

    // Add delay to ensure Google Maps is fully loaded
    const timer = setTimeout(initializeAutocomplete, 500);
    
    return () => clearTimeout(timer);
  }, []); 

   // Handle postcode selection
  const handlePostcodeSelected = (type: 'collection' | 'delivery') => {
    try {
      const autocomplete = type === 'collection' 
        ? autocompleteCollectionPostcode.current 
        : autocompleteDeliveryPostcode.current;
      
      if (!autocomplete) {
        console.log('Autocomplete not available');
        return;
      }
      
      const place = autocomplete.getPlace();
      console.log('Place selected:', place);
      
      if (!place || !place.address_components) {
        console.log('No place or address components found');
        return;
      } 
      
      // Extract postcode and other address components
      let postcode = '';
      let street = '';
      let city = '';
      let town = '';
      let county = '';
      let building = '';
      
      // Extract components
      place.address_components.forEach(component => {
        if (component.types.includes("postal_code")) {
          postcode = component.long_name;
        } else if (component.types.includes("route")) {
          street = component.long_name;
        } else if (component.types.includes("locality")) {
          city = component.long_name;
        } else if (component.types.includes("postal_town")) {
          town = component.long_name;
        } else if (component.types.includes("administrative_area_level_2")) {
          county = component.long_name;
        } else if (component.types.includes("premise") || component.types.includes("street_number")) {
          building = component.long_name;
        }
      });
      
      // If no street was found but we have a formatted address, extract a reasonable value
      if (!street && place.formatted_address) {
        const parts = place.formatted_address.split(',');
        if (parts.length > 1) {
          // The first part might be the street or building+street
          street = parts[0].trim();
        }
      }
      
      // Create a copy of the current state to modify
      const updatedAddress = type === 'collection' ? {...collection} : {...delivery};
      
      // Update only address-related fields, preserving the name
      updatedAddress.postcode = postcode;
      updatedAddress.address = building ? `${building} ${street}`.trim() : street;
      updatedAddress.street = street;
      updatedAddress.city = city;
      updatedAddress.town = town;
      updatedAddress.county = county;
      updatedAddress.building = building;
      
      // Update state with the modified copy
      if (type === 'collection') {
        setCollection(updatedAddress);
      } else {
        setDelivery(updatedAddress);
      }

           // Price will be calculated automatically by useEffect 
    } catch (e) {
      console.error("Error handling postcode selection:", e);
    }
  };

   const shouldCalculatePrice = () => {
    return (
      vehicleType !== null && 
      collection.postcode !== '' && 
      delivery.postcode !== '' &&
      collection.name !== '' &&
      delivery.name !== '' &&
      collection.address !== '' &&
      delivery.address !== ''
    );
  }; 

   const calculatePrice = async () => {
    if (!shouldCalculatePrice()) {
      setPrice({ base: 0, vat: 0, total: 0 });
      return;
    } 
    
    setIsCalculating(true);
    setError('');

    try {
      // Properly format addresses for better results
      const formatAddress = (addr: Address) => {
        const parts = [];
        
        if (addr.building) parts.push(addr.building);
        if (addr.address) parts.push(addr.address);
        if (addr.city) parts.push(addr.city);
        if (addr.town && addr.town !== addr.city) parts.push(addr.town);
        
        // Add UK if not already mentioned
        const addressStr = parts.join(', ');
        if (!addressStr.toLowerCase().includes('uk') && 
            !addressStr.toLowerCase().includes('united kingdom')) {
          return `${addressStr}, ${addr.postcode}, UK`;
        }
        
        return `${addressStr}, ${addr.postcode}`;
      };
      
      const collectionAddress = formatAddress(collection);
      const deliveryAddress = formatAddress(delivery);
      
      // In case only postcodes are available
      const fallbackCollectionAddress = collection.postcode + ", UK";
      const fallbackDeliveryAddress = delivery.postcode + ", UK";
      
      // Try with full address first
      let distance = 0;
      try {
        distance = await calculateRoute(collectionAddress, deliveryAddress);
      } catch (err) {
        console.warn('Error with full addresses, trying with postcodes only:', err);
        try {
          // Fallback to postcodes only
          distance = await calculateRoute(fallbackCollectionAddress, fallbackDeliveryAddress);
        } catch (postcodeErr) {
          console.error('Error with postcode addresses:', postcodeErr);
          // Continue with distance=0, we'll use default pricing below
        }
      }

      if (distance === 0) {
        console.warn('Could not calculate exact route, using estimated pricing');
        // Instead of showing an error, we'll proceed with default pricing
        // This ensures a better user experience even if route calculation fails
      }

      const miles = distance * 0.000621371;
      // Base rate depends on vehicle type and settings from admin
      const baseRate = vehicleType === 'bike' ? priceSettings.baseRateBike : priceSettings.baseRateVan;
      
      // If distance is 0 (calculation failed), use an estimated distance
      const estimatedMiles = 25; // A reasonable assumption for UK delivery
      let basePrice = miles > 0 ? miles * baseRate : estimatedMiles * baseRate;

      // Apply vehicle-specific adjustments
      if (vehicleType === 'bike') {
        // Bike delivery has a minimum charge
        basePrice = Math.max(basePrice, priceSettings.bikeMinimumCharge);
        // And a maximum distance cap
        if (miles > priceSettings.bikeDistanceLimit) {
          setError(`Bike delivery is only available for distances under ${priceSettings.bikeDistanceLimit} miles. Please select Delivery Van for longer distances.`);
          setVehicleType('van');
          // Recalculate with van pricing
          basePrice = miles * priceSettings.baseRateVan;
        }
      }

      if (isUrgent) {
        basePrice *= priceSettings.urgentMultiplier;
      }

      // London postcodes check
      const londonPostcodes = ['EC', 'WC', 'E', 'SE', 'SW', 'W', 'N', 'NW'];
      const collPrefix = collection.postcode?.slice(0, 2).toUpperCase() || '';
      const delPrefix = delivery.postcode?.slice(0, 2).toUpperCase() || '';
      
      if (londonPostcodes.some(prefix => 
        collPrefix.startsWith(prefix) || delPrefix.startsWith(prefix)
      )) {
        basePrice *= priceSettings.londonMultiplier;
      }
      
      // Format to penny precision
      basePrice = Math.round(basePrice * 100) / 100;
      const vat = Math.round(basePrice * priceSettings.vatRate * 100) / 100;
      const total = Math.round((basePrice + vat) * 100) / 100;

      // Update directly so price is always displayed
      setPrice({
        base: basePrice,
        vat: vat,
        total: total
      });
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

   // Vehicle type selection handler
  const handleVehicleSelect = (vehicle: 'bike' | 'van') => {
    setVehicleType(vehicle);
  }; 
  
  // Update price when vehicle type or urgent flag changes
  useEffect(() => {
    if (shouldCalculatePrice()) {
      calculatePrice();
    } else {
      // Reset price to zero when required fields are missing
      setPrice({ base: 0, vat: 0, total: 0 });
    }
  }, [isUrgent, vehicleType, collection.postcode, delivery.postcode, collection.name, delivery.name, collection.address, delivery.address]); 

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
  };
  
  const handleParcelCountChange = (count: number) => {
    setParcelCount(count);
  };

  const handleBookNow = () => {
    if (!selectedDate) {
      setError('Please select a date and time for your collection');
      return;
    }
    
    // Check if user is logged in before proceeding to confirmation
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      // Set the time on the selected date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(hours, minutes);
      setSelectedDate(dateWithTime);
      
      setShowConfirmation(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !user || !vehicleType) return;
    
    setIsSaving(true);
    setError('');
    
    // Add time to date if not already set
    let dateWithTime = selectedDate;
    if (selectedDate.getHours() === 0 && selectedDate.getMinutes() === 0) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(hours, minutes);
    }
    
    const bookingData = {
      collection,
      delivery,
      selectedDate: dateWithTime.toISOString(),
      isUrgent,
      vehicleType,
      parcelCount,
      price,
      bookingDate: new Date().toISOString()
    };

    try {
      const id = await saveBooking(bookingData, user.id);
      setBookingId(id);
      setBookingSuccess(true);
    } catch (error) {
      console.error('Error saving booking:', error);
      setError('Error saving booking. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle urgent flag change
  const handleUrgentChange = (value: boolean) => {
    setIsUrgent(value);
  };

   const resetForm = () => {
    // Clean up existing autocomplete instances
    if (autocompleteCollectionPostcode.current) {
      google.maps.event.clearInstanceListeners(autocompleteCollectionPostcode.current);
      autocompleteCollectionPostcode.current = null;
    }
    if (autocompleteDeliveryPostcode.current) {
      google.maps.event.clearInstanceListeners(autocompleteDeliveryPostcode.current);
      autocompleteDeliveryPostcode.current = null;
    }

    setCollection({ 
      name: '', 
      address: '', 
      street: '',
      city: '',
      town: '',
      county: '',
      building: '',
      postcode: '' 
    });
    setDelivery({ 
      name: '', 
      address: '', 
      street: '',
      city: '',
      town: '',
      county: '',
      building: '',
      postcode: '' 
    });
    setSelectedDate(null);
    setSelectedTime('12:00');
    setParcelCount(1);
    setIsUrgent(false);
    setVehicleType(null);
    setShowConfirmation(false);
    setBookingSuccess(false);
    setError('');
    setBookingId('');
    setPrice({ base: 0, vat: 0, total: 0 });
  }; 

  if (bookingSuccess) {
    return <SuccessMessage onReset={resetForm} bookingId={bookingId} vehicleType={vehicleType} parcelCount={parcelCount} />;
  }

  if (showConfirmation && selectedDate) {
    return (
      <ConfirmationPage
        collection={collection}
        delivery={delivery}
        price={price}
        selectedDate={selectedDate}
        isUrgent={isUrgent}
        parcelCount={parcelCount}
        vehicleType={vehicleType}
        onIsUrgentChange={handleUrgentChange}
        onBack={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        isSaving={isSaving}
        error={error}
      />
    );
  }

  if (showLoginPrompt) {
     return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6 relative">
      <button
        onClick={() => setShowLoginPrompt(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button> 
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Create an Account to Continue
        </h2>
        
        <div className="bg-blue-50 p-5 rounded-lg">
          <p className="text-gray-700 mb-4">
            You need to be logged in to complete your booking. Please create an account or log in to continue.
          </p>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button
              onClick={onNeedLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex-1 flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Log In
            </button>
            
            <button
              onClick={onNeedRegister}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex-1 flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Create Account
            </button>
          </div>
          
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Delivery Details
        </h2>
        
        <div className="space-y-5">
          {/* Vehicle type selector */}
          <VehicleSelector 
            selectedVehicle={vehicleType}
            onVehicleSelect={handleVehicleSelect}
          />

                            <div className="p-4 rounded-lg border border-gray-200"> 
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              Collection Details
            </h3> 
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="House Number / Name"
                  value={collection.name}
                  onChange={e => setCollection(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="First Line of Address"
                  value={collection.address}
                  onChange={e => setCollection(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="City"
                    value={collection.city}
                    onChange={e => setCollection(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Town"
                    value={collection.town}
                    onChange={e => setCollection(prev => ({ ...prev, town: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={collectionPostcodeRef}
                  type="text"
                  placeholder="Enter Postcode (e.g. SW1A 1AA)"
                  value={collection.postcode}
                  onChange={e => {
                    const newPostcode = e.target.value.toUpperCase();
                    setCollection(prev => ({ ...prev, postcode: newPostcode }));
                    
                                       // Price will be calculated automatically by useEffect 
                  }}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-red-500 text-xs mt-1">Please enter postcode to find address</p>
              </div>
            </div>
          </div>

                   <div className="p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Delivery Details
            </h3> 
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="House Number / Name"
                  value={delivery.name}
                  onChange={e => setDelivery(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="First Line of Address"
                  value={delivery.address}
                  onChange={e => setDelivery(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="City"
                    value={delivery.city}
                    onChange={e => setDelivery(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Town"
                    value={delivery.town}
                    onChange={e => setDelivery(prev => ({ ...prev, town: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={deliveryPostcodeRef}
                  type="text"
                  placeholder="Enter Postcode (e.g. M1 1BB)"
                  value={delivery.postcode}
                  onChange={e => {
                    const newPostcode = e.target.value.toUpperCase();
                    setDelivery(prev => ({ ...prev, postcode: newPostcode }));
                    
                                       // Price will be calculated automatically by useEffect 
                  }}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-red-500 text-xs mt-1">Please enter postcode to find address</p>
              </div>
            </div>
          </div>
          
          {/* Inline Calendar */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Collection Date & Time
            </h3>
            
            <InlineCalendar 
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              selectedTime={selectedTime}
              onTimeChange={handleTimeChange}
              parcelCount={parcelCount}
              onParcelCountChange={handleParcelCountChange}
            />

            <div className="mt-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={isUrgent}
                  onChange={(e) => handleUrgentChange(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="urgent" className="text-sm font-medium text-gray-700">
                  Urgent Delivery
                </label>
              </div>
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
          onClick={handleBookNow}
          disabled={!collection.address || !delivery.address || !collection.postcode || !delivery.postcode || !collection.name || !delivery.name || !vehicleType || !selectedDate}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
 