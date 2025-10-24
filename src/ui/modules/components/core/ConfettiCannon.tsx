'use client';

import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

interface ConfettiCannonProps {
  onComplete?: () => void;
}

export const ConfettiCannon = ({ onComplete }: ConfettiCannonProps) => {
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#10b981', '#059669', '#047857', '#065f46', '#fbbf24', '#f59e0b', '#d97706', '#b45309'],
    };

    function fire(particleRatio: number, opts: Partial<confetti.Options>) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    const fireRealisticConfetti = () => {
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    };

    fireRealisticConfetti();

    const timer = setTimeout(() => {
      onCompleteRef.current?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};
