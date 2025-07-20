
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RoomLocation, ListingType, RoomType, RoomListingFormData } from '../types';
import { Button, Input, Select, Textarea, Alert, Modal } from '../components/UIElements';
import { PencilIcon, RocketIcon } from '../components/VibrantIcons';
import { ALL_HOSTELS, BLOCKS, ROOM_TYPES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { uploadAllotmentProof, saveListing } from '../services/listingService';

const FileUploadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-slate-400 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338 0 4.5 4.5 0 01-1.41 8.775H6.75z" />
  </svg>
);


const ListRoomPage: React.FC = () => {
  const { user, setUserHasActiveListing, updateUserRoom } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RoomListingFormData>({
    roomDetails: user?.currentRoom || { hostel: ALL_HOSTELS[0].value, block: BLOCKS[0], roomNumber: '', type: ROOM_TYPES[0] as RoomType },
    listingType: 'Exchange',
    description: '',
    desiredTradeConditions: '',
    roomProofFile: null,
    allotmentProof: undefined,
    allotmentProofType: undefined
  });
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    if (user?.currentRoom) {
      setFormData(prev => ({ ...prev, roomDetails: user.currentRoom! }));
    }
  }, [user]);

  const handleInputChange = <K extends keyof RoomLocation>(field: K, value: RoomLocation[K]) => {
    setFormData(prev => ({ ...prev, roomDetails: { ...prev.roomDetails, [field]: value } }));
  };

  const handleFormChange = (field: keyof Omit<RoomListingFormData, 'roomDetails' | 'roomProofFile'>, value: string | ListingType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, roomProofFile: e.target.files![0] }));
    } else {
      setFormData(prev => ({ ...prev, roomProofFile: null }));
    }
  };

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be logged in to list a room.');
      return;
    }
    if (!formData.roomDetails.roomNumber.trim()) {
        setError('Room number is required.');
        return;
    }
    if (!formData.description.trim()) {
        setError('Description is required.');
        return;
    }
    if (!formData.roomProofFile) {
        setError('Room allocation proof (photo/screenshot) is required.');
        return;
    }

    setIsConfirmationModalOpen(true);
  };
  
  const handleConfirmSubmit = async () => {
    setIsConfirmationModalOpen(false);
    setIsLoading(true);

    if (!user) {
        setError('You must be logged in to list a room.');
        setIsLoading(false);
        return;
    }

    try {
      // Step 1: Upload allotment proof
      if (!formData.roomProofFile) {
        setError('Room allocation proof is required.');
        setIsLoading(false);
        return;
      }

      console.log('Uploading allotment proof...');
      const proofUploadResult = await uploadAllotmentProof(formData.roomProofFile);
      console.log('Allotment proof uploaded successfully:', proofUploadResult);

      // Step 2: Create listing with proof
      const listingData: RoomListingFormData = {
        ...formData,
        allotmentProof: proofUploadResult.allotmentProof,
        allotmentProofType: 'gmail' // Default to gmail for now
      };

      console.log('Creating listing...');
      const listing = await saveListing(listingData);
      console.log('Listing created successfully:', listing);

      // Update user state
      updateUserRoom(formData.roomDetails);
      setUserHasActiveListing(true);
      
      setSuccess('Your room has been successfully listed! Redirecting to dashboard...');
      
      // Clear form
      setFormData(prev => ({
          ...prev,
          description: '',
          desiredTradeConditions: '',
          roomProofFile: null,
          allotmentProof: undefined,
          allotmentProofType: undefined
      }));
      
      setTimeout(() => navigate('/dashboard'), 2500);

    } catch (error) {
      console.error('Failed to create listing:', error);
      if (error instanceof Error) {
        setError(`Failed to create listing: ${error.message}`);
      } else {
        setError('Failed to create listing. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
    return <div className="text-center p-8"><p className="text-xl text-yellow-500">Loading user information or please log in.</p></div>;
  }

  if (user.hasActiveListing) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white/80 dark:bg-black/30 backdrop-blur-md shadow-xl rounded-xl border border-white/20 dark:border-white/10 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">✅ You Have an Active Listing</h1>
        <p className="text-slate-700 dark:text-slate-300 mb-4">
          You already have an active room listing. According to hostel rules, you can only list one room at a time.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          To make changes, please delist your current room first or contact the admin.
        </p> 
        <Button onClick={() => navigate('/dashboard')} className="mt-6">Go to Dashboard</Button>
      </div>
    );
  }


  return ( 
    <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white/80 dark:bg-black/30 backdrop-blur-md shadow-xl rounded-xl border border-white/20 dark:border-white/10">
       <Modal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        title="⚠️ Confirm Your Details"
        size="md"
      >
        <p className="text-slate-700 dark:text-slate-300">
          Please double-check your room details. Once listed, this information will be <strong>locked</strong> and will require admin approval to change.
        </p>
        <div className="mt-3 p-3 bg-slate-200/50 dark:bg-black/30 rounded-lg border border-slate-300/40 dark:border-white/10 text-sm space-y-1">
          <p><strong className="font-semibold text-slate-600 dark:text-slate-400">Hostel:</strong> {formData.roomDetails.hostel}</p>
          <p><strong className="font-semibold text-slate-600 dark:text-slate-400">Block:</strong> {formData.roomDetails.block}</p>
          <p><strong className="font-semibold text-slate-600 dark:text-slate-400">Room:</strong> {formData.roomDetails.roomNumber}</p>
          <p><strong className="font-semibold text-slate-600 dark:text-slate-400">Type:</strong> {formData.roomDetails.type}</p>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsConfirmationModalOpen(false)}>Go Back & Edit</Button>
          <Button variant="primary" onClick={handleConfirmSubmit}>Confirm & List Room</Button>
        </div>
      </Modal>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
        <PencilIcon className="w-8 h-8" /> List Your Room
      </h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} />}
      
      <form onSubmit={handleInitiateSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200/90 dark:border-white/15 pb-2">🏠 Your Room Details</h2>
           <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2"><strong>Important:</strong> These details will be locked once you list your room. Ensure they are correct.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Select
              label="Hostel"
              value={formData.roomDetails.hostel}
              onChange={(value) => handleInputChange('hostel', value)}
              options={ALL_HOSTELS.map(h => ({ value: h.value, label: h.label }))}
              required
            />
            <Select
              label="Block"
              value={formData.roomDetails.block}
              onChange={(value) => handleInputChange('block', value)}
              options={BLOCKS.map(b => ({ value: b, label: b }))}
              required
            />
            <Input
              label="Room Number"
              type="text"
              value={formData.roomDetails.roomNumber}
              onChange={(e) => handleInputChange('roomNumber', e.target.value)}
              placeholder="e.g., 101, G-05"
              required
            />
            <Select
              label="Room Type"
              value={formData.roomDetails.type}
              onChange={(value) => handleInputChange('type', value as RoomType)}
              options={ROOM_TYPES.filter(rt => rt !== 'Any').map(rt => ({value: rt, label: rt}))}
              required
            />
          </div>
        </div>

        <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200/90 dark:border-white/15 pb-2">ℹ️ Listing Information</h2>
            <Select
                label="Listing Type"
                value={formData.listingType}
                onChange={(value) => handleFormChange('listingType', value as ListingType)}
                options={[
                    { value: 'Exchange', label: 'Up for Exchange' },
                    { value: 'Bidding', label: 'Up for Bidding' }
                ]}
                required
            />
        </div>

        <Textarea
          label="Description"
          rows={3}
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="e.g., Well-ventilated, good view, near common facilities."
          required
        />

        {formData.listingType === 'Bidding' && (
          <Textarea
            label="Desired Trade Conditions (for Bidding)"
            rows={2}
            value={formData.desiredTradeConditions}
            onChange={(e) => handleFormChange('desiredTradeConditions', e.target.value)}
            placeholder="e.g., Looking for a single room in HL-1 or HL-4."
            required={formData.listingType === 'Bidding'}
          />
        )}

        <div>
            <label htmlFor="roomProofFile" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                📎 Upload Room Allocation Proof
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300/50 dark:border-white/30 border-dashed rounded-md bg-white/50 dark:bg-black/20 hover:border-indigo-400/50 dark:hover:border-indigo-500/60 transition-colors">
                <div className="space-y-1 text-center">
                    <FileUploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                        <label
                            htmlFor="roomProofFile-input"
                            className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-1"
                        >
                            <span>Upload a file</span>
                            <input id="roomProofFile-input" name="roomProofFile" type="file" className="sr-only" onChange={handleFileChange} accept="image/jpeg,image/png,application/pdf" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, PDF up to 2MB (mock)</p>
                    {formData.roomProofFile && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Selected: {formData.roomProofFile.name}</p>}
                </div>
            </div>
             <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">A photo/screenshot of your official room allocation is required.</p>
        </div>
        
        <Button type="submit" className="w-full !mt-8" isLoading={isLoading} size="lg" leftIcon={<RocketIcon />}>
          {isLoading ? 'Submitting...' : 'List My Room'}
        </Button>
      </form>
    </div>
  );
};

export default ListRoomPage;
