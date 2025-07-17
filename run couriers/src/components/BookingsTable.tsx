import  { useState, useEffect } from 'react';
import { getBookings, updateBooking, deleteBooking } from '../utils/storage';
import  { AdminJobManagement } from './AdminJobManagement';
import  { JobsForDrivers } from './JobsForDrivers';  
import { Database, Eye, EyeOff, ArrowLeft, Download, Shield, CheckCircle, Clock, XCircle, Edit, User, Bike, Truck, Sliders, Search, Trash2, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { AdminCustomersList } from './AdminCustomersList';
import { AdminPriceControls } from './AdminPriceControls';
import { AdminUserControls } from './AdminUserControls';
import { BookingDetails } from './BookingDetails';
import { useAuth } from '../context/AuthContext';

interface BookingsTableProps {
  onBack: () => void;
}

export function BookingsTable({ onBack }: BookingsTableProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [viewBookingDetails, setViewBookingDetails] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{success?: string, error?: string} | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showUserControls, setShowUserControls] = useState(false);
  const [showPriceControls, setShowPriceControls] = useState(false);
   const [showJobManagement, setShowJobManagement] = useState(false);
  const [showJobsForDrivers, setShowJobsForDrivers] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { isAdmin, isWorker, workerPermissions, syncBookingsWithGoogleSheets } = useAuth();
  
  useEffect(() => {
    loadBookings();
  }, []);
  
  // Get all bookings from localStorage
  const loadBookings = () => {
    setLoading(true);
    const allBookings = getBookings();
    setBookings(allBookings);
    setLoading(false);
  };
  
  // Sync bookings with Google Sheets
  const handleSyncBookings = async () => {
    if (!syncBookingsWithGoogleSheets) return;
    
    setIsSyncing(true);
    setUpdateStatus({ success: "Syncing bookings from Google Sheets..." });
    
    try {
      await syncBookingsWithGoogleSheets();
      setUpdateStatus({ success: "Bookings successfully synced from Google Sheets" });
      loadBookings(); // Reload bookings after sync
    } catch (error) {
      setUpdateStatus({ error: `Failed to sync bookings: ${(error as Error).message}` });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Filter by search term and status
  const filteredBookings = bookings.filter(booking => {
    // First filter by search term
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (booking.collectionName && booking.collectionName.toLowerCase().includes(searchLower)) ||
      (booking.deliveryName && booking.deliveryName.toLowerCase().includes(searchLower)) ||
      (booking.collectionPostcode && booking.collectionPostcode.toLowerCase().includes(searchLower)) ||
      (booking.deliveryPostcode && booking.deliveryPostcode.toLowerCase().includes(searchLower)) ||
      (booking.bookingId && booking.bookingId.toLowerCase().includes(searchLower));
    
    // Then filter by status if needed
    if (filter === 'all') {
      return matchesSearch;
    } else {
      return matchesSearch && booking.status === filter;
    }
  });
  
  // Sort bookings based on current sort field and direction
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Special handling for dates
    if (sortField === 'timestamp' || sortField === 'modifiableUntil') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  const displayBookings = showAll ? sortedBookings : sortedBookings.slice(0, 10);
  
  // Function to export bookings as CSV
  const exportCSV = () => {
    if (bookings.length === 0) return;
    
    // Get all keys from the first booking for headers
    const headers = Object.keys(bookings[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    bookings.forEach(booking => {
      const row = headers.map(header => {
        // Handle values that might contain commas by wrapping in quotes
        let cell = booking[header] || '';
        cell = cell.toString().replace(/"/g, '""'); // Escape quotes
        return `"${cell}"`;
      }).join(',');
      csvContent += row + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'delivery_bookings.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };
  
   // Function to handle booking status update
  const handleStatusChange = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'accepted' | 'declined' | 'outsourced') => {
    setIsUpdating(true);
    setUpdateStatus(null);
    
    try {
      await updateBooking(bookingId, { status: newStatus });
      setUpdateStatus({ success: `Booking successfully updated to ${newStatus}` });
      
      // Force immediate reload of bookings
      loadBookings();
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('bookingUpdated', { 
        detail: { bookingId, newStatus } 
      }));
      
    } catch (error) {
      setUpdateStatus({ error: `Failed to update booking: ${(error as Error).message}` });
    } finally {
      setIsUpdating(false);
    }
  }; 
  
   // Function to handle booking deletion
  const handleDeleteBooking = async (bookingId: string) => {
    setIsUpdating(true);
    setUpdateStatus(null);
    
    try {
      // Delete booking from both localStorage and Google Sheets
      await deleteBooking(bookingId);
      
      // Update the local state
      setBookings(prevBookings => prevBookings.filter(booking => booking.bookingId !== bookingId));
      
      // Reload bookings to ensure consistency
      loadBookings();
      
      setUpdateStatus({ success: 'Booking successfully deleted' });
    } catch (error) {
      setUpdateStatus({ error: `Failed to delete booking: ${(error as Error).message}` });
    } finally {
      setIsUpdating(false);
      setShowConfirmDelete(null);
    }
  }; 
  
  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-purple-100 text-purple-800">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'outsourced':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-indigo-100 text-indigo-800">
            <CheckCircle className="w-3 h-3" />
            Outsourced
          </span>
        );
      case 'declined':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-orange-100 text-orange-800">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  if (showCustomers) {
    return <AdminCustomersList onBack={() => setShowCustomers(false)} />;
  }

  if (showUserControls) {
    return <AdminUserControls onBack={() => setShowUserControls(false)} />;
  }

  if (showPriceControls) {
    return <AdminPriceControls onBack={() => setShowPriceControls(false)} />;
  }

   if (showJobManagement) {
    return (
      <AdminJobManagement 
        bookings={bookings}
        onUpdateBooking={handleStatusChange}
        onDeleteBooking={handleDeleteBooking}
        onBack={() => setShowJobManagement(false)} 
      />
    );
  } 

  if (viewBookingDetails) {
    const booking = bookings.find(b => b.bookingId === viewBookingDetails);
    if (!booking) return null;
    
    return (
      <BookingDetails 
        bookingId={viewBookingDetails}
        booking={booking}
        onBack={() => setViewBookingDetails(null)}
        onRefresh={loadBookings}
      />
    );
  }

   return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {isAdmin ? (
            <>
              <Shield className="w-6 h-6 text-green-600" />
              Admin Dashboard
            </>
          ) : (
            <>
              <Users className="w-6 h-6 text-purple-600" />
              Worker Dashboard
            </>
          )}
        </h2>
      </div>
      
      <div className="space-y-3">
               {isAdmin && (
          <>
            <button
              onClick={() => setShowJobManagement(true)}
              className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <Truck className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <span className="block text-lg font-medium text-green-800">Job Management</span>
                <span className="block text-sm text-green-600">Manage all bookings and orders</span>
              </div>
            </button> 
            
            <button
              onClick={() => setShowPriceControls(true)}
              className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <Sliders className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-medium text-blue-800">Pricing Controls</span>
            </button>

            <button
              onClick={() => setShowUserControls(true)}
              className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <User className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-medium text-purple-800">User Management</span>
            </button>
            
            <button
              onClick={() => setShowCustomers(true)}
              className="w-full flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
            >
              <Database className="w-6 h-6 text-indigo-600" />
              <span className="text-lg font-medium text-indigo-800">Customer List</span>
            </button>
          </>
        )}
        
        {isWorker && workerPermissions && (
          <>
            {workerPermissions.manageBookings && (
              <button
                onClick={() => setShowJobManagement(true)}
                className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <Truck className="w-6 h-6 text-green-600" />
                <span className="text-lg font-medium text-green-800">Job Management</span>
              </button>
            )}
            
            {workerPermissions.viewPricing && (
              <button
                onClick={() => setShowPriceControls(true)}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <Sliders className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-medium text-blue-800">View Pricing</span>
              </button>
            )}
            
            {workerPermissions.viewCustomers && (
              <button
                onClick={() => setShowCustomers(true)}
                className="w-full flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              >
                <Database className="w-6 h-6 text-indigo-600" />
                <span className="text-lg font-medium text-indigo-800">Customer List</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  ); 
}
 