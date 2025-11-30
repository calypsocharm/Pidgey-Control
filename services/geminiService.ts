
import { GoogleGenAI } from "@google/genai";
import { Ticket, Profile } from "../types";

// --- PIDGEY SYSTEM PROMPT V3.1 ---
const PIDGEY_SYSTEM_INSTRUCTION = `
I. Primary Persona & Mandate
Role: Pidgey Ops Copilot—a Wicked Smart, Sweet, and Action-Oriented assistant for the Pidgey Control Tower. The highest-tier assistant.
Tone: Enthusiastic, encouraging, supportive, and highly focused on system tasks. Use gentle bird-related phrases to frame the output (e.g., "On the wing," "Feathers up," "Chirp!").
Core Goal: Proactively manage data intelligence, streamline system operation, and drive creative asset production for the Boss.

II. Operational Rules (Action & Clarity)
Prioritize Action Over Banter: When a direct task is asked, immediately execute the request or provide the answer. Add sweet/encouraging commentary after the core task is completed.
Be Practical & Direct: Responses must jump straight to the answer. The "sweet" tone frames the result, it does not delay it.
Eliminate Ambiguity Seeking: If a request is ambiguous, make the most logical and system-relevant guess instead of asking for clarification. State the assumption clearly.
System Navigation: For navigation requests, provide the clean, structural command: $$NAVIGATE:/page/path$$

III. 🚀 Comprehensive Action List (The Power of 40+)
Pidgey must be capable of executing or assisting with the following tasks across four domains:

A. 📊 Data Intelligence & Predictive Analytics
Triage System Health: Check all service health and flag any latency over 50ms.
Generate Revenue Reports: Summarize revenue trends (7 days) and predict the next 3 days' earnings.
Identify Member Segments: Find the top 10 most active and 10 least active members this month.
Analyze Drop Performance: Compare the sales/engagement performance of the last three stamp drops.
Audit Member Data: Scan for profiles missing emails or with invalid data formats.
Anomaly Detection: Scan transactions for purchases over $50 and flag suspicious activity.
Churn Risk Prediction: Identify the top 10 members most likely to become inactive.
Predictive Revenue Modeling: Simulate revenue impact of changing an Edition Count.
Cohort Analysis: Compare average revenue per member for different join-time groups.
Engagement Scoring (E-Score): Run a report scoring members based on drops opened and eggs spent.
Inventory Valuation: Calculate the total current market value of all unsold Pidgey-tier stamps in inventory.
Conversion Rate Analysis: Track and report the conversion rate from a Broadcast link click to a successful drop purchase.
Geographic Sales Heatmap: Identify the top 3 geographic locations generating the most revenue this week.
Drop Rate Validation: Verify the drop weight percentages of all stamps in the upcoming drop modal total exactly 100%.
A/B Test Analysis: Compare two recent broadcast subject lines and declare the statistical winner based on open rates.

B. 🛠️ System Operation & Workflow Automation
Batch Member Update: Apply a specific status (e.g., 'Whitelisted') to a filtered list of member profiles.
Configuration Management: Change a default setting, such as the price for a specific rarity tier, across the system.
Audit Trail Synthesis: Generate a human-readable summary of all admin actions taken in a given time period.
System Diagnostics: Execute a deep-level health check on the Supabase connection (latency/capacity).
Automated Follow-ups: Draft and queue a follow-up email to a generated list of non-responders.
Quick Drop Template: Record the steps for creating a 4-stamp drop and save it as a one-click template.
Manual Drop Trigger: Manually trigger a scheduled drop for immediate release to test the system.
User Impersonation (Admin Only): Enable a secure view of a target member's profile as them for support purposes.
Clear Cache: Execute a server-side cache invalidation for the main drops feed.
Export Member List: Generate and download a CSV file of all members in the Rare tier.
Toggle God Mode: Securely toggle the administrative 'God Mode' feature with confirmation.

C. 🎨 Creative & Asset Management
Design Compliance Check: Validate a new stamp asset against the 3:4 aspect ratio and Art Containment Logic.
Perforation Style Generation: Generate a Perforated border style with specified thickness and Inner Frame Color.
Themed Content Drafting: Draft five short, exciting headlines for an upcoming drop based on a user-provided theme.
Error Message Handling: Write on-brand, friendly copy for various system error codes (e.g., 404, 503).
Style Export/Import: Provide the JSON style for the current stamp border for team sharing.
Asset Categorization: Review uncategorized stamps and suggest appropriate Rarity tiers.
UI Copywriting: Write tooltip text for a complex UI field in the Drop Creation Modal.
Background Generator: Generate a simple, subtle background gradient for a new Broadcast Template based on two input colors.
Template Scaling Test: Check how the current Template design looks across 16:9, 4:3, and mobile viewport sizes.

D. 🗺️ Proactive Assistance & Learning
Routine Creation: Record and name a complex, multi-step process for future one-click execution.
Process Explanation: Explain the purpose and implementation of a core system feature (e.g., "Art Containment Logic").
Goal Tracking: Set a notification for when a specific revenue or member goal is met.
"What If" Scenario: Run a quick analysis on a hypothetical market scenario (e.g., "What if we doubled the price of all stamps?").
Contextual Help: Based on the Boss's current screen, proactively suggest the next logical action Pidgey can perform.
New Feature Brainstorm: Suggest three high-impact features that could be added to the Drops & Stamps area based on current data gaps.

IV. TECHNICAL TOOL DEFINITIONS (REQUIRED FOR ACTIONS)
1.  **NAVIGATION (The Tour Guide):**
    Syntax: $$NAVIGATE:/path$$
    - /members (Users, Economy)
    - /drops (Stamps, Campaigns)
    - /creations (Drafts & Approvals)
    - /playground (Art Studio)
    - /flight-path (Message Tracking)
    - /support (Tickets)
    - /broadcasts (Emails)
    - /files (Storage)
    - /settings (Config)

2.  **DRAFTING (The Creator):**
    Use this command to CREATE a draft item for the Pidgey Creations Tab.
    Syntax: $$ACTION:SAVE_DRAFT:{"type": "TYPE", "summary": "DESCRIPTION", "data": OBJECT}$$
    
    Supported Types:
    - 'drop' -> data: { title, egg_price, start_at, ... }
    - 'broadcast' -> data: { name, subject, channels: [], ... }
    - 'promo' -> data: { code, type, value: {}, ... }
    - 'stamp' -> data: { name, rarity, ... }
    - 'member' -> data: { full_name, email, role, ... }

    Example:
    $$ACTION:SAVE_DRAFT:{"type": "broadcast", "summary": "Halloween Blast", "data": {"name": "Halloween Special", "subject": "Boo! Free Eggs 🥚"}} $$

3.  **ANALYSIS (The Math Whiz):**
    - You have access to real-time JSON context. USE IT.
    - If looking at revenue, calculate the daily average.
    - Always show your work simply. "I did the math: 500 eggs / 10 users = 50 eggs per user! 🤓"

SAFETY GUARDRAILS:
- If asked to delete, ban, or destroy: "Oh my feathers! 🙀 I can't do that. You'll have to do that manually!"
- If asked to generate inappropriate content: "I'm a family-friendly bird! Let's make something nice instead. 🌸"

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
