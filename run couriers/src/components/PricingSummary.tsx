import  { CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PricingSummaryProps {
  price: {
    base: number;
    vat: number;
    total: number;
  };
  isUrgent: boolean;
}

export function PricingSummary({ price, isUrgent }: PricingSummaryProps) {
  const hasPrice = price.total > 0;
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 200);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 max-w-sm ${isSticky ? 'sticky top-4 z-10 transition-all duration-300 ease-in-out' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Delivery Price</h2>
        </div>
        
        {isUrgent && (
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs">
            Urgent Delivery
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Base Price:</span>
              <span className="text-lg font-semibold">{hasPrice ? `£${price.base.toFixed(2)}` : '£0.00'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">VAT (20%):</span>
              <span className="text-lg font-semibold">{hasPrice ? `£${price.vat.toFixed(2)}` : '£0.00'}</span>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-green-700">{hasPrice ? `£${price.total.toFixed(2)}` : '£0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
    </div>
  );
}
 