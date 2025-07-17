import  { useState } from 'react';
import { Truck, Database, User, Menu, X, Shield, LogIn, UserPlus, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  onViewBookings: () => void;
  onUserProfile: () => void;
  onViewAllBookings: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onViewGuide: () => void;
}

export function Navigation({ 
  onViewBookings, 
  onUserProfile, 
  onViewAllBookings, 
  onLogin, 
  onRegister,
  onViewGuide
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, isWorker, workerPermissions, isAuthenticated } = useAuth();
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-semibold text-gray-800">Run Couriers</span>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-blue-600 hover:bg-gray-100"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
                       <div className="flex items-center space-x-6 text-sm">              
              {isAdmin && (
                <button
                  onClick={onViewAllBookings}
                  className="flex items-center gap-2 text-green-600 hover:text-green-800"
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </button>
              )}
              
              {isWorker && workerPermissions && workerPermissions.viewCustomers && (
                <button
                  onClick={onViewAllBookings}
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-800"
                >
                  <Users className="w-4 h-4" />
                  Worker Dashboard
                </button>
              )}
              
              {isAdmin && (
                <button
                  onClick={onViewGuide}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <BookOpen className="w-4 h-4" />
                  Google Sheets Setup
                </button>
              )}
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onUserProfile}
                  className="flex items-center"
                >
                  <div className="relative">
                    <img 
                      src={user?.avatar || `https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453`}
                      alt={user?.name || "User"}
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-600"
                    />
                    <div className="absolute bottom-0 right-0 bg-green-500 w-2.5 h-2.5 rounded-full border-2 border-white"></div>
                  </div>
                </button>
              </div>
            ) : ( 
              <div className="flex items-center space-x-3">
                <button
                  onClick={onLogin}
                  className="flex items-center gap-1 text-sm py-1.5 px-3 text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md"
                >
                  <LogIn className="w-4 h-4" />
                  Log In
                </button>
                
                <button
                  onClick={onRegister}
                  className="flex items-center gap-1 text-sm py-1.5 px-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAdmin && (
              <button
                onClick={() => {
                  onViewAllBookings();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-green-600 hover:text-green-800 hover:bg-gray-100"
              >
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </button>
            )}
            
            {isWorker && workerPermissions && workerPermissions.viewCustomers && (
              <button
                onClick={() => {
                  onViewAllBookings();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-purple-600 hover:text-purple-800 hover:bg-gray-100"
              >
                <Users className="w-5 h-5" />
                Worker Dashboard
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={() => {
                  onViewGuide();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-100"
              >
                <BookOpen className="w-5 h-5" />
                Google Sheets Setup
              </button>
            )}
          </div>
          
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <img 
                    src={user?.avatar || `https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453`}
                    alt={user?.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
                           <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={() => {
                    onUserProfile();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                >
                  <User className="w-5 h-5" />
                  Profile
                </button>
              </div> 
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200 px-3 space-y-2">
              <button
                onClick={() => {
                  onLogin();
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 py-2 rounded-md text-base font-medium text-blue-600 border border-blue-600"
              >
                <LogIn className="w-5 h-5" />
                Log In
              </button>
              
              <button
                onClick={() => {
                  onRegister();
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 py-2 rounded-md text-base font-medium text-white bg-blue-600"
              >
                <UserPlus className="w-5 h-5" />
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
 