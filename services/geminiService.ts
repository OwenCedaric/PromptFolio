
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * 使用 Gemini 3 Flash 优化 Prompt
   */
  optimizePrompt: async (currentPrompt: string): Promise<string> => {
    try {
      const modelId = 'gemini-3-flash-preview';
      const systemInstruction = `你是一位世界级的提示词工程师。你的任务是优化用户的原始提示词，使其逻辑更严密、结构更清晰、输出更精准。
如果是对话类，请加强上下文设定；如果是任务类，请细化步骤说明。
请直接返回优化后的内容，不要包含任何多余的解释。`;
      
      const response = await ai.models.generateContent({
        model: modelId,
        contents: currentPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      return response.text || currentPrompt;
    } catch (error) {
      console.error("优化提示词失败:", error);
      throw error;
    }
  },

  /**
   * 自动生成标签
   */
  suggestTags: async (title: string, description: string): Promise<string[]> => {
    try {
        const modelId = 'gemini-3-flash-preview';
        const prompt = `根据以下内容生成 5 个相关的短标签。
标题: "${title}"
描述: "${description}"
仅返回一个 JSON 字符串数组，例如 ["AI", "写作", "效率"]。`;
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (error) {
        return ["AI", "Prompt"];
    }
  },

  /**
   * 自动生成摘要描述
   */
  generateDescription: async (content: string): Promise<string> => {
    try {
        const modelId = 'gemini-3-flash-preview';
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `请为以下提示词写一段简短的摘要描述（100字以内），用于卡片展示：\n\n${content}`,
        });
        return response.text || "";
    } catch (error) {
        return "";
    }
  }
};
