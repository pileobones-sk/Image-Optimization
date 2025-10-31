import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { VideoAspectRatio } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import Spinner from './common/Spinner';
import Button from './common/Button';
import Icon from './common/Icon';

// FIX: Define a named interface for `aistudio` to resolve declaration merging conflicts.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } catch (e) {
            console.error("Error checking for API key:", e);
            setApiKeySelected(false);
        }
    } else {
        // Fallback for environments where aistudio is not available
        console.warn("aistudio context not found. Assuming API key is set via environment.");
        setApiKeySelected(true);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    try {
        await window.aistudio.openSelectKey();
        // Assume success to avoid race condition, re-check on next API call if needed.
        setApiKeySelected(true);
    } catch (e) {
        console.error("Could not open API key selection:", e);
        setError("Failed to open API key selection dialog.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !imageFile) {
      setError('Please provide a prompt and upload a starting image.');
      return;
    }
    
    await checkApiKey();
    if (!apiKeySelected) {
      setError('Please select an API key to proceed.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const videoUrl = await generateVideo(base64Image, imageFile.type, prompt, aspectRatio);
      setGeneratedVideo(videoUrl);
    } catch (e) {
      console.error('Video generation failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      if (errorMessage.includes("Requested entity was not found")) {
          setError("API Key error. Please re-select your API key and try again.");
          setApiKeySelected(false);
      } else {
          setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFile, aspectRatio, apiKeySelected, checkApiKey]);

  if (!apiKeySelected) {
      return (
          <div className="max-w-md mx-auto text-center p-8 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">API Key Required for Video Generation</h2>
              <p className="text-gray-400 mb-6">The Veo model requires you to select a project-based API key. This helps manage billing for video generation.</p>
              <Button onClick={handleSelectKey} icon={<Icon icon='sparkles' />}>
                  Select API Key
              </Button>
               {error && <p className="text-red-400 mt-4">{error}</p>}
              <p className="text-xs text-gray-500 mt-4">
                  For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">billing documentation</a>.
              </p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h2 className="text-xl font-bold mb-2 text-center">AI Video Generator (Veo)</h2>
        <p className="text-gray-400 mb-6 text-center">Upload a starting image and describe the video you want to create.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., The city awakens, time-lapse from dawn to day"
                    rows={3}
                    className="w-full bg-gray-700 text-white rounded-md p-3 text-base border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                />
                 <div>
                    <label htmlFor="video-aspect-ratio" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
                    <select
                        id="video-aspect-ratio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
                        className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                    </select>
                </div>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt.trim() || !imageFile} className="w-full" icon={<Icon icon="video" />}>
                    Generate Video
                </Button>
            </div>
            <div>
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*"/>
                 <button onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
                    ) : (
                        <>
                            <Icon icon="upload" className="h-8 w-8 mb-2" />
                            <span>Click to upload starting image</span>
                        </>
                    )}
                 </button>
            </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col justify-center items-center p-8 bg-gray-800/50 rounded-xl space-y-4">
          <Spinner text="Generating your video..."/>
          <p className="text-sm text-gray-400 text-center">This can take a few minutes. Please be patient.</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-xl text-center">
          <p>{error}</p>
        </div>
      )}

      {generatedVideo && (
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
            <h3 className="text-lg font-bold mb-4 text-center">Result</h3>
            <video src={generatedVideo} controls autoPlay loop className="rounded-lg mx-auto max-w-full shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;