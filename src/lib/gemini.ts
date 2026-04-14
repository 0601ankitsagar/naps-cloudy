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
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `You are an expert forensic linguist specializing in detecting AI-generated content. 
      Analyze the following text with extreme scrutiny for markers of Large Language Model (LLM) generation versus genuine human creativity.

      CRITERIA FOR ANALYSIS:
      1. PERPLEXITY: AI text is often highly predictable. Look for "safe" word choices and lack of linguistic surprises.
      2. BURSTINESS: AI tends to produce uniform sentence lengths and structures. Human writing has "bursts" of varied complexity.
      3. TONE & STYLE: Look for the "AI voice"—overly formal, neutral, repetitive transitions (e.g., "Furthermore", "In conclusion"), and a lack of personal idiosyncratic flair.
      4. EMOTIONAL DEPTH: AI often simulates emotion but lacks the raw, sometimes messy, resonance of human experience.
      5. LOGICAL STRUCTURE: AI is very linear. Human thought often has creative leaps or subtle inconsistencies.

      SCORING (0-100):
      - 0-30: High confidence AI (Uniform, predictable, neutral).
      - 31-60: Likely AI or heavily AI-assisted/edited.
      - 61-85: Likely Human (Some creative variance, personal voice).
      - 86-100: Definitely Human (High burstiness, unique style, emotional resonance).

      Text to analyze:
      "${text}"
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
  } catch (error: any) {
    if (error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand")) {
      throw new Error("The AI engine is currently experiencing high demand. Please wait a few seconds and try again.");
    }
    throw error;
  }
}
