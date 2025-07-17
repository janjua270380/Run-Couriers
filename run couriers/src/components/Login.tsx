import  { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, User, Lock, LogIn, X, ArrowLeft } from 'lucide-react'; 

interface LoginProps {
  onClose: () => void;
  onRegisterClick: () => void;
}

export function Login({ onClose, onRegisterClick }: LoginProps) {
   const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoggingIn(true);
    setError('');
    
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return (
       <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button> 
      
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="bg-blue-100 rounded-full p-2">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Log In</h2>
        <p className="text-gray-600 mt-1">Access your delivery dashboard</p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoggingIn}
            />
          </div>
          
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoggingIn}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <div className="text-sm">
            <a href="#" className="text-blue-600 hover:text-blue-800">
              Forgot password?
            </a>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {isLoggingIn ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Log In
            </>
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button 
            onClick={onRegisterClick}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
 