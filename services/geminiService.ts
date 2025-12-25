
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Enhances a given prompt to be more detailed and effective.
   */
  optimizePrompt: async (currentPrompt: string): Promise<string> => {
    try {
      const modelId = 'gemini-3-flash-preview';
      const systemInstruction = `You are an expert Prompt Engineer. Your goal is to take a rough prompt and refine it into a high-quality, detailed system instruction or prompt for an LLM. Ensure clarity, context, and specific constraints. Return ONLY the refined prompt text.`;
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: currentPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text || currentPrompt;
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      throw error;
    }
  },

  /**
   * Suggests tags based on the prompt title and description.
   */
  suggestTags: async (title: string, description: string): Promise<string[]> => {
    try {
        const modelId = 'gemini-3-flash-preview';
        const prompt = `Generate a list of 5 relevant tags for a prompt with the Title: "${title}" and Description: "${description}". Return the tags as a JSON array of strings.`;
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) return [];
        return JSON.parse(jsonText) as string[];

    } catch (error) {
        console.error("Error suggesting tags:", error);
        return ["AI", "Creative"]; // Fallback
    }
  },

  /**
   * Generates a description for a prompt based on its content.
   */
  generateDescription: async (content: string): Promise<string> => {
    try {
        const modelId = 'gemini-3-flash-preview';
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Summarize the purpose of the following prompt in one concise paragraph suitable for a gallery description: \n\n${content}`,
        });
        return response.text || "";
    } catch (error) {
        console.error("Error generating description:", error);
        return "";
    }
  }
};
