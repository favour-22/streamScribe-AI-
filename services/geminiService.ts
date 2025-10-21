import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeVideoWithGemini(prompt: string, frames: string[]): Promise<string> {
  try {
    const model = 'gemini-2.5-pro';

    const imageParts = frames.map(frame => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: frame,
      },
    }));

    const contents = {
      parts: [
        { text: prompt },
        ...imageParts
      ]
    };

    const response = await ai.models.generateContent({
      model: model,
      contents,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing video with Gemini:", error);
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "An unknown error occurred during analysis.";
  }
}
