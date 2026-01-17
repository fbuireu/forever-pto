'use client';

import { Button } from '@const/components/ui/button';

export const CookieButton = () => {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('cc:showPreferences'));
  };

  return (
    <Button variant='ghost' className='text-muted-foreground -ml-2 font-normal' onClick={handleClick}>
      Manage cookies
    </Button>
  );
};
