import React, { useState, useCallback } from 'react';
import { performGroundedSearch } from '../services/geminiService';
import Spinner from './common/Spinner';
import Button from './common/Button';
import Icon from './common/Icon';

declare const marked: any;

const GroundedSearch: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<{ text: string; chunks: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setLocationError(null);
      },
      () => {
        setLocationError("Unable to retrieve your location. Please grant permission.");
      }
    );
  }, []);

  const handleSearch = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a search query.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const searchResult = await performGroundedSearch(prompt, location ?? undefined);
      setResult(searchResult);
    } catch (e) {
      console.error('Grounded search failed:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, location]);

  const renderChunks = (chunks: any[]) => {
    return (
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-300 mb-2">Sources:</h4>
        <div className="flex flex-wrap gap-2">
          {chunks.map((chunk, index) => {
            const source = chunk.web || chunk.maps;
            if (!source || !source.uri) return null;
            return (
              <a
                key={index}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 text-blue-300 text-xs px-3 py-1 rounded-full hover:bg-gray-600 hover:text-blue-200 transition-colors"
              >
                {source.title || new URL(source.uri).hostname}
              </a>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <h2 className="text-xl font-bold mb-2 text-center">Grounded Search</h2>
        <p className="text-gray-400 mb-6 text-center">Ask questions about recent events, news, or places to get up-to-date answers grounded in Google Search and Maps.</p>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., What are some good Italian restaurants nearby?"
                className="w-full bg-gray-700 text-white rounded-md p-3 text-base border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button onClick={handleSearch} isLoading={isLoading} disabled={!prompt.trim()} icon={<Icon icon="search" />}>
                Search
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <button onClick={getLocation} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                <Icon icon="location" className="h-4 w-4" />
                {location ? `Location Captured (${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)})` : 'Share Location for Better Local Results'}
            </button>
          </div>
          {locationError && <p className="text-xs text-center text-yellow-400">{locationError}</p>}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-8 bg-gray-800/50 rounded-xl">
          <Spinner text="Searching for the latest information..." />
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-xl text-center">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
            <div 
              className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-a:text-blue-400"
              dangerouslySetInnerHTML={{ __html: marked.parse(result.text) }}
            />
            {result.chunks.length > 0 && renderChunks(result.chunks)}
        </div>
      )}
    </div>
  );
};

export default GroundedSearch;
