import MusicEditor from "@/components/music-editor"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home({
  searchParams,
}: {
  searchParams: { session?: string }
}) {
  const sessionId = searchParams.session || ""

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4">
          <h1 className="text-2xl font-bold">Music Notation App</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container px-4 py-8">
        <MusicEditor initialSessionId={sessionId} />
      </main>
    </div>
  )
}

