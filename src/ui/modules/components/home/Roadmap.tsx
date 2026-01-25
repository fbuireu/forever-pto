'use client';

import { Button } from '@const/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { cn } from '@const/lib/utils';
import { Circle, Sparkles } from 'lucide-react';
import type { SVGMotionProps } from 'motion/react';
import dynamic from 'next/dynamic';
import { type ComponentType, useState } from 'react';
import { FeatureList } from 'src/components/animate-ui/components/community/FeatureList';
import { RadialNav, type RadialNavProps } from 'src/components/animate-ui/components/community/radial-nav';
import { CircleCheckBig } from 'src/components/animate-ui/icons/circle-check-big';
import { Clock } from 'src/components/animate-ui/icons/clock';
import './roadmap.css';

const ContactModal = dynamic(() =>
  import('../contact/ContactModal').then((module) => ({ default: module.ContactModal }))
);

interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  quarter?: string;
}

const CategoryStatus = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in-progress',
  PLANNED: 'planned',
  FUTURE: 'future',
} as const;

type CategoryStatus = (typeof CategoryStatus)[keyof typeof CategoryStatus];

const ROADMAP_CATEGORIES = [
  {
    id: 1,
    icon: CircleCheckBig as ComponentType<SVGMotionProps<SVGSVGElement>>,
    label: 'Completed',
    angle: 0,
    status: CategoryStatus.COMPLETED,
    className: 'text-green-500',
  },
  {
    id: 2,
    icon: Clock as ComponentType<SVGMotionProps<SVGSVGElement>>,
    label: 'In Progress',
    angle: 90,
    status: CategoryStatus.IN_PROGRESS,
    className: 'text-blue-500',
  },
  {
    id: 3,
    icon: Circle as ComponentType<SVGMotionProps<SVGSVGElement>>,
    label: 'Planned',
    angle: 180,
    status: CategoryStatus.PLANNED,
    className: 'text-orange-500',
  },
  {
    id: 4,
    icon: Sparkles as ComponentType<SVGMotionProps<SVGSVGElement>>,
    label: 'Future',
    angle: 270,
    status: CategoryStatus.FUTURE,
    className: 'text-purple-500',
  },
];

const ROADMAP_FEATURES: Record<CategoryStatus, RoadmapFeature[]> = {
  [CategoryStatus.COMPLETED]: [
    {
      id: '1',
      title: 'Core PTO Calculator',
      description: 'Smart vacation planning with holiday optimization and bridge detection',
      quarter: 'Q4 2024',
    },
    {
      id: '2',
      title: 'Multiple Countries Support',
      description: 'Support for holidays across European countries with region-specific rules',
      quarter: 'Q4 2024',
    },
    {
      id: '3',
      title: 'Premium Features',
      description: 'Unlock advanced features with one-time payment via Stripe',
      quarter: 'Q1 2025',
    },
    {
      id: '4',
      title: 'Custom Holidays',
      description: 'Add, edit, and remove custom holidays for personalized planning',
      quarter: 'Q1 2025',
    },
  ],
  [CategoryStatus.IN_PROGRESS]: [
    {
      id: '5',
      title: 'Alternative Strategies',
      description: 'Multiple vacation planning strategies with efficiency comparison',
      quarter: 'Q1 2025',
    },
    {
      id: '6',
      title: 'Analytics Dashboard',
      description: 'Detailed metrics and insights about your vacation planning',
      quarter: 'Q1 2025',
    },
  ],
  [CategoryStatus.PLANNED]: [
    {
      id: '7',
      title: 'Calendar Export',
      description: 'Export your vacation plan to Google Calendar, iCal, or Outlook',
      quarter: 'Q2 2025',
    },
    {
      id: '8',
      title: 'Team Planning',
      description: 'Coordinate vacation planning with team members to avoid conflicts',
      quarter: 'Q2 2025',
    },
    {
      id: '9',
      title: 'Email Notifications',
      description: 'Get reminders about upcoming vacations and important dates',
      quarter: 'Q2 2025',
    },
  ],
  [CategoryStatus.FUTURE]: [
    {
      id: '10',
      title: 'Mobile App',
      description: 'Native iOS and Android apps for vacation planning on the go',
    },
    {
      id: '11',
      title: 'AI Suggestions',
      description: 'AI-powered recommendations based on your preferences and past patterns',
    },
    {
      id: '12',
      title: 'Weather Integration',
      description: 'See weather forecasts for your planned vacation dates',
    },
    {
      id: '13',
      title: 'Multi-Year Planning',
      description: 'Plan vacations across multiple years with carryover support',
    },
  ],
};

export function Roadmap() {
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const selectedNavItem = ROADMAP_CATEGORIES.find((cat) => cat.id === selectedCategory);
  const selectedStatus = selectedNavItem?.status ?? CategoryStatus.COMPLETED;
  const features = ROADMAP_FEATURES[selectedStatus];

  return (
    <div className='container max-w-4xl py-8 space-y-8 m-auto'>
      <div className='space-y-2 text-center mb-0'>
        <h3 className='text-3xl font-bold tracking-tight'>Roadmap</h3>
        <p className='text-muted-foreground'>Explore what we&apos;ve built and what&apos;s coming next</p>
      </div>
      <div className='flex flex-col lg:flex-row gap-8 items-center mt-4'>
        <div className='lg:sticky lg:top-8 flex flex-col items-center w-full lg:w-auto'>
          <div className='relative h-80 w-80 flex items-center justify-center'>
            <RadialNav
              items={ROADMAP_CATEGORIES as unknown as RadialNavProps['items']}
              onActiveChange={(id) => setSelectedCategory(id)}
              defaultActiveId={selectedCategory}
            />
          </div>
          {selectedNavItem && (
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>Selected</p>
              <p className={cn('text-lg font-semibold', selectedNavItem.className)}>{selectedNavItem.label}</p>
            </div>
          )}
        </div>
        <div className='flex-1 space-y-4 z-1'>
          <FeatureList features={features} categoryLabel={selectedNavItem?.label ?? 'Features'} />
        </div>
      </div>
      <Card className='dashed-card group relative border-none'>
        <svg className='absolute inset-0 w-full h-full pointer-events-none' xmlns='http://www.w3.org/2000/svg'>
          <rect
            x='0.5'
            y='0.5'
            width='calc(100% - 1px)'
            height='calc(100% - 1px)'
            fill='none'
            strokeWidth='2'
            strokeDasharray='20 12'
            strokeLinecap='round'
            rx='8'
          />
        </svg>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>Have a suggestion?</CardTitle>
          <CardDescription>
            Your feedback shapes our roadmap. Share your ideas and help us build the perfect vacation planner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <span>Got an idea that would make your life easier?</span>
            <Button
              variant='ghost'
              onClick={() => setContactModalOpen(true)}
              className='font-semibold text-foreground hover:text-primary transition-colors underline decoration-primary/30 hover:decoration-primary underline-offset-4'
            >
              Let&apos;s talk
            </Button>
            <span>or</span>
            <a
              href='https://github.com/tu-usuario/tu-repo/issues/new?template=feature_request.md&title=[Feature Request]&labels=enhancement'
              target='_blank'
              rel='noopener noreferrer'
              className='font-semibold text-foreground hover:text-primary transition-colors underline decoration-primary/30 hover:decoration-primary underline-offset-4'
            >
              open an issue on GitHub
            </a>
          </div>
        </CardContent>
      </Card>
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
}
