import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface AuthenticityResult {
  score: number; // 0 to 100, where 100 is human, 0 is AI
  analysis: string;
  breakdown: {
    perplexity: number;
    burstiness: number;
    linguisticPatterns: string;
  };
  highlights: {
    text: string;
    reason: string;
    type: "ai" | "human";
  }[];
}

export async function analyzeAuthenticity(text: string): Promise<AuthenticityResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following text for AI-generated patterns versus human creativity. 
    Provide an "Authenticity Score" from 0 to 100 (100 = definitely human, 0 = definitely AI).
    Also provide a detailed analysis of linguistic patterns, perplexity, and burstiness.
    Identify specific segments that feel particularly AI-like or particularly human.

    Text to analyze:
    ${text}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Authenticity score 0-100" },
          analysis: { type: Type.STRING, description: "Overall analysis text" },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              perplexity: { type: Type.NUMBER },
              burstiness: { type: Type.NUMBER },
              linguisticPatterns: { type: Type.STRING }
            },
            required: ["perplexity", "burstiness", "linguisticPatterns"]
          },
          highlights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                reason: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["ai", "human"] }
              },
              required: ["text", "reason", "type"]
            }
          }
        },
        required: ["score", "analysis", "breakdown", "highlights"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text);
}
