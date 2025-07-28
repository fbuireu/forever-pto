'use client'

import { usePtoDays, useSetPtoDays } from "@application/stores/pto";
import { Counter } from "src/components/animate-ui/components/counter";

export const Header = () => {
  const ptoDays = usePtoDays();
  const setPtoDays = useSetPtoDays(); 
  
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="text-center">
        <div className="mt-4">
          <p className="text-xl mb-2">PTO Days: {ptoDays}</p>
          <Counter number={ptoDays} setNumber={setPtoDays} />
        </div>
      </div>
    </div>
    )
}