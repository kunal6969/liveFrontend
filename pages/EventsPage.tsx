import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventFormData } from '../types';
import * as eventService from '../services/eventService';
import LoadingIndicator from '../components/LoadingIndicator';
import { Button } from '../components/UIElements';
import { CalendarDaysIcon, PlusIcon, WhatsAppIcon } from '../components/VibrantIcons';
import { Modal, Input, Textarea, Alert } from '../components/UIElements';
import { RocketIcon } from '../components/VibrantIcons';
import { useNavigate } from 'react-router-dom';

const RequestEventModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: EventFormData) => Promise<boolean>;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<EventFormData>({ name: '', organizer: '', date: '', time: '', location: '', description: '', registrationLink: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
           setTimeout(() => {
             setFormData({ name: '', organizer: '', date: '', time: '', location: '', description: '', registrationLink: '' });
             setError('');
             setIsSubmitting(false);
             setSuccess(false);
           }, 300)
        }
    }, [isOpen]);
    
    const handleChange = (field: keyof EventFormData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        setError('');
        if (!formData.name || !formData.organizer || !formData.date || !formData.time || !formData.location || !formData.description) {
            setError('All fields except the registration link are required.');
            return;
        }
        setIsSubmitting(true);
        const result = await onSubmit(formData);
        setIsSubmitting(false);

        if (result) {
            setSuccess(true);
            setTimeout(() => onClose(), 2500);
        } else {
            setError('There was an error submitting your request.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Register Your Event" size="xl">
            {success ? (
                <div className="text-center p-4">
                    <h3 className="text-lg font-semibold mt-4 text-slate-200">Request Sent!</h3>
                    <p className="text-slate-400">Your event has been submitted for admin approval.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                    <p className="text-sm text-slate-400">Fill out the details below to request your event listing.</p>
                    <Input label="Event Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className="futuristic-input"/>
                    <Input label="Club / Organizer Name" value={formData.organizer} onChange={e => handleChange('organizer', e.target.value)} required className="futuristic-input"/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Date" type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} required className="futuristic-input"/>
                        <Input label="Time" type="time" value={formData.time} onChange={e => handleChange('time', e.target.value)} required className="futuristic-input"/>
                    </div>
                    <Input label="Location / Venue" value={formData.location} onChange={e => handleChange('location', e.target.value)} required className="futuristic-input"/>
                    <Textarea label="Event Description" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} required className="futuristic-input"/>
                    <Input label="External Registration Link (Optional)" value={formData.registrationLink} onChange={e => handleChange('registrationLink', e.target.value)} placeholder="https://forms.gle/..." className="futuristic-input"/>
                </div>
            )}
             {!success && (
                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} leftIcon={<RocketIcon/>}>Request to Admin</Button>
                </div>
            )}
        </Modal>
    );
};


const EventsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const shareText = `Hey! Check out MNIT LIVE, the one-stop platform for MNIT students to exchange rooms, find events, and connect. Join the community here: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    useEffect(() => {
        document.body.classList.add('futuristic-theme');
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => {
            document.body.classList.remove('futuristic-theme');
            clearTimeout(timer);
        };
    }, []);
    
    const handleRegisterClick = () => {
        if (user) {
            setIsModalOpen(true);
        } else {
            navigate('/login');
        }
    };

    const handleRequestSubmit = async (formData: EventFormData): Promise<boolean> => {
        if (!user) return false;
        try {
            await eventService.requestEventListing(formData);
            return true;
        } catch (error) {
            console.error("Failed to submit event request:", error);
            return false;
        }
    };

    if (isLoading) {
        return <LoadingIndicator message="Loading Events Section..." />;
    }

    return (
        <div className="max-w-5xl mx-auto p-4 text-center">
            <RequestEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleRequestSubmit}
            />

            <div className="flex flex-col items-center justify-center space-y-12">
                <div className="my-8 animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight futuristic-title">
                        Features Currently in Development
                    </h1>
                    <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                        Suggest <span className="font-bold text-cyan-400">MNIT LIVE</span> to your friends for faster availability of this feature.
                    </p>
                </div>

                <div className="w-full max-w-lg p-8 holo-card animate-pop-in" style={{animationDelay: '200ms'}}>
                     <h2 className="text-2xl font-bold text-cyan-300 flex items-center justify-center gap-3">
                        <CalendarDaysIcon className="w-8 h-8" />
                        Got an Event?
                    </h2>
                    <p className="mt-3 text-md text-slate-300">
                        Organizing a club recruitment, workshop, or a fun activity? Get it listed here for everyone to see.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        className="mt-6 w-full"
                        leftIcon={<PlusIcon className="w-6 h-6"/>}
                        onClick={handleRegisterClick}
                    >
                        Register Your Event
                    </Button>
                </div>

                 <div className="w-full max-w-lg p-8 holo-card animate-pop-in" style={{animationDelay: '400ms'}}>
                    <h2 className="text-2xl font-bold text-cyan-300 flex items-center justify-center gap-3">
                       <WhatsAppIcon className="w-8 h-8" />
                       Help Us Grow!
                    </h2>
                    <p className="mt-3 text-md text-slate-300">
                        Love MNIT LIVE? Spread the word and help the community connect.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <a 
                            href={whatsappUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex-1 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black transition-all duration-200 ease-in-out transform flex items-center justify-center shadow-lg hover:scale-[1.03] active:scale-[0.98] px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white"
                        >
                            <WhatsAppIcon className="w-6 h-6 mr-3" />
                            Share on WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventsPage;
