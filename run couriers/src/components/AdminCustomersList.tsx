import  { useState, useEffect } from 'react';
import { User, Mail, Building, Calendar, ArrowLeft, Download, RefreshCw, CheckCircle, Search, Phone, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  registeredAt: string;
}

interface AdminCustomersListProps {
  onBack: () => void;
}

export function AdminCustomersList({ onBack }: AdminCustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Customer>('registeredAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { isAdmin, isWorker } = useAuth();

  useEffect(() => {
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
        registeredAt: user.registeredAt
      }));
      setCustomers(formattedUsers);
    }
    setLoading(false);
  }, []);

  // Handle sorting
  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter by search term
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
      (customer.company && customer.company.toLowerCase().includes(searchLower))
    );
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
    
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Registered At'];
    
    let csvContent = headers.join(',') + '\n';
    
    customers.forEach(customer => {
      const row = [
        customer.id,
        `"${customer.name.replace(/"/g, '""')}"`,
        `"${customer.email.replace(/"/g, '""')}"`,
        `"${(customer.phone || '').replace(/"/g, '""')}"`,
        `"${(customer.company || '').replace(/"/g, '""')}"`,
        `"${new Date(customer.registeredAt).toLocaleString().replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'customer_list.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {isAdmin ? (
              <>
                <Shield className="w-6 h-6 text-green-600" />
                Customer Management
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-purple-600" />
                Customer List
              </>
            )}
          </h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setLoading(true)}
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
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <div className="flex items-center gap-2 text-blue-800">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Customer Database</p>
            <p className="text-sm mt-1">
              {isAdmin 
                ? "View and manage all customers who have created accounts with your delivery service." 
                : "View all customers who have created accounts with your delivery service."}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search customers by name, email, phone or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No registered customers yet</p>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer, index) => (
                <tr key={customer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-center text-sm text-gray-500">
        {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
      </div>
    </div>
  );
}
 