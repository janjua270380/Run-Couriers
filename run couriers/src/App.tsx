import  { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { PricingCalculator } from './components/PricingCalculator';
import { Navigation } from './components/Navigation';
import { GoogleSheetIntegrationGuide } from './components/GoogleSheetIntegrationGuide';
import { BookingsTable } from './components/BookingsTable';
import { UserBookings } from './components/UserBookings';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { UserProfile } from './components/UserProfile';
import { updateBookingStatuses } from './utils/storage';
import { PricingSummary } from './components/PricingSummary';

function App() {
  const [showGuide, setShowGuide] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showUserBookings, setShowUserBookings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [price, setPrice] = useState({ base: 0, vat: 0, total: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const { isAuthenticated, isAdmin, isWorker, workerPermissions, isLoading } = useAuth();

  // Set up listener for navigation events (simulated routing for demo)
  useEffect(() => {
    const handleNavigation = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail?.path === '/bookings') {
        setShowUserBookings(true);
        setShowGuide(false);
        setShowBookings(false);
        setShowLogin(false);
        setShowRegister(false);
      } else if (event.detail?.path === '/login') {
        setShowLogin(true);
        setShowRegister(false);
        setShowUserBookings(false);
        setShowGuide(false);
        setShowBookings(false);
      } else if (event.detail?.path === '/register') {
        setShowRegister(true);
        setShowLogin(false);
        setShowUserBookings(false);
        setShowGuide(false);
        setShowBookings(false);
      } else if (event.detail?.path === '/guide') {
        setShowGuide(true);
        setShowLogin(false);
        setShowRegister(false);
        setShowUserBookings(false);
        setShowBookings(false);
      }
    };
    
    window.addEventListener('navigation', handleNavigation);
    
    return () => {
      window.removeEventListener('navigation', handleNavigation);
    };
  }, []);
  
  // Periodically check and update bookings status indicators
  useEffect(() => {
    updateBookingStatuses();
    
    const intervalId = setInterval(() => {
      updateBookingStatuses();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // This useEffect will remove the specific demo booking
  useEffect(() => {
    // Get current bookings
    const existingBookings = localStorage.getItem('deliveryBookings');
    if (existingBookings) {
      let bookings = JSON.parse(existingBookings);
      
      // Filter out the specific unwanted booking
      const filteredBookings = bookings.filter((booking: any) => {
        // Check if this is the unwanted demo booking
        return !(
          booking.collectionName === "ABC Shipping Ltd" &&
          booking.collectionPostcode === "EC1V 1AB" &&
          booking.deliveryPostcode === "M1 1BB" &&
          booking.date === "28/04/2025"
        );
      });
      
      // Only update if we actually removed something
      if (filteredBookings.length < bookings.length) {
        localStorage.setItem('deliveryBookings', JSON.stringify(filteredBookings));
      }
    }
  }, []);

  const closeAllModals = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowUserProfile(false);
  };

  const handlePriceUpdate = (newPrice: {base: number, vat: number, total: number}, urgent: boolean) => {
    setPrice(newPrice);
    setIsUrgent(urgent);
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
       <div className="min-h-screen bg-white"> 
      <Navigation 
        onViewBookings={() => {
          if (isAuthenticated) {
            setShowUserBookings(true);
            setShowBookings(false);
            setShowGuide(false);
            setShowLogin(false);
            setShowRegister(false);
          } else {
            setShowLogin(true);
          }
        }} 
        onUserProfile={() => {
          if (isAuthenticated) {
            setShowUserProfile(true);
            setShowBookings(false);
            setShowGuide(false);
            setShowLogin(false);
            setShowRegister(false);
          } else {
            setShowLogin(true);
          }
        }}
        onViewAllBookings={() => {
          setShowBookings(true);
          setShowUserBookings(false);
          setShowGuide(false);
          setShowLogin(false);
          setShowRegister(false);
        }}
        onLogin={() => {
          setShowLogin(true);
          setShowRegister(false);
          setShowUserBookings(false);
          setShowGuide(false);
          setShowBookings(false);
        }}
        onRegister={() => {
          setShowRegister(true);
          setShowLogin(false);
          setShowUserBookings(false);
          setShowGuide(false);
          setShowBookings(false);
        }}
        onViewGuide={() => {
          setShowGuide(true);
          setShowLogin(false);
          setShowRegister(false);
          setShowUserBookings(false);
          setShowBookings(false);
        }}
      />
      
      {/* Main Content */}
      <div className="relative">
        
        
        <main className="container mx-auto px-4 py-8 relative">
          {showUserProfile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <UserProfile onClose={() => setShowUserProfile(false)} />
            </div>
          )}
          
          {showLogin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Login 
                onClose={() => setShowLogin(false)} 
                onRegisterClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
              />
            </div>
          )}
          
          {showRegister && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Register 
                onClose={() => setShowRegister(false)} 
                onLoginClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              />
            </div>
          )}
          
          {showGuide ? (
            <GoogleSheetIntegrationGuide />
          ) : showBookings ? (
            <BookingsTable onBack={() => setShowBookings(false)} />
          ) : showUserBookings ? (
            <UserBookings onBack={() => setShowUserBookings(false)} />
          ) : (
            // Always show the calculator and map, regardless of authentication status
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <PricingCalculator 
                    onNeedLogin={() => setShowLogin(true)}
                    onNeedRegister={() => setShowRegister(true)}
                    onPriceUpdate={handlePriceUpdate}
                  />
                </div>
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <Map />
                  <PricingSummary price={price} isUrgent={isUrgent} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
 