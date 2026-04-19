'use client';

import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { BarChart3, CalendarDays, Sparkles, TrendingUp } from 'lucide-react';
import { m, type Transition, type Variants } from 'motion/react';
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
      className='sticky top-0 z-10 flex w-fit flex-wrap items-center gap-3 rounded-[1.35rem] border-[2.5px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-lg)]'
      data-tutorial='alternatives-manager'
    >
      <div className='flex shrink-0 grow items-center rounded-[1rem] border-[2px] border-[var(--frame)] bg-[var(--surface-panel-soft)] px-2 shadow-[var(--shadow-brutal-xs)]'>
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
        <div className='mx-2 flex w-25 grow flex-col items-center relative duration-300 ease-out'>
          <div className='flex items-center space-x-1 text-sm tabular-nums'>
            <span className='text-xs text-muted-foreground'>{t('option')}</span>
            <SlidingNumber className='text-base font-semibold text-foreground' padStart number={currentIndex + 1} />
            <span className='text-muted-foreground'>/ {totalOptions}</span>
          </div>
          {isMainSuggestion && (
            <m.span
              variants={BADGE_VARIANTS}
              initial='initial'
              animate='animate'
              className='mt-1 flex items-center gap-1 rounded-full border-[2px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-yellow)_28%,white_72%)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-brand-orange-deep)] shadow-[var(--shadow-brutal-xs)]'
            >
              <Sparkles size={8} />
              {t('recommended')}
            </m.span>
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

      <div className='hidden lg:block mx-1 h-9 w-[2px] bg-[var(--frame)]/15 rounded-full' />

      <m.div layout layoutRoot className='flex flex-nowrap space-x-2'>
        <m.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-11 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-[1rem] border-[2px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-teal)_18%,white_82%)] px-3 py-2 shadow-[var(--shadow-brutal-xs)] dark:bg-[color-mix(in_srgb,var(--color-brand-teal)_16%,black_84%)]'
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
          <m.span
            variants={LABEL_VARIANTS}
            transition={LABEL_TRANSITION}
            className='invisible text-sm text-green-600 dark:text-green-400'
          >
            {t('totalOff')}
          </m.span>
        </m.button>

        <m.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-11 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-[1rem] border-[2px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,white_80%)] px-3 py-2 shadow-[var(--shadow-brutal-xs)] dark:bg-[color-mix(in_srgb,var(--color-brand-purple)_16%,black_84%)]'
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
          <m.span
            variants={LABEL_VARIANTS}
            transition={LABEL_TRANSITION}
            className='invisible text-sm text-purple-600 dark:text-purple-400'
          >
            {t('efficiency')}
          </m.span>
        </m.button>

        {!isMainSuggestion && (
          <m.button
            {...STAT_CARD_MOTION_CONFIG}
            className='flex h-11 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-[1rem] border-[2px] border-[var(--frame)] bg-[var(--surface-panel-soft)] px-3 py-2 shadow-[var(--shadow-brutal-xs)] dark:bg-[var(--surface-panel-soft)]'
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
            <m.span
              variants={LABEL_VARIANTS}
              transition={LABEL_TRANSITION}
              className='invisible text-sm text-neutral-600 dark:text-neutral-400'
            >
              {t('vsMain')}
            </m.span>
          </m.button>
        )}
      </m.div>
      <Button
        disabled={currentSelectionIndex === currentIndex}
        className='flex grow h-11 text-sm cursor-pointer items-center justify-center rounded-[1rem] px-4 py-2 font-black transition-colors duration-300'
        onClick={() => onSelectionChange({ suggestion: currentSuggestion, index: currentIndex })}
      >
        {currentSelectionIndex === currentIndex ? t('alreadyApplied') : t('applyAlternative')}
      </Button>
    </div>
  );
};
