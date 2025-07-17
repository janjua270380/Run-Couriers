export   interface Address {
  name: string;
  address: string;
  street?: string;
  city?: string;
  town?: string;
  county?: string;
  building?: string;
  postcode: string;
}

export interface Price {
  base: number;
  vat: number;
  total: number;
}

export interface BookingData {
  id: string;
  collection: Address;
  delivery: Address;
  selectedDate: string;
  isUrgent: boolean;
  vehicleType: 'bike' | 'van';
  parcelCount: number;
  price: Price;
  bookingDate: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  modifiableUntil: string;
  canModify: boolean;
  contactEmail?: string;
  contactPhone?: string;
  additionalInfo?: string;
}

export interface WorkerPermissions {
  viewCustomers: boolean;
  manageBookings: boolean;
  viewPricing: boolean;
  managePricing: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  isAdmin?: boolean;
  isWorker?: boolean;
  workerPermissions?: WorkerPermissions;
  phone?: string;
}
 