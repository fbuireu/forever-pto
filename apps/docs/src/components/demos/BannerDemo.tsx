import { Banner } from '@ui/modules/core/primitives/Banner';
import { Button } from '@ui/modules/core/primitives/Button';
import { Check, Info, Lightbulb, type LucideIcon, Sparkles } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Demo } from '../Demo';
import type { VariantRow } from '../VariantsTable';

type BannerColorScheme = ComponentProps<typeof Banner>['colorScheme'];

// Exhaustive Record over the component's real `colorScheme` prop type: adding,
// renaming or removing a scheme in the app makes `astro check` fail here.
const SCHEME_EXAMPLES: Record<BannerColorScheme, { icon: LucideIcon; title: string; message: string }> = {
  orange: { icon: Lightbulb, title: 'Tip', message: 'Two PTO days around a Thursday holiday unlock a 5-day break.' },
  blue: { icon: Info, title: 'Heads up', message: 'Regional holidays depend on the selected region.' },
  indigo: { icon: Sparkles, title: 'Premium', message: 'Multi-year planning is a premium feature.' },
  green: { icon: Check, title: 'Saved', message: 'Your custom holiday was added to the calendar.' },
};

const SCHEMES = Object.keys(SCHEME_EXAMPLES) as BannerColorScheme[];

export const BANNER_SCHEME_ROWS: VariantRow[] = [
  {
    axis: 'colorScheme',
    values: SCHEMES,
    notes: 'Required prop, no default. Each scheme mixes a brand color var for light and dark mode.',
  },
];

export const BannerSchemesDemo = () => (
  <Demo className='flex-col items-stretch'>
    {SCHEMES.map((scheme) => {
      const { icon, title, message } = SCHEME_EXAMPLES[scheme];
      return (
        <Banner key={scheme} colorScheme={scheme} icon={icon} title={title}>
          {message}
        </Banner>
      );
    })}
  </Demo>
);

export const BannerActionDemo = () => (
  <Demo className='flex-col items-stretch'>
    <Banner
      colorScheme='indigo'
      icon={Sparkles}
      title='Premium'
      action={
        <Button size='sm' variant='accent'>
          Upgrade
        </Button>
      }
    >
      The action slot renders below the message.
    </Banner>
  </Demo>
);
