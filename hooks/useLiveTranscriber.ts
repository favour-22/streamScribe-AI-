import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode } from '../utils/audioUtils';

export const useLiveTranscriber = () => {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Idle');
    const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
    const [currentTranscription, setCurrentTranscription] = useState('');
    const [error, setError] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    // FIX: Use a ref to correctly accumulate transcription across messages.
    const currentInputTranscriptionRef = useRef('');

    const cleanup = useCallback(() => {
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        audioContextRef.current?.close().catch(console.error);
        audioContextRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(console.error);
            sessionPromiseRef.current = null;
        }
    }, []);

    const startTranscription = useCallback(async () => {
        if (isTranscribing) return;
        
        setIsTranscribing(true);
        setError('');
        setStatusMessage('Requesting permissions...');
        setTranscriptionHistory([]);
        setCurrentTranscription('');
        currentInputTranscriptionRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            setStatusMessage('Initializing...');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // FIX: Cast window to `any` to allow `webkitAudioContext` for broader browser support, resolving the TypeScript error.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                        setStatusMessage('Listening...');
                    },
                    onmessage: (message: LiveServerMessage) => {
                        // FIX: Correctly handle streaming transcription updates and turn completion using a ref.
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscriptionRef.current += text;
                            setCurrentTranscription(currentInputTranscriptionRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                           const fullTranscription = currentInputTranscriptionRef.current;
                           if (fullTranscription) {
                               setTranscriptionHistory(prev => [...prev, fullTranscription]);
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
                    onclose: () => {
                        // This might be called on session.close() or on connection loss.
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], // required, even if we only use transcription
                    inputAudioTranscription: {},
                },
            });
            await sessionPromiseRef.current;
        } catch (err) {
            console.error('Failed to start transcription:', err);
            setError(err instanceof Error ? err.message : 'Failed to access microphone.');
            setIsTranscribing(false);
            setStatusMessage('Error');
            cleanup();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTranscribing, cleanup]);
    
    const stopTranscription = useCallback(() => {
        if (!isTranscribing) return;
        
        setIsTranscribing(false);
        setStatusMessage('Idle');
        cleanup();
    }, [isTranscribing, cleanup]);

    return {
        isTranscribing,
        statusMessage,
        transcriptionHistory,
        currentTranscription,
        error,
        startTranscription,
        stopTranscription,
    };
};
