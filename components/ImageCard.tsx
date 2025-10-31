import React, { useState, useCallback } from 'react';
import { ImageFile, ProcessStatus } from '../types';
import { editImage } from '../services/geminiService';
import Spinner from './common/Spinner';
import Icon from './common/Icon';
import Button from './common/Button';

interface ImageCardProps {
  imageFile: ImageFile;
  onUpdate: (updatedFile: Partial<ImageFile> & { id: string }) => void;
}

const statusInfo = {
  [ProcessStatus.Pending]: { text: 'Pending', color: 'text-gray-400', icon: 'edit' as const },
  [ProcessStatus.Analyzing]: { text: 'Analyzing with AI...', color: 'text-blue-400', icon: 'sparkles' as const },
  [ProcessStatus.Optimizing]: { text: 'Optimizing formats...', color: 'text-purple-400', icon: 'sparkles' as const },
  [ProcessStatus.Editing]: { text: 'Applying AI edits...', color: 'text-indigo-400', icon: 'sparkles' as const },
  [ProcessStatus.Done]: { text: 'Ready', color: 'text-green-400', icon: 'check' as const },
  [ProcessStatus.Error]: { text: 'Error', color: 'text-red-400', icon: 'warning' as const },
};

const ImageCard: React.FC<ImageCardProps> = ({ imageFile, onUpdate }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiEdit = useCallback(async () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    setError(null);
    onUpdate({ id: imageFile.id, status: ProcessStatus.Editing });

    try {
      const originalBlob = await (await fetch(imageFile.originalUrl)).blob();
      const reader = new FileReader();
      reader.readAsDataURL(originalBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const newBase64 = await editImage(base64String, imageFile.originalFile.type, editPrompt);
        
        const newPreviewUrl = `data:image/jpeg;base64,${newBase64}`;
        onUpdate({ 
          id: imageFile.id, 
          previewUrl: newPreviewUrl,
          status: ProcessStatus.Done
        });
      };
    } catch (e) {
      console.error("AI Edit failed:", e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      onUpdate({ id: imageFile.id, status: ProcessStatus.Error, errorMessage: error as string });
    } finally {
      setIsEditing(false);
      setEditPrompt('');
    }
  }, [editPrompt, imageFile, onUpdate, error]);
  
  const status = statusInfo[imageFile.status];

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col transition-all duration-300 hover:shadow-blue-500/20 hover:border-blue-500/50">
      <div className="relative">
        <img src={imageFile.previewUrl} alt={imageFile.altText} className="w-full h-48 object-cover" />
        <div className={`absolute top-2 right-2 flex items-center gap-2 bg-gray-900/70 text-xs px-2 py-1 rounded-full ${status.color}`}>
          <Icon icon={status.icon} className="h-3 w-3" />
          <span>{status.text}</span>
        </div>
        {(isEditing || imageFile.status === ProcessStatus.Analyzing || imageFile.status === ProcessStatus.Editing) && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Spinner text={isEditing ? 'Applying edits...' : 'Analyzing...'}/>
             </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-4">
          <label htmlFor={`filename-${imageFile.id}`} className="block text-xs font-medium text-gray-400 mb-1">Filename</label>
          <input
            id={`filename-${imageFile.id}`}
            type="text"
            value={imageFile.newName}
            onChange={(e) => onUpdate({ id: imageFile.id, newName: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-md px-2 py-1 text-sm border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mb-4 flex-grow">
          <label htmlFor={`alttext-${imageFile.id}`} className="block text-xs font-medium text-gray-400 mb-1">Alt-Text / Description</label>
          <textarea
            id={`alttext-${imageFile.id}`}
            value={imageFile.altText}
            onChange={(e) => onUpdate({ id: imageFile.id, altText: e.target.value })}
            rows={4}
            className="w-full bg-gray-700 text-white rounded-md px-2 py-1 text-sm border border-gray-600 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
        <div className="mt-auto space-y-2">
           <p className="text-xs font-medium text-gray-400 mb-1">AI Edit</p>
           <div className="flex gap-2">
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., 'add a retro filter'"
              className="flex-grow bg-gray-700 text-white rounded-md px-2 py-1 text-sm border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              disabled={isEditing}
            />
            <Button onClick={handleAiEdit} isLoading={isEditing} disabled={!editPrompt.trim()}>
              Apply
            </Button>
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
