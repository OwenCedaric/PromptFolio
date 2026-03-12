import { GoogleGenAI } from "@google/genai";

interface Env {
    GEMINI_API_KEY: string;
    GEMINI_MODEL: string;
}

export const onRequestPost = async (context: any) => {
    try {
        const env = context.env as Env;
        const { content } = await context.request.json();

        if (!content) {
            return new Response(JSON.stringify({ error: "Content is required" }), { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const modelId = env.GEMINI_MODEL || 'gemini-3-flash-preview';

        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Summarize the purpose of the following prompt in one concise paragraph suitable for a gallery description: \n\n${content}`,
        });

        return new Response(JSON.stringify({ text: response.text }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
