/**
 * Anonymous session management
 * Stores a session ID in localStorage for tracking reviews
 */

const SESSION_ID_KEY = 'gwc_session_id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr'
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}
