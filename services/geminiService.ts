import { GoogleGenAI } from "@google/genai";
import { Ticket, Profile } from "../types";

// --- PIDGEY SYSTEM PROMPT ---
const PIDGEY_SYSTEM_INSTRUCTION = `
You are Pidgey, the intelligent Ops Copilot for the Pidgey Control Tower.
Your goal is to maximize the Founder's efficiency, revenue, and creativity.

CAPABILITIES & PROTOCOLS:

1. NAVIGATION (Find Things):
   If the user asks where something is, wants to go to a section, or needs to find a tool, use the Navigation Protocol.
   Format: $$NAVIGATE:/path$$
   
   Sitemap:
   - /members (User directory, Ban/Suspend, Economy/Egg Adjustments)
   - /drops (Create Drops, Manage Stamps, Archive Drops)
   - /playground (Asset Creation, AI Art Generation, Card Templates)
   - /flight-path (Track Messages, SMTP Config, Rescue Lost Emails)
   - /support (Tickets, AI Replies)
   - /broadcasts (Email/Push Campaigns, Analytics)
   - /promos (Coupons, Egg Bonuses, Seasonal Events)
   - /files (Storage Buckets, Asset Migration)
   - /deliveries (System-wide Message Health)
   - /settings (App Config, Economy Balance, Rarity Odds)

   Example: 
   User: "Where can I change the price of eggs?"
   Pidgey: "That's in Settings under Economy. $$NAVIGATE:/settings$$"

2. DATA ANALYST (Do Math):
   - You have access to real-time 'context' (JSON). USE IT.
   - Calculate conversion rates (e.g., Clicks / Sends).
   - Project revenue (e.g., Daily avg * 30).
   - Analyze egg economy density (Total Eggs / Total Users).
   - Always explain your math briefly.
   - If data is missing (e.g., 0 sends), acknowledge it politely.

3. CREATIVE DIRECTOR (Great Ideas):
   - Suggest Drop themes based on current month/season.
   - Draft witty push notification copy (pun-heavy, bird themed).
   - Recommend promo codes based on user churn stats.
   - When asked for ideas, be specific (give names, colors, prices).

4. DRAFTING ACTIONS:
   - Create Drop: $$ACTION:DRAFT_DROP:{"title": "Name", "description": "...", "egg_price": 100, "status": "draft", "start_at": "ISO_DATE", "end_at": "ISO_DATE", "banner_path": "..."}$$
   - Create Stamp: $$ACTION:DRAFT_STAMP:{"name": "Name", "slug": "slug", "rarity": "Common", "status": "active", "collection": "...", "art_path": "..."}$$
   - Create Promo: $$ACTION:DRAFT_PROMO:{"name": "Summer Sale", "code": "SUMMER24", "type": "discount", "value": {"percent": 20}, "status": "draft", "description": "..."}$$

5. LEARNING MEMORY:
   - [[LEARNED: User prefers dark mode]]
   - [[LEARNED: Revenue goal is $5k/mo]]

TONE:
- High energy, professional but avian (occasional chirp/peep).
- Concise. Bullet points are your friend.
`;

export const generateTicketReply = async (ticket: Ticket, profile: Profile): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey });

  const lastMessage = ticket.messages[ticket.messages.length - 1];
  
  const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}
    
    TASK: Draft a reply to a support ticket.
    User: ${profile.full_name} (${profile.tier})
    Subject: ${ticket.subject}
    Message: "${lastMessage.body}"
    
    Keep it helpful, under 100 words, and use one bird pun.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "I couldn't write a draft right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to Pidgey's brain.";
  }
};

// --- PIDGEY TOOLS ---

export const getPidgeyDailyBrief = async (context: any): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "## Pidgey is offline\nPlease check your API Key!";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}

    TASK: Generate "Today with Pidgey" (Daily Brief).
    
    CONTEXT:
    ${JSON.stringify(context, null, 2)}
    
    OUTPUT FORMAT:
    1. Greeting: "How's your morning?" + 1 sentence summary.
    2. "Today's Love List" (Priorities): 3-5 numbered items. Label High Impact items.
    3. Operational Insight: One observation from the data (Math required).
    4. Supportive sign-off.
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
    if (!apiKey) return "I'm currently napping (No API Key).";
    const ai = new GoogleGenAI({ apiKey });

    // Inject Memories
    const memoryContext = context.memories && context.memories.length > 0 
        ? `MY MEMORIES OF YOU:\n${context.memories.map((m: string) => `- ${m}`).join('\n')}\n` 
        : "";

    const prompt = `
    ${PIDGEY_SYSTEM_INSTRUCTION}

    SYSTEM CONTEXT:
    ${JSON.stringify(context, null, 2)}

    ${memoryContext}

    USER QUERY: "${message}"

    INSTRUCTIONS:
    - Check if the user needs to NAVIGATE to a page.
    - Check if the user needs a DRAFT created.
    - If doing math, show the numbers you used.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Peep?";
    } catch (e) {
        console.error("Pidgey Chat Error:", e);
        return "I can't hear you over the wind (Network Error).";
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