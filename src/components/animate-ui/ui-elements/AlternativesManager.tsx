'use client';

import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { BarChart3, Calendar, CalendarDays, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { motion, type Transition, type Variants } from 'motion/react';
import { useCallback, useState } from 'react';
import { Button } from '../components/buttons/button';
import { SlidingNumber } from '../text/sliding-number';

interface AlternativeManagerProps {
  allSuggestions: Suggestion[];
  onSelectionChange: (params: AlternativeSelectionBaseParams) => void;
  onPreviewChange: (params: AlternativeSelectionBaseParams) => void;
  selectedIndex: number;
  currentSelectionIndex: number;
}

const STAT_CARD_MOTION_CONFIG = {
  initial: 'rest',
  whileHover: 'hover',
  whileTap: 'tap',
  variants: {
    rest: { maxWidth: '120px' },
    hover: {
      maxWidth: '200px',
      transition: { type: 'spring', stiffness: 200, damping: 35, delay: 0.15 },
    },
    tap: { scale: 0.95 },
  },
  transition: { type: 'spring', stiffness: 250, damping: 25 },
} as const;

const LABEL_VARIANTS: Variants = {
  rest: { opacity: 0, x: 4 },
  hover: { opacity: 1, x: 0, visibility: 'visible' },
  tap: { opacity: 1, x: 0, visibility: 'visible' },
};

const LABEL_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

const BADGE_VARIANTS: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20, delay: 0.2 },
  },
};

