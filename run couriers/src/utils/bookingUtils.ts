import  { generateBookingId } from './idGenerator';

export interface Address {
  name: string;
  address: string;
  street?: string;
  city?: string;
  town?: string;
  county?: string;
  building?: string;
  postcode: string;
}

export interface BookingData {
  bookingId: string;
  collectionName: string;
  collectionAddress: string;
  collectionPostcode: string;
  deliveryName: string;
  deliveryAddress: string;
  deliveryPostcode: string;
  date: string;
  deliveryTime: string;
  isUrgent: boolean;
  vehicleType: 'bike' | 'van';
  parcelCount: number;
  basePrice: number;
  vat: number;
  totalPrice: number;
  userId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'outsourced';
  contactEmail?: string;
  contactPhone?: string;
  additionalInfo?: string;
  createdAt: string;
  modifiableUntil?: string;
}

export function createBooking(data: Partial<BookingData>): BookingData {
  const now = new Date();
  const modifiableUntil = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
  
  // Generate a booking ID (max 10 chars)
  const bookingId = data.bookingId || generateBookingId();
  
  return {
    bookingId,
    collectionName: data.collectionName || '',
    collectionAddress: data.collectionAddress || '',
    collectionPostcode: data.collectionPostcode || '',
    deliveryName: data.deliveryName || '',
    deliveryAddress: data.deliveryAddress || '',
    deliveryPostcode: data.deliveryPostcode || '',
    date: data.date || now.toISOString().split('T')[0],
    deliveryTime: data.deliveryTime || '12:00',
    isUrgent: data.isUrgent || false,
    vehicleType: data.vehicleType || 'van',
    parcelCount: data.parcelCount || 1,
    basePrice: data.basePrice || 0,
    vat: data.vat || 0,
    totalPrice: data.totalPrice || 0,
    userId: data.userId || '',
    status: data.status || 'pending',
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    additionalInfo: data.additionalInfo,
    createdAt: data.createdAt || now.toISOString(),
    modifiableUntil: data.modifiableUntil || modifiableUntil.toISOString()
  };
}

export function isBookingModifiable(booking: BookingData): boolean {
  if (!booking.modifiableUntil) return true;
  
  const now = new Date();
  const modifiableUntil = new Date(booking.modifiableUntil);
  
  return now < modifiableUntil;
}

export function formatAddressForDisplay(address: Address): string {
  const parts = [];
  
  if (address.name) parts.push(address.name);
  if (address.address) parts.push(address.address);
  if (address.building) parts.push(address.building);
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.town && address.town !== address.city) parts.push(address.town);
  if (address.county) parts.push(address.county);
  if (address.postcode) parts.push(address.postcode);
  
  return parts.join(', ');
}
 