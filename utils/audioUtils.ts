// These functions are for handling raw audio data for the Gemini Live API.

const TARGET_SAMPLE_RATE = 16000;

/**
 * Encodes raw audio bytes into a base64 string.
 * @param bytes The Uint8Array containing audio data.
 * @returns A base64 encoded string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string into raw audio bytes.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array containing the decoded audio data.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * The browser's native decodeAudioData expects a file format, so we do this manually.
 * @param data The raw PCM audio data as a Uint8Array.
 * @param ctx The AudioContext to create the buffer in.
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of channels in the audio.
 * @returns A promise that resolves to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Processes a video file to extract, decode, and resample its audio track for transcription.
 * @param file The video file.
 * @returns A promise that resolves to a Float32Array of the raw audio data, resampled to 16kHz mono.
 */
export async function processVideoFileForTranscription(file: File): Promise<Float32Array> {
  // Use `any` cast for webkitAudioContext compatibility
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const fileBuffer = await file.arrayBuffer();
  
  // This will throw a descriptive error if the file format is not supported
  const decodedBuffer = await audioContext.decodeAudioData(fileBuffer);

  // If the audio is already at the target sample rate and mono, we can skip resampling.
  if (decodedBuffer.sampleRate === TARGET_SAMPLE_RATE && decodedBuffer.numberOfChannels === 1) {
    await audioContext.close();
    return decodedBuffer.getChannelData(0);
  }

  // Use an OfflineAudioContext to resample the audio to 16kHz mono.
  const offlineContext = new OfflineAudioContext(
    1, // 1 channel (mono)
    Math.ceil(decodedBuffer.duration * TARGET_SAMPLE_RATE), // total number of samples in the new buffer
    TARGET_SAMPLE_RATE // target sample rate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const resampledBuffer = await offlineContext.startRendering();
  await audioContext.close();
  
  return resampledBuffer.getChannelData(0);
}
