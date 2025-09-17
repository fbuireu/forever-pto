'use client';

import {useHolidaysStore} from '@application/stores/holidays';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@const/components/ui/dialog';
import {Input} from '@const/components/ui/input';
import {Label} from '@const/components/ui/label';
import {zodResolver} from '@hookform/resolvers/zod';
import {Calendar as CalendarIcon, CalendarDays, Plus} from 'lucide-react';
import type {Locale} from 'next-intl';
import {useState, useTransition} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from 'src/components/animate-ui/components/buttons/button';
import {z} from 'zod';
import {Calendar, type FromTo} from '../../core/Calendar';
import {formatDate} from '../../utils/formatters';
import {toast} from 'sonner';

interface AddHolidayModalProps {
    open: boolean;
    onClose: () => void;
    locale: Locale;
}

const holidaySchema = z.object({
    name: z.string().min(1, 'Holiday name is required').max(100, 'Holiday name is too long'),
    date: z.date({error: 'Please select a date'}),
});

type HolidayFormData = z.infer<typeof holidaySchema>;

export const AddHolidayModal = ({open, onClose, locale}: AddHolidayModalProps) => {
    const {holidays, addHoliday, currentSelection, alternatives, suggestion} = useHolidaysStore();
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset,
        setValue,
    } = useForm<HolidayFormData>({
        resolver: zodResolver(holidaySchema),
        mode: 'onSubmit',
        defaultValues: {
            name: '',
        },
    });

    const handleClose = () => {
        reset();
        setSelectedDate(undefined);
        onClose();
    };

    const onSubmit = (data: HolidayFormData) => {
        startTransition(() => {
            try {
                const existingHoliday = holidays.find((holiday) => holiday.date.toDateString() === data.date.toDateString());

                if (existingHoliday) {
                    toast.error('Holiday already exists', {
                        description: `There's already a holiday on ${formatDate({
                            date: data.date,
                            locale,
                            format: 'MMMM d, yyyy',
                        })}: ${existingHoliday.name}`,
                    });
                    return;
                }

                addHoliday({holiday: {name: data.name, date: data.date}, locale});

                toast.success('Holiday created successfully', {
                    description: `${data.name} has been added on ${formatDate({
                        date: data.date,
                        locale,
                        format: 'MMMM d, yyyy',
                    })}`,
                });

                handleClose();
            } catch (error) {
                console.error('Error creating holiday:', error);
                toast.error('Error creating holiday', {
                    description: 'Something went wrong. Please try again.',
                });
            }
        });
    };

    const handleDateSelect = (date: Date | Date[] | FromTo | undefined) => {
        if (date instanceof Date) {
            setSelectedDate(date);
            setValue('date', date, {shouldValidate: true});
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className='sm:max-w-sm'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Plus className='w-5 h-5 text-green-500'/>
                        Add New Holiday
                    </DialogTitle>
                    <DialogDescription>
            <span className='block my-2'>
              <CalendarDays className='w-4 h-4 inline mr-1'/>
              Create a new holiday by selecting a date and entering a name
            </span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
                    <div className='space-y-2'>
                        <Label htmlFor='name'>Holiday Name</Label>
                        <Input
                            id='name'
                            type='text'
                            placeholder='e.g. My birthday'
                            autoFocus
                            disabled={isPending}
                            {...register('name')}
                        />
                        {errors.name && <p className='text-sm text-destructive mt-1'>{errors.name.message}</p>}
                    </div>
                    <div className='space-y-2'>
                        <Label className='flex flex-direction-column flex-wrap align-items-flex-start'>
                            Select Date
                            <div className='border rounded-lg p-3'>
                                <Calendar
                                    mode='single'
                                    showNavigation
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    locale={locale}
                                    holidays={holidays}
                                    allowPastDays
                                    currentSelection={currentSelection}
                                    alternatives={alternatives}
                                    suggestion={suggestion}
                                    className='w-full'
                                    disabled={isPending}
                                />
                                {selectedDate && (
                                    <div className='mt-3 p-2 bg-muted rounded text-sm flex align-items-center'>
                                        <CalendarIcon className='w-4 h-4 inline mr-2'/>
                                        Selected: {formatDate({
                                        date: selectedDate,
                                        locale,
                                        format: 'EEEE, MMMM d, yyyy'
                                    })}
                                    </div>
                                )}
                            </div>
                        </Label>
                        {errors.date && <p className='text-sm text-destructive mt-1'>{errors.date.message}</p>}
                    </div>
                    <DialogFooter>
                        <div className='flex gap-2 pt-2'>
                            <Button
                                type='submit'
                                className='flex-1'
                                disabled={isPending}
                            >
                                <Plus className='w-4 h-4 mr-2'/>
                                {isPending ? 'Adding...' : 'Add Holiday'}
                            </Button>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={handleClose}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
