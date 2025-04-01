import { parseNotation, noteToMidi } from "@/utils/notation-parser"

// Create a simple MIDI file from notation
export function createMidiFile(notation: string): Uint8Array {
  // Parse notation
  const parsedNotation = parseNotation(notation)

  // MIDI file header
  const header = [
    0x4d,
    0x54,
    0x68,
    0x64, // MThd
    0x00,
    0x00,
    0x00,
    0x06, // Header size
    0x00,
    0x01, // Format
    0x00,
    0x01, // Number of tracks
    0x01,
    0x00, // Division (ticks per quarter note)
  ]

  // Track header
  const trackHeader = [
    0x4d,
    0x54,
    0x72,
    0x6b, // MTrk
    0x00,
    0x00,
    0x00,
    0x00, // Track length (placeholder)
  ]

  // Track events
  const events: number[] = []

  // Set tempo
  const tempo = parsedNotation.tempo || 120
  const microsecondsPerQuarter = Math.floor(60000000 / tempo)

  events.push(0x00) // Delta time
  events.push(0xff, 0x51, 0x03) // Meta event: Set Tempo
  events.push(
    (microsecondsPerQuarter >> 16) & 0xff,
    (microsecondsPerQuarter >> 8) & 0xff,
    microsecondsPerQuarter & 0xff,
  )

  // Set instrument (Piano)
  events.push(0x00) // Delta time
  events.push(0xc0, 0x00) // Program Change, channel 0, program 0 (Piano)

  // Add note events
  let lastTime = 0
  let currentTime = 0

  parsedNotation.measures.forEach((measure) => {
    measure.notes.forEach((note) => {
      if (!note.isRest) {
        const deltaTime = Math.round((currentTime - lastTime) * 480) // Convert to ticks
        const midiNote = noteToMidi(note)

        // Note On
        events.push(deltaTime) // Delta time
        events.push(0x90, midiNote, 0x64) // Note On, channel 0, note, velocity

        // Note Off
        const noteDuration = Math.round(note.duration * 480) // Convert to ticks
        events.push(noteDuration) // Delta time (duration)
        events.push(0x80, midiNote, 0x40) // Note Off, channel 0, note, velocity

        lastTime = currentTime + note.duration
      } else {
        // For rests, just update the time
        lastTime = currentTime + note.duration
      }

      currentTime += note.duration
    })
  })

  // End of track
  events.push(0x00) // Delta time
  events.push(0xff, 0x2f, 0x00) // Meta event: End of Track

  // Calculate track length
  const trackLength = events.length
  trackHeader[4] = (trackLength >> 24) & 0xff
  trackHeader[5] = (trackLength >> 16) & 0xff
  trackHeader[6] = (trackLength >> 8) & 0xff
  trackHeader[7] = trackLength & 0xff

  // Combine all parts
  const midiData = new Uint8Array([...header, ...trackHeader, ...events])

  return midiData
}

// Create a data URL for downloading
export function createDataUrl(data: Uint8Array, type: string): string {
  const blob = new Blob([data], { type })
  return URL.createObjectURL(blob)
}

