'use client'

import { usePtoDays, useSetPtoDays } from "@application/stores/pto";
import { Counter } from "src/components/animate-ui/components/counter";

export const Header = () => {
  const ptoDays = usePtoDays();
  const setPtoDays = useSetPtoDays(); 

  return (
      <div className="text-center">
        <div className="mt-4">
          <p className="text-xl mb-2">PTO Days: {ptoDays}</p>
          <Counter number={ptoDays} setNumber={setPtoDays} />
        </div>
    </div>
    )
}