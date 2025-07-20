

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CommonChatMessage, Poll, TextMessage, ImageMessage, PollMessage } from '../types';
import { getChatMessages, addChatMessage, voteOnPoll } from '../services/commonChatService';
import LoadingIndicator from '../components/LoadingIndicator';
import PollComponent from '../components/PollComponent';
import { Button, Textarea, Modal, Input, Alert } from '../components/UIElements';
import { BuildingIcon, ImageIcon, PollIcon, SendIcon, MaskIcon } from '../components/VibrantIcons';


// Helper component for Poll Creation Modal
const PollCreationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (pollData: { question: string; options: string[] }) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) { // Limit options
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) { // Must have at least 2 options
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleCreate = () => {
    setError('');
    if (!question.trim()) {
      setError('Poll question cannot be empty.');
      return;
    }
    const filledOptions = options.map(o => o.trim()).filter(o => o);
    if (filledOptions.length < 2) {
      setError('You must provide at least two non-empty options.');
      return;
    }
    onCreate({ question, options: filledOptions });
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };
  
  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
        setQuestion('');
        setOptions(['', '']);
        setError('');
    }
  }, [isOpen]);

  const modalTitle = (
    <div className="flex items-center gap-2">
      <PollIcon className="w-7 h-7" />
      <span>Create a New Poll</span>
    </div>
  );

  return ( 
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <Input
          label="❓ Poll Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What should we decide?"
          required
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">🗳️ Options</label>
          <div className="space-y-2 mt-1">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="!mt-0"
                />
                {options.length > 2 && (
                  <Button variant="danger" size="sm" onClick={() => removeOption(index)} className="!p-2">
                    &times;
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
            <Button variant="secondary" onClick={addOption} disabled={options.length >= 10}>
                Add Option
            </Button>
            <Button variant="primary" onClick={handleCreate}>
                Create Poll
            </Button>
        </div>
      </div>
    </Modal>
  );
};


const CommonChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommonChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(() => {
    const chatMessages = getChatMessages();
    setMessages(chatMessages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadMessages();
    setIsLoading(false);

    const intervalId = setInterval(loadMessages, 3000); // Poll for new messages
    return () => clearInterval(intervalId);
  }, [loadMessages]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleVote = (messageId: string, optionIndex: number) => {
    if (!user) return;
    const success = voteOnPoll(messageId, optionIndex, user.id);
    if (success) {
      loadMessages(); // Re-fetch messages to update UI
    }
  };
  
  const getSender = () => {
      if(isAnonymous || !user) return { id: 'anonymous', name: 'Anonymous' };
      return { id: user.id, name: user.fullName };
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const message: Omit<TextMessage, 'id' | 'timestamp'> = {
        type: 'text',
        sender: getSender(),
        content: newMessage,
    };
    addChatMessage(message);
    setNewMessage('');
    loadMessages();
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const imageUrl = e.target?.result as string;
              const message: Omit<ImageMessage, 'id' | 'timestamp'> = {
                  type: 'image',
                  sender: getSender(),
                  imageUrl: imageUrl,
              };
              addChatMessage(message);
              loadMessages();
          };
          reader.readAsDataURL(file);
      }
      // Reset file input
      if(imageInputRef.current) imageInputRef.current.value = "";
  };
  
  const handleCreatePoll = (pollData: { question: string; options: string[] }) => {
      const newPoll: Poll = {
          id: `poll-${Date.now()}`,
          question: pollData.question,
          options: pollData.options.map(opt => ({ text: opt, voters: [] })),
      };
      const message: Omit<PollMessage, 'id' | 'timestamp'> = {
          type: 'poll',
          sender: getSender(),
          poll: newPoll,
      };
      addChatMessage(message);
      loadMessages();
  };

  if (isLoading) return <LoadingIndicator message="Loading Common Room..." />;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-white/80 dark:bg-black/30 backdrop-blur-md shadow-2xl rounded-xl border border-white/20 dark:border-white/10 overflow-hidden"> 
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white p-4 border-b border-slate-200/90 dark:border-white/10 flex-shrink-0 text-center flex items-center justify-center gap-2">
        <BuildingIcon className="w-8 h-8" /> Common Chat Room
      </h1>
       
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md">
                {msg.sender.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow">
              <div className="flex items-baseline gap-2">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{msg.sender.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
              <div className="mt-1 text-slate-700 dark:text-slate-300">
                {msg.type === 'text' && <p>{msg.content}</p>}
                {msg.type === 'image' && <img src={msg.imageUrl} alt="User upload" className="max-w-xs md:max-w-sm rounded-lg shadow-lg my-2" />}
                {msg.type === 'poll' && <PollComponent messageId={msg.id} poll={msg.poll} onVote={handleVote} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200/90 dark:border-white/10 flex-shrink-0 bg-white/50 dark:bg-black/20">
        <div className="flex items-start gap-3">
            <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                placeholder="Type your message..."
                rows={2}
                className="!mt-0"
            /> 
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()} leftIcon={<SendIcon />}>Send</Button>
        </div>
        <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2">
                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden"/>
                <Button variant="ghost" size="sm" onClick={() => imageInputRef.current?.click()} leftIcon={<ImageIcon />}>Image</Button>
                <Button variant="ghost" size="sm" onClick={() => setIsPollModalOpen(true)} leftIcon={<PollIcon />}>Poll</Button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                <input 
                    type="checkbox" 
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600 bg-slate-100 dark:bg-black/20 border-slate-400 dark:border-white/20 focus:ring-indigo-500 rounded"
                /> 
                <MaskIcon className="w-5 h-5"/> Post Anonymously
            </label>
        </div>
      </div>
      <PollCreationModal isOpen={isPollModalOpen} onClose={() => setIsPollModalOpen(false)} onCreate={handleCreatePoll} />
    </div>
  );
};

export default CommonChatPage;
