import { GoogleGenAI, Type } from "@google/genai";

interface Env {
    GEMINI_API_KEY: string;
    GEMINI_MODEL: string;
}

export const onRequestPost = async (context: any) => {
    try {
        const env = context.env as Env;
        const { title, description } = await context.request.json();

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const modelId = env.GEMINI_MODEL || 'gemini-3-flash-preview';
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

        return new Response(response.text, {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
