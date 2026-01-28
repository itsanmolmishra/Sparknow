import * as React from "react"

export function StructuredAnswerRenderer({ sections = [], renderText }) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return null
  }

  const renderContent = typeof renderText === "function" ? renderText : (text) => text
  const stripAsterisks = (text) => text.replace(/\*/g, "")
  const stripHeadingCitations = (text) => text.replace(/\[\d+\]/g, "")

  const renderHeading = (title, level, key) => {
    if (!title) return null
    const cleanTitle = stripAsterisks(stripHeadingCitations(title)).trim()
    if (!cleanTitle) return null
    if (level === 1) return <h1 key={key} className="font-bold">{cleanTitle}</h1>
    if (level === 2) return <h2 key={key} className="font-bold">{cleanTitle}</h2>
    return <h2 key={key} className="font-bold">{cleanTitle}</h2>
  }

  return (
    <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
      {sections.map((section, sectionIndex) => {
        const content = Array.isArray(section?.content) ? section.content : []
        const blocks = []
        let pendingList = []

        const flushList = () => {
          if (pendingList.length === 0) return
          const listItems = pendingList
            .map((item) => item.replace(/^- /, ""))
            .filter(Boolean)
          if (listItems.length > 0) {
            blocks.push(
              <ul key={`section-${sectionIndex}-list-${blocks.length}`}>
                {listItems.map((item, itemIndex) => (
                  <li key={`section-${sectionIndex}-li-${itemIndex}`}>{renderContent(item)}</li>
                ))}
              </ul>
            )
          }
          pendingList = []
        }

        content.forEach((entry, entryIndex) => {
          const text = typeof entry === "string" ? stripAsterisks(entry) : ""
          if (text.startsWith("- ")) {
            pendingList.push(text)
            return
          }
          flushList()
          if (text) {
            blocks.push(<p key={`section-${sectionIndex}-p-${entryIndex}`}>{renderContent(text)}</p>)
          }
        })

        flushList()

        return (
          <section key={`section-${sectionIndex}`}>
            {renderHeading(section?.title || "", section?.level, `section-${sectionIndex}-heading`)}
            {blocks}
          </section>
        )
      })}
    </article>
  )
}
