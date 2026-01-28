import { ChatHistoryFilters } from "@/components/chat/chat-history-filters"
import { EnhancedChatResponse } from "@/components/chat/enhanced-chat-response"
import { MentionAutocomplete } from "@/components/chat/mention-autocomplete"
import { PageContainer } from "@/components/page-container"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MOCK_SUGGESTED_QUESTIONS } from "@/lib/mock-data"
import { sendChatMessage, generateSessionId } from "@/lib/api"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  AtSign,
  Bookmark,
  BotMessageSquare,
  EllipsisVertical,
  History,
  Lightbulb,
  Mic,
  Moon,
  RotateCw,
  Save,
  Send,
  SlidersHorizontal,
  Sun,
  UserSearch,
  X,
} from "lucide-react"
import * as React from "react"

export const ChatWelcome = () => {
  const { theme, setTheme } = useTheme()
  const [input, setInput] = React.useState("")
  const [showMentions, setShowMentions] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState("")
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const [showFilters, setShowFilters] = React.useState(false)
  const [filters, setFilters] = React.useState({})
  const [messages, setMessages] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedExperts, setSelectedExperts] = React.useState([])
  const [showDropdownMenu, setShowDropdownMenu] = React.useState(false)
  const [sessionId, setSessionId] = React.useState(() => generateSessionId())
  const inputRef = React.useRef(null)
  const filterButtonRef = React.useRef(null)
  const messagesEndRef = React.useRef(null)
  const dropdownMenuRef = React.useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Close dropdown menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target)) {
        setShowDropdownMenu(false)
      }
    }

    if (showDropdownMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDropdownMenu])

  const hasInput = input.trim().length > 0

  const handleBackClick = () => {
    setMessages([])
    setInput("")
    setSessionId(generateSessionId()) // Generate new session ID when starting fresh
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0
    setInput(value)
    setCursorPosition(cursorPos)

    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Only show mentions if @ is at start or preceded by space
      if (lastAtIndex === 0 || value[lastAtIndex - 1] === " ") {
        setMentionQuery(textAfterAt)
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (mention) => {
    const textBeforeCursor = input.slice(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    const textBeforeAt = input.slice(0, lastAtIndex)
    const textAfterCursor = input.slice(cursorPosition)

    const newValue = `${textBeforeAt}@${mention} ${textAfterCursor}`
    setInput(newValue)
    setShowMentions(false)

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursorPos = lastAtIndex + mention.length + 2
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleQuestionClick = (question) => {
    setInput(question)
    inputRef.current?.focus()
  }

  // Hardcoded responses for greetings
  const greetingResponses = {
    patterns: ['hi', 'hey', 'hello', 'hii', 'hiii', 'heyyy', 'heyy', 'helloo', 'howdy', 'sup', 'yo'],
    responses: [
      "Hello! I'm SPARQNOW, your AI assistant for trusted insights. How can I help you today? Feel free to ask me anything about geopolitics, technology, business, or any topic you're curious about!",
      "Hey there! Welcome to SPARQNOW. I'm here to help you find expert perspectives and insights. What would you like to explore today?",
      "Hi! Great to see you. I can help you discover insights from industry experts on various topics. What's on your mind?",
    ]
  }

  const isGreeting = (text) => {
    const lowerText = text.toLowerCase().trim()
    return greetingResponses.patterns.some(pattern => 
      lowerText === pattern || lowerText.startsWith(pattern + ' ') || lowerText.startsWith(pattern + '!')
    )
  }

  const getRandomGreetingResponse = () => {
    const randomIndex = Math.floor(Math.random() * greetingResponses.responses.length)
    return greetingResponses.responses[randomIndex]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuery = input.trim()

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userQuery,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Check if it's a greeting - respond immediately without API call
    if (isGreeting(userQuery)) {
      const greetingMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getRandomGreetingResponse(),
        timestamp: new Date(),
        isGreeting: true,
      }
      setMessages((prev) => [...prev, greetingMessage])
      return
    }

    setIsLoading(true)

    try {
      // Call the real API
      const response = await sendChatMessage(userQuery, sessionId)

      const buildCopyTextFromStructured = (sections = []) => {
        const lines = []
        sections.forEach((section) => {
          if (section?.title) lines.push(section.title)
          const content = Array.isArray(section?.content) ? section.content : []
          content.forEach((entry) => {
            if (typeof entry === "string" && entry.trim()) {
              lines.push(entry)
            }
          })
          lines.push("")
        })
        return lines.join("\n").trim()
      }

      // Parse the API response
      if (response && response.answer) {
        const answerData = response.answer
        
        const structuredContent = answerData?.formatting?.structured_content || []
        const formattedContent = buildCopyTextFromStructured(structuredContent)

        // Map video_resources from API to video sources for display
        const videoSources = (answerData.video_resources || []).map((video, index) => ({
          id: `video-${video.video_id}`,
          citationNumber: index + 1,
          videoTitle: video.title || `Video ${video.video_id}`,
          channelName: video.speaker || 'Unknown',
          publishDate: video.publish_date || 'Unknown',
          youtubeUrl: video.url || `https://www.youtube.com/watch?v=${video.video_id}`,
          thumbnailUrl: video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`,
          viewCount: video.view_count || 0,
          citationCount: video.citation_count || 0,
        }))

        // Transform experts_consulted (strings) and video_resources into proper expert objects
        // The API returns experts_consulted as strings like ["Video 8Db3zzvdnTY"]
        // We need to convert them to objects with id, name, title, etc.
        const expertsFromApi = (answerData.video_resources || []).map((video, index) => ({
          id: `expert-${video.video_id || index}`,
          name: video.speaker && video.speaker !== 'Unknown' ? video.speaker : video.title || `Expert ${index + 1}`,
          title: video.title || 'Video Source',
          avatar: video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/default.jpg`,
          bio: `Source from video with ${video.citation_count || 0} citations`,
          verified: true,
        }))

        // Update selected experts with properly formatted objects
        if (expertsFromApi.length > 0) {
          setSelectedExperts(expertsFromApi)
        } else {
          setSelectedExperts([])
        }

        // Build citation lookup from sources + claims for tooltip details
        const citationDetails = {}

        const sources = Array.isArray(answerData.sources) ? answerData.sources : []
        sources.forEach((source, index) => {
          const citationId =
            source?.citation_id ??
            source?.source_id ??
            source?.sourceId ??
            source?.id ??
            index + 1
          if (!citationId || citationDetails[citationId]) return
          citationDetails[citationId] = {
            title: source?.title || source?.name || source?.source || 'Source',
            speaker: source?.speaker || source?.author || source?.publisher || 'Unknown',
            startTime: source?.start_time || 0,
            url: source?.url || source?.link || '',
            videoId: source?.video_id || '',
          }
        })

        if (answerData.claims && answerData.claims.length > 0) {
          answerData.claims.forEach((claimObj) => {
            if (claimObj.citations && claimObj.citations.length > 0) {
              claimObj.citations.forEach((citation) => {
                const citId = citation.citation_id
                if (citId && !citationDetails[citId]) {
                  citationDetails[citId] = {
                    title: citation.title || '',
                    speaker: citation.speaker || 'Unknown',
                    startTime: citation.start_time || 0,
                    url: citation.url || '',
                    videoId: citation.video_id || '',
                  }
                }
              })
            }
          })
        }

        // Create assistant message from API response
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: formattedContent || "I've received your query and processed it.",
          timestamp: new Date(),
          sources: videoSources,
          articles: [], // API currently returns video sources, no articles
          sourceCount: {
            videoCount: videoSources.length,
            articleCount: 0,
            expertCount: answerData.experts_consulted?.length || 0,
            timeframe: "Recent",
          },
          answerType: answerData.answer_type || "factual",
          claims: answerData.claims || [],
          citationDetails: citationDetails,
          videoResources: answerData.video_resources || [],
          structuredContent,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // Handle unexpected response format
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I received a response, but it wasn't in the expected format. Please try again.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Error calling chat API:", error)
      // Show error message to user
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error while processing your request: ${error.message}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFilter = (filterType) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      if (filterType === "speakers") {
        newFilters.speakers = undefined
      } else if (filterType === "categories") {
        newFilters.categories = undefined
      }
      return newFilters
    })
  }

  const handleClearAllFilters = () => {
    setFilters({})
  }

  const handleFilterClick = (filterType) => {
    setShowFilters(true)
  }

  const getActiveFilters = () => {
    const active = []
    if (filters.speakers && filters.speakers.length > 0) {
      const speakerNames = filters.speakers
        .map((id) => selectedExperts.find((e) => e.id === id)?.name)
        .filter(Boolean)
        .join(", ")
      if (speakerNames) {
        active.push({ type: "speakers", label: `Speakers: ${speakerNames}` })
      }
    }
    if (filters.categories && filters.categories.length > 0) {
      const categoryNames = filters.categories.join(", ")
      active.push({ type: "categories", label: `Categories: ${categoryNames}` })
    }
    return active
  }

  const activeFilters = getActiveFilters()

  return (
    <PageContainer>
      <div className="w-full space-y-8 overflow-visible">
        {/* Show logo only when no messages */}
        {messages.length === 0 && (
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-bold tracking-tight font-[family-name:var(--font-poppins)]">
              <span className="text-sparq dark:text-white">SPARQ</span>
              <span className="text-now">NOW</span>
            </h1>
            <p className="text-muted-foreground text-xl">Trusted Insights. Simplified</p>
          </div>
        )}

        {/* Show messages when they exist */}
        {messages.length > 0 && (
          <div className="rounded-3xl bg-white shadow-lg">
            <div className="flex items-center gap-4 border-b border-gray-200 px-6 py-4">
              <Button
                onClick={handleBackClick}
                variant="ghost"
                size="icon"
                className="rounded-lg text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
              <div>
                <h2 className="text-lg font-semibold">Chat</h2>
                <p className="text-xs text-muted-foreground">Trusted insights with sources</p>
              </div>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-380px)] px-6 py-5">
            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <div className="flex justify-end mb-4">
                    <div className="max-w-xs bg-sparq text-white rounded-2xl px-4 py-2 shadow-sm">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <EnhancedChatResponse
                    message={message}
                    experts={selectedExperts}
                    videos={message.sources}
                    articles={message.articles}
                    isLoading={false}
                  />
                )}
              </div>
            ))}

            {/* Thinking Animation - Show while waiting for API response */}
            {isLoading && (
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sparq to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                  <div className="flex-1 max-w-4xl">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-sparq rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-sparq rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-sparq rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        Thinking and gathering insights from experts...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Main Input Form */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-md">
            <div className="relative w-full flex items-center gap-2 overflow-visible">
              <form onSubmit={handleSubmit} className="relative flex-1 overflow-visible">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      ref={filterButtonRef}
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowFilters(true)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground z-10"
                    >
                      <SlidersHorizontal className="h-5 w-5" />
                      <span className="sr-only">Filters</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Filter by Category, Experts, Timeframe etc.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask @YourFavouriteExpert almost anything"
                className="h-24 pl-16 pr-28 text-base rounded-2xl bg-gray-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                {hasInput && (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 rounded-lg bg-sparq hover:bg-sparq/90 text-white"
                  >
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Send message</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Mic className="h-5 w-5" />
                  <span className="sr-only">Voice input</span>
                </Button>
              </div>

              {/* Mention Autocomplete Dropdown */}
              {showMentions && (
                <MentionAutocomplete
                  query={mentionQuery}
                  onSelect={handleMentionSelect}
                  onClose={() => setShowMentions(false)}
                />
              )}
            </form>

            <div className="flex-shrink-0 relative z-50" ref={dropdownMenuRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowDropdownMenu(!showDropdownMenu)}
                className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <EllipsisVertical className="h-5 w-5" />
                <span className="sr-only">More</span>
              </Button>

              {showDropdownMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-popover text-popover-foreground rounded-md border shadow-md p-1 z-[9999]"
                  style={{ zIndex: 9999 }}
                >
                  <button
                    onClick={() => {
                      setShowDropdownMenu(false)
                      // Add save chat functionality here
                    }}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Save Chat</span>
                  </button>
                  
                  <Link
                    to="/chat"
                    onClick={() => setShowDropdownMenu(false)}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <BotMessageSquare className="h-4 w-4" />
                    <span>New Chat</span>
                  </Link>
                  
                  <Link
                    to="/chat/history"
                    onClick={() => setShowDropdownMenu(false)}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <History className="h-4 w-4" />
                    <span>Chat History</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      setShowDropdownMenu(false)
                      // Add find experts functionality here
                    }}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                  >
                    <UserSearch className="h-4 w-4" />
                    <span>Find Experts by Topics</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDropdownMenu(false)
                      // Add ask expert functionality here
                    }}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                  >
                    <AtSign className="h-4 w-4" />
                    <span>Ask an Expert/Collection</span>
                  </button>
                  
                  <div className="bg-border -mx-1 my-1 h-px" />
                  
                  <button
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark")
                      setShowDropdownMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 ml-3">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.type}
                  onClick={() => handleFilterClick(filter.type)}
                  className="gap-2 px-3 py-1.5 bg-sparq/10 text-sparq hover:bg-sparq/20 border border-sparq/20 cursor-pointer"
                >
                  {filter.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFilter(filter.type)
                    }}
                    className="hover:bg-sparq/30 rounded-full"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove filter</span>
                  </button>
                </Badge>
              ))}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="space-y-3">
            {MOCK_SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuestionClick(q.question)}
                className="group flex items-start gap-3 text-left text-muted-foreground hover:text-foreground transition-colors w-full ml-3"
              >
                <div className="flex h-10 w-10 items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <span className="text-sm leading-relaxed pt-2">{q.question}</span>
              </button>
            ))}
            <button className="flex items-start gap-3 text-left text-muted-foreground hover:text-foreground transition-colors w-full text-sm ml-3">
              <div className="flex h-10 w-10 items-center justify-center flex-shrink-0">
                <RotateCw className="h-5 w-5" />
              </div>
              <span className="leading-relaxed pt-2">... load more suggestions</span>
            </button>
          </div>
        )}
      </div>

      <ChatHistoryFilters
        filters={filters}
        onFilterChange={setFilters}
        open={showFilters}
        onOpenChange={setShowFilters}
      />
    </PageContainer>
  )
}

