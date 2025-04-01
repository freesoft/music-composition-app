"use client"

import { useEffect, useRef } from "react"

interface MusicNotationProps {
  notation: string
}

export default function MusicNotation({ notation }: MusicNotationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up staff lines
    const staffHeight = 40
    const staffY = canvas.height / 2 - staffHeight / 2

    // Draw staff lines
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1

    for (let i = 0; i < 5; i++) {
      const y = staffY + i * (staffHeight / 4)
      ctx.beginPath()
      ctx.moveTo(20, y)
      ctx.lineTo(canvas.width - 20, y)
      ctx.stroke()
    }

    // Parse and draw notes
    const measures = notation.split("|")
    let xPosition = 40
    const noteWidth = 30

    measures.forEach((measure, measureIndex) => {
      const notes = measure.trim().split(" ")

      notes.forEach((noteStr) => {
        if (noteStr.trim() === "") return

        // Extract note name and octave (e.g., C4)
        const noteName = noteStr[0]
        const octave = Number.parseInt(noteStr[1]) || 4

        // Calculate y position based on note name and octave
        // This is a simplified mapping for visualization
        const noteMap: Record<string, number> = { C: 0, D: -1, E: -2, F: -3, G: -4, A: -5, B: -6 }
        const baseY = staffY + 2 * (staffHeight / 4) // Middle line
        const noteY = baseY + (noteMap[noteName] || 0) * (staffHeight / 8) - ((octave - 4) * staffHeight) / 2

        // Draw note
        ctx.fillStyle = "#333"
        ctx.beginPath()
        ctx.ellipse(xPosition, noteY, 8, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        // Draw stem
        ctx.beginPath()
        ctx.moveTo(xPosition + 6, noteY)
        ctx.lineTo(xPosition + 6, noteY - 30)
        ctx.stroke()

        // Move to next note position
        xPosition += noteWidth
      })

      // Draw bar line
      if (measureIndex < measures.length - 1) {
        ctx.beginPath()
        ctx.moveTo(xPosition, staffY)
        ctx.lineTo(xPosition, staffY + staffHeight)
        ctx.stroke()
        xPosition += 20
      }
    })
  }, [notation])

  return (
    <div className="relative w-full h-[300px] bg-white border rounded-md">
      <canvas ref={canvasRef} width={800} height={300} className="w-full h-full" />
    </div>
  )
}

