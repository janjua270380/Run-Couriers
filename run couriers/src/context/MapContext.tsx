import  React, { createContext, useContext, useCallback, ReactNode, useState } from 'react';

interface MapContextType {
  initializeMap: (element: HTMLElement) => void;
  calculateRoute: (origin: string, destination: string) => Promise<number>;
  setMapMarkers: (origin: string, destination: string) => Promise<void>;
  clearMapMarkers: () => void;
}

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const [mapInstance, setMapInstance] = useState<{
    map?: google.maps.Map;
    directionsService?: google.maps.DirectionsService;
    directionsRenderer?: google.maps.DirectionsRenderer;
    markers: google.maps.Marker[];
    geocoder?: google.maps.Geocoder;
  }>({
    markers: []
  });

  const initializeMap = useCallback((element: HTMLElement) => {
    const map = new google.maps.Map(element, {
      center: { lat: 54.7023545, lng: -3.2765753 }, // Center of UK
      zoom: 6,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4361ee',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    const geocoder = new google.maps.Geocoder();

    setMapInstance({ map, directionsService, directionsRenderer, markers: [], geocoder });
  }, []);

  const clearMapMarkers = useCallback(() => {
    if (mapInstance.markers) {
      mapInstance.markers.forEach(marker => marker.setMap(null));
      setMapInstance(prev => ({ ...prev, markers: [] }));
    }
  }, [mapInstance]);

  // Helper function to create a marker
  const createMarker = useCallback((position: google.maps.LatLng, title: string, color: string) => {
    if (!mapInstance.map) return null;
    
    return new google.maps.Marker({
      position,
      map: mapInstance.map,
      title,
      icon: {
        url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
      }
    });
  }, [mapInstance.map]);

  // Enhanced function to process postcode
  const formatUKPostcode = useCallback((postcode: string): string => {
    // Standardize UK postcode format (e.g., "SW1A 1AA")
    if (!postcode) return postcode;
    
    // Remove any non-alphanumeric characters
    const clean = postcode.replace(/[^A-Za-z0-9]/g, '');
    
    // Apply standard UK postcode format
    if (clean.length > 3) {
      const outwardCode = clean.slice(0, -3);
      const inwardCode = clean.slice(-3);
      return `${outwardCode} ${inwardCode}`.toUpperCase();
    }
    
    return clean.toUpperCase();
  }, []);

  // Improved geocoding with better error handling
  const geocodeAddress = useCallback(async (address: string): Promise<google.maps.LatLng | null> => {
    if (!mapInstance.geocoder) return null;
    
    try {
      // Check if this looks like a UK postcode
      const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
      
      let geocodeRequest: google.maps.GeocoderRequest = { address };
      
      // If it's a postcode, add UK region bias and properly format it
      if (ukPostcodeRegex.test(address.trim())) {
        const formattedPostcode = formatUKPostcode(address.trim());
        geocodeRequest = { 
          address: formattedPostcode,
          region: 'uk'
        };
      } else if (!address.toLowerCase().includes('uk') && 
                !address.toLowerCase().includes('united kingdom')) {
        // If address doesn't mention UK, add it for better results
        geocodeRequest = { 
          address: `${address}, UK`,
          region: 'uk'
        };
      }
      
      const result = await mapInstance.geocoder.geocode(geocodeRequest);
      
      if (result.results?.length > 0) {
        return result.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error(`Geocoding error for address "${address}":`, error);
      return null;
    }
  }, [mapInstance.geocoder, formatUKPostcode]);

  const setMapMarkers = useCallback(async (origin: string, destination: string) => {
    if (!mapInstance.map) return;
    
    clearMapMarkers();
    const newMarkers: google.maps.Marker[] = [];
    
    try {
      // Try to geocode both addresses
      const originLocation = await geocodeAddress(origin);
      const destLocation = await geocodeAddress(destination);
      
      // Add markers if locations were found
      if (originLocation) {
        const originMarker = createMarker(originLocation, 'Collection Point', 'green');
        if (originMarker) newMarkers.push(originMarker);
      }
      
      if (destLocation) {
        const destMarker = createMarker(destLocation, 'Delivery Point', 'red');
        if (destMarker) newMarkers.push(destMarker);
      }
      
      // If we have at least one marker, center the map
      if (newMarkers.length > 0) {
        // Create bounds and fit the map
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach(marker => {
          if (marker.getPosition()) bounds.extend(marker.getPosition()!);
        });
        
        if (bounds.isEmpty()) {
          // If somehow bounds are empty, center on UK
          mapInstance.map.setCenter({ lat: 54.7023545, lng: -3.2765753 });
          mapInstance.map.setZoom(6);
        } else {
          mapInstance.map.fitBounds(bounds);
          // If only one marker, set appropriate zoom
          if (newMarkers.length === 1) {
            mapInstance.map.setZoom(12);
          }
        }
      }
      
      setMapInstance(prev => ({ 
        ...prev, 
        markers: [...prev.markers, ...newMarkers]
      }));
    } catch (error) {
      console.error('Error setting markers:', error);
      // Even if there's an error, save any markers we did manage to create
      if (newMarkers.length > 0) {
        setMapInstance(prev => ({ 
          ...prev, 
          markers: [...prev.markers, ...newMarkers]
        }));
      }
    }
  }, [mapInstance, clearMapMarkers, createMarker, geocodeAddress]);

  const calculateRoute = useCallback(async (origin: string, destination: string): Promise<number> => {
    const { directionsService, directionsRenderer, map } = mapInstance;
    if (!directionsService || !directionsRenderer || !map) return 0;

    try {
      // First try with markers to ensure we have some visual feedback
      await setMapMarkers(origin, destination);
      
      // Ensure addresses are properly formatted
      let processedOrigin = origin;
      let processedDestination = destination;
      
      // Check if they look like UK postcodes
      const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
      if (ukPostcodeRegex.test(origin.trim())) {
        processedOrigin = formatUKPostcode(origin.trim()) + ", UK";
      } else if (!origin.toLowerCase().includes('uk')) {
        processedOrigin = `${origin}, UK`;
      }
      
      if (ukPostcodeRegex.test(destination.trim())) {
        processedDestination = formatUKPostcode(destination.trim()) + ", UK";
      } else if (!destination.toLowerCase().includes('uk')) {
        processedDestination = `${destination}, UK`;
      }
      
      // Try to calculate route with processed addresses
      try {
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route({
            origin: processedOrigin,
            destination: processedDestination,
            travelMode: google.maps.TravelMode.DRIVING,
            avoidFerries: true, // Stay on land routes
            region: 'uk' // Bias to UK results
          }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          });
        });
        
        directionsRenderer.setDirections(result);
        
        // Calculate bounds to fit the route
        const bounds = new google.maps.LatLngBounds();
        const route = result.routes[0];
        if (route && route.legs) {
          route.legs.forEach(leg => {
            if (leg.start_location) bounds.extend(leg.start_location);
            if (leg.end_location) bounds.extend(leg.end_location);
          });
          map.fitBounds(bounds);
        }
        
        return result.routes[0].legs[0].distance?.value || 0;
      } catch (routeError) {
        console.warn('Error with specific addresses, trying geocode results directly:', routeError);
        
        // If we failed with the addresses, try using the geocoded coordinates directly
        if (mapInstance.markers.length === 2) {
          const originPos = mapInstance.markers[0].getPosition();
          const destPos = mapInstance.markers[1].getPosition();
          
          if (originPos && destPos) {
            try {
              const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route({
                  origin: originPos,
                  destination: destPos,
                  travelMode: google.maps.TravelMode.DRIVING,
                  avoidFerries: true,
                  region: 'uk'
                }, (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result);
                  } else {
                    reject(new Error(`Directions with coordinates failed: ${status}`));
                  }
                });
              });
              
              directionsRenderer.setDirections(result);
              
              // Calculate bounds to fit the route
              const bounds = new google.maps.LatLngBounds();
              const route = result.routes[0];
              if (route && route.legs) {
                route.legs.forEach(leg => {
                  if (leg.start_location) bounds.extend(leg.start_location);
                  if (leg.end_location) bounds.extend(leg.end_location);
                });
                map.fitBounds(bounds);
              }
              
              return result.routes[0].legs[0].distance?.value || 0;
            } catch (coordError) {
              console.error('Error calculating route with coordinates:', coordError);
              throw coordError;
            }
          }
        }
        
        throw routeError;
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      
      // If route calculation fails but we have markers, show them instead
      if (mapInstance.markers.length > 0) {
        // If directionsRenderer has a route showing, clear it
        directionsRenderer.setMap(null);
        directionsRenderer.setMap(map);
        
        const bounds = new google.maps.LatLngBounds();
        mapInstance.markers.forEach(marker => {
          if (marker.getPosition()) {
            bounds.extend(marker.getPosition()!);
          }
        });
        
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds);
          // Add some padding
          const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            map.setZoom(Math.min(12, map.getZoom() || 12));
          });
          setTimeout(() => {
            google.maps.event.removeListener(listener);
          }, 1000);
        }
      }
      
      // Calculate an approximate distance based on a straight line
      // This is a fallback when we can't get the actual route
      if (mapInstance.markers.length === 2) {
        const pos1 = mapInstance.markers[0].getPosition();
        const pos2 = mapInstance.markers[1].getPosition();
        
        if (pos1 && pos2) {
          const distance = google.maps.geometry.spherical.computeDistanceBetween(pos1, pos2);
          // Add 30% to account for roads not being straight lines
          return distance * 1.3;
        }
      }
      
      // Last resort - return a reasonable default distance for UK delivery
      return 30000; // 30 km as fallback for demo purposes
    }
  }, [mapInstance, setMapMarkers, formatUKPostcode]);

  return (
    <MapContext.Provider value={{ 
      initializeMap, 
      calculateRoute, 
      setMapMarkers,
      clearMapMarkers 
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
 