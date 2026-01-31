/**
 * Prompt Builder
 * Constructs prompts for Gemini Pro based on context
 */

/**
 * Build prompt for generating customer insight
 */
export const buildInsightPrompt = (context) => {
    const { customerProfile, relevantInteractions, currentMessage, sessionHistory } = context;

    return `You are a sales intelligence assistant for ContextAI. Analyze the customer interaction and provide actionable insights for the sales agent.

CUSTOMER PROFILE:
${customerProfile ? JSON.stringify(customerProfile, null, 2) : 'New customer - no profile available'}

RELEVANT PAST INTERACTIONS:
${relevantInteractions?.length > 0
            ? relevantInteractions.map((i, idx) => `${idx + 1}. ${i.document}`).join('\n')
            : 'No past interactions found'}

CURRENT SESSION HISTORY:
${sessionHistory?.length > 0
            ? sessionHistory.map(m => `[${m.sender_type}]: ${m.content}`).join('\n')
            : 'Session just started'}

CURRENT MESSAGE:
[${context.senderType}]: ${currentMessage}

Provide analysis in the following JSON format:
{
  "summary": "2-3 sentence summary about this customer for the agent",
  "intent": "primary intent detected (e.g., 'purchase_inquiry', 'support_request', 'complaint', 'general_inquiry')",
  "urgency": "low | medium | high | critical",
  "sentiment": "positive | neutral | negative",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "extractedPreferences": {
    "key": "value"
  },
  "suggestedResponses": ["suggested response option 1", "suggested response option 2"]
}

Respond ONLY with valid JSON, no additional text.`;
};

/**
 * Build prompt for generating returning customer summary
 */
export const buildReturningCustomerPrompt = (context) => {
    const { customerProfile, recentSessions, relevantInteractions } = context;

    return `You are a sales intelligence assistant. A returning customer has started a new chat. Provide a quick summary for the sales agent.

CUSTOMER PROFILE:
- Name: ${customerProfile?.name || 'Unknown'}
- Email: ${customerProfile?.email || 'Not provided'}
- First seen: ${customerProfile?.first_seen || 'Unknown'}
- Total sessions: ${customerProfile?.total_sessions || 0}
- Preferences: ${JSON.stringify(customerProfile?.preferences || {})}
- Tags: ${(customerProfile?.tags || []).join(', ') || 'None'}

RECENT SESSION SUMMARIES:
${recentSessions?.map((s, i) =>
        `${i + 1}. [${s.started_at}] Intent: ${s.detected_intent || 'Unknown'}, Summary: ${s.session_summary || 'No summary'}`
    ).join('\n') || 'No previous sessions'}

RELEVANT PAST INTERACTIONS:
${relevantInteractions?.map((i, idx) => `${idx + 1}. ${i.document}`).join('\n') || 'None'}

Generate a brief, actionable summary for the agent in JSON format:
{
  "summary": "Brief 2-3 sentence summary highlighting key customer history and preferences",
  "keyInsights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "warningFlags": ["any concerns or special handling notes"],
  "topInterests": ["interest 1", "interest 2"]
}

Respond ONLY with valid JSON.`;
};

/**
 * Build prompt for session summary
 */
export const buildSessionSummaryPrompt = (messages) => {
    return `Summarize this customer service chat session in 2-3 sentences. Focus on:
- What the customer needed
- What was resolved
- Any follow-up required

CHAT TRANSCRIPT:
${messages.map(m => `[${m.sender_type}]: ${m.content}`).join('\n')}

Provide a concise summary:`;
};

/**
 * Build prompt for preference extraction
 */
export const buildPreferenceExtractionPrompt = (messages) => {
    return `Analyze these customer messages and extract any preferences or interests mentioned.

MESSAGES:
${messages.map(m => m.content).join('\n')}

Extract preferences in JSON format:
{
  "communicationPreference": "email | phone | chat | null",
  "productInterests": ["product/service interests"],
  "concerns": ["any concerns mentioned"],
  "budget": "budget indication if any | null",
  "timeline": "urgency/timeline if mentioned | null",
  "otherPreferences": {}
}

Respond ONLY with valid JSON.`;
};

export default {
    buildInsightPrompt,
    buildReturningCustomerPrompt,
    buildSessionSummaryPrompt,
    buildPreferenceExtractionPrompt,
};
