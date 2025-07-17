import  React, { useState } from 'react';
import { ArrowLeft, Truck, User, Mail, Send, Package, Calendar, Clock, MapPin } from 'lucide-react';
import { Booking } from '../types';

interface JobsForDriversProps {
  bookings: Booking[];
  onBack: () => void;
}

export function JobsForDrivers({ bookings, onBack }: JobsForDriversProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [driverEmail, setDriverEmail] = useState('');

  const availableJobs = bookings.filter(booking => 
    booking.status === 'accepted' || booking.status === 'confirmed'
  );

  const handleSendJob = (bookingId: string) => {
    if (!driverEmail || !selectedBooking) return;

    const emailContent = `
Subject: New Delivery Job Assignment - ${bookingId}

Dear Driver,

You have been assigned a new delivery job:

Job ID: ${bookingId}
Date: ${selectedBooking.selectedDate}
Time: ${selectedBooking.selectedTime}
Vehicle: ${selectedBooking.vehicleType}

Collection:
${selectedBooking.collectionName}
${selectedBooking.collectionAddress}
${selectedBooking.collectionPostcode}

Delivery:
${selectedBooking.deliveryName}
${selectedBooking.deliveryAddress}
${selectedBooking.deliveryPostcode}

Customer: ${selectedBooking.customerName}
Phone: ${selectedBooking.customerPhone}
Email: ${selectedBooking.customerEmail}

${selectedBooking.additionalInfo ? `Instructions: ${selectedBooking.additionalInfo}` : ''}

Please confirm receipt and estimated arrival time.

Best regards,
Dispatch Team
    `.trim();

    const mailtoLink = `mailto:${driverEmail}?subject=New Delivery Job Assignment - ${bookingId}&body=${encodeURIComponent(emailContent)}`;
    window.open(mailtoLink);
    
    setSelectedBooking(null);
    setDriverEmail('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Jobs for Drivers
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Jobs ({availableJobs.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableJobs.map((booking) => (
              <div
                key={booking.bookingId}
                onClick={() => setSelectedBooking(booking)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedBooking?.bookingId === booking.bookingId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">{booking.bookingId}</span>
                  <span className="text-xs text-gray-500">{booking.vehicleType}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {booking.selectedDate} at {booking.selectedTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {booking.collectionPostcode} → {booking.deliveryPostcode}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {booking.parcelCount} parcel{booking.parcelCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedBooking ? (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Job Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Schedule</h4>
                  <p className="text-sm text-gray-600">{selectedBooking.selectedDate} at {selectedBooking.selectedTime}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Collection</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedBooking.collectionName}</p>
                    <p>{selectedBooking.collectionAddress}</p>
                    <p>{selectedBooking.collectionPostcode}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Delivery</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedBooking.deliveryName}</p>
                    <p>{selectedBooking.deliveryAddress}</p>
                    <p>{selectedBooking.deliveryPostcode}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Customer</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedBooking.customerName}</p>
                    <p>{selectedBooking.customerEmail}</p>
                    <p>{selectedBooking.customerPhone}</p>
                  </div>
                </div>

                {selectedBooking.additionalInfo && (
                  <div>
                    <h4 className="font-medium mb-2">Instructions</h4>
                    <p className="text-sm text-gray-600">{selectedBooking.additionalInfo}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Assign to Driver</h4>
                  <div className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        placeholder="Driver email address"
                        value={driverEmail}
                        onChange={(e) => setDriverEmail(e.target.value)}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <button
                      onClick={() => handleSendJob(selectedBooking.bookingId)}
                      disabled={!driverEmail}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Job to Driver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>Select a job to assign to a driver</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 