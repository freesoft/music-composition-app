import { getCompositions } from "@/app/actions/composition"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Music } from "lucide-react"

export default async function CompositionsPage() {
  const { success, compositions, error } = await getCompositions()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4">
          <h1 className="text-2xl font-bold">Music Notation App</h1>
          <nav className="ml-auto flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/compositions">
              <Button variant="ghost">Compositions</Button>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Saved Compositions</h2>
          <Link href="/">
            <Button>
              <Music className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {!success ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error || "Failed to load compositions"}</p>
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
                  <Link href={`/composition/${composition.id}`}>
                    <Button variant="outline">View</Button>
                  </Link>
                  <Link href={`/?session=${composition.id}`}>
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

