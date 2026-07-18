import { Button, type buttonVariants } from '@ui/modules/core/primitives/Button';
import type { VariantProps } from 'class-variance-authority';
import { Demo } from '../Demo';
import type { VariantRow } from '../VariantsTable';

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

// Exhaustive Record over the real CVA types: adding, renaming or removing a
// variant in the app makes `astro check` fail here, keeping the docs honest.
const VARIANT_LABELS: Record<ButtonVariant, string> = {
  default: 'Default',
  accent: 'Accent',
  destructive: 'Destructive',
  success: 'Success',
  outline: 'Outline',
  secondary: 'Secondary',
  ghost: 'Ghost',
  link: 'Link',
};

const SIZE_LABELS: Record<ButtonSize, string> = {
  default: 'Default',
  sm: 'Small',
  lg: 'Large',
  icon: 'Icon',
  'icon-sm': 'Icon small',
  'icon-lg': 'Icon large',
};

const VARIANTS = Object.keys(VARIANT_LABELS) as ButtonVariant[];
const TEXT_SIZES = ['sm', 'default', 'lg'] as const satisfies readonly ButtonSize[];
const ICON_SIZES = ['icon-sm', 'icon', 'icon-lg'] as const satisfies readonly ButtonSize[];

export const BUTTON_VARIANT_ROWS: VariantRow[] = [
  {
    axis: 'variant',
    values: VARIANTS,
    defaultValue: 'default',
    notes: 'ghost and link render without border, shadow or hover lift.',
  },
  {
    axis: 'size',
    values: Object.keys(SIZE_LABELS),
    defaultValue: 'default',
    notes: 'icon-* sizes are square, for icon-only buttons.',
  },
];

export const ButtonVariantsDemo = () => (
  <Demo>
    {VARIANTS.map((variant) => (
      <Button key={variant} variant={variant}>
        {VARIANT_LABELS[variant]}
      </Button>
    ))}
  </Demo>
);

export const ButtonSizesDemo = () => (
  <Demo>
    {TEXT_SIZES.map((size) => (
      <Button key={size} size={size}>
        {SIZE_LABELS[size]}
      </Button>
    ))}
    {ICON_SIZES.map((size) => (
      <Button key={size} size={size} aria-label={SIZE_LABELS[size]}>
        ★
      </Button>
    ))}
  </Demo>
);

export const ButtonStatesDemo = () => (
  <Demo>
    <Button>Hover me</Button>
    <Button disabled>Disabled</Button>
    <Button variant='outline' asChild>
      <a href='https://forever-pto.com' target='_blank' rel='noreferrer'>
        asChild link
      </a>
    </Button>
  </Demo>
);
