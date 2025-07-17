import  React, { createContext, useState, useContext, useEffect } from 'react';
import { generateUserId } from '../utils/idGenerator';
import  { authenticateViaGoogleSheets, registerViaGoogleSheets } from '../utils/googleSheetsApi';
import { isAuthorizedDevice, getCurrentDeviceFingerprint } from '../utils/deviceFingerprint'; 

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  isAdmin?: boolean;
  isWorker?: boolean;
  workerPermissions?: {
    viewCustomers: boolean;
    manageBookings: boolean;
    viewPricing: boolean;
    managePricing: boolean;
  };
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { email: string; password: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  updateUserProfile: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user is stored in local storage on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('user');
      }
    }
    setIsInitialized(true);
  }, []);

   const login = async (email: string, password: string) => {
    try {
           // First check for local admin account with device restriction
      if (email === 'admin@example.com' && password === 'admin123') {
        // Check if this device is authorized for admin access
        if (!isAuthorizedDevice()) {
          throw new Error('Admin access is restricted to authorized devices only. This device is not authorized.');
        }
        
        const adminUser = {
          id: 'admin_001',
          name: 'Administrator',
          email: 'admin@example.com',
          isAdmin: true,
          isWorker: false,
          phone: '',
          company: 'Run Couriers',
          deviceFingerprint: getCurrentDeviceFingerprint()
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        return;
      } 
      
      // Check for demo account
      if (email === 'demo@example.com' && password === 'password') {
        const demoUser = {
          id: 'demo_001',
          name: 'Demo User',
          email: 'demo@example.com',
          isAdmin: false,
          isWorker: false,
          phone: '',
          company: ''
        };
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
        return;
      }
      
      // Check local storage for registered users
      const usersStr = localStorage.getItem('registeredUsers');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const localUser = users.find((user: any) => 
          user.email === email && user.password === password
        );
        
        if (localUser) {
          const loggedInUser = {
            id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            isAdmin: localUser.isAdmin || localUser.accountType === 'admin',
            isWorker: localUser.isWorker || localUser.accountType === 'worker',
            workerPermissions: localUser.workerPermissions,
            phone: localUser.phone || '',
            company: localUser.company || ''
          };
          setUser(loggedInUser);
          localStorage.setItem('user', JSON.stringify(loggedInUser));
          return;
        }
      }
      
      // Try to authenticate via Google Sheets as fallback
      try {
        const response = await authenticateViaGoogleSheets(email, password);
        
        if (response.result === 'success' && response.user) {
          const loggedInUser = response.user;
          setUser(loggedInUser);
          localStorage.setItem('user', JSON.stringify(loggedInUser));
          return;
        }
      } catch (gsError) {
        console.warn('Google Sheets authentication failed:', gsError);
      }
      
      throw new Error('Invalid email or password');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(`Login error: ${error.message || 'Unknown error'}`);
    }
  };
 

   const register = async (userData: Partial<User> & { email: string; password: string }) => {
    try {
      // Generate a user ID if not provided
      const userId = userData.id || generateUserId();
      
      // First try local storage registration as fallback
      const newUser = {
        id: userId,
        name: userData.name || '',
        email: userData.email,
        password: userData.password,
        company: userData.company || '',
        phone: userData.phone || '',
        isAdmin: userData.isAdmin || false,
        isWorker: userData.isWorker || false,
        workerPermissions: userData.workerPermissions || {
          viewCustomers: false,
          manageBookings: false,
          viewPricing: false,
          managePricing: false
        },
        accountType: userData.isAdmin ? 'admin' : (userData.isWorker ? 'worker' : 'customer'),
        createdAt: new Date().toISOString()
      };
      
      // Check if user already exists in local storage
      const existingUsersStr = localStorage.getItem('registeredUsers');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
      
      const userExists = existingUsers.find((user: any) => 
        user.email.toLowerCase() === userData.email.toLowerCase()
      );
      
      if (userExists) {
        throw new Error('An account with this email already exists');
      }
      
      // Add to local storage
      existingUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      
      // Try to register via Google Sheets (optional)
      try {
        const response = await registerViaGoogleSheets({
          ...newUser,
          accountType: newUser.accountType
        });
        
        if (response.result === 'success') {
          console.log('User also registered in Google Sheets');
        }
      } catch (gsError) {
        console.warn('Google Sheets registration failed, but local registration succeeded:', gsError);
      }
      
      // Auto-login after successful registration
      await login(userData.email, userData.password);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }; 

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUserProfile = async (updatedUser: User): Promise<void> => {
    try {
      // In a real app, send update to server here
      // For now, just update locally
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(`Update failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Derive authentication status from user state
  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user?.isAdmin);
  const isWorker = Boolean(user?.isWorker);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isWorker,
        updateUserProfile
      }}
    >
      {isInitialized ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
 