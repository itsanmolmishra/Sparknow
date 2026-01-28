import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Bookmark, Check, Copy, ExternalLink, Share2, ThumbsDown, ThumbsUp, Video, User, Clock, Play } from "lucide-react"
import * as React from "react"

export function EnhancedChatResponse({
  message,
  experts = [],
  videos = [],
  articles = [],
  isLoading = false,
}) {
  const [isCopied, setIsCopied] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const [loadingIndices, setLoadingIndices] = React.useState(new Set())
  const summary = message.summary || ""
  const sections = Array.isArray(message.sections) ? message.sections : []
  const hasStructuredContent = summary.length > 0 || sections.length > 0

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content || summary)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  // Get citation details from message if available
  const citationDetails = message.citationDetails || {}
  const videoResources = message.videoResources || []

  // Build a map of citation_id to video info for quick lookup
  const getCitationUrl = (citationId) => {
    const detail = citationDetails[citationId]
    if (detail && detail.url) return detail.url
    const video = videos[citationId - 1]
    if (video) return video.youtubeUrl
    if (videoResources.length > 0) {
      return videoResources[0].url || `https://www.youtube.com/watch?v=${videoResources[0].video_id}`
    }
    return '#'
  }

  const getCitationTitle = (citationId) => {
    const detail = citationDetails[citationId]
    if (detail && detail.title) return detail.title
    const video = videos[citationId - 1]
    if (video) return video.videoTitle
    if (videoResources.length > 0) return videoResources[0].title || 'Video Source'
    return 'Source'
  }

  const getCitationSpeaker = (citationId) => {
    const detail = citationDetails[citationId]
    if (detail && detail.speaker) return detail.speaker
    const video = videos[citationId - 1]
    if (video) return video.channelName
    if (videoResources.length > 0) return videoResources[0].speaker || 'Unknown'
    return 'Unknown'
  }

  // Parse markdown-style content: **bold**, *italic*, bullet points
  const parseMarkdownText = (text) => {
    // Handle bold text **text**
    let result = text
    const boldParts = []
    let lastIndex = 0
    const boldRegex = /\*\*([^*]+)\*\*/g
    let match

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        boldParts.push(text.substring(lastIndex, match.index))
      }
      boldParts.push(<strong key={`bold-${match.index}`} className="font-semibold text-gray-900 dark:text-gray-100">{match[1]}</strong>)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
      boldParts.push(text.substring(lastIndex))
    }

    return boldParts.length > 0 ? boldParts : text
  }

  const renderContentWithCitations = (text) => {
    const citationRegex = /\[(\d+)\]/g
    const parts = []
    let lastIndex = 0
    let match

    // First parse markdown, then handle citations
    const processedText = typeof text === 'string' ? text : ''

    while ((match = citationRegex.exec(processedText)) !== null) {
      const citationIndex = parseInt(match[1])
      const citationUrl = getCitationUrl(citationIndex)
      const citationTitle = getCitationTitle(citationIndex)
      const citationSpeaker = getCitationSpeaker(citationIndex)

      if (match.index > lastIndex) {
        const textBefore = processedText.substring(lastIndex, match.index)
        parts.push(<span key={`text-${lastIndex}`}>{parseMarkdownText(textBefore)}</span>)
      }

      parts.push(
        <TooltipProvider key={`citation-${match.index}-${citationIndex}`}>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <a
                href={citationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 rounded-md bg-sparq/10 px-1.5 py-0.5 text-sparq transition-all hover:bg-sparq/20 dark:bg-sparq/20 dark:text-sparq dark:hover:bg-sparq/30 font-semibold text-xs mx-0.5 border border-sparq/20"
                onClick={(e) => {
                  e.preventDefault()
                  setLoadingIndices((prev) => new Set(prev).add(citationIndex))
                  setTimeout(() => {
                    setLoadingIndices((prev) => {
                      const newSet = new Set(prev)
                      newSet.delete(citationIndex)
                      return newSet
                    })
                    window.open(citationUrl, "_blank")
                  }, 300)
                }}
              >
                {loadingIndices.has(citationIndex) ? (
                  <span className="h-3 w-3 rounded-full border-2 border-transparent border-t-sparq animate-spin" />
                ) : (
                  <span>[{citationIndex}]</span>
                )}
              </a>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-xs bg-gray-900 border-gray-800">
              <div className="space-y-1.5">
                <p className="font-medium text-xs text-white line-clamp-2">{citationTitle}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Video className="h-3 w-3" />
                  <span>Watch on YouTube</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < processedText.length) {
      const textAfter = processedText.substring(lastIndex)
      parts.push(<span key={`text-end`}>{parseMarkdownText(textAfter)}</span>)
    }

    return parts.length > 0 ? parts : parseMarkdownText(processedText)
  }

  const renderStructuredContent = () => (
    <div className="space-y-6">
      {summary && (
        <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white via-white to-sparq/5 p-4 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-sparq/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Summary
          </p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {renderContentWithCitations(summary)}
          </p>
        </div>
      )}

      {sections.map((section) => (
        <div key={section.id} className="space-y-2">
          {section.title && (
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sparq/80" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {section.title}
              </h4>
            </div>
          )}
          <div className="space-y-3">
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p
                key={`${section.id}-p-${paragraphIndex}`}
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                {renderContentWithCitations(paragraph)}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // Check if this is a simple greeting response (no video resources)
  const isGreetingResponse = message.isGreeting || (!videoResources.length && !videos.length && !message.sourceCount)

  if (message.role === "user") {
    return null // User messages are handled separately
  }

  // Simple greeting response - minimal UI
  if (isGreetingResponse) {
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sparq to-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Full response with citations and sources
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sparq to-purple-600 flex items-center justify-center">
        <span className="text-white text-xs font-bold">AI</span>
      </div>
      <div className="flex-1 max-w-4xl space-y-4">
        {/* Answer Type Badge */}
        {message.answerType && (
          <Badge className={`text-xs font-semibold px-2.5 py-1 ${
            message.answerType === 'factual' 
              ? 'bg-emerald-500 text-white' 
              : message.answerType === 'opinion'
              ? 'bg-amber-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {message.answerType.charAt(0).toUpperCase() + message.answerType.slice(1)} Answer
          </Badge>
        )}

        {/* Main Response Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {hasStructuredContent ? (
            renderStructuredContent()
          ) : (
            <div className="space-y-4">
              {message.content.split("\n").map((line, index) => {
                const trimmedLine = line.trim()
                if (trimmedLine === "") return null

                // Handle bullet points with *
                if (trimmedLine.startsWith("*   ") || trimmedLine.startsWith("* ")) {
                  const bulletContent = trimmedLine.replace(/^\*\s+/, "")
                  return (
                    <div key={index} className="flex items-start gap-3 pl-2">
                      <span className="text-sparq mt-1.5 text-lg leading-none">•</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                        {renderContentWithCitations(bulletContent)}
                      </p>
                    </div>
                  )
                }

                // Handle dash bullet points
                if (trimmedLine.startsWith("- ")) {
                  const bulletContent = trimmedLine.replace(/^-\s+/, "")
                  return (
                    <div key={index} className="flex items-start gap-3 pl-2">
                      <span className="text-sparq mt-1.5 text-lg leading-none">•</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                        {renderContentWithCitations(bulletContent)}
                      </p>
                    </div>
                  )
                }

                // Regular paragraph
                return (
                  <p key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {renderContentWithCitations(trimmedLine)}
                  </p>
                )
              })}
            </div>
          )}
        </div>

        {/* Video Sources Section */}
        {videoResources.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Sources ({videoResources.length})
            </p>
            <div className="grid gap-3">
              {videoResources.map((video, index) => (
                <a
                  key={video.video_id || index}
                  href={video.url || `https://www.youtube.com/watch?v=${video.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-sparq/50 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-sparq/50"
                >
                  <div className="relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                      alt={video.title || 'Video thumbnail'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${video.video_id}/default.jpg`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-sparq transition-colors">
                      {video.title || `Video ${video.video_id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Video className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {video.citation_count || 0} citations
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-sparq transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Source Stats */}
        {message.sourceCount && (message.sourceCount.videoCount > 0 || message.sourceCount.expertCount > 0) && (
          <div className="flex flex-wrap gap-2">
            {message.sourceCount.videoCount > 0 && (
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                <Video className="w-3 h-3 mr-1.5" />
                {message.sourceCount.videoCount} video{message.sourceCount.videoCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {message.sourceCount.expertCount > 0 && (
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                <User className="w-3 h-3 mr-1.5" />
                {message.sourceCount.expertCount} source{message.sourceCount.expertCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
            onClick={handleCopy}
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
            onClick={handleSave}
          >
            <Bookmark className={`h-3.5 w-3.5 mr-1 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/30"
          >
            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
            Helpful
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/30"
          >
            <ThumbsDown className="h-3.5 w-3.5 mr-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
          >
            <Share2 className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}
