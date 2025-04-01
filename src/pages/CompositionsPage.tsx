"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Music } from "lucide-react"
import { getCompositions } from "../utils/api"

export default function CompositionsPage() {
  const [compositions, setCompositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompositions = async () => {
      try {
        const result = await getCompositions()
        if (result.success) {
          setCompositions(result.compositions)
        } else {
          setError(result.error || "Failed to load compositions")
        }
      } catch (err) {
        setError("An error occurred while fetching compositions")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompositions()
  }, [])

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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Saved Compositions</h2>
          <Link to="/">
            <Button>
              <Music className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading compositions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : compositions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No compositions found. Create your first one!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {compositions.map((composition) => (
              <Card key={composition.id}>
                <CardHeader>
                  <CardTitle>{composition.title}</CardTitle>
                  <CardDescription>Created {new Date(composition.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm truncate">
                    {composition.notation.substring(0, 50)}
                    {composition.notation.length > 50 ? "..." : ""}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link to={`/composition/${composition.id}`}>
                    <Button variant="outline">View</Button>
                  </Link>
                  <Link to={`/?session=${composition.id}`}>
                    <Button>
                      <Music className="w-4 h-4 mr-2" />
                      Play
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

