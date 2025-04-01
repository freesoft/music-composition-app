import { getComposition } from "@/app/actions/composition"
import MusicEditor from "@/components/music-editor"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { notFound } from "next/navigation"

interface CompositionPageProps {
  params: {
    id: string
  }
}

export default async function CompositionPage({ params }: CompositionPageProps) {
  const { id } = params
  const { success, composition, error } = await getComposition(id)

  if (!success || !composition) {
    notFound()
  }

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold">{composition.title}</h2>
          <p className="text-muted-foreground">Created {new Date(composition.createdAt).toLocaleDateString()}</p>
        </div>

        <MusicEditor initialNotation={composition.notation} initialSessionId={id} />
      </main>
    </div>
  )
}

