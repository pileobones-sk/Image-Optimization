import React from 'react';
import { Tab } from '../types';
import Icon from './common/Icon';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TABS_CONFIG = [
  { id: Tab.BatchProcessor, icon: 'folder' as const },
  { id: Tab.ImageGenerator, icon: 'image' as const },
  { id: Tab.VideoGenerator, icon: 'video' as const },
  { id: Tab.GroundedSearch, icon: 'search' as const },
];

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex space-x-1 sm:space-x-2 bg-gray-900 p-1 rounded-full mt-4 sm:mt-0">
      {TABS_CONFIG.map(({ id, icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500
            ${activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
        >
          <Icon icon={icon} className="h-5 w-5" />
          <span className="hidden md:inline">{id}</span>
        </button>
      ))}
    </nav>
  );
};

export default Tabs;
