import   { useState, useEffect } from 'react';
import { getUserBookings, updateBooking, getBookingById } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, Eye, CheckCircle, AlertTriangle, XCircle, RefreshCw, Calendar, Bike, Truck, Info, Edit, MapPin, Search, ExternalLink, Download } from 'lucide-react'; 
import { BookingDetails } from './BookingDetails';

interface UserBookingsProps {
  onBack: () => void;
}

export function UserBookings({ onBack }: UserBookingsProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [viewBookingDetails, setViewBookingDetails] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Update bookings list periodically
  useEffect(() => {
    if (!user) return;
    
    // Update initial data
    loadBookings();
    
    // Set up interval to check for bookings that can no longer be modified
    const intervalId = setInterval(() => {
      loadBookings();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  const loadBookings = () => {
    if (!user) return;
    
    const userBookings = getUserBookings(user.id);
    setBookings(userBookings);
    setLoading(false);
  };
  
  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;
    
    setIsUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      await updateBooking(bookingId, { status: 'cancelled' });
      setSuccess('Your booking has been cancelled successfully');
      loadBookings();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };
  
   const getStatusBadge = (status: string, canModify: boolean) => {
    const statusText = typeof status === 'object' ? status.status || 'Unknown' : status;
    
    switch (statusText) {
      case 'pending':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            {canModify ? 'Pending (Can Modify)' : 'Pending Approval'}
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'outsourced':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-purple-100 text-purple-800">
            <ExternalLink className="w-3 h-3" />
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
      case 'completed':
        return (
          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-none font-semibold rounded-full bg-purple-100 text-purple-800">
            <CheckCircle className="w-3 h-3" />
            Completed
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
            {String(statusText)}
          </span>
        );
    }
  }; 
  
  const getTimeRemaining = (modifiableUntil: string) => {
    const now = new Date();
    const endTime = new Date(modifiableUntil);
    const diffMs = endTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Time expired';
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s remaining`;
  };
  
  // Function to extract time from date 
   const extractTimeFromDate = (dateString: string) => {
    try {
      // Try to parse the date string
      const date = new Date(dateString);
      
      // Return time in 12-hour format
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      // If there's an error parsing the date, just return the original string
      return dateString;
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
Status: ${booking.status?.toUpperCase() || 'COMPLETED'}
Service Date: ${booking.date}
Service Time: ${extractTimeFromDate(booking.deliveryTime || booking.date)}
Vehicle Type: ${booking.vehicleType?.toUpperCase()}
Parcel Count: ${booking.parcelCount || '1'}
${booking.isUrgent === 'Yes' ? 'Service Type: URGENT DELIVERY' : 'Service Type: STANDARD DELIVERY'}

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
${booking.collectionBuilding ? `Building: ${booking.collectionBuilding}` : ''}
${booking.collectionCity ? `City: ${booking.collectionCity}` : ''}
${booking.collectionCounty ? `County: ${booking.collectionCounty}` : ''}
Postcode: ${booking.collectionPostcode}

-------------------------------------
DELIVERY ADDRESS
-------------------------------------
Name/Business: ${booking.deliveryName}
Address: ${booking.deliveryAddress}
${booking.deliveryBuilding ? `Building: ${booking.deliveryBuilding}` : ''}
${booking.deliveryCity ? `City: ${booking.deliveryCity}` : ''}
${booking.deliveryCounty ? `County: ${booking.deliveryCounty}` : ''}
Postcode: ${booking.deliveryPostcode}

-------------------------------------
PRICING BREAKDOWN
-------------------------------------
Base Price: £${booking.basePrice || '0.00'}
VAT (20%): £${booking.vat || '0.00'}
${booking.isUrgent === 'Yes' ? 'Urgent Surcharge: INCLUDED' : ''}
-------------------------------------
TOTAL AMOUNT: £${booking.totalPrice}
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
      const bookingStatus = typeof booking.status === 'object' ? booking.status.status || 'pending' : booking.status;
      return matchesSearch && bookingStatus === filter;
    } 
  });

  if (viewBookingDetails) {
    const booking = getBookingById(viewBookingDetails);
    if (!booking) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setViewBookingDetails(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Booking Not Found</h2>
          </div>
          <div className="bg-red-50 p-4 rounded-md text-red-700">
            <p>The booking you are looking for could not be found. It may have been deleted.</p>
          </div>
          <button
            onClick={() => setViewBookingDetails(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to My Bookings
          </button>
        </div>
      );
    }
    
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
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          My Bookings
        </h2>
        
        <button 
          onClick={loadBookings}
          className="ml-auto p-2 text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="col-span-1 md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, postcode, or address..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="col-span-1">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending Only</option>
              <option value="confirmed">Approved Only</option>
              <option value="outsourced">Outsourced Only</option>
              <option value="declined">Declined Only</option>
              <option value="completed">Completed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">You don't have any bookings yet</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Your First Booking
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Info className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No bookings match your search criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From → To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                               {filteredBookings.map((booking, index) => {
                  const bookingStatus = typeof booking.status === 'object' ? booking.status.status || 'pending' : booking.status;
                  const isModifiable = bookingStatus === 'pending' && new Date() < new Date(booking.modifiableUntil);
                  const canCancel = bookingStatus !== 'cancelled' && bookingStatus !== 'completed'; 
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 gap-2">
                          {booking.vehicleType === 'bike' ? (
                            <Bike className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Truck className="w-4 h-4 text-blue-600" />
                          )}
                          {booking.vehicleType === 'bike' ? 'Bike' : 'Van'}
                          {booking.isUrgent === 'Yes' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 gap-1">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-medium">{booking.collectionPostcode}</div>
                            <div className="text-gray-500 text-xs flex items-center">
                              <ArrowLeft className="w-3 h-3 rotate-180" />
                              {booking.deliveryPostcode}
                            </div>
                          </div>
                        </div>
                      </td>
                                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.date}
                        <div className="text-xs text-blue-600">
                          {extractTimeFromDate(booking.deliveryTime || booking.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                                               <div>
                          {getStatusBadge(bookingStatus, isModifiable)}
                          {isModifiable && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              {getTimeRemaining(booking.modifiableUntil)}
                            </div>
                          )}
                          {booking.outsourcedTo && (
                            <div className="text-xs text-purple-600 mt-1">
                              Partner: {booking.outsourcedTo}
                            </div>
                          )}
                        </div> 
                      </td> 
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        £{booking.totalPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewBookingDetails(booking.bookingId)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            title="View booking details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          
                                                                            {(bookingStatus === 'completed' || bookingStatus === 'confirmed') && (
                            <button
                              onClick={() => downloadReceipt(booking)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1"
                              title="Download receipt"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">Receipt</span>
                            </button>
                          )} 

                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(booking.bookingId)}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-800 disabled:text-gray-400 flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Cancel</span>
                            </button>
                          )}
                          
                          {isModifiable && (
                            <button
                              onClick={() => setViewBookingDetails(booking.bookingId)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          )} 
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {selectedBooking && (() => {
            const booking = bookings.find(b => b.bookingId === selectedBooking);
            if (!booking) return null;
            
            return (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>Booking Details</span>
                  <div className="flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {booking.vehicleType === 'bike' ? (
                      <Bike className="w-3 h-3" />
                    ) : (
                      <Truck className="w-3 h-3" />
                    )}
                    {booking.vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
                  </div>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Collection Address</h4>
                      <p className="text-sm">
                        <span className="font-medium">{booking.collectionName}</span><br />
                        {booking.collectionBuilding && `${booking.collectionBuilding}, `}
                        {booking.collectionAddress}<br />
                        {booking.collectionCity && `${booking.collectionCity}, `}
                        {booking.collectionCounty && booking.collectionCounty !== booking.collectionCity && `${booking.collectionCounty}, `}
                        {booking.collectionPostcode}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Pricing</h4>
                      <p className="text-sm">
                        Base Price: £{booking.basePrice}<br />
                        VAT (20%): £{booking.vat}<br />
                        <span className="font-medium">Total: £{booking.totalPrice}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Delivery Address</h4>
                      <p className="text-sm">
                        <span className="font-medium">{booking.deliveryName}</span><br />
                        {booking.deliveryBuilding && `${booking.deliveryBuilding}, `}
                        {booking.deliveryAddress}<br />
                        {booking.deliveryCity && `${booking.deliveryCity}, `}
                        {booking.deliveryCounty && booking.deliveryCounty !== booking.deliveryCity && `${booking.deliveryCounty}, `}
                        {booking.deliveryPostcode}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Collection Info</h4>
                      <p className="text-sm">
                        Date: {booking.date}<br />
                        Time: {extractTimeFromDate(booking.deliveryTime || booking.date)}<br />
                        Urgent: {booking.isUrgent}<br />
                        Status: {booking.status}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Show outsourced information if applicable */}
                {booking.status === 'outsourced' && booking.outsourcedTo && (
                  <div className="mt-4 bg-purple-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Outsourced Details</h4>
                    <p className="text-sm text-gray-600">
                      This delivery has been outsourced to: <span className="font-medium">{booking.outsourcedTo}</span>
                      {booking.outsourcedPhone && (
                        <span className="block mt-1">Contact: {booking.outsourcedPhone}</span>
                      )}
                      {booking.outsourcedNotes && (
                        <span className="block mt-1">Notes: {booking.outsourcedNotes}</span>
                      )}
                    </p>
                  </div>
                )}
                
                {/* Show decline reason if applicable */}
                {booking.status === 'declined' && booking.declineReason && (
                  <div className="mt-4 bg-red-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Decline Reason</h4>
                    <p className="text-sm text-gray-600">
                      {booking.declineReason}
                    </p>
                  </div>
                )}
                
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handleCancelBooking(booking.bookingId)}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                    >
                      {isUpdating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Cancel Booking
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {booking.status === 'pending' && new Date() < new Date(booking.modifiableUntil) && (
                  <div className="mt-4 bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        You can modify or cancel this booking until {new Date(booking.modifiableUntil).toLocaleTimeString()}
                        {' '} ({getTimeRemaining(booking.modifiableUntil)})
                      </span>
                    </p>
                  </div>
                )}
                
                {booking.status === 'pending' && (
                  <div className="mt-4 bg-amber-50 p-3 rounded-md">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        This booking is awaiting approval from our admin team. We'll notify you once it's reviewed.
                      </span>
                    </p>
                  </div>
                )}
                
                {booking.status === 'confirmed' && (
                  <div className="mt-4 bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Your booking has been approved and is scheduled for collection!
                      </span>
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
 