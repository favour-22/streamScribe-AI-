import React from 'react';
import { useLiveTranscriber } from '../hooks/useLiveTranscriber';
import { MicIcon, StopCircleIcon, LoadingSpinner } from './icons/Icons';

export const LiveTranscriber: React.FC = () => {
    const {
        isTranscribing,
        statusMessage,
        transcriptionHistory,
        currentTranscription,
        error,
        startTranscription,
        stopTranscription
    } = useLiveTranscriber();

    return (
        <div className="container mx-auto max-w-4xl">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-white">Live Transcriber</h2>
                
                <div className="flex flex-col items-center space-y-6">
                    <div className="w-full flex justify-center">
                        {!isTranscribing ? (
                            <button
                                onClick={startTranscription}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                            >
                                <MicIcon className="w-6 h-6" />
                                <span className="text-lg font-semibold">Start Transcription</span>
                            </button>
                        ) : (
                            <button
                                onClick={stopTranscription}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
                            >
                                <StopCircleIcon className="w-6 h-6" />
                                <span className="text-lg font-semibold">Stop Transcription</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                        {isTranscribing && statusMessage !== 'Listening...' && <LoadingSpinner className="w-4 h-4" />}
                        {isTranscribing && statusMessage === 'Listening...' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                        <span>{statusMessage}</span>
                    </div>

                    {error && <div className="text-red-400 text-sm p-3 bg-red-900/50 rounded-md w-full text-center">{error}</div>}

                    <div className="w-full bg-gray-900/50 rounded-lg p-4 min-h-[200px] border border-gray-700">
                        <p className="text-gray-400">
                            {transcriptionHistory.map((line, index) => (
                                <span key={index}>{line} </span>
                            ))}
                            <span className="text-white font-medium">{currentTranscription}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
