import  { useState, useEffect } from 'react';
import  { User, Settings, LogOut, Save, X, Edit, Eye, EyeOff } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import { isValidUserId } from '../utils/idGenerator';

interface  UserProfileProps {
  onClose?: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) { 
  const { user, logout, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
   const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || '',
    userId: user?.id || '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); 

   useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || '',
        phone: user.phone || '',
        userId: user.id || '',
        password: ''
      });
    }
  }, [user]); 

  const handleSave = async () => {
    setError('');
    
    // Validate user ID
    if (!isValidUserId(profileData.userId)) {
      setError('User ID must be at least 5 characters and contain only letters and numbers');
      return;
    }
    
    // Validate name
    if (!profileData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
       try {
      const updateData = {
        ...user,
        id: profileData.userId,
        name: profileData.name,
        email: profileData.email,
        company: profileData.company,
        phone: profileData.phone
      };
      
      // Only include password if it was changed
      if (profileData.password.trim()) {
        updateData.password = profileData.password;
      }
      
      await updateUserProfile(updateData);
      setIsEditing(false);
      setProfileData({ ...profileData, password: '' }); // Clear password field
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } 
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
           <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          My Profile
        </h2>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50"
            >
              <X className="w-4 h-4 inline mr-1" />
              Cancel
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div> 
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.userId}
                onChange={(e) => setProfileData({ ...profileData, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="User ID"
              />
            ) : (
              <p className="text-gray-800 py-2">{user?.id || 'Not set'}</p>
            )}
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum 5 characters, letters and numbers only
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full Name"
              />
            ) : (
              <p className="text-gray-800 py-2">{user?.name || 'Not set'}</p>
            )}
          </div>
          
                   <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email Address"
              />
            ) : (
              <p className="text-gray-800 py-2">{user?.email || 'Not set'}</p>
            )}
          </div> 
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.company}
                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Company Name (Optional)"
              />
            ) : (
              <p className="text-gray-800 py-2">{user?.company || 'Not set'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Phone Number"
              />
            ) : (
              <p className="text-gray-800 py-2">{user?.phone || 'Not set'}</p>
            )}
          </div>
          
                   <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            {isEditing ? (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={profileData.password}
                  onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <p className="text-gray-800 py-2">••••••••</p>
            )}
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to keep current password
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <p className="text-gray-800 py-2 capitalize">
              {user?.isAdmin ? 'Administrator' : (user?.isWorker ? 'Worker' : 'Customer')}
            </p>
          </div> 
        </div>
        
        {isEditing && (
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Account Settings
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your account preferences and settings
              </p>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-50 text-red-600 py-2 px-4 rounded-md hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 