"use client"

import { useEffect, useRef } from "react"
import { parseNotation } from "@/utils/notation-parser"
import { useTheme } from "@/components/theme-provider"

interface MusicNotationProps {
  notation: string
}

export default function MusicNotation({ notation }: MusicNotationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Determine colors based on theme
    const isDarkMode = document.documentElement.classList.contains("dark")
    const lineColor = isDarkMode ? "#888" : "#333"
    const noteColor = isDarkMode ? "#fff" : "#333"
    const textColor = isDarkMode ? "#aaa" : "#666"
    const bgColor = isDarkMode ? "#1a1a1a" : "#fff"

    // Clear the canvas
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Set up staff lines
    const staffHeight = 40
    const staffY = canvas.height / 2 - staffHeight / 2

    // Draw staff lines
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1

    for (let i = 0; i < 5; i++) {
      const y = staffY + i * (staffHeight / 4)
      ctx.beginPath()
      ctx.moveTo(20, y)
      ctx.lineTo(canvas.width - 20, y)
      ctx.stroke()
    }

    // Parse the notation
    const parsedNotation = parseNotation(notation)

    // Draw treble clef
    ctx.fillStyle = noteColor
    ctx.font = "40px serif"
    ctx.fillText("𝄞", 25, staffY + 16)

    // Draw tempo if specified
    if (parsedNotation.tempo) {
      ctx.fillStyle = textColor
      ctx.font = "12px sans-serif"
      ctx.fillText(`♩ = ${parsedNotation.tempo}`, 25, staffY - 20)
    }

    // Draw key signature if specified
    if (parsedNotation.key) {
      ctx.fillStyle = textColor
      ctx.font = "12px sans-serif"
      ctx.fillText(`Key: ${parsedNotation.key}`, 100, staffY - 20)
    }

    // Draw measures
    let xPosition = 60
    const noteWidth = 25

    parsedNotation.measures.forEach((measure, measureIndex) => {
      // Draw time signature if present
      if (measure.timeSignature) {
        ctx.fillStyle = noteColor
        ctx.font = "20px serif"
        ctx.fillText(measure.timeSignature.numerator.toString(), xPosition, staffY + 8)
        ctx.fillText(measure.timeSignature.denominator.toString(), xPosition, staffY + 24)
        xPosition += 20
      }

      measure.notes.forEach((note) => {
        if (note.isRest) {
          // Draw rest
          ctx.fillStyle = noteColor
          ctx.font = "20px serif"

          // Different rest symbols based on duration
          let restSymbol = "𝄽" // Quarter rest
          if (note.duration >= 1)
            restSymbol = "𝄻" // Whole rest
          else if (note.duration >= 0.5)
            restSymbol = "𝄼" // Half rest
          else if (note.duration <= 0.125) restSymbol = "𝄾" // Eighth rest

          ctx.fillText(restSymbol, xPosition, staffY + 16)
        } else {
          // Calculate y position based on note name and octave
          const noteMap: Record<string, number> = { C: 0, D: -1, E: -2, F: -3, G: -4, A: -5, B: -6 }
          const baseY = staffY + 2 * (staffHeight / 4) // Middle line
          const noteY = baseY + (noteMap[note.name] || 0) * (staffHeight / 8) - ((note.octave - 4) * staffHeight) / 2

          // Draw note
          ctx.fillStyle = noteColor
          ctx.beginPath()

          // Different note heads based on duration
          if (note.duration >= 0.5) {
            // Whole or half note (open notehead)
            ctx.strokeStyle = noteColor
            ctx.lineWidth = 1
            ctx.ellipse(xPosition, noteY, 8, 6, 0, 0, Math.PI * 2)
            ctx.stroke()
          } else {
            // Quarter note or shorter (filled notehead)
            ctx.ellipse(xPosition, noteY, 8, 6, 0, 0, Math.PI * 2)
            ctx.fill()
          }

          // Draw stem for notes shorter than whole notes
          if (note.duration < 1) {
            ctx.beginPath()
            ctx.strokeStyle = noteColor
            ctx.moveTo(xPosition + 6, noteY)
            ctx.lineTo(xPosition + 6, noteY - 30)
            ctx.stroke()
          }

          // Draw flags for eighth notes and shorter
          if (note.duration <= 0.125) {
            ctx.beginPath()
            ctx.strokeStyle = noteColor
            ctx.moveTo(xPosition + 6, noteY - 30)
            ctx.bezierCurveTo(xPosition + 6, noteY - 30, xPosition + 20, noteY - 25, xPosition + 20, noteY - 15)
            ctx.stroke()
          }

          // Draw dot for dotted notes
          if (note.dotted) {
            ctx.beginPath()
            ctx.arc(xPosition + 14, noteY, 2, 0, Math.PI * 2)
            ctx.fill()
          }

          // Draw tie
          if (note.tie) {
            ctx.beginPath()
            ctx.strokeStyle = noteColor
            ctx.moveTo(xPosition + 10, noteY - 10)
            ctx.bezierCurveTo(xPosition + 20, noteY - 20, xPosition + 30, noteY - 20, xPosition + 40, noteY - 10)
            ctx.stroke()
          }

          // Draw accidental
          if (note.accidental) {
            ctx.fillStyle = noteColor
            ctx.font = "16px serif"
            let accidentalSymbol = ""
            if (note.accidental === "#") accidentalSymbol = "♯"
            else if (note.accidental === "b") accidentalSymbol = "♭"
            else if (note.accidental === "n") accidentalSymbol = "♮"

            ctx.fillText(accidentalSymbol, xPosition - 15, noteY + 5)
          }
        }

        // Move to next note position
        xPosition += noteWidth + (note.accidental ? 5 : 0) + (note.dotted ? 5 : 0)
      })

      // Draw bar line
      if (measureIndex < parsedNotation.measures.length - 1) {
        ctx.beginPath()
        ctx.strokeStyle = lineColor
        ctx.moveTo(xPosition, staffY)
        ctx.lineTo(xPosition, staffY + staffHeight)
        ctx.stroke()
        xPosition += 20
      }
    })
  }, [notation, theme])

  return (
    <div className="relative w-full h-[300px] bg-background border rounded-md">
      <canvas ref={canvasRef} width={800} height={300} className="w-full h-full" />
    </div>
  )
}

