import { Badge, type badgeVariants } from '@ui/modules/core/primitives/Badge';
import type { VariantProps } from 'class-variance-authority';
import { Demo } from '../Demo';
import type { VariantRow } from '../VariantsTable';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

// Exhaustive Record over the real CVA types: adding, renaming or removing a
// variant in the app makes `astro check` fail here, keeping the docs honest.
const VARIANT_LABELS: Record<BadgeVariant, string> = {
  default: 'Default',
  secondary: 'Secondary',
  destructive: 'Destructive',
  outline: 'Outline',
};

const VARIANTS = Object.keys(VARIANT_LABELS) as BadgeVariant[];

export const BADGE_VARIANT_ROWS: VariantRow[] = [
  {
    axis: 'variant',
    values: VARIANTS,
    defaultValue: 'default',
    notes: 'No size axis — a single fixed pill size.',
  },
];

export const BadgeVariantsDemo = () => (
  <Demo>
    {VARIANTS.map((variant) => (
      <Badge key={variant} variant={variant}>
        {VARIANT_LABELS[variant]}
      </Badge>
    ))}
  </Demo>
);

export const BadgeAsLinkDemo = () => (
  <Demo>
    <Badge variant='secondary'>Static badge</Badge>
    <Badge variant='secondary' asChild>
      <a href='https://forever-pto.com' target='_blank' rel='noreferrer'>
        Link badge — hover me
      </a>
    </Badge>
  </Demo>
);
