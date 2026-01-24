import * as React from "react"
import { Check, User, FolderTree } from "lucide-react"
import { MOCK_EXPERTS } from "@/lib/mock-data"

const MOCK_MENTIONS = [
  ...MOCK_EXPERTS.map((expert) => ({
    id: expert.id,
    type: "expert",
    name: expert.name,
    handle: expert.handle,
    subtitle: expert.title,
    contentCount: expert.contentCount * 7,
    available: expert.available,
  })),
  {
    id: "collection-1",
    type: "collection",
    name: "Top Macro Investors",
    handle: "TopMacroInvestors",
    subtitle: "12 experts",
    contentCount: 1240 * 7,
    available: true,
  },
]

export function MentionAutocomplete({ query, onSelect, onClose }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const filteredMentions = React.useMemo(() => {
    if (!query) return MOCK_MENTIONS.slice(0, 8)
    const lowerQuery = query.toLowerCase()
    return MOCK_MENTIONS.filter(
      (m) => m.name.toLowerCase().includes(lowerQuery) || m.handle.toLowerCase().includes(lowerQuery),
    ).slice(0, 8)
  }, [query])

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < filteredMentions.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter" && filteredMentions[selectedIndex]) {
        e.preventDefault()
        if (filteredMentions[selectedIndex].available) {
          onSelect(filteredMentions[selectedIndex].handle)
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [filteredMentions, selectedIndex, onSelect, onClose])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (filteredMentions.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border bg-popover p-4 shadow-lg">
        <p className="text-sm text-muted-foreground">No experts found</p>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border bg-popover shadow-lg max-h-80 overflow-y-auto">
      {filteredMentions.map((mention, index) => (
        <button
          key={mention.id}
          type="button"
          onClick={() => {
            if (mention.available) {
              onSelect(mention.handle)
            }
          }}
          disabled={!mention.available}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors ${
            index === selectedIndex ? "bg-accent" : ""
          } ${!mention.available ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {mention.type === "expert" ? (
            <User className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FolderTree className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">@{mention.handle}</span>
              {index === selectedIndex && <Check className="h-4 w-4" />}
            </div>
            <p className="text-sm text-muted-foreground truncate">{mention.subtitle}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

