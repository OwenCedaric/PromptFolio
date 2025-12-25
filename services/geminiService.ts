import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * 优化提示词
   */
  optimizePrompt: async (currentPrompt: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: currentPrompt,
        config: {
          systemInstruction: `你是一名顶级的 Prompt 工程师。
任务：将用户的草稿提示词优化为结构清晰、指令明确、包含上下文约束的高质量 Prompt。
要求：直接返回优化后的文本，不要包含任何解释或开场白。`,
          temperature: 0.4, // 较低的随机性以保证指令性
        }
      });

      return response.text || currentPrompt;
    } catch (error) {
      console.error("Gemini 优化失败:", error);
      throw error;
    }
  },

  /**
   * 智能标签建议
   */
  suggestTags: async (title: string, description: string): Promise<string[]> => {
    try {
      const prompt = `根据标题 "${title}" 和描述 "${description}"，生成 5 个相关的提示词标签（Tags）。`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const jsonText = response.text;
      return jsonText ? JSON.parse(jsonText) : [];
    } catch (error) {
      console.error("标签建议失败:", error);
      return ["AI", "Prompt"];
    }
  },

  /**
   * 智能生成摘要描述
   */
  generateDescription: async (content: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `为以下 Prompt 写一段简短的摘要描述（100字以内），用于列表展示：\n\n${content}`,
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error("生成描述失败:", error);
      return "";
    }
  }
};