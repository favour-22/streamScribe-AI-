import React from 'react';
import { Page } from '../types';
import { VideoIcon, MicIcon, PriceTagIcon } from './icons/Icons';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { page: Page.VideoAnalyzer, label: 'Video Analyzer', icon: <VideoIcon className="w-5 h-5" /> },
    { page: Page.LiveTranscriber, label: 'Live Transcriber', icon: <MicIcon className="w-5 h-5" /> },
    { page: Page.Pricing, label: 'Pricing', icon: <PriceTagIcon className="w-5 h-5" /> },
  ];

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-700">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">StreamScribe AI</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentPage === item.page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
       <div className="md:hidden p-2">
            <div className="flex justify-around">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md text-xs font-medium transition-colors duration-200 w-full ${
                    currentPage === item.page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
    </header>
  );
};
