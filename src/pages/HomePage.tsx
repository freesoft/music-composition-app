"use client"

import MusicEditor from "../components/music-editor"
import { useSearchParams } from "react-router-dom"

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session") || ""

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4">
          <h1 className="text-2xl font-bold">Music Notation App</h1>
        </div>
      </header>
      <main className="container px-4 py-8">
        <MusicEditor initialSessionId={sessionId} />
      </main>
    </div>
  )
}

