import { GoogleGenAI } from "@google/genai";

interface Env {
    GEMINI_API_KEY: string;
    GEMINI_MODEL: string;
}

export const onRequestPost = async (context: any) => {
    try {
        const env = context.env as Env;
        const { prompt } = await context.request.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const modelId = env.GEMINI_MODEL || 'gemini-3-flash-preview';
        const systemInstruction = `You are an expert Prompt Engineer. Your goal is to take a rough prompt and refine it into a high-quality, detailed system instruction or prompt for an LLM. Ensure clarity, context, and specific constraints. Return ONLY the refined prompt text.`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        return new Response(JSON.stringify({ text: response.text }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
