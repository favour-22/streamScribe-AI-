import React, { useState, useRef, useCallback } from 'react';
import { analyzeVideoWithGemini } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingSpinner } from './icons/Icons';

const MAX_FRAMES = 30;
const FRAME_CAPTURE_INTERVAL = 1000; // 1 frame per second

export const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Summarize this video.');
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setAnalysis('');
      setError('');
    }
  };

  const captureFrames = useCallback(async (): Promise<string[]> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) {
        resolve([]);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const frames: string[] = [];

      video.currentTime = 0;
      
      const onSeeked = () => {
        if (!context) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const frameDataUrl = canvas.toDataURL('image/jpeg');
        const base64Frame = frameDataUrl.split(',')[1];
        frames.push(base64Frame);

        if (frames.length >= MAX_FRAMES || video.currentTime >= video.duration) {
          video.removeEventListener('seeked', onSeeked);
          resolve(frames);
        } else {
          video.currentTime += FRAME_CAPTURE_INTERVAL / 1000;
        }
      };
      
      video.addEventListener('seeked', onSeeked);
      video.currentTime = 0; // Start the process
    });
  }, []);

  const handleAnalyze = async () => {
    if (!videoFile || !prompt) {
      setError('Please select a video and provide a prompt.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const frames = await captureFrames();
      if (frames.length === 0) {
        throw new Error('Could not capture frames from the video.');
      }
      
      const result = await analyzeVideoWithGemini(prompt, frames);
      setAnalysis(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Analysis failed:', errorMessage);
      setError(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Video Analyzer</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="video-upload" className="block text-sm font-medium text-gray-300 mb-2">
              Upload Video
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="video/*" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">{videoFile ? videoFile.name : 'MP4, MOV, AVI up to 50MB'}</p>
              </div>
            </div>
          </div>

          {videoUrl && (
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <video ref={videoRef} src={videoUrl} controls className="w-full" onLoadedMetadata={() => videoRef.current && (videoRef.current.volume = 0.5)} />
            </div>
          )}

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
              Analysis Prompt
            </label>
            <textarea
              id="prompt"
              rows={3}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !videoFile}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <>
                    <LoadingSpinner />
                    Analyzing...
                </>
            ) : (
                'Analyze Video'
            )}
          </button>

          {error && <div className="text-red-400 text-sm p-3 bg-red-900/50 rounded-md">{error}</div>}

          {analysis && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Analysis Results</h3>
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 text-gray-300 whitespace-pre-wrap">
                {analysis}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
