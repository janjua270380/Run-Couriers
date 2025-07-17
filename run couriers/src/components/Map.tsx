import  { useEffect, useRef } from 'react';
import { useMap } from '../context/MapContext';
import { MapPin } from 'lucide-react';

export function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { initializeMap } = useMap();

  useEffect(() => {
    // Wait a short moment to ensure DOM is ready
    const timer = setTimeout(() => {
      if (mapRef.current) {
        initializeMap(mapRef.current);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initializeMap]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Route Map
          </h2>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
          <div className="text-center text-gray-400">
            <img 
              src="https://images.unsplash.com/photo-1577086664693-894d8405334a?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHJvdXRlcyUyMHRyYW5zcG9ydGF0aW9uJTIwbG9naXN0aWNzJTIwbWFwJTIwcGxhbm5pbmd8ZW58MHx8fHwxNzQ1NDM2MTk2fDA&ixlib=rb-4.0.3&fit=fillmax&h=500&w=800"
              alt="Map with delivery route"
              className="w-full h-full object-cover opacity-10"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Enter UK postcodes to view the delivery route</p>
              </div>
            </div>
          </div>
        </div>
        <div ref={mapRef} className="w-full h-[200px] relative z-10" />
      </div>
      <div className="p-2 bg-gray-50 text-xs text-gray-500 text-center">
        Please enter complete UK postcodes for accurate routing
      </div>
    </div>
  );
}
 