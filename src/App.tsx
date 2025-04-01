import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import CompositionsPage from "./pages/CompositionsPage"
import CompositionDetailPage from "./pages/CompositionDetailPage"
import NotFoundPage from "./pages/NotFoundPage"
import { Toaster } from "./components/ui/toaster"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/compositions" element={<CompositionsPage />} />
        <Route path="/composition/:id" element={<CompositionDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App

