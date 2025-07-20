
import React from 'react';
import { RoomListing } from '../types';
import { Button } from './UIElements';
import { WhatsAppIcon, FireIcon, HeartIcon } from './VibrantIcons';


interface RoomCardProps {
  room: RoomListing;
  currentUserId?: string; 
  className?: string;
  style?: React.CSSProperties;
  onExpressInterest?: (listingId: string, currentInterestStatus: boolean) => void;
  currentUserInterested?: boolean;
  rank?: number;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  currentUserId,
  className,
  style,
  onExpressInterest,
  currentUserInterested,
  rank
}) => {
  const { roomDetails, listedBy, listingType, description, desiredTradeConditions, status, createdAt, interestCount, id } = room;
  
  const roomSummary = `${roomDetails.hostel} - ${roomDetails.block}/${roomDetails.roomNumber}`;

  const handleInterestClick = () => {
    if (onExpressInterest) {
      onExpressInterest(id, !!currentUserInterested);
    }
  };
  
  const canMessageLister = listedBy && listedBy.whatsappNumber && (!currentUserId || listedBy.id !== currentUserId);

  const listingTypeBadgeClass = listingType === 'Exchange' 
    ? 'bg-blue-900/50 text-blue-200' 
    : 'bg-purple-900/50 text-purple-200';

  const whatsappUrl = `https://wa.me/91${listedBy.whatsappNumber.replace(/\D/g, '')}`;

  return (
    <div 
        className={`holo-card flex flex-col justify-between ${className || ''}`}
        style={style}
    >
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-cyan-200 hover:text-cyan-400 transition-colors flex items-center gap-2">
                {rank && <span className="text-xl font-black text-cyan-400">#{rank}</span>}
                {roomSummary}
            </h3>
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${listingTypeBadgeClass}`}>
            {listingType}
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-1">Type: <span className="font-medium text-slate-200">{roomDetails.type}</span></p>
        
        {listedBy && (
          <p className="text-sm text-slate-400 mb-1">
            Listed by: <span className="font-medium text-slate-200">{listedBy.fullName} ({listedBy.rollNumber})</span>
          </p>
        )}

        {description && (
          <p className="text-sm text-slate-300 mt-3 mb-3 bg-slate-800/50 p-3 rounded-md border border-cyan-500/10">{description}</p>
        )}
        {desiredTradeConditions && (
          <p className="text-sm text-slate-300 mt-3 mb-3 bg-slate-800/50 p-3 rounded-md italic border border-cyan-500/10">
            <span className="font-semibold not-italic">Wants:</span> {desiredTradeConditions}
          </p>
        )}

        {listingType === 'Bidding' && (
            <div className="flex justify-between items-center mt-2 mb-2">
                <p className="text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                    <FireIcon className="w-5 h-5"/> {interestCount || 0} students interested
                </p>
                {currentUserId && onExpressInterest && (
                    <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={handleInterestClick}
                        leftIcon={<HeartIcon className={`w-5 h-5 ${currentUserInterested ? 'text-pink-500 fill-current' : ''}`} />}
                        className={currentUserInterested ? '!bg-pink-900/50 !text-pink-200' : 'text-slate-300 hover:bg-white/10'}
                    >
                        {currentUserInterested ? 'Interested' : 'Interest'}
                    </Button>
                )}
            </div>
        )}

        <p className="text-xs text-slate-400 mb-4">Status: <span className={`font-semibold ${status === 'Open' ? 'text-green-400' : 'text-red-400'}`}>{status}</span></p>
        
        <div className="mt-4 space-y-2">
            {canMessageLister && (
                 <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black transition-all duration-200 ease-in-out transform flex items-center justify-center shadow-lg hover:scale-[1.03] active:scale-[0.98] px-4 py-2 text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500 w-full"
                  >
                    <WhatsAppIcon className="w-5 h-5 mr-2" />
                    Message on WhatsApp
                </a>
            )}
        </div>
      </div>
      <div className="bg-transparent px-6 py-2 text-right border-t border-cyan-500/10 mt-auto">
        <p className="text-xs text-slate-400">
          Listed: {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RoomCard;
