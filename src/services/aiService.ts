import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PRDSection {
    title: string;
    product_objective: string;
    business_goal: string;
    user_impact: string;
}

const getApiKey = () => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const generatePRD = async (topic: string): Promise<PRDSection> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key is required. Please set it in settings or provide it in the dialog.');
    }

    const ai = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash since it is fast and supports JSON generation well
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert Product Manager using the 'prd-writer' skill.
  Help me write a comprehensive PRD for: ${topic}
  
  Please provide the output STRICTLY as a JSON object with the following keys, containing comprehensive text:
  - "title": A concise title for the initiative (max 5 words).
  - "product_objective": Problem statement and proposed solution overview (3-4 sentences).
  - "business_goal": The business impact and success metrics (2-3 sentences).
  - "user_impact": User pain points solved and user stories (3-4 sentences).
  
  Return ONLY the JSON. Do not use markdown blocks (\`\`\`json) or any other text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson) as PRDSection;
    } catch (err) {
        console.error('Failed to parse AI response', responseText);
        throw new Error('Failed to parse AI response into PRD format. Model returned non-JSON.');
    }
};

export const generateNarrative = async (topic: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key is required.');
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert in Strategic Narrative using the Andy Raskin framework.
  Help craft a compelling strategic narrative for: ${topic}
  
  Write it in Markdown format with the following sections:
  ### 1. The Old Game vs The New Game
  ### 2. The Undeniable Change in the World
  ### 3. The Promised Land
  ### 4. Magic Gifts (Features)
  ### 5. Evidence
  
  Make it concise, punchy, and inspiring. Return only the markdown text.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
};

export const shapeUpInitiative = async (topic: string, details?: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Gemini API key is required.');
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let context = topic;
    if (details) {
        context += `\n\nAdditional Details:\n${details}`;
    }

    const prompt = `You are an expert product manager using the Basecamp 'Shape Up' methodology.
  Help shape the following initiative into a structured pitch:
  
  CONTEXT:
  ${context}
  
  Write it in Markdown format with the following sections:
  ### 1. Problem (The raw idea or pain point)
  ### 2. Appetite (How much time we want to spend vs how much time it could take)
  ### 3. Solution (The core elements we are proposing)
  ### 4. Rabbit Holes (Technical or design risks to avoid)
  ### 5. No-Gos (What we are explicitly NOT doing in this cycle)
  
  Make it practical, focused on limiting scope, and engineering-ready. Return only the markdown text.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
};
