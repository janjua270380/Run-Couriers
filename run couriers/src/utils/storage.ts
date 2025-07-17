import  { BookingData, Address, Price } from '../types';
import { saveBookingToGoogleSheets, deleteBookingFromGoogleSheets } from './googleSheetsApi';

// Add a global property to window for temporary contact info storage
declare global {
  interface Window {
    bookingContactInfo?: {
      email: string;
      phone: string;
    };
    bookingAdditionalInfo?: string;
  }
}

// Function to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Store bookings in Google Sheets via JDoodle proxy
// With local storage fallback for demo purposes
export async function saveBooking(
  booking: {
    collection: Address;
    delivery: Address;
    selectedDate: string;
    isUrgent: boolean;
    vehicleType: 'bike' | 'van';
    parcelCount?: number;
    price: Price;
    bookingDate: string;
  },
  userId: string
): Promise<string> {
  try {
    // Create booking ID
    const bookingId = generateId();
    
    // Calculate modifiable until time (30 minutes from now)
    const modifiableUntil = new Date();
    modifiableUntil.setMinutes(modifiableUntil.getMinutes() + 30);
    
    // Get contact info from window or use defaults
    const contactEmail = window.bookingContactInfo?.email || '';
    const contactPhone = window.bookingContactInfo?.phone || '';
    const additionalInfo = window.bookingAdditionalInfo || '';
    
    // Create the full booking object
    const fullBooking: BookingData = {
      id: bookingId,
      ...booking,
      userId,
      status: 'pending', // All new bookings start as pending for admin approval
      modifiableUntil: modifiableUntil.toISOString(),
      canModify: true,
      contactEmail,
      contactPhone,
      additionalInfo,
      parcelCount: booking.parcelCount || 1
    };
    
    // Format data for Google Sheets format
    const formattedData = {
      bookingId: fullBooking.id,
      collectionName: fullBooking.collection.name,
      collectionAddress: fullBooking.collection.address,
      collectionStreet: fullBooking.collection.street || '',
      collectionCity: fullBooking.collection.city || '',
      collectionCounty: fullBooking.collection.county || '',
      collectionBuilding: fullBooking.collection.building || '',
      collectionPostcode: fullBooking.collection.postcode,
      deliveryName: fullBooking.delivery.name,
      deliveryAddress: fullBooking.delivery.address,
      deliveryStreet: fullBooking.delivery.street || '',
      deliveryCity: fullBooking.delivery.city || '',
      deliveryCounty: fullBooking.delivery.county || '',
      deliveryBuilding: fullBooking.delivery.building || '',
      deliveryPostcode: fullBooking.delivery.postcode,
      date: new Date(fullBooking.selectedDate).toLocaleDateString("en-GB"),
      deliveryTime: new Date(fullBooking.selectedDate).toLocaleTimeString("en-US", {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      isUrgent: fullBooking.isUrgent ? "Yes" : "No",
      vehicleType: fullBooking.vehicleType,
      // CRITICAL: Make sure parcel count is explicitly included
      parcelCount: fullBooking.parcelCount || 1,
      basePrice: fullBooking.price.base.toFixed(2),
      vat: fullBooking.price.vat.toFixed(2),
      totalPrice: fullBooking.price.total.toFixed(2),
      userId: fullBooking.userId,
      status: fullBooking.status,
      modifiableUntil: new Date(fullBooking.modifiableUntil).toLocaleString(),
      contactEmail: fullBooking.contactEmail,
      contactPhone: fullBooking.contactPhone,
      additionalInfo: fullBooking.additionalInfo,
      timestamp: new Date().toLocaleString(),
      // Add explicit action flag to avoid confusion with registration
      action: 'saveBooking'
    };
 

    // Always save to localStorage (backup/local copy)
    const existingBookings = localStorage.getItem('deliveryBookings');
    const bookings = existingBookings ? JSON.parse(existingBookings) : [];
    bookings.push(formattedData);
    localStorage.setItem('deliveryBookings', JSON.stringify(bookings));
    
    try {
      // Attempt to save to Google Sheets via JDoodle proxy
      // This is now designed to not throw errors that would disrupt the booking flow
      await saveBookingToGoogleSheets(formattedData);
    } catch (googleSheetsError) {
      // This should never happen with the new implementation, but just in case
      console.warn('Google Sheets integration non-critical error:', googleSheetsError);
    }
    
    return bookingId;
  } catch (error) {
    console.error('Error saving booking:', error);
    return Promise.reject(new Error('Failed to save booking. Please try again.'));
  }
}

// Update bookings in both local storage and Google Sheets
export async function updateBooking(bookingId: string, updatedData: Partial<BookingData>): Promise<void> {
  try {
    const existingBookings = localStorage.getItem('deliveryBookings');
    if (!existingBookings) return Promise.reject(new Error('No bookings found'));
    
    const bookings = JSON.parse(existingBookings);
    const index = bookings.findIndex((b: any) => b.bookingId === bookingId);
    
    if (index === -1) return Promise.reject(new Error('Booking not found'));
    
    // Update the booking
    const updatedBooking = {
      ...bookings[index],
      ...updatedData,
      // Update timestamp
      timestamp: new Date().toLocaleString()
    };
    
    bookings[index] = updatedBooking;
    
    // Save to local storage
    localStorage.setItem('deliveryBookings', JSON.stringify(bookings));
    
    // Try to update in Google Sheets - errors here won't disrupt the process
    try {
      await saveBookingToGoogleSheets({
        ...updatedBooking,
        action: 'update' // Indicate this is an update operation
      });
    } catch (googleSheetsError) {
      console.warn('Google Sheets update non-critical error:', googleSheetsError);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error updating booking:', error);
    return Promise.reject(new Error('Failed to update booking. Please try again.'));
  }
}

// Delete booking from both local storage and Google Sheets
export async function deleteBooking(bookingId: string): Promise<void> {
  try {
    const existingBookings = localStorage.getItem('deliveryBookings');
    if (!existingBookings) return Promise.reject(new Error('No bookings found'));
    
    const bookings = JSON.parse(existingBookings);
    const filteredBookings = bookings.filter((b: any) => b.bookingId !== bookingId);
    
    if (bookings.length === filteredBookings.length) {
      return Promise.reject(new Error('Booking not found'));
    }
    
    // Save updated bookings to local storage
    localStorage.setItem('deliveryBookings', JSON.stringify(filteredBookings));
    
    // Try to delete from Google Sheets - errors here won't disrupt the process
    try {
      await deleteBookingFromGoogleSheets(bookingId);
    } catch (googleSheetsError) {
      console.warn('Google Sheets deletion non-critical error:', googleSheetsError);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error deleting booking:', error);
    return Promise.reject(new Error('Failed to delete booking. Please try again.'));
  }
}

// Get all bookings from local storage
export function getAllBookings(): Array<any> {
  const existingBookings = localStorage.getItem('deliveryBookings');
  return existingBookings ? JSON.parse(existingBookings) : [];
}

// Get bookings (alias for getAllBookings)
export function getBookings(): Array<any> {
  return getAllBookings();
}

// Get user bookings
export function getUserBookings(userId: string): Array<any> {
  const allBookings = getAllBookings();
  return allBookings.filter((booking: any) => booking.userId === userId);
}

// Get booking by ID
export function getBookingById(bookingId: string): any {
  const allBookings = getAllBookings();
  return allBookings.find((booking: any) => booking.bookingId === bookingId);
}

// Check and update booking modifiable status
export function updateBookingStatuses(): void {
  const existingBookings = localStorage.getItem('deliveryBookings');
  if (!existingBookings) return;
  
  const bookings = JSON.parse(existingBookings);
  const now = new Date();
  let updated = false;
  
  bookings.forEach((booking: any) => {
    const modifiableUntil = new Date(booking.modifiableUntil);
    
    // If the booking was modifiable and the time has passed
    // Note: Now only confirmed bookings auto-progress to the next stage
    // Pending bookings need admin approval
    if (booking.status === 'confirmed' && now > modifiableUntil) {
      booking.canModify = false; // This affects UI indication
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem('deliveryBookings', JSON.stringify(bookings));
  }
}
 