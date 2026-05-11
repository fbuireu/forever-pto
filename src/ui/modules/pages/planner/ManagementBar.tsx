'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import { useIsMobile } from '@ui/hooks/useMobile';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { Drawer, DrawerContent, DrawerTitle } from '@ui/modules/core/animate/base/Drawer';
import { useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import { Skeleton } from 'boneyard-js/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { LegendItems } from './Legend';
import { PlannerPanel } from './PlannerPanel';
import { PlannerPanelFixture } from './PlannerPanelFixture';

export const ManagementBar = () => {
  const t = useTranslations('toasts');
  const tAlt = useTranslations('alternativesManager');
  const { areStoresReady } = useStoresReady();
  const isMobile = useIsMobile();
  const { openMobile } = useSidebar();
  const [snap, setSnap] = useState<number | string | null>(0.15);
  const {
    alternatives,
    suggestion,
    currentSelection,
    setPreviewAlternativeSelection,
    setCurrentAlternativeSelection,
    previewAlternativeIndex,
    currentSelectionIndex,
  } = useHolidaysStore(
    useShallow((state) => ({
      alternatives: state.alternatives,
      suggestion: state.suggestion,
      currentSelection: state.currentSelection,
      setPreviewAlternativeSelection: state.setPreviewAlternativeSelection,
      setCurrentAlternativeSelection: state.setCurrentAlternativeSelection,
      previewAlternativeIndex: state.previewAlternativeIndex,
      currentSelectionIndex: state.currentSelectionIndex,
    }))
  );

  useEffect(() => {
    const expand = () => setSnap(1);
    window.addEventListener('tutorial:expand-drawer', expand);
    return () => window.removeEventListener('tutorial:expand-drawer', expand);
  }, []);

  const handlePreviewChange = useCallback(
    (params: AlternativeSelectionBaseParams) => {
      setPreviewAlternativeSelection(params);
    },
    [setPreviewAlternativeSelection]
  );

  const handleSelectionChange = useCallback(
    (params: AlternativeSelectionBaseParams) => {
      setCurrentAlternativeSelection(params);
      toast.success(t('suggestionApplied'));
      setSnap(0.15);
    },
    [setCurrentAlternativeSelection, t]
  );

  const baseSuggestions = [suggestion, ...alternatives].filter(
    (suggestion): suggestion is NonNullable<typeof suggestion> => !!suggestion
  );

  const allSuggestions = baseSuggestions.map((sug, index) =>
    index === currentSelectionIndex && currentSelection ? currentSelection : sug
  );

  const hasValidSuggestions = allSuggestions.length > 0 && allSuggestions[0].days && allSuggestions[0].days.length > 0;
  const hasValidCurrentSelection = currentSelection?.days && currentSelection.days.length > 0;

  const isReady = areStoresReady && hasValidSuggestions && hasValidCurrentSelection;

  const plannerPanelProps = {
    currentSelectionIndex,
    allSuggestions,
    onSelectionChange: handleSelectionChange,
    onPreviewChange: handlePreviewChange,
    selectedIndex: previewAlternativeIndex,
    currentSelection: currentSelection ?? allSuggestions[currentSelectionIndex],
  };

  const previewSuggestion = allSuggestions[previewAlternativeIndex] ?? allSuggestions[0];
  const effectiveDays = previewSuggestion?.metrics?.totalEffectiveDays ?? 0;
  const efficiency = previewSuggestion?.metrics?.averageEfficiency ?? 0;

  return (
    <div className='col-span-full sticky top-3 z-10'>
      {!isMobile && (
        <Skeleton name='planner-panel' loading={!isReady} fixture={<PlannerPanelFixture />}>
          {isReady && currentSelection && <PlannerPanel key={previewAlternativeIndex} {...plannerPanelProps} />}
        </Skeleton>
      )}

      {isMobile && (
        <Drawer
          snapPoints={[0.15, 1]}
          activeSnapPoint={snap}
          setActiveSnapPoint={setSnap}
          modal={false}
          open={!openMobile}
          dismissible={false}
        >
          <DrawerContent overlay={false} className='h-[100dvh] max-h-none'>
            <DrawerTitle>Planner</DrawerTitle>
            <div data-tutorial='planner-drawer' className='px-4 pt-2 pb-3 shrink-0'>
              {isReady ? (
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <span className='text-sm font-black shrink-0'>
                    {tAlt('option')} {currentSelectionIndex + 1}
                    <span className='font-normal text-muted-foreground'> / {allSuggestions.length}</span>
                  </span>
                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='font-mono text-sm font-semibold text-green-600 dark:text-green-400'>
                      {effectiveDays} {tAlt('daysUnit')}
                    </span>
                    <span className='font-mono text-sm font-semibold text-purple-600 dark:text-purple-400'>
                      {efficiency.toFixed(1)}x
                    </span>
                  </div>
                </div>
              ) : (
                <div className='h-8 animate-pulse rounded-[8px] bg-[var(--surface-panel-soft)]' />
              )}
            </div>

            <div className='border-t-[2px] border-[var(--frame)]/15 mx-4 shrink-0' />
            <div data-vaul-no-drag className='flex-1 overflow-y-auto px-3 pt-3 pb-6 select-text'>
              {isReady && currentSelection && <PlannerPanel key={previewAlternativeIndex} {...plannerPanelProps} />}
              <div className='border-t-[2px] border-[var(--frame)]/15 my-4' />
              <LegendItems />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};
