import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@ui/modules/core/primitives/Command';
import { Demo } from '../Demo';

export const CommandDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <Command className='w-full max-w-sm border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-md)]'>
        <CommandInput placeholder='Search a country…' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading='Countries'>
            <CommandItem>Spain</CommandItem>
            <CommandItem>Italy</CommandItem>
            <CommandItem>Andorra</CommandItem>
          </CommandGroup>
          <CommandGroup heading='Regions'>
            <CommandItem>Catalonia</CommandItem>
            <CommandItem>Lombardy</CommandItem>
            <CommandItem disabled>Atlantis (disabled)</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </LazyMotionProvider>
  </Demo>
);
