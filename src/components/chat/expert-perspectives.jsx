import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronRight } from "lucide-react"
import * as React from "react"

export function ExpertPerspectives({
  experts,
  totalPerspectives,
  title,
}) {
  const [selectedExpert, setSelectedExpert] = React.useState(null)
  const [perspectiveDetail, setPerspectiveDetail] = React.useState(null)
  const displayExperts = experts.slice(0, 4)
  const remainingCount = Math.max(0, totalPerspectives - displayExperts.length)

  const handleViewPerspectives = () => {
    // This would open a modal showing all perspectives
  }

  const handleExpertClick = (expert) => {
    setSelectedExpert(expert)
    setPerspectiveDetail({
      expertId: expert.id,
      title: `${expert.name}'s Perspective on ${title}`,
      content: `As a ${expert.title}, I believe...`,
      keyPoints: [
        "Focus on continuous learning",
        "Build deep expertise",
        "Expand impact gradually",
      ],
    })
  }

  return (
    <>
      <div className="my-6 space-y-3">
        {/* Header with avatars */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                {displayExperts.map((expert, index) => (
                  <TooltipProvider key={expert.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800">
                          <AvatarImage
                            src={expert.avatar || `https://avatar.vercel.sh/${expert.name}`}
                            alt={expert.name}
                          />
                          <AvatarFallback>{expert.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>{expert.name}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {remainingCount > 0 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    +{remainingCount}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{totalPerspectives} perspectives</span> from industry experts
              </div>
            </div>
            {totalPerspectives > displayExperts.length && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                onClick={handleViewPerspectives}
              >
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Expert cards list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {title}
          </p>
          {displayExperts.map((expert) => (
            <div
              key={expert.id}
              className="rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/30 cursor-pointer"
              onClick={() => handleExpertClick(expert)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="mt-0.5 h-10 w-10">
                  <AvatarImage
                    src={expert.avatar || `https://avatar.vercel.sh/${expert.name}`}
                    alt={expert.name}
                  />
                  <AvatarFallback>{expert.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {expert.name}
                    </span>
                    {expert.verified && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{expert.title}</p>
                  {expert.bio && (
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {expert.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expert detail dialog */}
      <Dialog open={!!selectedExpert} onOpenChange={(open) => !open && setSelectedExpert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={selectedExpert?.avatar || `https://avatar.vercel.sh/${selectedExpert?.name}`}
                  alt={selectedExpert?.name}
                />
                <AvatarFallback>{selectedExpert?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {selectedExpert?.name}
            </DialogTitle>
            <DialogDescription>{selectedExpert?.title}</DialogDescription>
          </DialogHeader>
          {perspectiveDetail && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {perspectiveDetail.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {perspectiveDetail.content}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                  Key Points
                </p>
                <ul className="space-y-1">
                  {perspectiveDetail.keyPoints.map((point, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                    >
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
