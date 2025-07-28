'use client';

import { useUpdateStore } from '@application/stores/pto';
import { useEffect } from 'react';

interface StoreInitializerProps {
  userCountry?: string;
}

export const StoreInitializer = ({ 
  userCountry
}: StoreInitializerProps) => {
  const updateStore = useUpdateStore();

  useEffect(() => {
    const initialData: any = {};
    
    if (userCountry) {
      initialData.country = userCountry;
    }
    
    
    if (Object.keys(initialData).length > 0) {
      updateStore(initialData);
    }
  }, [
    userCountry, 
    updateStore
  ]);

  return null; 
};