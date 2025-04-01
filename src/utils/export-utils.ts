// MIDI note mapping
const NOTE_MAP: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
}

// Convert note name to MIDI note number
export function noteToMidi(note: string): number {
  const noteName = note.slice(0, -1)
  const octave = Number.parseInt(note.slice(-1))

  // Calculate MIDI note number
  // C4 is MIDI note 60
  const baseNote = NOTE_MAP[noteName] || 0
  return baseNote + (octave + 1) * 12
}

// Create a simple MIDI file from notation
export function createMidiFile(notation: string): Uint8Array {
  // Parse notation
  const measures = notation.split("|")
  const notes: { note: string; duration: number; time: number }[] = []

  let time = 0
  measures.forEach((measure) => {
    const noteStrings = measure.trim().split(" ")

    noteStrings.forEach((noteStr) => {
      if (noteStr.trim() === "") return

      // Default duration (quarter note)
      const duration = 0.5

      notes.push({
        note: noteStr,
        duration,
        time,
      })

      time += duration
    })
  })

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

  // Set tempo (120 BPM)
  events.push(0x00) // Delta time
  events.push(0xff, 0x51, 0x03) // Meta event: Set Tempo
  events.push(0x07, 0xa1, 0x20) // Tempo value (500,000 microseconds per quarter note)

  // Set instrument (Piano)
  events.push(0x00) // Delta time
  events.push(0xc0, 0x00) // Program Change, channel 0, program 0 (Piano)

  // Add note events
  let lastTime = 0
  notes.forEach(({ note, duration, time }) => {
    const deltaTime = Math.round((time - lastTime) * 480) // Convert to ticks
    const midiNote = noteToMidi(note)

    // Note On
    events.push(deltaTime) // Delta time
    events.push(0x90, midiNote, 0x64) // Note On, channel 0, note, velocity

    // Note Off
    events.push(Math.round(duration * 480)) // Delta time (duration)
    events.push(0x80, midiNote, 0x40) // Note Off, channel 0, note, velocity

    lastTime = time + duration
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
  const measures = notation.split("|")
  const staffHeight = 40
  const staffWidth = 800
  const noteWidth = 30
  const staffY = 100

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${staffWidth}" height="200" viewBox="0 0 ${staffWidth} 200">
    <style>
      .staff-line { stroke: #333; stroke-width: 1; }
      .note { fill: #333; }
      .bar-line { stroke: #333; stroke-width: 1; }
      .note-text { font-family: sans-serif; font-size: 10px; text-anchor: middle; }
    </style>
  `

  // Draw staff lines
  for (let i = 0; i < 5; i++) {
    const y = staffY + i * (staffHeight / 4)
    svg += `<line class="staff-line" x1="20" y1="${y}" x2="${staffWidth - 20}" y2="${y}" />`
  }

  // Draw treble clef (simplified)
  svg += `<text x="30" y="${staffY + 16}" font-family="serif" font-size="40">𝄞</text>`

  // Parse and draw notes
  let xPosition = 60

  measures.forEach((measure, measureIndex) => {
    const notes = measure.trim().split(" ")

    notes.forEach((noteStr) => {
      if (noteStr.trim() === "") return

      // Extract note name and octave (e.g., C4)
      const noteName = noteStr[0]
      const octave = Number.parseInt(noteStr[1]) || 4

      // Calculate y position based on note name and octave
      const noteMap: Record<string, number> = { C: 0, D: -1, E: -2, F: -3, G: -4, A: -5, B: -6 }
      const baseY = staffY + 2 * (staffHeight / 4) // Middle line
      const noteY = baseY + (noteMap[noteName] || 0) * (staffHeight / 8) - ((octave - 4) * staffHeight) / 2

      // Draw note
      svg += `<ellipse class="note" cx="${xPosition}" cy="${noteY}" rx="8" ry="6" />`

      // Draw stem
      svg += `<line class="staff-line" x1="${xPosition + 6}" y1="${noteY}" x2="${xPosition + 6}" y2="${noteY - 30}" />`

      // Draw note name below staff
      svg += `<text class="note-text" x="${xPosition}" y="${staffY + 50}">${noteStr}</text>`

      // Move to next note position
      xPosition += noteWidth
    })

    // Draw bar line
    if (measureIndex < measures.length - 1) {
      svg += `<line class="bar-line" x1="${xPosition}" y1="${staffY}" x2="${xPosition}" y2="${staffY + staffHeight}" />`
      xPosition += 20
    }
  })

  svg += "</svg>"

  return svg
}

