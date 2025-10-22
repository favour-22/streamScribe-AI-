import React, { useState } from 'react';
import { useLiveTranscriber } from '../hooks/useLiveTranscriber';
import { MicIcon, StopCircleIcon, LoadingSpinner, VideoIcon } from './icons/Icons';

type Mode = 'mic' | 'video';

export const LiveTranscriber: React.FC = () => {
    const [mode, setMode] = useState<Mode>('mic');
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const {
        isTranscribing,
        isProcessing,
        statusMessage,
        transcriptionHistory,
        currentTranscription,
        error,
        startMicTranscription,
        startVideoTranscription,
        stopTranscription
    } = useLiveTranscriber();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVideoFile(file);
        }
    };

    const handleStartVideoTranscription = () => {
        if (videoFile) {
            startVideoTranscription(videoFile);
        }
    };
    
    const isBusy = isTranscribing || isProcessing;

    const renderMicMode = () => (
        <div className="flex flex-col items-center space-y-6">
             <div className="w-full flex justify-center">
                 {!isTranscribing ? (
                     <button
                         onClick={startMicTranscription}
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
        </div>
    );
    
    const renderVideoMode = () => (
         <div className="w-full space-y-6">
            <div>
                 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                   <div className="space-y-1 text-center">
                     <VideoIcon className="mx-auto h-12 w-12 text-gray-500" />
                     <div className="flex text-sm text-gray-400">
                       <label htmlFor="video-file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500">
                         <span>Upload a video file</span>
                         <input id="video-file-upload" name="video-file-upload" type="file" className="sr-only" accept="video/*" onChange={handleFileChange} />
                       </label>
                       <p className="pl-1">or drag and drop</p>
                     </div>
                     <p className="text-xs text-gray-500">{videoFile ? videoFile.name : 'MP4, MOV, WEBM, etc.'}</p>
                   </div>
                 </div>
             </div>

             {isBusy ? (
                 <button
                    onClick={stopTranscription}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-red-600 text-white rounded-md shadow-lg hover:bg-red-700"
                >
                    <StopCircleIcon className="w-5 h-5" />
                    <span>Stop Transcription</span>
                </button>
             ) : (
                <button
                    onClick={handleStartVideoTranscription}
                    disabled={!videoFile}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Transcribe Video Audio
                </button>
             )}
         </div>
    );

    return (
        <div className="container mx-auto max-w-4xl">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-2 text-white">Audio Transcription</h2>
                <p className="text-gray-400 mb-6 text-sm">
                    Transcribing from live streams (e.g., YouTube) is not possible in a browser. As an alternative, you can transcribe from your microphone or by uploading a video file.
                </p>
                
                <div className="flex border-b border-gray-700 mb-6">
                    <button
                        onClick={() => setMode('mic')}
                        disabled={isBusy}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'mic' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <MicIcon className="w-5 h-5" />
                        From Microphone
                    </button>
                    <button
                        onClick={() => setMode('video')}
                        disabled={isBusy}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'video' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <VideoIcon className="w-5 h-5" />
                        From Video File
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    {mode === 'mic' ? renderMicMode() : renderVideoMode()}

                    <div className="w-full h-8 mt-6 flex items-center justify-center gap-2 text-gray-400">
                        {isBusy && <LoadingSpinner className="w-5 h-5" />}
                        {isBusy && statusMessage === 'Listening...' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                        <span>{isBusy ? statusMessage : 'Idle'}</span>
                    </div>

                    {error && <div className="mt-4 text-red-400 text-sm p-3 bg-red-900/50 rounded-md w-full text-center">{error}</div>}

                    <div className="w-full bg-gray-900/50 rounded-lg p-4 min-h-[200px] border border-gray-700 mt-6">
                        <div className="text-gray-300 whitespace-pre-wrap space-y-2">
                            {transcriptionHistory.map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                            {currentTranscription && <p className="text-white font-medium">{currentTranscription}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
