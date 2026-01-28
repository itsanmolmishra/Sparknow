export function PageContainer({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="mx-auto w-full max-w-[850px] px-4 pb-12 pt-10">
        {children}
      </main>
    </div>
  )
}
