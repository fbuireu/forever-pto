import { Textarea } from '@ui/modules/core/primitives/Textarea';
import { Demo } from '../Demo';

export const TextareaStatesDemo = () => (
  <Demo className='flex-col items-stretch'>
    <Textarea placeholder='Type several lines — the field grows with its content.' aria-label='Default textarea' />
    <Textarea defaultValue='Disabled' disabled aria-label='Disabled textarea' />
    <Textarea defaultValue='Invalid value' aria-invalid='true' aria-label='Invalid textarea' />
  </Demo>
);
