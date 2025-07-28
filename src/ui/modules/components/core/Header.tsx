'use client'

import { usePtoDays, useSetPtoDays } from "@application/stores/pto";

export const Header = () => {
  const ptoDays = usePtoDays();
  const setPtoDays = useSetPtoDays(); 
  
  const incrementPtoDays = () => {
    setPtoDays(ptoDays + 1);
  };
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="text-center">
        <div className="mt-4">
          <p className="text-xl mb-2">PTO Days: {ptoDays}</p>
          <button 
            onClick={incrementPtoDays}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            +1 PTO Day
          </button>
        </div>
      </div>
    </div>
    )
}