import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, processVideoFileForTranscription } from '../utils/audioUtils';

const CHUNK_SIZE = 4096; // Corresponds to ScriptProcessorNode buffer size
const SEND_INTERVAL_MS = (CHUNK_SIZE / 16000) * 1000; // ~256ms

export const useLiveTranscriber = () => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // For video file pre-processing
    const [statusMessage, setStatusMessage] = useState('Idle');
    const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
    const [currentTranscription, setCurrentTranscription] = useState('');
    const [error, setError] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const currentInputTranscriptionRef = useRef('');
    const videoProcessIntervalRef = useRef<number | null>(null);

    const cleanup = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (videoProcessIntervalRef.current) {
            clearInterval(videoProcessIntervalRef.current);
            videoProcessIntervalRef.current = null;
        }
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(console.error);
            sessionPromiseRef.current = null;
        }
    }, []);

    const stopTranscription = useCallback(() => {
        if (!isTranscribing && !isProcessing) return;
        
        setIsTranscribing(false);
        setIsProcessing(false);
        setStatusMessage('Idle');
        cleanup();
    }, [isTranscribing, isProcessing, cleanup]);
    
    const startSession = useCallback((onSessionStarted: (session: LiveSession) => void) => {
        setIsTranscribing(true);
        setError('');
        setTranscriptionHistory([]);
        setCurrentTranscription('');
        currentInputTranscriptionRef.current = '';

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        sessionPromiseRef.current?.then(onSessionStarted).catch(err => {
                             console.error('Session promise failed in onopen:', err);
                             setError('Failed to start transcription session.');
                             stopTranscription();
                        });
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscriptionRef.current += text;
                            setCurrentTranscription(currentInputTranscriptionRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                           const fullTranscription = currentInputTranscriptionRef.current;
                           if (fullTranscription.trim()) {
                               setTranscriptionHistory(prev => [...prev, fullTranscription.trim()]);
                           }
                           setCurrentTranscription('');
                           currentInputTranscriptionRef.current = '';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred.');
                        stopTranscription();
                    },
                    onclose: () => {},
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                },
            });
            return sessionPromiseRef.current;
        } catch (err) {
            console.error('Failed to start session:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsTranscribing(false);
            setStatusMessage('Error');
            cleanup();
            return Promise.reject(err);
        }
    }, [cleanup, stopTranscription]);

    const startMicTranscription = useCallback(async () => {
        if (isTranscribing) return;
        setStatusMessage('Requesting permissions...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            await startSession((session) => {
                setStatusMessage('Initializing...');
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = audioContextRef.current!.createMediaStreamSource(stream);
                const scriptProcessor = audioContextRef.current!.createScriptProcessor(CHUNK_SIZE, 1, 1);
                scriptProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob: Blob = {
                        data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                        mimeType: 'audio/pcm;rate=16000',
                    };
                    session.sendRealtimeInput({ media: pcmBlob });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(audioContextRef.current!.destination);
                setStatusMessage('Listening...');
            });

        } catch (err) {
            console.error('Failed to start microphone transcription:', err);
            setError(err instanceof Error ? err.message : 'Failed to access microphone.');
            setIsTranscribing(false);
            setStatusMessage('Error');
            cleanup();
        }
    }, [isTranscribing, startSession, cleanup]);

    const startVideoTranscription = useCallback(async (file: File) => {
        if (isTranscribing || isProcessing) return;
        
        setIsProcessing(true);
        setStatusMessage('Processing video audio...');

        try {
            const audioData = await processVideoFileForTranscription(file);
            setIsProcessing(false);
            setStatusMessage('Initializing session...');
            
            await startSession((session) => {
                setStatusMessage('Transcribing...');
                let cursor = 0;
                
                videoProcessIntervalRef.current = window.setInterval(() => {
                    if (cursor >= audioData.length) {
                        clearInterval(videoProcessIntervalRef.current!);
                        videoProcessIntervalRef.current = null;
                        setStatusMessage('Finalizing transcription...');
                        return;
                    }

                    const chunkEnd = Math.min(cursor + CHUNK_SIZE, audioData.length);
                    const chunk = audioData.slice(cursor, chunkEnd);
                    cursor = chunkEnd;

                    const pcmBlob: Blob = {
                        data: encode(new Uint8Array(new Int16Array(chunk.map(x => x * 32768)).buffer)),
                        mimeType: 'audio/pcm;rate=16000',
                    };
                    session.sendRealtimeInput({ media: pcmBlob });
                }, SEND_INTERVAL_MS);
            });
        } catch (err) {
            console.error('Failed to start video transcription:', err);
            setError(err instanceof Error ? err.message : 'Failed to process video file. It may be corrupt or in an unsupported format.');
            setIsTranscribing(false);
            setIsProcessing(false);
            setStatusMessage('Error');
            cleanup();
        }
    }, [isTranscribing, isProcessing, startSession, cleanup]);

    return {
        isTranscribing,
        isProcessing,
        statusMessage,
        transcriptionHistory,
        currentTranscription,
        error,
        startMicTranscription,
        startVideoTranscription,
        stopTranscription,
    };
};
