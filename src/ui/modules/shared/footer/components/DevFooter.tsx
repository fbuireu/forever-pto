'use client';

import { blueskyIcon } from '@ui/assets/icons/bluesky';
import { buyMeACoffeeIcon } from '@ui/assets/icons/buyMeACoffee';
import { githubIcon } from '@ui/assets/icons/github';
import { linkedinIcon } from '@ui/assets/icons/linkedin';
import { RotatingTextContainer } from '@ui/modules/core/animate/primitives/texts/Rotating';
import { RotatingText } from '@ui/modules/core/animate/text/Rotating';
import { Me } from '@ui/modules/pages/legal/Me';
import { Icon } from '@ui/modules/shared/Icon';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const EMOJIS: string[] = ['☕', '🍺', '❤️', '🚀', '⚡', '🔥', '💻', '🌮', '🍕', '🎵', '🎮', '😴', '🤯', '💡'];

const SOCIAL_NETWORKS = {
  GITHUB: {
    USERNAME: 'fbuireu',
    BASE_URL: 'https://github.com',
    ICON: githubIcon,
    COLOR: 'light-dark(#24292f, #f0f6fc)',
  },
  LINKEDIN: {
    USERNAME: 'ferran-buireu',
    BASE_URL: 'https://linkedin.com/in',
    ICON: linkedinIcon,
    COLOR: '#0077B5',
  },
  BLUESKY: {
    USERNAME: 'fbuireu.bsky.social',
    BASE_URL: 'https://bsky.app/profile',
    ICON: blueskyIcon,
    COLOR: '#0085FF',
  },
  BUY_ME_A_COFFEE: {
    USERNAME: 'ferranbuireu',
    BASE_URL: 'https://www.buymeacoffee.com',
    ICON: buyMeACoffeeIcon,
    COLOR: '#FFDD00',
  },
} as const;

const getRandomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

export const DevFooter = () => {
  const t = useTranslations('devFooter');
  const [currentEmoji, setCurrentEmoji] = useState(getRandomEmoji);
  const intervalRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentEmoji(getRandomEmoji());
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className='p-4 flex flex-col items-center justify-center gap-4'>
      <div className='text-sm flex items-baseline gap-1.5 text-muted-foreground text-center'>
        {t('madeWith')}
        <RotatingTextContainer text={EMOJIS}>
          <RotatingText text={currentEmoji} transition={{ type: 'spring', bounce: 0.5, stiffness: 300, duration: 2 }} />
        </RotatingTextContainer>
        {t('by')}
        <span className='font-medium text-foreground hover:text-primary p-0 h-auto min-w-0'>
          <Me ariaLabel='Ferran Buireu' />
        </span>
      </div>
      <p className='text-sm text-muted-foreground text-center'>{t('findMeOn')}</p>
      <div className='flex gap-5 items-center gap-x-1 text-xs text-muted-foreground/70'>
        {Object.entries(SOCIAL_NETWORKS).map(([key, network]) => (
          <a
            key={key}
            href={`${network.BASE_URL}/${network.USERNAME}`}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`Visit my ${key.toLowerCase().replace('_', ' ')} profile`}
            className='inline-flex items-center justify-center min-w-11 min-h-11 transition-transform duration-200 hover:scale-110'
            style={{ '--hover-color': network.COLOR } as React.CSSProperties & { '--hover-color': string }}
          >
            <Icon icon={network.ICON} size={24} className='transition-colors duration-200 hover:text-(--hover-color)' />
          </a>
        ))}
      </div>
    </div>
  );
};
