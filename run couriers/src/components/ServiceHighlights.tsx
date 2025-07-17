import  { Clock, Truck, MapPin } from 'lucide-react';

export function ServiceHighlights() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Run Couriers</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="flex flex-col items-center p-4 rounded-lg border border-gray-200"> 
          <h3 className="font-semibold text-gray-800 mb-2">🚴‍♂️ Bike Courier</h3>  
          <p className="text-sm text-gray-600 text-center">Fast delivery for smaller items with eco-friendly transport</p>
        </div>
        
        <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Delivery Van</h3>
          <p className="text-sm text-gray-600 text-center">Larger capacity for bulk deliveries and heavy items</p>
        </div> 
      </div>
      
      <div className="p-4 bg-blue-50">
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Professional drivers with GPS tracking for all collections and deliveries</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Express collection options with priority service</span>
          </li>
          <li className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>London collections with specialized service options</span>
          </li>
        </ul>
      </div>
    </div>
  );
}  
 