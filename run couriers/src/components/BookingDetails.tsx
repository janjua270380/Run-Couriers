import   { useState, useEffect } from 'react';
import { updateBooking } from '../utils/storage';
import  { ArrowLeft, Clock, Calendar, Truck, Bike, XCircle, CheckCircle, AlertTriangle, Edit, Save, Mail, Phone, User, MapPin, FileText, Package, Download } from 'lucide-react'; 

interface BookingDetailsProps {
  bookingId: string;
  onBack: () => void;
  onRefresh: () => void;
  booking: any;
}

export function BookingDetails({ bookingId, onBack, onRefresh, booking }: BookingDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState({
    status: booking.status || 'pending',
    collectionName: booking.collectionName || '',
    collectionAddress: booking.collectionAddress || '',
    collectionPostcode: booking.collectionPostcode || '',
    deliveryName: booking.deliveryName || '',
    deliveryAddress: booking.deliveryAddress || '',
    deliveryPostcode: booking.deliveryPostcode || '',
    date: booking.date || '',
    deliveryTime: booking.deliveryTime || '',
    isUrgent: booking.isUrgent || 'No',
    parcelCount: booking.parcelCount || 1,
    notes: booking.notes || '',
    contactEmail: booking.contactEmail || '',
    contactPhone: booking.contactPhone || '',
    additionalInfo: booking.additionalInfo || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Update local state if booking changes
  useEffect(() => {
    if (booking) {
      setEditedBooking({
        status: booking.status || 'pending',
        collectionName: booking.collectionName || '',
        collectionAddress: booking.collectionAddress || '',
        collectionPostcode: booking.collectionPostcode || '',
        deliveryName: booking.deliveryName || '',
        deliveryAddress: booking.deliveryAddress || '',
        deliveryPostcode: booking.deliveryPostcode || '',
        date: booking.date || '',
        deliveryTime: booking.deliveryTime || '',
        isUrgent: booking.isUrgent || 'No',
        parcelCount: booking.parcelCount || 1,
        notes: booking.notes || '',
        contactEmail: booking.contactEmail || '',
        contactPhone: booking.contactPhone || '',
        additionalInfo: booking.additionalInfo || '',
      });
    }
  }, [booking]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Update price if isUrgent has changed
      if (editedBooking.isUrgent !== booking.isUrgent) {
        // Get the base price
        const basePrice = parseFloat(booking.basePrice);
        const urgentMultiplier = 1.5; // Default multiplier, in a real app this would be loaded from settings
        
        // Calculate new prices based on urgency
        let newBasePrice = basePrice;
        if (booking.isUrgent === 'Yes' && editedBooking.isUrgent === 'No') {
          // If changing from urgent to non-urgent, divide by the multiplier
          newBasePrice = basePrice / urgentMultiplier;
        } else if (booking.isUrgent === 'No' && editedBooking.isUrgent === 'Yes') {
          // If changing from non-urgent to urgent, multiply by the multiplier
          newBasePrice = basePrice * urgentMultiplier;
        }
        
        // Round to 2 decimal places
        newBasePrice = Math.round(newBasePrice * 100) / 100;
        const vatRate = 0.20; // 20% VAT, should be loaded from settings in real app
        const newVat = Math.round(newBasePrice * vatRate * 100) / 100;
        const newTotal = Math.round((newBasePrice + newVat) * 100) / 100;
        
        // Add the new price to the edited booking
        const updatedBookingWithPrice = {
          ...editedBooking,
          basePrice: newBasePrice.toFixed(2),
          vat: newVat.toFixed(2),
          totalPrice: newTotal.toFixed(2)
        };
        
        await updateBooking(bookingId, updatedBookingWithPrice);
      } else {
        // No price change needed, just update the booking
        await updateBooking(bookingId, editedBooking);
      }
      
      setSuccess('Booking updated successfully');
      setIsEditing(false);
      onRefresh(); // Refresh the parent component's booking list
    } catch (err) {
      setError((err as Error).message || 'Failed to update booking');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    setEditedBooking({
      status: booking.status || 'pending',
      collectionName: booking.collectionName || '',
      collectionAddress: booking.collectionAddress || '',
      collectionPostcode: booking.collectionPostcode || '',
      deliveryName: booking.deliveryName || '',
      deliveryAddress: booking.deliveryAddress || '',
      deliveryPostcode: booking.deliveryPostcode || '',
      date: booking.date || '',
      deliveryTime: booking.deliveryTime || '',
      isUrgent: booking.isUrgent || 'No',
      parcelCount: booking.parcelCount || 1,
      notes: booking.notes || '',
      contactEmail: booking.contactEmail || '',
      contactPhone: booking.contactPhone || '',
      additionalInfo: booking.additionalInfo || '',
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateBooking(bookingId, { status: newStatus });
      setSuccess(`Booking marked as ${newStatus}`);
      onRefresh(); // Refresh the parent component's booking list
    } catch (err) {
      setError((err as Error).message || 'Failed to update booking status');
    } finally {
      setIsSaving(false);
    }
  };

   const downloadReceipt = () => {
    const receiptContent = `
DELIVERY RECEIPT
=====================================

Receipt ID: REC-${bookingId}
Date Issued: ${new Date().toLocaleDateString('en-GB')}
Time Issued: ${new Date().toLocaleTimeString('en-GB')}

-------------------------------------
BOOKING DETAILS
-------------------------------------
Booking ID: ${bookingId}
Status: ${booking.status?.toUpperCase() || 'COMPLETED'}
Service Date: ${booking.date}
Service Time: ${booking.deliveryTime}
Vehicle Type: ${booking.vehicleType?.toUpperCase()}
Parcel Count: ${booking.parcelCount || '1'}
${booking.isUrgent === 'Yes' ? 'Service Type: URGENT DELIVERY' : 'Service Type: STANDARD DELIVERY'}

-------------------------------------
CUSTOMER INFORMATION
-------------------------------------
Name: ${booking.customerName || booking.collectionName}
Email: ${booking.contactEmail || 'N/A'}
Phone: ${booking.contactPhone || 'N/A'}

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

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `receipt-${bookingId}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateEmailPreview = () => { 
    let subject;
    let content;
    
    switch (booking.status) {
      case 'pending':
        subject = `Delivery Booking Confirmation - ${bookingId.substring(0, 8)}`;
        content = `
Dear ${booking.collectionName},

Thank you for your booking with our delivery service. Your booking has been received and is pending confirmation.

Booking Details:
- Booking ID: ${bookingId.substring(0, 8)}
- Collection Date: ${booking.date}
- Collection Time: ${booking.deliveryTime}
- Parcel Count: ${booking.parcelCount || 1}
- Collection Address: ${booking.collectionAddress}, ${booking.collectionPostcode}
- Delivery Address: ${booking.deliveryAddress}, ${booking.deliveryPostcode}
- Service Type: ${booking.vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
- Urgent Delivery: ${booking.isUrgent}
- Total Price: £${booking.totalPrice}

${booking.additionalInfo ? `Special Instructions: ${booking.additionalInfo}` : ''}

We will confirm your booking shortly. You can modify or cancel this booking within 30 minutes of submission.

Thank you for choosing our delivery service.

Best regards,
Your Delivery Team
        `;
        break;
        
      case 'confirmed':
        subject = `Delivery Booking Confirmed - ${bookingId.substring(0, 8)}`;
        content = `
Dear ${booking.collectionName},

Your delivery booking has been confirmed and scheduled!

Confirmed Booking Details:
- Booking ID: ${bookingId.substring(0, 8)}
- Collection Date: ${booking.date}
- Collection Time: ${booking.deliveryTime}
- Parcel Count: ${booking.parcelCount || 1}
- Collection Address: ${booking.collectionAddress}, ${booking.collectionPostcode}
- Delivery Address: ${booking.deliveryAddress}, ${booking.deliveryPostcode}
- Service Type: ${booking.vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
- Urgent Delivery: ${booking.isUrgent}
- Total Price: £${booking.totalPrice}

${booking.additionalInfo ? `Special Instructions: ${booking.additionalInfo}` : ''}

Our driver will contact you approximately 30 minutes before arrival. Please ensure someone is available at the collection address to hand over the package.

If you need to make any changes to your booking, please contact our customer service team as soon as possible.

Thank you for choosing our delivery service.

Best regards,
Your Delivery Team
        `;
        break;
        
      case 'completed':
        subject = `Delivery Completed - ${bookingId.substring(0, 8)}`;
        content = `
Dear ${booking.collectionName},

We are pleased to inform you that your delivery has been completed successfully.

Delivery Details:
- Booking ID: ${bookingId.substring(0, 8)}
- Collection Date: ${booking.date}
- Collection Time: ${booking.deliveryTime}
- Parcel Count: ${booking.parcelCount || 1}
- Collection Address: ${booking.collectionAddress}, ${booking.collectionPostcode}
- Delivery Address: ${booking.deliveryAddress}, ${booking.deliveryPostcode}
- Service Type: ${booking.vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
- Total Price: £${booking.totalPrice}

We hope you are satisfied with our service. If you have any feedback or questions, please don't hesitate to contact us.

Thank you for choosing our delivery service. We look forward to serving you again.

Best regards,
Your Delivery Team
        `;
        break;
        
      case 'cancelled':
        subject = `Delivery Booking Cancelled - ${bookingId.substring(0, 8)}`;
        content = `
Dear ${booking.collectionName},

Your delivery booking has been cancelled as requested.

Cancelled Booking Details:
- Booking ID: ${bookingId.substring(0, 8)}
- Collection Date: ${booking.date}
- Collection Time: ${booking.deliveryTime}
- Parcel Count: ${booking.parcelCount || 1}
- Collection Address: ${booking.collectionAddress}, ${booking.collectionPostcode}
- Delivery Address: ${booking.deliveryAddress}, ${booking.deliveryPostcode}
- Service Type: ${booking.vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
- Total Price: £${booking.totalPrice}

If you did not request this cancellation or if you have any questions, please contact our customer service team immediately.

Thank you for considering our delivery service.

Best regards,
Your Delivery Team
        `;
        break;
      
      default:
        subject = `Delivery Booking Update - ${bookingId.substring(0, 8)}`;
        content = `
Dear ${booking.collectionName},

We are writing to inform you about an update to your delivery booking.

Booking Details:
- Booking ID: ${bookingId.substring(0, 8)}
- Collection Date: ${booking.date}
- Collection Time: ${booking.deliveryTime}
- Parcel Count: ${booking.parcelCount || 1}
- Collection Address: ${booking.collectionAddress}, ${booking.collectionPostcode}
- Delivery Address: ${booking.deliveryAddress}, ${booking.deliveryPostcode}
- Service Type: ${booking.vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
- Total Price: £${booking.totalPrice}

${booking.additionalInfo ? `Special Instructions: ${booking.additionalInfo}` : ''}

If you have any questions about this update, please contact our customer service team.

Thank you for choosing our delivery service.

Best regards,
Your Delivery Team
        `;
    }
    
    setEmailContent(`Subject: ${subject}\n\n${content}`);
    setShowEmailPreview(true);
  };

  // Function to get a badge for the current status
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

  // Format address function to avoid repetition
  const formatAddress = (name: string, address: string, postcode: string) => {
    return `${name}, ${address}, ${postcode}`;
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
            <span>Booking #{bookingId.substring(0, 8)}</span>
            <div className="ml-2">
              {getStatusBadge(booking.status || 'pending')}
            </div>
          </h2>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Edit Booking
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-3 rounded-md text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-3 rounded-md text-green-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Vehicle type indicator */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          {booking.vehicleType === 'bike' ? (
            <Bike className="w-5 h-5 text-blue-700" />
          ) : (
            <Truck className="w-5 h-5 text-blue-700" />
          )}
          <div>
            <p className="font-medium text-blue-900">
              {booking.vehicleType === 'bike' ? 'Bike Courier' : 'Delivery Van'}
            </p>
            {booking.isUrgent === 'Yes' && (
              <p className="text-xs text-amber-600 font-medium">Urgent Delivery</p>
            )}
          </div>
          <div className="ml-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-700" />
            <span className="font-medium text-blue-900">
              {booking.parcelCount || 1} {booking.parcelCount === 1 ? 'Parcel' : 'Parcels'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collection Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Collection Details
          </h3>
          
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name/Department
                </label>
                <input
                  id="collectionName"
                  type="text"
                  value={editedBooking.collectionName}
                  onChange={(e) => setEditedBooking({...editedBooking, collectionName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="collectionAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  id="collectionAddress"
                  type="text"
                  value={editedBooking.collectionAddress}
                  onChange={(e) => setEditedBooking({...editedBooking, collectionAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="collectionPostcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  id="collectionPostcode"
                  type="text"
                  value={editedBooking.collectionPostcode}
                  onChange={(e) => setEditedBooking({...editedBooking, collectionPostcode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Name/Department:</span><br />
                {booking.collectionName}
              </p>
              
              <p className="text-sm">
                <span className="font-medium text-gray-700">Address:</span><br />
                {booking.collectionAddress}
              </p>
              
              <p className="text-sm">
                <span className="font-medium text-gray-700">Postcode:</span><br />
                {booking.collectionPostcode}
              </p>
            </div>
          )}
        </div>

        {/* Delivery Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Delivery Details
          </h3>
          
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="deliveryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name/Department
                </label>
                <input
                  id="deliveryName"
                  type="text"
                  value={editedBooking.deliveryName}
                  onChange={(e) => setEditedBooking({...editedBooking, deliveryName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  id="deliveryAddress"
                  type="text"
                  value={editedBooking.deliveryAddress}
                  onChange={(e) => setEditedBooking({...editedBooking, deliveryAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryPostcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  id="deliveryPostcode"
                  type="text"
                  value={editedBooking.deliveryPostcode}
                  onChange={(e) => setEditedBooking({...editedBooking, deliveryPostcode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Name/Department:</span><br />
                {booking.deliveryName}
              </p>
              
              <p className="text-sm">
                <span className="font-medium text-gray-700">Address:</span><br />
                {booking.deliveryAddress}
              </p>
              
              <p className="text-sm">
                <span className="font-medium text-gray-700">Postcode:</span><br />
                {booking.deliveryPostcode}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Contact Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-600" />
          Contact Information
        </h3>
        
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="contactEmail"
                type="email"
                value={editedBooking.contactEmail}
                onChange={(e) => setEditedBooking({...editedBooking, contactEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={editedBooking.contactPhone}
                onChange={(e) => setEditedBooking({...editedBooking, contactPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Email:</span><br />
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  {booking.contactEmail || 'Not provided'}
                </span>
              </p>
            </div>
            
            <div>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Phone:</span><br />
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-blue-600" />
                  {booking.contactPhone || 'Not provided'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Parcel Information */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-green-600" />
          Parcel Information
        </h3>
        
        {isEditing ? (
          <div>
            <label htmlFor="parcelCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Parcels
            </label>
            <input
              id="parcelCount"
              type="number"
              min="1"
              value={editedBooking.parcelCount}
              onChange={(e) => setEditedBooking({...editedBooking, parcelCount: parseInt(e.target.value) || 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        ) : (
          <div>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Number of Parcels:</span><br />
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4 text-green-600" />
                {booking.parcelCount || 1} {(booking.parcelCount || 1) === 1 ? 'parcel' : 'parcels'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Additional Information */}
      {(booking.additionalInfo || isEditing) && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            Special Instructions
          </h3>
          
          {isEditing ? (
            <div>
              <textarea
                id="additionalInfo"
                value={editedBooking.additionalInfo}
                onChange={(e) => setEditedBooking({...editedBooking, additionalInfo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Special delivery instructions or notes for the courier"
              ></textarea>
            </div>
          ) : booking.additionalInfo ? (
            <div className="bg-white p-3 rounded-md border border-green-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.additionalInfo}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No special instructions provided</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scheduling Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Collection Schedule
          </h3>
          
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  id="date"
                  type="text"
                  value={editedBooking.date}
                  onChange={(e) => setEditedBooking({...editedBooking, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  id="deliveryTime"
                  type="text"
                  value={editedBooking.deliveryTime}
                  onChange={(e) => setEditedBooking({...editedBooking, deliveryTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="isUrgent" className="block text-sm font-medium text-gray-700 mb-1">
                  Urgent Delivery
                </label>
                <select
                  id="isUrgent"
                  value={editedBooking.isUrgent}
                  onChange={(e) => setEditedBooking({...editedBooking, isUrgent: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Date:</span><br />
                {booking.date}
              </p>
              
              <p className="text-sm">
                <span className="font-medium text-gray-700">Time:</span><br />
                {booking.deliveryTime}
              </p>
              
              <p className="text-sm">
                <span className="font-medium text-gray-700">Urgent Delivery:</span><br />
                {booking.isUrgent}
              </p>
            </div>
          )}
        </div>

        {/* Pricing and Additional Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Pricing Details</h3>
          
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Base Price:</span><br />
              £{booking.basePrice}
            </p>
            
            <p className="text-sm">
              <span className="font-medium text-gray-700">VAT (20%):</span><br />
              £{booking.vat}
            </p>
            
            <p className="text-sm">
              <span className="font-medium text-gray-700">Total Price:</span><br />
              <span className="text-lg font-semibold text-green-700">£{booking.totalPrice}</span>
            </p>
          </div>
          
          {isEditing && (
            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes
              </label>
              <textarea
                id="notes"
                value={editedBooking.notes}
                onChange={(e) => setEditedBooking({...editedBooking, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Add private notes about this booking"
              />
            </div>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Customer Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm">
              <span className="font-medium text-gray-700">User ID:</span><br />
              {booking.userId || 'Anonymous'}
              {booking.userDeleted && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  Account Deleted
                </span>
              )}
            </p>
            
            <p className="text-sm mt-2">
              <span className="font-medium text-gray-700">Booking Date:</span><br />
              {booking.timestamp || 'Not recorded'}
            </p>
          </div>
          
          <div>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Modifiable Until:</span><br />
              {booking.modifiableUntil || 'Not applicable'}
            </p>
            
            <p className="text-sm mt-2">
              <span className="font-medium text-gray-700">Booking ID:</span><br />
              <span className="font-mono">{bookingId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Admin Actions</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('pending')}
            disabled={isSaving || booking.status === 'pending'}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50 flex items-center gap-1"
          >
            <Clock className="w-4 h-4" />
            Mark as Pending
          </button>
          
          <button
            onClick={() => handleStatusChange('confirmed')}
            disabled={isSaving || booking.status === 'confirmed'}
            className="px-3 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50 flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Booking
          </button>
          
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={isSaving || booking.status === 'completed'}
            className="px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Completed
          </button>
          
          <button
            onClick={() => handleStatusChange('cancelled')}
            disabled={isSaving || booking.status === 'cancelled'}
            className="px-3 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 disabled:opacity-50 flex items-center gap-1"
          >
            <XCircle className="w-4 h-4" />
            Cancel Booking
          </button>
          
          <button
            onClick={generateEmailPreview}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
          >
            <Mail className="w-4 h-4" />
            Preview Email Notification
          </button>
          
                   <button
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
          >
            <Phone className="w-4 h-4" />
            Contact Customer
          </button>
          
          {(booking.status === 'completed' || booking.status === 'confirmed') && (
            <button
              onClick={() => downloadReceipt()}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
          )} 
        </div>
        
        {booking.notes && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
            <p className="text-sm text-gray-600 mt-1">{booking.notes}</p>
          </div>
        )}
      </div>

      {/* Email Preview Dialog */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Preview
              </h3>
              <button 
                onClick={() => setShowEmailPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
              <pre className="whitespace-pre-wrap">{emailContent}</pre>
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 