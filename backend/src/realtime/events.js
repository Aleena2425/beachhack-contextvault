/**
 * Socket.io Events Definition
 * All event names and payload types for real-time communication
 */

// Server → Agent events (insights pushed to agents)
export const AGENT_EVENTS = {
    // Connection events
    CONNECTION_ESTABLISHED: 'connection:established',
    ERROR: 'error',

    // Customer insight events
    CUSTOMER_INSIGHT: 'customer:insight',

    // Session lifecycle
    SESSION_STARTED: 'session:started',
    SESSION_ENDED: 'session:ended',
    SESSION_TRANSFERRED: 'session:transferred',

    // Real-time analysis updates during chat
    ANALYSIS_UPDATE: 'analysis:update',

    // Agent-initiated events
    REQUEST_INSIGHT: 'agent:request_insight',
    SYNC_STATE: 'agent:sync_state',
};

// Room naming conventions
export const ROOMS = {
    // Agent-specific room (1 agent : 1 room)
    agentRoom: (agentId) => `agent_${agentId}`,

    // Session-specific room (1 session : N agents if transferred)
    sessionRoom: (sessionId) => `session_${sessionId}`,

    // Customer-specific room (for multi-agent scenarios)
    customerRoom: (customerId) => `customer_${customerId}`,

    // All agents room (for broadcasts)
    ALL_AGENTS: 'all_agents',
};

export default {
    AGENT_EVENTS,
    ROOMS,
};
