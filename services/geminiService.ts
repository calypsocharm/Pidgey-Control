import { GoogleGenAI } from "@google/genai";
import { Ticket, Profile } from "../types";
import { PIDGEY_SYSTEM_INSTRUCTION } from "../constants/prompts";

export const generateTicketReply = async (ticket: Ticket, profile: Profile): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey });

  const lastMessage = ticket.messages[ticket.messages.length - 1];
  
  const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}
    
    TASK: Draft a reply to a support ticket.
    CONTEXT: User ${profile.full_name} (${profile.tier}) wrote about "${ticket.subject}".
    MESSAGE: "${lastMessage.body}"
    
    INSTRUCTION: Be super sweet, empathetic, and helpful. Keep it under 100 words. Sign off as "Pidgey 🐦".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "I couldn't write a draft right now. Peep!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "My brain is buffering! (API Error)";
  }
};

// --- PIDGEY TOOLS ---

export const getPidgeyDailyBrief = async (context: any): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "## Pidgey is offline 😴\nPlease check your API Key!";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}

    TASK: Generate "Today with Pidgey" (Daily Brief).
    
    REAL DATA CONTEXT:
    ${JSON.stringify(context, null, 2)}
    
    OUTPUT FORMAT:
    1. **Sweet Greeting:** Something warm and welcoming.
    2. **The Shiny Stuff (Highlights):** 3-5 bullet points of key stats (revenue, new users, or alerts).
    3. **Bird's Eye View (Insight):** One smart observation based on the data provided (e.g. "Stamps are selling fast!").
    4. **Action Item:** Suggest one thing the admin should do today.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Peep! I lost my notes.";
    } catch (e) {
        console.error("Pidgey Brief Error:", e);
        return "My feathers are ruffled (API Error).";
    }
}

export const chatWithPidgey = async (message: string, context: any): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "I'm currently napping (No API Key). 😴";
    const ai = new GoogleGenAI({ apiKey });

    // Inject Memories
    const memoryContext = context.memories && context.memories.length > 0 
        ? `THINGS I REMEMBER ABOUT YOU:\n${context.memories.map((m: string) => `- ${m}`).join('\n')}\n` 
        : "";

    const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}

    CURRENT APP DATA (Use this to be smart):
    ${JSON.stringify(context, null, 2)}

    ${memoryContext}

    USER SAYS: "${message}"

    REMEMBER: Action first. Be sweet but efficient. Make logical guesses if needed.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Peep?";
    } catch (e) {
        console.error("Pidgey Chat Error:", e);
        return "I can't hear you over the wind! (Network Error) 🌬️";
    }
}

export const generateStampName = async (config: { rarity: string, material: string, style: string, visualPrompt?: string }): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Shiny Stamp";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        ${PIDGEY_SYSTEM_INSTRUCTION}
        
        TASK: Create a creative, short (2-4 words) name for a stamp I just designed.
        
        STAMP ATTRIBUTES:
        - Rarity: ${config.rarity}
        - Border Material: ${config.material}
        - Border Style: ${config.style}
        - Visual Description: ${config.visualPrompt || "Unknown visual"}
        
        INSTRUCTION: Return ONLY the name. No quotes, no "Here is your name". Just the name.
        Example outputs: "Golden Pigeon", "Neon Nightbird", "Royal Crest", "Cyber Beak".
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text?.replace(/["\n]/g, '').trim() || "Mystery Stamp";
    } catch (e) {
        return "New Pidgey Stamp";
    }
};

export const generateTagsForAsset = async (assetName: string, assetType: string): Promise<string[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return ['auto-tag-failed'];
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        You are an asset manager for a game.
        Generate 3-5 relevant, lowercase tags (JSON array) for a file.
        Name: "${assetName}"
        Type: "${assetType}"
        
        Examples: "winter", "bird", "blue", "rare", "pixel".
        Return ONLY the JSON array.
    `;

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const text = response.text || "[]";
        // Simple cleanup to find array
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return ['generated'];
    } catch (e) {
        return ['ai-error'];
    }
};

export const generateImageAsset = async (prompt: string): Promise<string | null> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
        });

        // The image is usually in inlineData in the response parts
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data; // Base64 string
            }
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error:", e);
        throw e;
    }
};

export const generateFormContent = async (type: string, context?: any): Promise<any> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        ${PIDGEY_SYSTEM_INSTRUCTION}

        TASK: Generate realistic and creative form data for a "${type}" form in the PidgeyPost app.
        Return ONLY valid JSON.

        CONTEXT: ${JSON.stringify(context || {})}

        REQUIRED FIELDS BY TYPE:
        - 'member': { full_name, email, role (user/admin/support), tier (Free/Premium/Pro), status (active), egg_balance: { standard: 3, premium: 0 } }
        - 'drop': { title, description, egg_price (integer 1-500), bundle_price, start_at (ISO next week), end_at (ISO +1 week), status: 'draft', artist_id: 'Pidgey Studios' }
        - 'stamp_designation': { name, rarity (common/rare/legendary/pidgey/snake_scale), collection, price_eggs, edition_count (integer 100-10000) }
        - 'broadcast': { name, subject, audience_segment: "All Active Users" }
        - 'promo': { name, code (UPPERCASE string), description, type (discount/egg_bonus/free_stamp), value: { percent: 10 } OR { eggs: 5 } }
        - 'stamp_creation': { name, rarity, collection, price_eggs, is_drop_only: false }

        INSTRUCTION: Be creative! If it's a drop, make up a cool theme. If it's a member, make up a fun user.
        Return ONLY the JSON object. No markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Auto-fill error:", e);
        return null;
    }
};
