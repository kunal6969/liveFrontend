import React, { useState } from 'react';
import { Event } from '../types';
import { Button } from './UIElements';
import { CalendarDaysIcon, FireIcon, CheckmarkIcon } from './VibrantIcons';

interface EventCardProps {
    event: Event;
    isRegistered: boolean;
    onRegister: (eventId: string) => void;
    onUnregister: (eventId: string) => void;
    style?: React.CSSProperties;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 text-sm">
        <div className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0">{icon}</div>
        <span className="font-medium text-slate-600 dark:text-slate-400">{label}:</span>
        <span className="text-slate-800 dark:text-slate-200">{value}</span>
    </div>
);

const EventCard: React.FC<EventCardProps> = ({ event, isRegistered, onRegister, onUnregister, style }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    const eventDate = new Date(event.dateTime);
    const formattedDate = eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

    const handleRegisterClick = async () => {
        setIsProcessing(true);
        await onRegister(event.id);
        setIsProcessing(false);
    };

    const handleUnregisterClick = async () => {
        setIsProcessing(true);
        await onUnregister(event.id);
        setIsProcessing(false);
    };
    
    return (
        <div
            className="bg-white/90 dark:bg-black/30 backdrop-blur-md shadow-xl rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 border border-white/20 dark:border-white/10 flex flex-col justify-between animate-pop-in"
            style={style}
        >
            <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{event.name}</h3>
                <p className="text-md font-semibold text-indigo-600 dark:text-indigo-400 mb-4">{event.organizer}</p>
                
                <div className="space-y-2 mb-4">
                   <InfoRow icon={<CalendarDaysIcon />} label="Date" value={formattedDate} />
                   <InfoRow icon={<FireIcon />} label="Time" value={formattedTime} />
                   <InfoRow icon={<UsersIcon />} label="Venue" value={event.location} />
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-white/5 p-3 rounded-md border border-slate-300/30 dark:border-white/10">
                    {event.description}
                </p>

                {event.registrationLink && (
                    <a 
                        href={event.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline mt-3 inline-block"
                    >
                        External Registration Link
                    </a>
                )}
            </div>

            <div className="bg-black/5 dark:bg-black/20 px-6 py-4 mt-auto border-t border-black/10 dark:border-white/10">
                {isRegistered ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full !bg-green-100 dark:!bg-green-900/40 !text-green-700 dark:!text-green-200 hover:!bg-green-200 dark:hover:!bg-green-900/60"
                        onClick={handleUnregisterClick}
                        isLoading={isProcessing}
                        leftIcon={<CheckmarkIcon />}
                    >
                        Registered
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={handleRegisterClick}
                        isLoading={isProcessing}
                    >
                        Register for Event
                    </Button>
                )}
            </div>
        </div>
    );
};
// Dummy icon for use inside the component
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.75 3.75 0 0112 15v-2.25A3.75 3.75 0 0115.75 9v-2.25A3.75 3.75 0 0112 3V4.5m-7.5 4.5M12 12.75a3 3 0 01-3-3v-1.5a3 3 0 013-3v1.5a3 3 0 013 3v1.5a3 3 0 01-3 3m-3.75 2.25A3.75 3.75 0 0112 18v-2.25a3.75 3.75 0 013.75-3.75V15m-7.5-3v3.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V12m-4.5 0V9A3.75 3.75 0 0112 5.25v1.5A3.75 3.75 0 0115.75 9V12m0-3h-1.5M12 9h1.5" />
    </svg>
);


export default EventCard;