export const AlternativesManager = ({
  allSuggestions,
  onSelectionChange,
  onPreviewChange,
  selectedIndex = 0,
  currentSelectionIndex = 0,
}: AlternativeManagerProps) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  const totalOptions = allSuggestions.length;
  const currentSuggestion = allSuggestions[currentIndex];

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onPreviewChange({ suggestion: allSuggestions[newIndex], index: newIndex });
    }
  }, [currentIndex, allSuggestions, onPreviewChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalOptions - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onPreviewChange({ suggestion: allSuggestions[newIndex], index: newIndex });
    }
  }, [currentIndex, totalOptions, allSuggestions, onPreviewChange]);

  if (!currentSuggestion?.days) {
    return null;
  }

  const ptoDays = currentSuggestion.days.length;
  const effectiveDays = currentSuggestion.totalEffectiveDays;
  const efficiency = effectiveDays / ptoDays;
  const gainedDays = effectiveDays - ptoDays;

  const mainEfficiency = allSuggestions[0].totalEffectiveDays / allSuggestions[0].days.length;
  const efficiencyDiff = efficiency - mainEfficiency;
  const isMainSuggestion = currentIndex === 0;

  return (
    <div className='sticky top-0 z-[10] flex w-fit flex-wrap items-center gap-y-2 rounded-2xl border border-border bg-background p-2 shadow-sm'>
      <div className='flex shrink-0 items-center rounded-lg bg-muted/50 px-2 h-full'>
        <Button disabled={currentIndex === 0} variant='ghost' onClick={handlePrevious} aria-label='Previous suggestion'>
          <ChevronLeft size={20} />
        </Button>

        <div className='mx-2 flex flex-col items-center relative w-25 transition-[height,padding] duration-300 ease-out'>
          <div className='flex items-center space-x-1 text-sm tabular-nums'>
            <span className='text-xs text-muted-foreground'>Option</span>
            <SlidingNumber className='text-base font-semibold text-foreground' padStart number={currentIndex + 1} />
            <span className='text-muted-foreground'>/ {totalOptions}</span>
          </div>
          {isMainSuggestion && (
            <motion.span
              variants={BADGE_VARIANTS}
              initial='initial'
              animate='animate'
              className='mt-0.5 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-1.5 py-px text-[10px] font-normal text-amber-700 dark:text-amber-400'
            >
              <Sparkles size={8} />
              Recommended
            </motion.span>
          )}
        </div>

        <Button
          disabled={currentIndex === totalOptions - 1}
          variant='ghost'
          onClick={handleNext}
          aria-label='Next suggestion'
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      <div className='mx-3 h-6 w-px bg-border rounded-full' />

      <motion.div layout layoutRoot className='mx-auto flex flex-wrap space-x-2 sm:flex-nowrap'>
        <motion.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-blue-100/60 px-2.5 py-2 dark:bg-blue-900/30'
          aria-label='PTO Days'
        >
          <Calendar size={20} className='text-blue-600 dark:text-blue-400 shrink-0' />
          <div className='flex items-center gap-1'>
            <SlidingNumber className='text-sm font-semibold text-blue-700 dark:text-blue-300' number={ptoDays} />
            <span className='text-xs text-blue-600 dark:text-blue-400'>days</span>
          </div>
          <motion.span
            variants={LABEL_VARIANTS}
            transition={LABEL_TRANSITION}
            className='invisible text-sm text-blue-600 dark:text-blue-400'
          >
            PTO Used
          </motion.span>
        </motion.button>

        <motion.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-green-100/60 px-2.5 py-2 dark:bg-green-900/30'
          aria-label='Total Days Off'
        >
          <CalendarDays size={20} className='text-green-600 dark:text-green-400 shrink-0' />
          <div className='flex items-center gap-1'>
            <SlidingNumber
              className='text-sm font-semibold text-green-700 dark:text-green-300'
              number={effectiveDays}
            />
            <span className='text-xs text-green-600 dark:text-green-400 flex'>
              (+
              <SlidingNumber number={gainedDays} />)
            </span>
          </div>
          <motion.span
            variants={LABEL_VARIANTS}
            transition={LABEL_TRANSITION}
            className='invisible text-sm text-green-600 dark:text-green-400'
          >
            Total Off
          </motion.span>
        </motion.button>

        <motion.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-purple-100/60 px-2.5 py-2 dark:bg-purple-900/30'
          aria-label='Efficiency'
        >
          <TrendingUp size={20} className='text-purple-600 dark:text-purple-400 shrink-0' />
          <div className='flex items-center gap-1'>
            <SlidingNumber
              className='text-sm font-semibold text-purple-700 dark:text-purple-300'
              number={parseFloat(efficiency.toFixed(1))}
              decimalPlaces={1}
            />
            <span className='text-sm font-semibold text-purple-700 dark:text-purple-300'>x</span>
            {!isMainSuggestion && (
              <span
                className={`text-xs flex ${
                  efficiencyDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {efficiencyDiff >= 0 ? '+' : ''}
                <SlidingNumber number={parseFloat(efficiencyDiff.toFixed(1))} decimalPlaces={1} />
              </span>
            )}
          </div>
          <motion.span
            variants={LABEL_VARIANTS}
            transition={LABEL_TRANSITION}
            className='invisible text-sm text-purple-600 dark:text-purple-400'
          >
            Efficiency
          </motion.span>
        </motion.button>

        {!isMainSuggestion && (
          <motion.button
            {...STAT_CARD_MOTION_CONFIG}
            className='flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-neutral-100/60 px-2.5 py-2 dark:bg-neutral-800/30'
            aria-label='Comparison'
          >
            <BarChart3 size={20} className='text-neutral-600 dark:text-neutral-400 shrink-0' />
            <div className='flex items-center gap-1'>
              <SlidingNumber
                className={`text-sm font-semibold ${
                  efficiencyDiff >= -0.5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
                number={Math.round((efficiency / mainEfficiency) * 100)}
              />
              <span
                className={`text-sm font-semibold ${
                  efficiencyDiff >= -0.5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                %
              </span>
            </div>
            <motion.span
              variants={LABEL_VARIANTS}
              transition={LABEL_TRANSITION}
              className='invisible text-sm text-neutral-600 dark:text-neutral-400'
            >
              vs Main
            </motion.span>
          </motion.button>
        )}
      </motion.div>
      <div className='mx-3 hidden h-6 w-px bg-border sm:block rounded-full' />
      <Button
        disabled={currentSelectionIndex === currentIndex}
        className='flex w-full h-10 text-sm cursor-pointer items-center justify-center rounded-lg px-3 py-2 font-medium transition-colors duration-300 sm:w-auto'
        onClick={() => onSelectionChange({ suggestion: currentSuggestion, index: currentIndex })}
      >
        {currentSelectionIndex === currentIndex ? 'Already Applied' : 'Apply Alternative'}
      </Button>
    </div>
  );
};
