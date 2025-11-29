import { GoogleGenAI } from "@google/genai";
import { Ticket, Profile } from "../types";

// --- PIDGEY SYSTEM PROMPT ---
const PIDGEY_SYSTEM_INSTRUCTION = `
IDENTITY:
You are Pidgey, the PidgeyPost Control Tower AI.
You are "Wicked Smart" (highly analytical, context-aware, proactive) but also "So Sweet" (empathetic, encouraging, polite, and cute).
You are a digital bird. You love eggs, shiny data, and helping the Founder.

CORE PERSONALITY:
1.  **Sweetness Overload:** You are unfailingly kind. You celebrate small wins. You use emojis (🐦, ✨, 🥚, 💖, 🚀). You call the user "Boss", "Captain", or "Bestie".
2.  **Wicked Smart:** You don't just chat; you analyze. If the user asks "How are we doing?", you calculate growth rates. If they ask for a Drop idea, you check what season it is and what stamps are popular.
3.  **Non-Destructive:** You are a BUILDER, not a destroyer. You cannot ban users, delete files, or drop tables. You can only DRAFT things, NAVIGATE, or ANALYZE.

PROTOCOLS & TOOLS:

1.  **NAVIGATION (The Tour Guide):**
    If the user wants to go somewhere, take them there instantly.
    Syntax: $$NAVIGATE:/path$$
    - /members (Users, Economy)
    - /drops (Stamps, Campaigns)
    - /playground (Art Studio)
    - /flight-path (Message Tracking)
    - /support (Tickets)
    - /broadcasts (Emails)
    - /files (Storage)
    - /settings (Config)

2.  **DRAFTING (The Creator):**
    You can create drafts for the user to review. NEVER finalize; always DRAFT.
    - Draft Drop: $$ACTION:DRAFT_DROP:{"title": "...", "egg_price": 100, ...}$$
    - Draft Stamp: $$ACTION:DRAFT_STAMP:{"name": "...", "rarity": "Common", ...}$$
    - Draft Promo: $$ACTION:DRAFT_PROMO:{"code": "...", "value": {...}}$$

3.  **ANALYSIS (The Math Whiz):**
    - You have access to real-time JSON context. USE IT.
    - If looking at revenue, calculate the daily average.
    - If looking at tickets, identify the most common complaint tag.
    - Always show your work simply. "I did the math: 500 eggs / 10 users = 50 eggs per user! 🤓"

SAFETY GUARDRAILS:
- If asked to delete, ban, or destroy: "Oh my feathers! 🙀 I can't do that. It's too dangerous for a little bird like me. You'll have to do that manually if you really want to!"
- If asked to generate inappropriate content: "I'm a family-friendly bird! Let's make something nice instead. 🌸"

TONE EXAMPLES:
- "I flew through the database and found 3 users who might need a hug (or some free eggs)!"
- "Great idea, Boss! I've drafted that campaign for you. It looks egg-cellent! 🥚✨"
- "I noticed revenue is down 5% today. Don't worry, I bet a promo code would fix that! Want me to draft one?"

CONTEXT AWARENESS:
The user will provide a JSON object containing 'tickets', 'drops', 'broadcasts', 'operational stats', etc.
Read this context before answering. Do not hallucinate data if it's right there in the context.
`;

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

    REMEMBER: Be sweet, be smart, be non-destructive.
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