import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import { AspectRatio } from '../types';
import Spinner from './common/Spinner';
import Button from './common/Button';
import Icon from './common/Icon';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64Image = await generateImage(prompt, aspectRatio);
      setGeneratedImage(`data:image/jpeg;base64,${base64Image}`);
    } catch (e) {
      console.error('Image generation failed:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio]);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h2 className="text-xl font-bold mb-2 text-center">AI Image Generator</h2>
        <p className="text-gray-400 mb-6 text-center">Describe the image you want to create. Be as specific as you like.</p>
        
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A photo of an astronaut riding a horse on Mars, cinematic lighting"
            rows={3}
            className="w-full bg-gray-700 text-white rounded-md p-3 text-base border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="w-full sm:w-auto">
                <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
                <select
                    id="aspect-ratio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                >
                    {aspectRatios.map(ratio => (
                        <option key={ratio} value={ratio}>{ratio}</option>
                    ))}
                </select>
            </div>
             <div className="w-full sm:w-auto flex-grow">
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt.trim()} className="w-full h-full" icon={<Icon icon="sparkles" />}>
                    Generate Image
                </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8 bg-gray-800/50 rounded-xl">
          <Spinner text="Generating your masterpiece..." />
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-xl text-center">
          <p>{error}</p>
        </div>
      )}

      {generatedImage && (
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
            <h3 className="text-lg font-bold mb-4 text-center">Result</h3>
            <img src={generatedImage} alt={prompt} className="rounded-lg mx-auto max-w-full max-h-[70vh] object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
