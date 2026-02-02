'use client';

import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { BarChart3, CalendarDays, Sparkles, TrendingUp } from 'lucide-react';
import { motion, type Transition, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Button } from '../components/buttons/button';
import { ChevronLeft } from '../icons/chevron-left';
import { ChevronRight } from '../icons/chevron-right';
import { AnimateIcon } from '../icons/icon';
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
    tap: { scale: 0.95, maxWidth: '200px' },
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
  const t = useTranslations('alternativesManager');
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

  const effectiveDays = currentSuggestion.metrics?.totalEffectiveDays ?? 0;
  const efficiency = currentSuggestion.metrics?.averageEfficiency ?? 0;
  const gainedDays = currentSuggestion.metrics?.bonusDays ?? 0;

  const mainEfficiency = allSuggestions[0]?.metrics?.averageEfficiency ?? 0;
  const efficiencyDiff = efficiency - mainEfficiency;
  const isMainSuggestion = currentIndex === 0;

  return (
    <div
      className='sticky top-0 z-10 flex w-fit flex-wrap items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm'
      data-tutorial='alternatives-manager'
    >
      <div className='flex shrink-0 items-center rounded-lg bg-muted/50 px-2 grow'>
        <AnimateIcon animateOnHover={currentIndex !== 0}>
          <Button
            disabled={currentIndex === 0}
            variant='ghost'
            onClick={handlePrevious}
            aria-label={t('previousSuggestion')}
          >
            <ChevronLeft size={20} />
          </Button>
        </AnimateIcon>
        <div className='mx-2 flex flex-col items-center relative w-25  grow duration-300 ease-out'>
          <div className='flex items-center space-x-1 text-sm tabular-nums'>
            <span className='text-xs text-muted-foreground'>{t('option')}</span>
            <SlidingNumber className='text-base font-semibold text-foreground' padStart number={currentIndex + 1} />
            <span className='text-muted-foreground'>/ {totalOptions}</span>
          </div>
          {isMainSuggestion && (
            <motion.span
              variants={BADGE_VARIANTS}
              initial='initial'
              animate='animate'
              className='mt-0.5 flex items-center gap-0.5 rounded-full bg-linear-to-r from-amber-500/20 to-orange-500/20 px-1.5 py-px text-[10px] font-normal text-amber-700 dark:text-amber-400'
            >
              <Sparkles size={8} />
              {t('recommended')}
            </motion.span>
          )}
        </div>
        <AnimateIcon animateOnHover={currentIndex !== totalOptions - 1}>
          <Button
            disabled={currentIndex === totalOptions - 1}
            variant='ghost'
            onClick={handleNext}
            aria-label={t('nextSuggestion')}
          >
            <ChevronRight size={20} />
          </Button>
        </AnimateIcon>
      </div>

      <div className='hidden lg:block mx-3 h-6 w-px bg-border rounded-full' />

      <motion.div layout layoutRoot className='flex flex-nowrap space-x-2'>
        <motion.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-green-100/60 px-2.5 py-2 dark:bg-green-900/30'
          aria-label={t('totalDaysOff')}
        >
          <CalendarDays size={20} className='text-green-600 dark:text-green-400 shrink-0' />
          <div className='flex items-center gap-1'>
            <SlidingNumber
              className='text-sm font-semibold text-green-700 dark:text-green-300'
              number={effectiveDays ?? 0}
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
            {t('totalOff')}
          </motion.span>
        </motion.button>

        <motion.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-purple-100/60 px-2.5 py-2 dark:bg-purple-900/30'
          aria-label={t('efficiency')}
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
            {t('efficiency')}
          </motion.span>
        </motion.button>

        {!isMainSuggestion && (
          <motion.button
            {...STAT_CARD_MOTION_CONFIG}
            className='flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-neutral-100/60 px-2.5 py-2 dark:bg-neutral-800/30'
            aria-label={t('comparison')}
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
              {t('vsMain')}
            </motion.span>
          </motion.button>
        )}
      </motion.div>
      <Button
        disabled={currentSelectionIndex === currentIndex}
        className='flex grow h-10 text-sm cursor-pointer items-center justify-center rounded-lg px-3 py-2 font-medium transition-colors duration-300'
        onClick={() => onSelectionChange({ suggestion: currentSuggestion, index: currentIndex })}
      >
        {currentSelectionIndex === currentIndex ? t('alreadyApplied') : t('applyAlternative')}
      </Button>
    </div>
  );
};
