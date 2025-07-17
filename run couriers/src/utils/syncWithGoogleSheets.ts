import  { fetchBookingsFromGoogleSheets } from './googleSheetsApi';
import { updateBooking, saveBooking, deleteBooking } from './storage';

// Function to sync bookings from Google Sheets to local storage
export async function syncBookingsFromGoogleSheets() {
  try {
    console.log("Starting sync from Google Sheets to local storage...");
    
    // Fetch bookings from Google Sheets
    const sheetsResult = await fetchBookingsFromGoogleSheets();
    
    if (!sheetsResult.success || !sheetsResult.bookings) {
      throw new Error(sheetsResult.error || "Failed to fetch bookings from Google Sheets");
    }
    
    console.log(`Fetched ${sheetsResult.bookings.length} bookings from Google Sheets`);
    
    // Process and save each booking to local storage
    let updatedCount = 0;
    let newCount = 0;
    
    for (const booking of sheetsResult.bookings) {
      // Format the booking data consistently
      const formattedBooking = {
        bookingId: booking.bookingId || booking["Booking ID"] || `bk_${Math.random().toString(36).substring(2, 10)}`,
        timestamp: booking.timestamp || booking["Timestamp"] || new Date().toLocaleString(),
        collectionName: booking.collectionName || booking["Collection Name"] || "",
        collectionAddress: booking.collectionAddress || booking["Collection Address"] || "",
        collectionPostcode: booking.collectionPostcode || booking["Collection Postcode"] || "",
        deliveryName: booking.deliveryName || booking["Delivery Name"] || "",
        deliveryAddress: booking.deliveryAddress || booking["Delivery Address"] || "",
        deliveryPostcode: booking.deliveryPostcode || booking["Delivery Postcode"] || "",
        date: booking.date || booking["Date"] || "",
        deliveryTime: booking.deliveryTime || booking["Time"] || "",
        isUrgent: booking.isUrgent || booking["Urgent"] || "No",
        vehicleType: booking.vehicleType || booking["Vehicle Type"] || "van",
               parcelCount: parseInt(booking.parcelCount) || parseInt(booking["Parcel Count"]) || 1, 
        basePrice: booking.basePrice || booking["Base Price"] || "0.00",
        vat: booking.vat || booking["VAT"] || "0.00",
        totalPrice: booking.totalPrice || booking["Total Price"] || "0.00",
        userId: booking.userId || booking["User ID"] || "",
        status: booking.status || booking["Status"] || "pending",
        contactEmail: booking.contactEmail || booking["Contact Email"] || "",
        contactPhone: booking.contactPhone || booking["Contact Phone"] || "",
        additionalInfo: booking.additionalInfo || booking["Additional Info"] || ""
      };
      
      // Check if we have enough data to consider this a valid booking
      if (formattedBooking.collectionName && formattedBooking.deliveryName) {
        try {
          // Try to update the booking if it exists
          const updated = await updateBooking(formattedBooking.bookingId, formattedBooking, false);
          
          if (updated) {
            updatedCount++;
          } else {
            // If update fails, it's a new booking - save it
            await saveBooking(formattedBooking);
            newCount++;
          }
        } catch (error) {
          console.error(`Error processing booking ${formattedBooking.bookingId}:`, error);
        }
      }
    }
    
    console.log(`Sync complete: Updated ${updatedCount} bookings, added ${newCount} new bookings`);
    return {
      success: true,
      updated: updatedCount,
      added: newCount,
      total: updatedCount + newCount
    };
  } catch (error) {
    console.error("Error syncing from Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
 