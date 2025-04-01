// Types for our enhanced notation
export interface Note {
  name: string // C, D, E, F, G, A, B
  octave: number // 0-8
  accidental?: string // #, b, n (natural)
  duration: number // 1 = whole, 0.5 = half, 0.25 = quarter, etc.
  dotted?: boolean // Increases duration by half
  isRest?: boolean // If true, this is a rest, not a note
  tie?: boolean // If true, this note is tied to the next
}

export interface Measure {
  notes: Note[]
  timeSignature?: { numerator: number; denominator: number }
}

export interface ParsedNotation {
  measures: Measure[]
  tempo?: number
  key?: string
}

// Regular expression for parsing enhanced notation
// Format examples:
// C4q - C in octave 4, quarter note
// D#5h. - D sharp in octave 5, dotted half note
// Eb3w - E flat in octave 3, whole note
// R8 - Eighth note rest
// F4q~ - F in octave 4, quarter note tied to next note
const NOTE_REGEX = /([A-G][#bn]?|R)(\d)?([whdqes])(\.|~)?/i

// Note duration mapping
const DURATION_MAP: Record<string, number> = {
  w: 1, // whole note
  h: 0.5, // half note
  q: 0.25, // quarter note
  e: 0.125, // eighth note
  s: 0.0625, // sixteenth note
  d: 0.375, // dotted half (special case)
}

/**
 * Parse enhanced notation string into structured data
 */
export function parseNotation(notation: string): ParsedNotation {
  const result: ParsedNotation = {
    measures: [],
    tempo: 120, // Default tempo
  }

  // Split into measures
  const measureStrings = notation.split("|")

  measureStrings.forEach((measureStr) => {
    const measure: Measure = {
      notes: [],
    }

    // Check for time signature at the beginning of the measure
    const timeSignatureMatch = measureStr.match(/^\s*(\d+)\/(\d+)\s*/)
    if (timeSignatureMatch) {
      measure.timeSignature = {
        numerator: Number.parseInt(timeSignatureMatch[1]),
        denominator: Number.parseInt(timeSignatureMatch[2]),
      }
      // Remove time signature from the measure string
      measureStr = measureStr.replace(timeSignatureMatch[0], "")
    }

    // Split into note tokens
    const noteTokens = measureStr.trim().split(/\s+/)

    noteTokens.forEach((token) => {
      if (!token) return

      // Check for tempo marking
      if (token.startsWith("tempo=")) {
        result.tempo = Number.parseInt(token.substring(6))
        return
      }

      // Check for key signature
      if (token.startsWith("key=")) {
        result.key = token.substring(4)
        return
      }

      // Parse note
      const match = token.match(NOTE_REGEX)
      if (match) {
        const [_, noteName, octaveStr, durationType, modifier] = match

        const note: Note = {
          name: noteName === "R" ? "R" : noteName[0].toUpperCase(),
          octave: octaveStr ? Number.parseInt(octaveStr) : 4,
          duration: DURATION_MAP[durationType.toLowerCase()] || 0.25,
          isRest: noteName === "R",
          dotted: modifier === ".",
          tie: modifier === "~",
        }

        // Handle accidentals
        if (noteName.length > 1 && noteName !== "R") {
          note.accidental = noteName.substring(1)
        }

        // Adjust duration for dotted notes
        if (note.dotted) {
          note.duration *= 1.5
        }

        measure.notes.push(note)
      } else {
        // Handle simple notation format for backward compatibility
        // Format: C4, D#5, etc.
        const simpleMatch = token.match(/([A-G][#b]?)(\d)/i)
        if (simpleMatch) {
          const [_, noteName, octave] = simpleMatch

          const note: Note = {
            name: noteName[0].toUpperCase(),
            octave: Number.parseInt(octave),
            duration: 0.25, // Default to quarter note
          }

          // Handle accidentals
          if (noteName.length > 1) {
            note.accidental = noteName.substring(1)
          }

          measure.notes.push(note)
        }
      }
    })

    if (measure.notes.length > 0) {
      result.measures.push(measure)
    }
  })

  return result
}

/**
 * Convert parsed notation back to string format
 */
export function stringifyNotation(parsed: ParsedNotation): string {
  const measures = parsed.measures.map((measure) => {
    let measureStr = ""

    // Add time signature if present
    if (measure.timeSignature) {
      measureStr += `${measure.timeSignature.numerator}/${measure.timeSignature.denominator} `
    }

    // Add notes
    const noteStrings = measure.notes.map((note) => {
      if (note.isRest) {
        // Format rest
        const durChar = Object.entries(DURATION_MAP).find(([_, val]) => val === note.duration)?.[0] || "q"
        return `R${durChar}`
      } else {
        // Format note
        let noteStr = note.name

        // Add accidental
        if (note.accidental) {
          noteStr += note.accidental
        }

        // Add octave
        noteStr += note.octave

        // Add duration
        const baseDuration = note.dotted ? note.duration / 1.5 : note.duration
        const durChar = Object.entries(DURATION_MAP).find(([_, val]) => val === baseDuration)?.[0] || "q"
        noteStr += durChar

        // Add modifiers
        if (note.dotted) {
          noteStr += "."
        } else if (note.tie) {
          noteStr += "~"
        }

        return noteStr
      }
    })

    return measureStr + noteStrings.join(" ")
  })

  // Add global properties
  let header = ""
  if (parsed.tempo && parsed.tempo !== 120) {
    header += `tempo=${parsed.tempo} `
  }
  if (parsed.key) {
    header += `key=${parsed.key} `
  }

  return header + measures.join(" | ")
}

/**
 * Convert a note to its frequency in Hz
 */
export function noteToFrequency(note: Note): number {
  if (note.isRest) return 0

  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

  // Adjust note name based on accidental
  let noteName = note.name
  if (note.accidental) {
    if (note.accidental === "#") {
      // Handle sharp
      const noteIndex = notes.indexOf(note.name)
      noteName = notes[(noteIndex + 1) % 12]
    } else if (note.accidental === "b") {
      // Handle flat
      const noteIndex = notes.indexOf(note.name)
      noteName = notes[(noteIndex + 11) % 12] // -1 + 12 to handle negative index
    }
  }

  const noteIndex = notes.indexOf(noteName)
  if (noteIndex === -1) return 440 // Default to A4 if note not found

  // A4 is 440Hz
  const a4Index = 9 + 4 * 12 // A4 is 9th note in 4th octave
  const notePosition = noteIndex + note.octave * 12

  return 440 * Math.pow(2, (notePosition - a4Index) / 12)
}

/**
 * Convert a note to MIDI note number
 */
export function noteToMidi(note: Note): number {
  if (note.isRest) return 0

  const noteMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }

  let baseNote = noteMap[note.name] || 0

  // Adjust for accidentals
  if (note.accidental) {
    if (note.accidental === "#") baseNote += 1
    if (note.accidental === "b") baseNote -= 1
  }

  // C4 is MIDI note 60
  return baseNote + (note.octave + 1) * 12
}

