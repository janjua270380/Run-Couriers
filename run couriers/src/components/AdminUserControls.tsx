import  { useState, useEffect } from 'react';
import { User, Mail, Building, Calendar, Trash2, Edit, Save, X, AlertTriangle, Shield, RefreshCw, CheckCircle, Search, UserPlus, Phone, Lock, Users, Eye, EyeOff, Sliders, ArrowLeft } from 'lucide-react';

interface EditableCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  registeredAt: string;
  isAdmin?: boolean;
  isWorker?: boolean;
  accountType?: string;
  workerPermissions?: {
    viewCustomers: boolean;
    manageBookings: boolean;
    viewPricing: boolean;
    managePricing: boolean;
  };
  isEditing?: boolean;
}

interface AdminUserControlsProps {
  onBack: () => void;
}

export function AdminUserControls({ onBack }: AdminUserControlsProps) {
  const [customers, setCustomers] = useState<EditableCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof EditableCustomer>('registeredAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editCustomer, setEditCustomer] = useState<EditableCustomer | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [action, setAction] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [newWorker, setNewWorker] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    permissions: {
      viewCustomers: false,
      manageBookings: false,
      viewPricing: false,
      managePricing: false
    }
  });
  const [activeTab, setActiveTab] = useState<'all' | 'customers' | 'workers' | 'admins'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    // Load customers from localStorage
    const usersStr = localStorage.getItem('registeredUsers');
    if (usersStr) {
      const rawUsers = JSON.parse(usersStr);
      // Map to our expected format and remove password
      const formattedUsers = rawUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        company: user.company || '',
        registeredAt: user.registeredAt,
        isAdmin: user.email === 'admin@example.com' || user.accountType === 'admin',
        isWorker: user.isWorker || user.accountType === 'worker',
        accountType: user.accountType || (user.email === 'admin@example.com' ? 'admin' : 
                      (user.isWorker ? 'worker' : 'customer')),
        workerPermissions: user.workerPermissions || {
          viewCustomers: false,
          manageBookings: false,
          viewPricing: false,
          managePricing: false
        },
        isEditing: false
      }));
      setCustomers(formattedUsers);
    }
    setLoading(false);
  };

  // Handle sorting
  const handleSort = (field: keyof EditableCustomer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter by search term and account type
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
      (customer.company && customer.company.toLowerCase().includes(searchLower))
    );
    
    // Apply account type filter
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'admins') {
      return matchesSearch && (customer.isAdmin || customer.accountType === 'admin');
    } else if (activeTab === 'workers') {
      return matchesSearch && (customer.isWorker || customer.accountType === 'worker');
    } else if (activeTab === 'customers') {
      return matchesSearch && !customer.isAdmin && !customer.isWorker && 
             (!customer.accountType || customer.accountType === 'customer');
    }
    
    return matchesSearch;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Handle special cases like dates
    if (sortField === 'registeredAt') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Export customers to CSV
  const exportCSV = () => {
    if (customers.length === 0) return;
    
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Registered At', 'Role'];
    
    let csvContent = headers.join(',') + '\n';
    
    customers.forEach(customer => {
      let role = customer.accountType || "Customer";
      if (!role || role === '') {
        if (customer.isAdmin) role = "Admin";
        else if (customer.isWorker) role = "Worker";
        else role = "Customer";
      }
      
      const row = [
        customer.id,
        `"${customer.name.replace(/"/g, '""')}"`,
        `"${customer.email.replace(/"/g, '""')}"`,
        `"${(customer.phone || '').replace(/"/g, '""')}"`,
        `"${(customer.company || '').replace(/"/g, '""')}"`,
        `"${new Date(customer.registeredAt).toLocaleString().replace(/"/g, '""')}"`,
        role
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_accounts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (customer: EditableCustomer) => {
    setEditCustomer({...customer});
  };

  const handleCancelEdit = () => {
    setEditCustomer(null);
  };

  const handleSaveEdit = async () => {
    if (!editCustomer) return;

    // Basic validation
    if (!editCustomer.name || !editCustomer.email || !editCustomer.phone) {
      setAction({
        type: 'error',
        message: 'Name, email, and phone are required fields'
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editCustomer.email)) {
      setAction({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\+\-\(\)]{7,15}$/;
    if (!phoneRegex.test(editCustomer.phone)) {
      setAction({
        type: 'error',
        message: 'Please enter a valid phone number'
      });
      return;
    }

    // Get all users from localStorage
    const usersStr = localStorage.getItem('registeredUsers');
    if (!usersStr) return;
    
    const users = JSON.parse(usersStr);
    
    // Determine account type for Google Sheets
    const accountType = editCustomer.accountType || 
                       (editCustomer.isAdmin ? 'admin' : 
                        (editCustomer.isWorker ? 'worker' : 'customer'));
    
    // Update the user in localStorage
    const updatedUsers = users.map((user: any) => {
      if (user.id === editCustomer.id) {
        // Create an updated user object for localStorage
        return {
          ...user,
          name: editCustomer.name,
          email: editCustomer.email,
          phone: editCustomer.phone,
          company: editCustomer.company,
          isWorker: editCustomer.isWorker,
          accountType: accountType,
          workerPermissions: editCustomer.workerPermissions
        };
      }
      return user;
    });
    
    // Save back to localStorage
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    // Try to update in Google Sheets if available
    try {
      // Import the function dynamically to avoid circular dependencies
      const { registerViaGoogleSheets } = await import('../utils/googleSheetsApi');
      
      // Find the user's password from the local storage data
      const userWithPassword = users.find((user: any) => user.id === editCustomer.id);
      if (userWithPassword && userWithPassword.password) {
        // Send update to Google Sheets (reusing the registration function with 'update' action)
        await registerViaGoogleSheets({
          action: 'update',
          userId: editCustomer.id,
          name: editCustomer.name,
          email: editCustomer.email,
          password: userWithPassword.password,
          company: editCustomer.company || '',
          phone: editCustomer.phone || '',
          accountType: accountType,
          workerPermissions: editCustomer.workerPermissions
        });
      }
    } catch (err) {
      console.warn('Could not update user in Google Sheets:', err);
      // Continue with local update even if Google Sheets fails
    }
    
    // Update the UI
    setCustomers(prev => prev.map(customer => {
      if (customer.id === editCustomer.id) {
        return {
          ...customer,
          name: editCustomer.name,
          email: editCustomer.email,
          phone: editCustomer.phone,
          company: editCustomer.company,
          isWorker: editCustomer.isWorker,
          accountType: accountType,
          workerPermissions: editCustomer.workerPermissions
        };
      }
      return customer;
    }));
    
    setEditCustomer(null);
    
    setAction({
      type: 'success',
      message: 'User account updated successfully'
    });
    
    // Clear the action status after 3 seconds
    setTimeout(() => {
      setAction(null);
    }, 3000);
  };

  const handleDeleteCustomer = async (id: string) => {
    // Get all users
    const usersStr = localStorage.getItem('registeredUsers');
    if (!usersStr) return;
    
    const users = JSON.parse(usersStr);
    
    // Filter out the user to delete
    const updatedUsers = users.filter((user: any) => user.id !== id);
    
    // Save back to localStorage
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    // Update bookings to mark this user's bookings
    const bookingsStr = localStorage.getItem('deliveryBookings');
    if (bookingsStr) {
      const bookings = JSON.parse(bookingsStr);
      const updatedBookings = bookings.map((booking: any) => {
        if (booking.userId === id) {
          return {
            ...booking,
            userDeleted: true
          };
        }
        return booking;
      });
      localStorage.setItem('deliveryBookings', JSON.stringify(updatedBookings));
    }
    
    // Try to delete in Google Sheets if available
    try {
      // Import the function dynamically to avoid circular dependencies
      const { handleUserAccountAction } = await import('../utils/googleSheetsApi');
      
      // Send delete request to Google Sheets
      await handleUserAccountAction('deleteUser', { userId: id });
    } catch (err) {
      console.warn('Could not delete user from Google Sheets:', err);
      // Continue with local deletion even if Google Sheets fails
    }
    
    // Update the UI
    setCustomers(prev => prev.filter(customer => customer.id !== id));
    
    setShowConfirmDelete(null);
    
    setAction({
      type: 'success',
      message: 'User account deleted successfully'
    });
    
    // Clear the action status after 3 seconds
    setTimeout(() => {
      setAction(null);
    }, 3000);
  };

  const handleAddCustomer = async () => {
    // Basic validation
    if (!newCustomer.name || !newCustomer.email || !newCustomer.password || !newCustomer.phone) {
      setAction({
        type: 'error',
        message: 'Name, email, phone and password are required fields'
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCustomer.email)) {
      setAction({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\+\-\(\)]{7,15}$/;
    if (!phoneRegex.test(newCustomer.phone)) {
      setAction({
        type: 'error',
        message: 'Please enter a valid phone number'
      });
      return;
    }

    // Password match validation
    if (newCustomer.password !== newCustomer.confirmPassword) {
      setAction({
        type: 'error',
        message: 'Passwords do not match'
      });
      return;
    }

    // Get all users
    const usersStr = localStorage.getItem('registeredUsers');
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Check if email already exists
    if (users.some((user: any) => user.email === newCustomer.email)) {
      setAction({
        type: 'error',
        message: 'A user with this email already exists'
      });
      return;
    }
    
    // Generate a unique ID
    const id = 'customer_' + Math.random().toString(36).substr(2, 9);
    
    // Create the new user
    const newUser = {
      id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      company: newCustomer.company,
      password: newCustomer.password, // In a real app, this would be hashed
      accountType: 'customer',
      registeredAt: new Date().toISOString()
    };
    
    // Save to localStorage
    const updatedUsers = [...users, newUser];
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    // Try to register in Google Sheets if available
    try {
      // Import the function dynamically to avoid circular dependencies
      const { registerViaGoogleSheets } = await import('../utils/googleSheetsApi');
      
      // Send registration to Google Sheets with explicit customer type
      await registerViaGoogleSheets({
        name: newCustomer.name,
        email: newCustomer.email,
        password: newCustomer.password,
        company: newCustomer.company || '',
        phone: newCustomer.phone || '',
        accountType: 'customer' // Explicitly set for Google Sheets
      });
    } catch (err) {
      console.warn('Could not register user in Google Sheets:', err);
      // Continue with local registration even if Google Sheets fails
    }
    
    // Update the UI
    const uiUser = {
      id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      company: newCustomer.company,
      registeredAt: new Date().toISOString(),
      isAdmin: false,
      isWorker: false,
      accountType: 'customer'
    };
    
    setCustomers(prev => [...prev, uiUser]);
    
    // Reset the form
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      company: '',
      password: '',
      confirmPassword: ''
    });
    
    setShowAddCustomer(false);
    
    setAction({
      type: 'success',
      message: 'Customer added successfully'
    });
    
    // Clear the action status after 3 seconds
    setTimeout(() => {
      setAction(null);
    }, 3000);
  };

  const handleAddWorker = async () => {
    // Basic validation
    if (!newWorker.name || !newWorker.email || !newWorker.password || !newWorker.phone) {
      setAction({
        type: 'error',
        message: 'Name, email, phone and password are required fields'
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newWorker.email)) {
      setAction({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\+\-\(\)]{7,15}$/;
    if (!phoneRegex.test(newWorker.phone)) {
      setAction({
        type: 'error',
        message: 'Please enter a valid phone number'
      });
      return;
    }

    // Password match validation
    if (newWorker.password !== newWorker.confirmPassword) {
      setAction({
        type: 'error',
        message: 'Passwords do not match'
      });
      return;
    }

    // Ensure at least one permission is granted
    if (!Object.values(newWorker.permissions).some(val => val)) {
      setAction({
        type: 'error',
        message: 'Worker must have at least one permission enabled'
      });
      return;
    }

    // Get all users
    const usersStr = localStorage.getItem('registeredUsers');
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Check if email already exists
    if (users.some((user: any) => user.email === newWorker.email)) {
      setAction({
        type: 'error',
        message: 'A user with this email already exists'
      });
      return;
    }
    
    // Generate a unique ID
    const id = 'worker_' + Math.random().toString(36).substr(2, 9);
    
    // Create the new worker
    const newWorkerUser = {
      id,
      name: newWorker.name,
      email: newWorker.email,
      phone: newWorker.phone,
      password: newWorker.password, // In a real app, this would be hashed
      registeredAt: new Date().toISOString(),
      isWorker: true,
      accountType: 'worker',
      workerPermissions: {
        viewCustomers: newWorker.permissions.viewCustomers,
        manageBookings: newWorker.permissions.manageBookings,
        viewPricing: newWorker.permissions.viewPricing,
        managePricing: newWorker.permissions.managePricing
      }
    };
    
    // Save to localStorage
    const updatedUsers = [...users, newWorkerUser];
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    // Try to register in Google Sheets if available
    try {
      // Import the function dynamically to avoid circular dependencies
      const { registerViaGoogleSheets } = await import('../utils/googleSheetsApi');
      
      // Send registration to Google Sheets with explicit worker type and permissions
      await registerViaGoogleSheets({
        name: newWorker.name,
        email: newWorker.email,
        password: newWorker.password,
        phone: newWorker.phone || '',
        accountType: 'worker', // Explicitly set for Google Sheets
        workerPermissions: newWorker.permissions
      });
    } catch (err) {
      console.warn('Could not register worker in Google Sheets:', err);
      // Continue with local registration even if Google Sheets fails
    }
    
    // Update the UI
    const uiWorker = {
      id,
      name: newWorker.name,
      email: newWorker.email,
      phone: newWorker.phone,
      company: '',
      registeredAt: new Date().toISOString(),
      isAdmin: false,
      isWorker: true,
      accountType: 'worker',
      workerPermissions: {
        viewCustomers: newWorker.permissions.viewCustomers,
        manageBookings: newWorker.permissions.manageBookings,
        viewPricing: newWorker.permissions.viewPricing,
        managePricing: newWorker.permissions.managePricing
      }
    };
    
    setCustomers(prev => [...prev, uiWorker]);
    
    // Reset the form
    setNewWorker({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      permissions: {
        viewCustomers: false,
        manageBookings: false,
        viewPricing: false,
        managePricing: false
      }
    });
    
    setShowAddWorker(false);
    
    setAction({
      type: 'success',
      message: 'Worker account added successfully'
    });
    
    // Clear the action status after 3 seconds
    setTimeout(() => {
      setAction(null);
    }, 3000);
  };

  const renderAccountTypeLabel = (customer: EditableCustomer) => {
    if (customer.accountType === 'admin' || customer.isAdmin) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      );
    } else if (customer.accountType === 'worker' || customer.isWorker) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
          <Users className="w-3 h-3" />
          Worker
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
          <User className="w-3 h-3" />
          Customer
        </span>
      );
    }
  };

  const renderPermissionBadges = (permissions: any) => {
    if (!permissions) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {permissions.viewCustomers && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            <Eye className="w-3 h-3 mr-1" />
            View Customers
          </span>
        )}
        {permissions.manageBookings && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            <Edit className="w-3 h-3 mr-1" />
            Manage Bookings
          </span>
        )}
        {permissions.viewPricing && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            <Eye className="w-3 h-3 mr-1" />
            View Pricing
          </span>
        )}
        {permissions.managePricing && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            <Sliders className="w-3 h-3 mr-1" />
            Manage Pricing
          </span>
        )}
      </div>
    );
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
            <User className="w-6 h-6 text-green-600" />
            User Management
          </h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCustomer(true)}
            className="flex items-center gap-1 text-sm py-1 px-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
          
          <button
            onClick={() => setShowAddWorker(true)}
            className="flex items-center gap-1 text-sm py-1 px-3 bg-purple-600 text-white hover:bg-purple-700 rounded-md"
          >
            <Users className="w-4 h-4" />
            Add Worker
          </button>
          
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                loadCustomers();
              }, 500);
            }}
            className="flex items-center gap-1 text-sm py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={exportCSV}
            disabled={customers.length === 0}
            className="flex items-center gap-1 text-sm py-1 px-3 bg-green-600 text-white hover:bg-green-700 rounded-md disabled:bg-gray-300 disabled:text-gray-500"
          >
            <Mail className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {action && (
        <div className={`p-4 rounded-md ${action.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} flex items-center gap-2`}>
          {action.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{action.message}</p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <div className="flex items-start gap-2 text-blue-800">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Advanced User Management</p>
            <p className="text-sm mt-1">
              As the main admin, you have exclusive access to create and manage all user accounts, including worker accounts with customized permissions.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name, email, phone or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-none px-3 py-2 rounded-md text-sm ${activeTab === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Users
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={`flex-1 md:flex-none px-3 py-2 rounded-md text-sm ${activeTab === 'customers' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Customers
          </button>
          <button 
            onClick={() => setActiveTab('workers')}
            className={`flex-1 md:flex-none px-3 py-2 rounded-md text-sm ${activeTab === 'workers' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Workers
          </button>
          <button 
            onClick={() => setActiveTab('admins')}
            className={`flex-1 md:flex-none px-3 py-2 rounded-md text-sm ${activeTab === 'admins' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Customer</h3>
              <button 
                onClick={() => setShowAddCustomer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="newName" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  id="newName"
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  id="newEmail"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  id="newPhone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newCompany" className="block text-sm font-medium text-gray-700">
                  Company (Optional)
                </label>
                <input
                  id="newCompany"
                  type="text"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newCustomer.password}
                  onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={newCustomer.confirmPassword}
                  onChange={(e) => setNewCustomer({...newCustomer, confirmPassword: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Form */}
      {showAddWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Add Worker Account
              </h3>
              <button 
                onClick={() => setShowAddWorker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="workerName" className="block text-sm font-medium text-gray-700">
                  Worker Name *
                </label>
                <input
                  id="workerName"
                  type="text"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="workerEmail" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  id="workerEmail"
                  type="email"
                  value={newWorker.email}
                  onChange={(e) => setNewWorker({...newWorker, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="workerPhone" className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  id="workerPhone"
                  type="tel"
                  value={newWorker.phone}
                  onChange={(e) => setNewWorker({...newWorker, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="workerPassword" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  id="workerPassword"
                  type="password"
                  value={newWorker.password}
                  onChange={(e) => setNewWorker({...newWorker, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="workerConfirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  id="workerConfirmPassword"
                  type="password"
                  value={newWorker.confirmPassword}
                  onChange={(e) => setNewWorker({...newWorker, confirmPassword: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Worker Permissions *
                </label>
                <div className="bg-gray-50 p-4 rounded-md space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="viewCustomers"
                      checked={newWorker.permissions.viewCustomers}
                      onChange={(e) => setNewWorker({
                        ...newWorker,
                        permissions: {
                          ...newWorker.permissions,
                          viewCustomers: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="viewCustomers" className="ml-2 block text-sm text-gray-700">
                      View Customers and Bookings
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="manageBookings"
                      checked={newWorker.permissions.manageBookings}
                      onChange={(e) => setNewWorker({
                        ...newWorker,
                        permissions: {
                          ...newWorker.permissions,
                          manageBookings: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="manageBookings" className="ml-2 block text-sm text-gray-700">
                      Manage Bookings (Accept/Decline/Outsource)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="viewPricing"
                      checked={newWorker.permissions.viewPricing}
                      onChange={(e) => setNewWorker({
                        ...newWorker,
                        permissions: {
                          ...newWorker.permissions,
                          viewPricing: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="viewPricing" className="ml-2 block text-sm text-gray-700">
                      View Pricing Settings
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="managePricing"
                      checked={newWorker.permissions.managePricing}
                      onChange={(e) => setNewWorker({
                        ...newWorker,
                        permissions: {
                          ...newWorker.permissions,
                          managePricing: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="managePricing" className="ml-2 block text-sm text-gray-700">
                      Manage Pricing Settings
                    </label>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select which permissions this worker account should have
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddWorker(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Create Worker Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editCustomer.accountType === 'worker' || editCustomer.isWorker 
                  ? 'Edit Worker Account' 
                  : editCustomer.accountType === 'admin' || editCustomer.isAdmin
                    ? 'View Admin Account' 
                    : 'Edit Customer Account'}
              </h3>
              <button 
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="editName"
                  type="text"
                  value={editCustomer.name}
                  onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={editCustomer.isAdmin}
                />
              </div>
              
              <div>
                <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="editEmail"
                  type="email"
                  value={editCustomer.email}
                  onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={editCustomer.isAdmin}
                />
              </div>
              
              <div>
                <label htmlFor="editPhone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="editPhone"
                  type="tel"
                  value={editCustomer.phone}
                  onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={editCustomer.isAdmin}
                />
              </div>
              
              <div>
                <label htmlFor="editCompany" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  id="editCompany"
                  type="text"
                  value={editCustomer.company}
                  onChange={(e) => setEditCustomer({...editCustomer, company: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={editCustomer.isAdmin}
                />
              </div>
              
              {editCustomer.isWorker && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Worker Permissions
                  </label>
                  <div className="bg-gray-50 p-4 rounded-md space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editViewCustomers"
                        checked={editCustomer.workerPermissions?.viewCustomers}
                        onChange={(e) => setEditCustomer({
                          ...editCustomer,
                          workerPermissions: {
                            ...editCustomer.workerPermissions,
                            viewCustomers: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="editViewCustomers" className="ml-2 block text-sm text-gray-700">
                        View Customers and Bookings
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editManageBookings"
                        checked={editCustomer.workerPermissions?.manageBookings}
                        onChange={(e) => setEditCustomer({
                          ...editCustomer,
                          workerPermissions: {
                            ...editCustomer.workerPermissions,
                            manageBookings: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="editManageBookings" className="ml-2 block text-sm text-gray-700">
                        Manage Bookings (Accept/Decline/Outsource)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editViewPricing"
                        checked={editCustomer.workerPermissions?.viewPricing}
                        onChange={(e) => setEditCustomer({
                          ...editCustomer,
                          workerPermissions: {
                            ...editCustomer.workerPermissions,
                            viewPricing: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="editViewPricing" className="ml-2 block text-sm text-gray-700">
                        View Pricing Settings
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editManagePricing"
                        checked={editCustomer.workerPermissions?.managePricing}
                        onChange={(e) => setEditCustomer({
                          ...editCustomer,
                          workerPermissions: {
                            ...editCustomer.workerPermissions,
                            managePricing: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="editManagePricing" className="ml-2 block text-sm text-gray-700">
                        Manage Pricing Settings
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                  {renderAccountTypeLabel(editCustomer)}
                  <p className="text-xs text-gray-500 mt-1">
                    Registered: {new Date(editCustomer.registeredAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {!editCustomer.isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setEditCustomer(null);
                      setShowConfirmDelete(editCustomer.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                  
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Confirm Deletion</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this user account? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCustomer(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No users found</p>
          <p className="text-sm text-gray-400 mt-1">Start by adding a customer or worker account</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  Email
                  {sortField === 'email' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('phone')}
                >
                  Phone
                  {sortField === 'phone' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('company')}
                >
                  Company
                  {sortField === 'company' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('registeredAt')}
                >
                  Registered
                  {sortField === 'registeredAt' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {customer.id.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.phone || <span className="text-gray-400">Not provided</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.company || <span className="text-gray-400">Not specified</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(customer.registeredAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {renderAccountTypeLabel(customer)}
                      {customer.isWorker && renderPermissionBadges(customer.workerPermissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {customer.isAdmin ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="sr-only">View</span>
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4" />
                            <span className="sr-only">Edit</span>
                          </>
                        )}
                      </button>
                      
                      {!customer.isAdmin && (
                        <button
                          onClick={() => setShowConfirmDelete(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-center text-sm text-gray-500">
        {filteredCustomers.length} {filteredCustomers.length === 1 ? 'user' : 'users'} found
        {filteredCustomers.length !== customers.length && ` (filtered from ${customers.length} total)`}
      </div>
    </div>
  );
}
 