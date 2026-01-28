// API URL for all environments
// Works with: Vite dev server, Netlify, Vercel
const getApiUrl = () => {
  return '/api/chat'
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

const normalizeArticleText = (text = '') =>
  text.replace(/\\\*/g, '*').replace(/\\n/g, '\n').trim()

const splitInlineHeadings = (text = '') => {
  const normalized = normalizeArticleText(text)
  if (!normalized) return []
  const headingRegex = /([A-Z][A-Za-z0-9&'’\- ]{2,80}?):\s*/g
  const matches = [...normalized.matchAll(headingRegex)]
  if (matches.length === 0) return [{ text: normalized }]

  const results = []
  let cursor = 0
  matches.forEach((match, index) => {
    const heading = match[1].trim()
    const headingStart = match.index
    const headingEnd = match.index + match[0].length
    const before = normalized.slice(cursor, headingStart).trim()
    if (before) results.push({ text: before })

    const nextStart = index + 1 < matches.length ? matches[index + 1].index : normalized.length
    let body = normalized.slice(headingEnd, nextStart).trim()
    if (body.toLowerCase().startsWith(heading.toLowerCase())) {
      body = body.slice(heading.length).trim()
    }
    results.push({ heading, text: body })
    cursor = nextStart
  })

  return results.filter((item) => item.text || item.heading)
}

/**
 * Map API response to clean article structure.
 * @param {Object} apiResponse - Raw API response
 * @returns {{ sections: Array<{id: string, title: string, paragraphs: string[], bullets: string[]}> }}
 */
export function mapApiResponseToArticle(apiResponse) {
  const answer = apiResponse?.answer || {}
  const sections = []
  const seen = new Set()

  const addParagraph = (target, text) => {
    const normalized = normalizeArticleText(text)
    if (!normalized) return
    const key = `p:${normalized.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    target.push(normalized)
  }

  const addBullet = (target, text) => {
    const normalized = normalizeArticleText(text)
    if (!normalized) return
    const key = `b:${normalized.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    target.push(normalized)
  }

  const answerText = normalizeArticleText(answer?.answer_text || '')
  if (answerText) {
    sections.push({
      id: 'answer',
      title: 'Answer',
      paragraphs: [answerText],
      bullets: [],
    })
  }

  const formattedSections = Array.isArray(answer?.formatting?.sections)
    ? answer.formatting.sections
    : []

  let currentSection = sections[sections.length - 1] || null
  const pushSection = (title = '', fallbackIndex = 0) => {
    const cleanTitle = normalizeArticleText(title)
    const section = {
      id: `section-${fallbackIndex}-${sections.length}`,
      title: cleanTitle,
      paragraphs: [],
      bullets: [],
    }
    sections.push(section)
    currentSection = section
    return section
  }

  formattedSections.forEach((section, index) => {
    let title = normalizeArticleText(section?.title || '')
    if (title.toLowerCase() === 'overview') {
      title = ''
    }

    if (title) {
      pushSection(title, index)
    }

    const sectionParagraphs = Array.isArray(section?.paragraphs) ? section.paragraphs : []
    sectionParagraphs.forEach((paragraph) => {
      const parts = splitInlineHeadings(paragraph)
      parts.forEach((part) => {
        let heading = normalizeArticleText(part.heading || '')
        if (heading.toLowerCase() === 'overview') heading = ''
        const body = part.text || ''
        if (heading) {
          if (currentSection && currentSection.title.toLowerCase() === heading.toLowerCase()) {
            addParagraph(currentSection.paragraphs, body)
          } else {
            const nextSection = pushSection(heading, index)
            addParagraph(nextSection.paragraphs, body)
          }
          return
        }
        if (!currentSection) {
          currentSection = sections[sections.length - 1] || pushSection('Answer', index)
        }
        addParagraph(currentSection.paragraphs, body)
      })
    })

    const sectionLists = Array.isArray(section?.lists) ? section.lists : []
    sectionLists.forEach((list) => {
      if (list?.type === 'bullet' && Array.isArray(list.items)) {
        list.items.forEach((item) => {
          const parts = splitInlineHeadings(item)
          parts.forEach((part) => {
            let heading = normalizeArticleText(part.heading || '')
            if (heading.toLowerCase() === 'overview') heading = ''
            const body = part.text || ''
            if (heading) {
              if (currentSection && currentSection.title.toLowerCase() === heading.toLowerCase()) {
                addParagraph(currentSection.paragraphs, body)
              } else {
                const nextSection = pushSection(heading, index)
                addParagraph(nextSection.paragraphs, body)
              }
              return
            }
            if (!currentSection) {
              currentSection = sections[sections.length - 1] || pushSection('Answer', index)
            }
            addBullet(currentSection.bullets, body)
          })
        })
      }
    })
  })

  return { sections }
}

/**
 * Generate a unique session ID
 * @returns {string} A unique session ID
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

