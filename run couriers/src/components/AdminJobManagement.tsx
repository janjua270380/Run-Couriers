import    React, { useState, useEffect } from 'react';
import    { Package, Search, Filter, User, MapPin, Calendar, Clock, Phone, Mail, Building, Truck, AlertCircle, CheckCircle, X, ExternalLink, Send, Eye, ArrowLeft, Download, FileText, Trash, Edit, Save } from 'lucide-react';     
import { useAuth } from '../context/AuthContext';
import { formatAddressForDisplay } from '../utils/bookingUtils';
import { Booking } from '../types';

interface   AdminJobManagementProps {
  bookings: any[];
  onUpdateBooking: (bookingId: string, updates: any) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onBack: () => void;
  onEditBooking?: (booking: any) => void;
}    

export     function AdminJobManagement({ bookings, onUpdateBooking, onDeleteBooking, onBack, onEditBooking }: AdminJobManagementProps) {   
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); 
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showOutsourceForm, setShowOutsourceForm] = useState(false);
  const [outsourceEmail, setOutsourceEmail] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [deletedBookings, setDeletedBookings] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});  

   const isAdmin = user?.isAdmin;
  const canManageJobs = isAdmin || user?.workerPermissions?.canManageJobs;

  // Listen for booking updates to refresh the component
  useEffect(() => {
    const handleBookingUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('bookingUpdated', handleBookingUpdate);
    return () => window.removeEventListener('bookingUpdated', handleBookingUpdate);
  }, []); 

  if (!canManageJobs) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You don't have permission to access job management features.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

     
   
   // Force re-evaluation of filtered bookings with refreshKey
   const filteredBookings = React.useMemo(() => {
     return statusFilter === 'deleted' 
       ? deletedBookings.filter(booking => {
           const matchesSearch = !searchTerm || 
             (booking.collectionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.deliveryName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.collectionPostcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.deliveryPostcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (booking.customerEmail || booking.contactEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
             (booking.bookingId || '').toLowerCase().includes(searchTerm.toLowerCase());
           return matchesSearch;
         })
       : (bookings || []).filter(booking => { 
           // Filter out test bookings and problematic entries
           const isTestBooking = booking.bookingId?.includes('test') || 
                                booking.customerName?.toLowerCase().includes('test') ||
                                booking.collectionName?.toLowerCase().includes('test') ||
                                booking.deliveryName?.toLowerCase().includes('test') ||
                                booking.bookingId?.includes('undefined') ||
                                booking.bookingId?.includes('null') ||
                                !booking.bookingId ||
                                booking.bookingId === '' ||
                                booking.collectionName === '' ||
                                booking.deliveryName === '';
           
           const matchesSearch = !searchTerm || 
             (booking.collectionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.deliveryName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.collectionPostcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.deliveryPostcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.bookingId || '').toLowerCase().includes(searchTerm.toLowerCase());

           const matchesStatus = statusFilter === 'all' || booking.status === statusFilter; 
           
           return !isTestBooking && matchesSearch && matchesStatus;
         });
   }, [bookings, deletedBookings, statusFilter, searchTerm, refreshKey]); 

     const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      outsourced: { color: 'bg-purple-100 text-purple-800', label: 'Outsourced' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      deleted: { color: 'bg-red-200 text-red-900', label: 'Deleted' }
    }; 

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  }; 

             const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      // Update booking status
      await onUpdateBooking(bookingId, { status: newStatus });
      
      // Update the selected booking state immediately
      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
      
      // Force component re-render by triggering parent refresh and local refresh
      setRefreshKey(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('bookingUpdated'));
      
      // Small delay to ensure status update is reflected
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
      
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  }; 
  

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      // Find the booking to move to deleted
      const bookingToDelete = bookings.find(b => b.bookingId === bookingId);
      if (bookingToDelete) {
        // Add to deleted bookings with deleted status and timestamp
        const deletedBooking = {
          ...bookingToDelete,
          status: 'deleted',
          deletedAt: new Date().toISOString(),
          deletedBy: user?.id || 'admin'
        };
        setDeletedBookings(prev => [...prev, deletedBooking]);
      }

      if (onDeleteBooking) {
        await onDeleteBooking(bookingId);
      } else {
        // Fallback to direct deletion if onDeleteBooking not provided
        const { deleteBooking } = await import('../utils/storage');
        await deleteBooking(bookingId);
      }
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  }; 

   const generateOutsourceEmail = (booking: any) => {
    return `Subject: Delivery Job Outsourcing Request - ${booking.bookingId}

Dear Partner,

We have a delivery job that we would like to outsource to your service:

Job Details:
- Booking ID: ${booking.bookingId}
- Date: ${booking.selectedDate || booking.date}
- Time: ${booking.selectedTime || booking.time}
- Vehicle Type: ${booking.vehicleType}
- Parcel Count: ${booking.parcelCount}

Collection:
- Name: ${booking.collectionName}
- Address: ${booking.collectionAddress}
- Postcode: ${booking.collectionPostcode}

Delivery:
- Name: ${booking.deliveryName}
- Address: ${booking.deliveryAddress}
- Postcode: ${booking.deliveryPostcode}

Customer  Contact:
- Name: ${booking.customerName}
- Email: ${booking.customerEmail || booking.contactEmail || 'N/A'}
- Phone: ${booking.customerPhone || booking.contactPhone || 'N/A'} 

Total Value: £${booking.totalPrice || booking.price}

${booking.additionalInfo ? `Special Instructions:\n${booking.additionalInfo}` : ''}

Please confirm if you can handle this delivery and let us know your availability.

Best regards,
Delivery Management Team`; 
  };

    const handleOutsource = async () => {
    if (selectedBooking && outsourceEmail) {
      const emailContent = generateOutsourceEmail(selectedBooking);
      
      const mailtoLink = `mailto:${outsourceEmail}?${new URLSearchParams({
        subject: `Delivery Job Outsourcing Request - ${selectedBooking.bookingId}`,
        body: emailContent
      })}`;
      
      window.open(mailtoLink);
      
      await handleStatusUpdate(selectedBooking.bookingId, 'outsourced');
      // Switch to outsourced tab after update
      setTimeout(() => setStatusFilter('outsourced'), 100);
      setShowOutsourceForm(false);
      setOutsourceEmail('');
    }
  }; 

  const generateReceipt = (booking: any) => {
    const receiptContent = `
DELIVERY RECEIPT
=====================================

Receipt ID: REC-${booking.bookingId}
Date Issued: ${new Date().toLocaleDateString('en-GB')}
Time Issued: ${new Date().toLocaleTimeString('en-GB')}

-------------------------------------
BOOKING DETAILS
-------------------------------------
Booking ID: ${booking.bookingId}
Status: COMPLETED
Service Date: ${booking.selectedDate || booking.date}
Service Time: ${booking.selectedTime || booking.time}
Vehicle Type: ${booking.vehicleType?.toUpperCase()}
Parcel Count: ${booking.parcelCount}
${booking.isUrgent ? 'Service Type: URGENT DELIVERY' : 'Service Type: STANDARD DELIVERY'}

-------------------------------------
CUSTOMER INFORMATION
-------------------------------------
Name: ${booking.customerName || booking.collectionName}
Email: ${booking.customerEmail || 'N/A'}
Phone: ${booking.customerPhone || 'N/A'}

-------------------------------------
COLLECTION ADDRESS
-------------------------------------
Name/Business: ${booking.collectionName}
Address: ${booking.collectionAddress}
Postcode: ${booking.collectionPostcode}

-------------------------------------
DELIVERY ADDRESS
-------------------------------------
Name/Business: ${booking.deliveryName}
Address: ${booking.deliveryAddress}
Postcode: ${booking.deliveryPostcode}

-------------------------------------
PRICING BREAKDOWN
-------------------------------------
Base Price: £${booking.basePrice || '0.00'}
VAT (20%): £${booking.vat || '0.00'}
${booking.isUrgent ? 'Urgent Surcharge: INCLUDED' : ''}
-------------------------------------
TOTAL AMOUNT: £${booking.totalPrice || booking.price}
-------------------------------------

${booking.additionalInfo ? `
SPECIAL INSTRUCTIONS:
${booking.additionalInfo}
` : ''}

-------------------------------------
SERVICE PROVIDER
-------------------------------------
Company: Run Couriers
Website: Built with jdoodle.ai
Email: info@runcouriers.com

Thank you for choosing our delivery service!

Generated on: ${new Date().toLocaleString('en-GB')}
=====================================
    `.trim();

    return receiptContent;
  };

  const downloadReceipt = (booking: any) => {
    const receiptContent = generateReceipt(booking);
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `receipt-${booking.bookingId}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setEditFormData({
      collectionName: booking.collectionName || '',
      collectionAddress: booking.collectionAddress || '',
      collectionPostcode: booking.collectionPostcode || '',
      deliveryName: booking.deliveryName || '',
      deliveryAddress: booking.deliveryAddress || '',
      deliveryPostcode: booking.deliveryPostcode || '',
      selectedDate: booking.selectedDate || booking.date || '',
           selectedTime: booking.selectedTime || booking.time || booking.deliveryTime || '', 
      vehicleType: booking.vehicleType || 'bike',
      parcelCount: booking.parcelCount || 1,
      isUrgent: booking.isUrgent || false,
      basePrice: booking.basePrice || '0.00',
      vat: booking.vat || '0.00',
      totalPrice: booking.totalPrice || booking.price || '0.00',
           customerEmail: booking.customerEmail || booking.contactEmail || '',
      customerPhone: booking.customerPhone || booking.contactPhone || '',
      contactEmail: booking.contactEmail || booking.customerEmail || '',
      contactPhone: booking.contactPhone || booking.customerPhone || '', 
      additionalInfo: booking.additionalInfo || '',
      status: booking.status || 'pending'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;
    
    try {
      const updatedBooking = {
        ...editingBooking,
        ...editFormData
      };
      
      await onUpdateBooking(editingBooking.bookingId, editFormData);
      
      // Update selected booking if it's the same
      if (selectedBooking?.bookingId === editingBooking.bookingId) {
        setSelectedBooking(updatedBooking);
      }
      
      setEditingBooking(null);
      setEditFormData({});
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditFormData({});
  }; 

     return (
    <div className="bg-white rounded-lg shadow-lg p-6">
           <div className="flex items-center mb-6">
               <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button> 
        <h2 className="text-2xl font-bold text-gray-800">Job Management</h2>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

                             <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'} flex items-center gap-2`}
          >
            <Package className="w-4 h-4" />
            All ({bookings?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'accepted' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Accepted ({bookings?.filter(b => b.status === 'accepted')?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('declined')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'declined' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Declined ({bookings?.filter(b => b.status === 'declined')?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('outsourced')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'outsourced' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Outsourced ({bookings?.filter(b => b.status === 'outsourced')?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Cancelled ({bookings?.filter(b => b.status === 'cancelled')?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Completed ({bookings?.filter(b => b.status === 'completed')?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('deleted')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'deleted' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Deleted ({deletedBookings?.length || 0})
          </button>
        </div> 

        
      </div>
      
           {/* Bookings Table */}
      <div className="mb-6 bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-32">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-28">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-36">Collection Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-48">Collection Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-24">Collection Postcode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-36">Delivery Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-48">Delivery Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-24">Delivery Postcode</th>
                               <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-28">Delivery Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-24">Delivery Time</th> 
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-16">Urgent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-24">Vehicle Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-20">Parcel Count</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-24">Base Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-16">VAT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-24">Total Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-24">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-20">Status</th>
                               <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-40">Contact Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-32">Contact Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-48">Additional Info</th>
                {statusFilter === 'deleted' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-32">Deleted Info</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Actions</th> 
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                           {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={statusFilter === 'deleted' ? 23 : 22} className="px-4 py-8 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>{statusFilter === 'deleted' ? 'No deleted bookings found' : 'No bookings found'}</p>
                    <p className="text-sm">{statusFilter === 'deleted' ? `${deletedBookings?.length || 0} deleted bookings available` : bookings?.length ? `${bookings.length} total bookings available` : 'No bookings in system'}</p>
                  </td>
                </tr>
              ) : ( 
                filteredBookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.timestamp || new Date(booking.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r font-medium">{booking.bookingId}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.collectionName || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.collectionAddress || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.collectionPostcode || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.deliveryName || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.deliveryAddress || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.deliveryPostcode || '-'}</td>
                                       <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.selectedDate || booking.date || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.selectedTime || booking.time || booking.deliveryTime || '-'}</td> 
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.isUrgent ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r capitalize">{booking.vehicleType || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.parcelCount || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">£{booking.basePrice || '0.00'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">£{booking.vat || '0.00'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r font-semibold">£{booking.totalPrice || booking.price || '0.00'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.userId || '-'}</td>
                    <td className="px-4 py-3 text-xs border-r">{getStatusBadge(booking.status)}</td>
                                       <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.customerEmail || booking.contactEmail || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.customerPhone || booking.contactPhone || '-'}</td> 
                    <td className="px-4 py-3 text-xs text-gray-900 border-r">{booking.additionalInfo ? booking.additionalInfo.substring(0, 50) + (booking.additionalInfo.length > 50 ? '...' : '') : '-'}</td>
                    {statusFilter === 'deleted' && (
                      <td className="px-4 py-3 text-xs text-gray-900 border-r">
                        <div>
                          <p>Deleted: {new Date(booking.deletedAt).toLocaleDateString()}</p>
                          <p>By: {booking.deletedBy}</p>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1"
                          title="View Booking"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {statusFilter !== 'deleted' && (
                          <button
                            onClick={() => handleDeleteBooking(booking.bookingId)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center gap-1"
                            title="Delete Booking"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td> 
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div> 

           {/* Booking Details Panel - Bottom */}
      {selectedBooking && (
        <div className="mt-6 bg-gray-50 border rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Job Details - {selectedBooking.bookingId}</h3>
            <button
              onClick={() => setSelectedBooking(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Booking Information</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Booking ID</p>
                  <p className="text-sm text-gray-900 font-mono">{selectedBooking.bookingId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-sm text-gray-900">{selectedBooking.userId || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Customer Details</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.customerName || selectedBooking.collectionName}</span>
                </div>
                               <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.customerEmail || selectedBooking.contactEmail || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.customerPhone || selectedBooking.contactPhone || 'N/A'}</span>
                </div> 
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Schedule & Service</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.selectedDate || selectedBooking.date}</span>
                </div>
                               <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.selectedTime || selectedBooking.time || selectedBooking.deliveryTime || 'Not specified'}</span>
                </div> 
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="capitalize">{selectedBooking.vehicleType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.parcelCount} parcel{selectedBooking.parcelCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Pricing</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>£{selectedBooking.basePrice || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT:</span>
                  <span>£{selectedBooking.vat || '0.00'}</span>
                </div>
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Total:</span>
                  <span>£{selectedBooking.totalPrice || selectedBooking.price}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Collection Address</p>
              <div className="bg-white p-3 rounded border">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{selectedBooking.collectionName}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.collectionAddress}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.collectionPostcode}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Delivery Address</p>
              <div className="bg-white p-3 rounded border">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{selectedBooking.deliveryName}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.deliveryAddress}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.deliveryPostcode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedBooking.additionalInfo && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Special Instructions</p>
              <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedBooking.additionalInfo}</p>
            </div>
          )}

                            {/* Action Buttons */}
          <div className="mb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
                             <button
                  onClick={async () => {
                    await handleStatusUpdate(selectedBooking.bookingId, 'accepted');
                    // Clear selected booking and switch to accepted tab
                    setSelectedBooking(null);
                    setTimeout(() => {
                      setStatusFilter('accepted');
                      setRefreshKey(prev => prev + 1);
                    }, 200);
                  }}
                  disabled={selectedBooking.status === 'accepted'}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                    selectedBooking.status === 'accepted' 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </button> 
              
                           <button
                onClick={async () => {
                  await handleStatusUpdate(selectedBooking.bookingId, 'declined');
                  // Clear selected booking and switch to declined tab
                  setSelectedBooking(null);
                  setTimeout(() => {
                    setStatusFilter('declined');
                    setRefreshKey(prev => prev + 1);
                  }, 200);
                }}
                disabled={selectedBooking.status === 'declined'}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  selectedBooking.status === 'declined' 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <X className="w-4 h-4" />
                Decline
              </button> 
              
              <button
                onClick={() => {
                  setShowOutsourceForm(true);
                }}
                disabled={selectedBooking.status === 'outsourced'}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  selectedBooking.status === 'outsourced' 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <Send className="w-4 h-4" />
                Outsource
              </button>

                           <button
                onClick={() => handleEditBooking(selectedBooking)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Booking
              </button> 
            </div> 

                       {/* Status-specific Actions */}
            <div className="flex flex-wrap gap-2">
 
              
                           {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'outsourced') && (
                <>
                                   <button
                    onClick={async () => {
                      await handleStatusUpdate(selectedBooking.bookingId, 'completed');
                      setTimeout(() => setStatusFilter('completed'), 100);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Completed
                  </button> 
                                   <button
                    onClick={async () => {
                      await handleStatusUpdate(selectedBooking.bookingId, 'cancelled');
                      setTimeout(() => setStatusFilter('cancelled'), 100);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel Booking
                  </button> 
                </>
              )} 

                           {(selectedBooking.status === 'declined' || selectedBooking.status === 'cancelled') && (
                <>
                                   <button
                    onClick={async () => {
                      await handleStatusUpdate(selectedBooking.bookingId, 'confirmed');
                      setTimeout(() => setStatusFilter('all'), 100);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Reactivate
                  </button> 
                </>
              )} 

                           {selectedBooking.status === 'completed' && (
                <>
                  <button
                    onClick={() => downloadReceipt(selectedBooking)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </button>
                                   <button
                    onClick={async () => {
                      await handleStatusUpdate(selectedBooking.bookingId, 'confirmed');
                      setTimeout(() => setStatusFilter('all'), 100);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Revert to Confirmed
                  </button> 
                </>
              )} 
            </div>
          </div> 

          {showOutsourceForm && (
            <div className="mt-6 p-4 bg-white rounded border border-purple-200">
              <h4 className="font-medium text-gray-900 mb-3">Outsource to Partner</h4>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Partner email address"
                  value={outsourceEmail}
                  onChange={(e) => setOutsourceEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEmailPreview(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Email
                  </button>
                  <button
                    onClick={handleOutsource}
                    disabled={!outsourceEmail}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send & Outsource
                  </button>
                  <button
                    onClick={() => setShowOutsourceForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showEmailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="text-sm bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {generateOutsourceEmail(selectedBooking)}
            </pre>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleOutsource}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Send Email
              </button>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
           )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Booking - {editingBooking.bookingId}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Collection Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Collection Details
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                  <input
                    type="text"
                    value={editFormData.collectionName}
                    onChange={(e) => setEditFormData({...editFormData, collectionName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Address</label>
                  <input
                    type="text"
                    value={editFormData.collectionAddress}
                    onChange={(e) => setEditFormData({...editFormData, collectionAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Postcode</label>
                  <input
                    type="text"
                    value={editFormData.collectionPostcode}
                    onChange={(e) => setEditFormData({...editFormData, collectionPostcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  Delivery Details
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Name</label>
                  <input
                    type="text"
                    value={editFormData.deliveryName}
                    onChange={(e) => setEditFormData({...editFormData, deliveryName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={editFormData.deliveryAddress}
                    onChange={(e) => setEditFormData({...editFormData, deliveryAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Postcode</label>
                  <input
                    type="text"
                    value={editFormData.deliveryPostcode}
                    onChange={(e) => setEditFormData({...editFormData, deliveryPostcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Schedule */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Schedule
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editFormData.selectedDate}
                    onChange={(e) => setEditFormData({...editFormData, selectedDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={editFormData.selectedTime}
                    onChange={(e) => setEditFormData({...editFormData, selectedTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-500" />
                  Service
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={editFormData.vehicleType}
                    onChange={(e) => setEditFormData({...editFormData, vehicleType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bike">Bike</option>
                    <option value="van">Van</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcel Count</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.parcelCount}
                    onChange={(e) => setEditFormData({...editFormData, parcelCount: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editFormData.isUrgent}
                      onChange={(e) => setEditFormData({...editFormData, isUrgent: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Urgent Delivery</span>
                  </label>
                </div>
              </div>

              {/* Pricing & Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Pricing & Status</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.basePrice}
                    onChange={(e) => setEditFormData({...editFormData, basePrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.vat}
                    onChange={(e) => setEditFormData({...editFormData, vat: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.totalPrice}
                    onChange={(e) => setEditFormData({...editFormData, totalPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="outsourced">Outsourced</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Contact */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Customer Contact
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                                       value={editFormData.customerEmail || editFormData.contactEmail}
                    onChange={(e) => setEditFormData({...editFormData, customerEmail: e.target.value, contactEmail: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                                       value={editFormData.customerPhone || editFormData.contactPhone}
                    onChange={(e) => setEditFormData({...editFormData, customerPhone: e.target.value, contactPhone: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Additional Information
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    rows={4}
                    value={editFormData.additionalInfo}
                    onChange={(e) => setEditFormData({...editFormData, additionalInfo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Special delivery instructions..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div> 
  ); 
} 
 