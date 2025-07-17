import  { CheckCircle, Package } from 'lucide-react';

interface VehicleSelectorProps {
  selectedVehicle: 'bike' | 'van' | null;
  onVehicleSelect: (vehicle: 'bike' | 'van') => void;
}

export function VehicleSelector({ selectedVehicle, onVehicleSelect }: VehicleSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Vehicle Type</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
          className={`relative cursor-pointer rounded-lg border-2 p-4 bg-white transition-all flex items-center gap-4
            ${selectedVehicle === 'bike' 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-gray-200 hover:border-blue-200'}`}
          onClick={() => onVehicleSelect('bike')} 
        >
          <div className="w-24 h-16 relative overflow-hidden bg-gray-100 rounded flex-shrink-0">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/1bdf6e9e-0cc1-43ab-a69d-bdd924148700/public"
              alt="Delivery bike courier" 
              className="w-full h-full object-contain"
            />
            {selectedVehicle === 'bike' && (
              <div className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
              </div>
            )}
          </div> 
          <div className="flex-1">
            <div className="font-medium">Bike Courier</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Package className="w-4 h-4" />
              Fast delivery for smaller items
            </div>
          </div>
        </div>
        
        <div 
          className={`relative cursor-pointer rounded-lg border-2 p-4 bg-white transition-all flex items-center gap-4
            ${selectedVehicle === 'van' 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-gray-200 hover:border-blue-200'}`}
          onClick={() => onVehicleSelect('van')} 
        >
          <div className="w-24 h-16 relative overflow-hidden bg-gray-100 rounded flex-shrink-0">
            <img 
              src="https://imagedelivery.net/FIZL8110j4px64kO6qJxWA/7b7ceb4e-9cdc-4cbb-68d6-4d5564a70a00/public"
              alt="Delivery van" 
              className="w-full h-full object-contain"
            />
            {selectedVehicle === 'van' && (
              <div className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
              </div>
            )}
          </div> 
          <div className="flex-1">
            <div className="font-medium">Delivery Van</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Package className="w-4 h-4" />
              A: 2500mm × B: 1500mm × Weight: 800kg
            </div>
          </div>
        </div>
 
      </div>
    </div>
  );
}
 