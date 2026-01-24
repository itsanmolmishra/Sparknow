// In development: Vite proxy handles it (/api)
// In production: Call Netlify function directly (/.netlify/functions/chat)
const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return '/api/chat'
  }
  // Production - call Netlify function directly
  return '/.netlify/functions/chat'
}

/**
 * Send a chat message to the API
 * @param {string} query - The user's query/question
 * @param {string} sessionId - The session ID for the conversation
 * @returns {Promise<Object>} The API response
 */
export async function sendChatMessage(query, sessionId = 'abch1') {
  try {
    const apiUrl = getApiUrl()
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error sending chat message:', error)
    throw error
  }
}

/**
 * Generate a unique session ID
 * @returns {string} A unique session ID
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

