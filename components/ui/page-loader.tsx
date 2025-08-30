'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 z-30 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        {/* Spinner */}
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
        
        {/* Loading text */}
        <p className="text-xs text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}