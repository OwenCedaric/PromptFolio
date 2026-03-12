
export const geminiService = {
    /**
     * Enhances a given prompt to be more detailed and effective.
     */
    optimizePrompt: async (currentPrompt: string): Promise<string> => {
        try {
            const response = await fetch('/api/ai/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentPrompt })
            });
            const data = await response.json();
            return data.text || currentPrompt;
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
            const response = await fetch('/api/ai/suggest-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            return await response.json();
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
            const response = await fetch('/api/ai/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            const data = await response.json();
            return data.text || "";
        } catch (error) {
            console.error("Error generating description:", error);
            return "";
        }
    }
};