// Generate a simple SVG score from notation
export function generateScoreSVG(notation: string): string {
  const parsedNotation = parseNotation(notation)
  const staffHeight = 40
  const staffWidth = 800
  const noteWidth = 30
  const staffY = 100

  // Determine colors based on theme
  const isDarkMode = document.documentElement.classList.contains("dark")
  const lineColor = isDarkMode ? "#888" : "#333"
  const noteColor = isDarkMode ? "#fff" : "#333"
  const textColor = isDarkMode ? "#aaa" : "#666"
  const bgColor = isDarkMode ? "#1a1a1a" : "#fff"

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${staffWidth}" height="200" viewBox="0 0 ${staffWidth} 200">
  <style>
    .staff-line { stroke: ${lineColor}; stroke-width: 1; }
    .note { fill: ${noteColor}; }
    .note-stroke { stroke: ${noteColor}; stroke-width: 1; fill: none; }
    .bar-line { stroke: ${lineColor}; stroke-width: 1; }
    .note-text { font-family: sans-serif; font-size: 10px; text-anchor: middle; fill: ${textColor}; }
    .clef { font-family: serif; font-size: 40px; fill: ${noteColor}; }
    .accidental { font-family: serif; font-size: 16px; fill: ${noteColor}; }
    .tempo { font-family: sans-serif; font-size: 12px; fill: ${textColor}; }
  </style>
  <rect width="${staffWidth}" height="200" fill="${bgColor}" />
`

  // Draw staff lines
  for (let i = 0; i < 5; i++) {
    const y = staffY + i * (staffHeight / 4)
    svg += `<line class="staff-line" x1="20" y1="${y}" x2="${staffWidth - 20}" y2="${y}" />`
  }

  // Draw treble clef
  svg += `<text class="clef" x="30" y="${staffY + 16}">𝄞</text>`

  // Draw tempo if specified
  if (parsedNotation.tempo) {
    svg += `<text class="tempo" x="25" y="${staffY - 20}">♩ = ${parsedNotation.tempo}</text>`
  }

  // Draw key signature if specified
  if (parsedNotation.key) {
    svg += `<text class="tempo" x="100" y="${staffY - 20}">Key: ${parsedNotation.key}</text>`
  }

  // Draw measures
  let xPosition = 60

  parsedNotation.measures.forEach((measure, measureIndex) => {
    // Draw time signature if present
    if (measure.timeSignature) {
      svg += `<text class="note" x="${xPosition}" y="${staffY + 8}">${measure.timeSignature.numerator}</text>`
      svg += `<text class="note" x="${xPosition}" y="${staffY + 24}">${measure.timeSignature.denominator}</text>`
      xPosition += 20
    }

    measure.notes.forEach((note) => {
      if (note.isRest) {
        // Draw rest
        let restSymbol = "𝄽" // Quarter rest
        if (note.duration >= 1)
          restSymbol = "𝄻" // Whole rest
        else if (note.duration >= 0.5)
          restSymbol = "𝄼" // Half rest
        else if (note.duration <= 0.125) restSymbol = "𝄾" // Eighth rest

        svg += `<text class="note" x="${xPosition}" y="${staffY + 16}">${restSymbol}</text>`
      } else {
        // Calculate y position based on note name and octave
        const noteMap: Record<string, number> = { C: 0, D: -1, E: -2, F: -3, G: -4, A: -5, B: -6 }
        const baseY = staffY + 2 * (staffHeight / 4) // Middle line
        const noteY = baseY + (noteMap[note.name] || 0) * (staffHeight / 8) - ((note.octave - 4) * staffHeight) / 2

        // Draw note
        if (note.duration >= 0.5) {
          // Whole or half note (open notehead)
          svg += `<ellipse class="note-stroke" cx="${xPosition}" cy="${noteY}" rx="8" ry="6" />`
        } else {
          // Quarter note or shorter (filled notehead)
          svg += `<ellipse class="note" cx="${xPosition}" cy="${noteY}" rx="8" ry="6" />`
        }

        // Draw stem for notes shorter than whole notes
        if (note.duration < 1) {
          svg += `<line class="staff-line" x1="${xPosition + 6}" y1="${noteY}" x2="${xPosition + 6}" y2="${noteY - 30}" />`
        }

        // Draw flags for eighth notes and shorter
        if (note.duration <= 0.125) {
          svg += `<path class="staff-line" d="M ${xPosition + 6} ${noteY - 30} C ${xPosition + 6} ${noteY - 30}, ${xPosition + 20} ${noteY - 25}, ${xPosition + 20} ${noteY - 15}" />`
        }

        // Draw dot for dotted notes
        if (note.dotted) {
          svg += `<circle class="note" cx="${xPosition + 14}" cy="${noteY}" r="2" />`
        }

        // Draw tie
        if (note.tie) {
          svg += `<path class="staff-line" d="M ${xPosition + 10} ${noteY - 10} C ${xPosition + 20} ${noteY - 20}, ${xPosition + 30} ${noteY - 20}, ${xPosition + 40} ${noteY - 10}" />`
        }

        // Draw accidental
        if (note.accidental) {
          let accidentalSymbol = ""
          if (note.accidental === "#") accidentalSymbol = "♯"
          else if (note.accidental === "b") accidentalSymbol = "♭"
          else if (note.accidental === "n") accidentalSymbol = "♮"

          svg += `<text class="accidental" x="${xPosition - 15}" y="${noteY + 5}">${accidentalSymbol}</text>`
        }
      }

      // Move to next note position
      xPosition += noteWidth + (note.accidental ? 5 : 0) + (note.dotted ? 5 : 0)
    })

    // Draw bar line
    if (measureIndex < parsedNotation.measures.length - 1) {
      svg += `<line class="bar-line" x1="${xPosition}" y1="${staffY}" x2="${xPosition}" y2="${staffY + staffHeight}" />`
      xPosition += 20
    }
  })

  svg += "</svg>"

  return svg
}

