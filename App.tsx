import React, { useState } from 'react';
import Tabs from './components/Tabs';
import ImageBatchProcessor from './components/ImageBatchProcessor';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import GroundedSearch from './components/GroundedSearch';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.BatchProcessor);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.BatchProcessor:
        return <ImageBatchProcessor />;
      case Tab.ImageGenerator:
        return <ImageGenerator />;
      case Tab.VideoGenerator:
        return <VideoGenerator />;
      case Tab.GroundedSearch:
        return <GroundedSearch />;
      default:
        return <ImageBatchProcessor />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            AI Asset Studio
          </h1>
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
      <footer className="bg-gray-800/30 text-center p-4 text-xs text-gray-400">
        Powered by Gemini AI
      </footer>
    </div>
  );
};

export default App;
