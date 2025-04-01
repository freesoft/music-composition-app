import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
        <Link to="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    </div>
  )
}

