
import { GoogleGenAI } from "@google/genai";
import { Anime, AppLanguage } from "../types";

// Use process.env, which works in this environment and will be replaced by Vite during a build.
const apiKey = process.env.API_KEY;

export const getAnimeRecommendation = async (
  userQuery: string, 
  currentContext: Anime | null,
  appLanguage: AppLanguage
): Promise<string> => {
  if (!apiKey) {
    return "Oracle Unavailable: Missing API Key.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const contextPrompt = currentContext 
      ? `The user is currently looking at or watching "${currentContext.title}".` 
      : "The user is browsing the home page.";

    const langPrompt = `IMPORTANT: Reply in the language code: "${appLanguage}".`;

    const prompt = `
      You are the "Anirias Oracle", a mystical AI guide for an anime streaming site.
      ${contextPrompt}
      ${langPrompt}
      User Query: "${userQuery}"
      
      Provide a short, engaging recommendation or answer (max 50 words). 
      Adopt a slightly chunibyo or mystical persona, but be helpful.
      If suggesting anime, focus on action, fantasy, or romance titles similar to High School DxD, Jujutsu Kaisen, etc.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "The spirits are silent right now. Try again later.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "A connection to the spirit realm could not be established.";
  }
};