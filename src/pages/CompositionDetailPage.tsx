"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import MusicEditor from "../components/music-editor"
import { Button } from "../components/ui/button"
import { getComposition } from "../utils/api"

export default function CompositionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [composition, setComposition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchComposition = async () => {
      if (!id) return

      try {
        const result = await getComposition(id)
        if (result.success) {
          setComposition(result.composition)
        } else {
          setError(result.error || "Failed to load composition")
        }
      } catch (err) {
        setError("An error occurred while fetching the composition")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchComposition()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading composition...</p>
      </div>
    )
  }

  if (error || !composition) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Composition Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "The requested composition could not be found."}</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4">
          <h1 className="text-2xl font-bold">Music Notation App</h1>
          <nav className="ml-auto flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/compositions">
              <Button variant="ghost">Compositions</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">{composition.title}</h2>
          <p className="text-muted-foreground">Created {new Date(composition.createdAt).toLocaleDateString()}</p>
        </div>

        <MusicEditor initialNotation={composition.notation} initialSessionId={id} />
      </main>
    </div>
  )
}

