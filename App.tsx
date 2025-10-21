import React, { useState } from 'react';
import { Header } from './components/Header';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { LiveTranscriber } from './components/LiveTranscriber';
import { PricingPage } from './components/PricingPage';
import { Page } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.VideoAnalyzer);

  const renderPage = () => {
    switch (currentPage) {
      case Page.VideoAnalyzer:
        return <VideoAnalyzer />;
      case Page.LiveTranscriber:
        return <LiveTranscriber />;
      case Page.Pricing:
        return <PricingPage />;
      default:
        return <VideoAnalyzer />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="p-4 sm:p-6 md:p-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
