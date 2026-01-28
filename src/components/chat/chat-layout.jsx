export function ChatLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background-section">
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

