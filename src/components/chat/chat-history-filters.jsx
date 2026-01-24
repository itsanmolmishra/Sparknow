import {
  X,
  FileText,
  Search,
  Users,
  Grid,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MOCK_EXPERTS } from "@/lib/mock-data"

const FILTER_CATEGORIES = [
  { id: "type", label: "Type", icon: FileText },
  { id: "content", label: "Content", icon: Search },
  { id: "speakers", label: "Speakers", icon: Users },
  { id: "categories", label: "Categories", icon: Grid },
]

const CATEGORIES = ["Markets", "Technology", "AI", "Climate", "Politics", "Healthcare", "Economics", "Crypto"]

export function ChatHistoryFilters({ filters, onFilterChange, open, onOpenChange }) {
  const [activeSection, setActiveSection] = React.useState(null)
  const [selectedSpeakers, setSelectedSpeakers] = React.useState(filters.speakers || [])
  const [selectedCategory, setSelectedCategory] = React.useState(filters.category)
  const [speakerSearch, setSpeakerSearch] = React.useState("")

  const filteredExperts = React.useMemo(() => {
    if (!speakerSearch) return MOCK_EXPERTS
    return MOCK_EXPERTS.filter((expert) => expert.name.toLowerCase().includes(speakerSearch.toLowerCase()))
  }, [speakerSearch])

  const handleSpeakerToggle = (expertId) => {
    setSelectedSpeakers((prev) => {
      if (prev.includes(expertId)) {
        return prev.filter((id) => id !== expertId)
      }
      return [...prev, expertId]
    })
  }

  const handleApply = () => {
    const newFilters = { ...filters }
    if (activeSection === "speakers") {
      newFilters.speakers = selectedSpeakers.length > 0 ? selectedSpeakers : undefined
    } else if (activeSection === "categories") {
      newFilters.category = selectedCategory
    }
    onFilterChange(newFilters)
    onOpenChange(false)
    setActiveSection(null)
  }

  const handleCancel = () => {
    setSelectedSpeakers(filters.speakers || [])
    setSelectedCategory(filters.category)
    setActiveSection(null)
  }

  const renderFilterContent = () => {
    if (!activeSection) {
      return (
        <>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold text-sparq">Filter</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2">
              {FILTER_CATEGORIES.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveSection(category.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <Icon className="h-5 w-5 text-sparq" />
                    <span className="text-base font-medium text-sparq">{category.label}</span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </>
      )
    }

    if (activeSection === "speakers") {
      return (
        <>
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveSection(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-lg font-semibold">Select Speakers</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <Input
              placeholder="Search speakers..."
              value={speakerSearch}
              onChange={(e) => setSpeakerSearch(e.target.value)}
            />
            <ScrollArea className="max-h-[40vh]">
              <div className="space-y-2">
                {filteredExperts.map((expert) => (
                  <div key={expert.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md">
                    <Checkbox
                      checked={selectedSpeakers.includes(expert.id)}
                      onCheckedChange={() => handleSpeakerToggle(expert.id)}
                    />
                    <Label className="flex-1 cursor-pointer">
                      {expert.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply
            </Button>
          </div>
        </>
      )
    }

    if (activeSection === "categories") {
      return (
        <>
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveSection(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-lg font-semibold">Select Category</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-4">
            <ScrollArea className="max-h-[40vh]">
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left p-3 rounded-md hover:bg-muted/50 ${
                      selectedCategory === category ? "bg-sparq/10 text-sparq" : ""
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply
            </Button>
          </div>
        </>
      )
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {renderFilterContent()}
      </DialogContent>
    </Dialog>
  )
}

