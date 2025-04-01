"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"
import { parseNotation, noteToFrequency } from "@/utils/notation-parser"

interface MusicPlayerProps {
  notation: string
  isPlaying: boolean
  onPlayPauseToggle: () => void
}

export default function MusicPlayer({ notation, isPlaying, onPlayPauseToggle }: MusicPlayerProps) {
  const [volume, setVolume] = useState<number>(75)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [tempo, setTempo] = useState<number>(120)
  const audioContextRef = useRef<AudioContext | null>(null)
  const schedulerIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const currentTimeRef = useRef<number>(0)
  const parsedNotationRef = useRef<any>(null)

  // Parse notation into playable notes
  useEffect(() => {
    try {
      const parsed = parseNotation(notation)
      parsedNotationRef.current = parsed

      // Calculate total duration
      let totalDuration = 0
      parsed.measures.forEach((measure) => {
        measure.notes.forEach((note) => {
          totalDuration += note.duration
        })
      })

      setDuration(totalDuration * (60 / (parsed.tempo || 120)))

      if (parsed.tempo) {
        setTempo(parsed.tempo)
      }
    } catch (error) {
      console.error("Error parsing notation:", error)
    }
  }, [notation])

  // Handle playback
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    if (isPlaying) {
      startPlayback()
    } else {
      stopPlayback()
    }

    return () => {
      if (schedulerIdRef.current !== null) {
        clearInterval(schedulerIdRef.current)
      }
    }
  }, [isPlaying, notation, tempo])

  // Play a single note
  const playNote = (note: any, time: number) => {
    if (!audioContextRef.current || note.isRest) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.value = noteToFrequency(note)

    // Apply volume
    gainNode.gain.value = volume / 100

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Calculate note duration in seconds
    const noteDuration = note.duration * (60 / tempo)

    // Schedule playback
    const startTime = ctx.currentTime + time
    oscillator.start(startTime)
    oscillator.stop(startTime + noteDuration - 0.01)

    // Envelope to avoid clicks
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume / 100, startTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration - 0.01)
  }

  // Start playback scheduler
  const startPlayback = () => {
    if (!audioContextRef.current || !parsedNotationRef.current) return

    const ctx = audioContextRef.current

    // Resume audio context if suspended
    if (ctx.state === "suspended") {
      ctx.resume()
    }

    startTimeRef.current = ctx.currentTime

    // Schedule all notes
    let currentTime = 0
    parsedNotationRef.current.measures.forEach((measure) => {
      measure.notes.forEach((note) => {
        playNote(note, currentTime)
        // Calculate note duration in seconds
        const noteDuration = note.duration * (60 / tempo)
        currentTime += noteDuration
      })
    })

    // Update progress
    schedulerIdRef.current = window.setInterval(() => {
      if (!audioContextRef.current) return

      currentTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current

      if (currentTimeRef.current >= duration) {
        stopPlayback()
        onPlayPauseToggle()
        setProgress(0)
      } else {
        setProgress((currentTimeRef.current / duration) * 100)
      }
    }, 50)
  }

  // Stop playback
  const stopPlayback = () => {
    if (schedulerIdRef.current !== null) {
      clearInterval(schedulerIdRef.current)
      schedulerIdRef.current = null
    }
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get volume icon based on volume level
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-4 w-4" />
    if (volume < 50) return <Volume1 className="h-4 w-4" />
    return <Volume2 className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button onClick={onPlayPauseToggle} variant="default" size="icon" className="h-10 w-10">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 w-24">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {getVolumeIcon()}
          </Button>
          <Slider value={[volume]} max={100} step={1} className="w-16" onValueChange={handleVolumeChange} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Slider value={[progress]} max={100} step={0.1} disabled={true} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <div>{formatTime((duration * progress) / 100)}</div>
          <div>{formatTime(duration)}</div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-4">
        <p>
          Currently playing: {notation.substring(0, 30)}
          {notation.length > 30 ? "..." : ""}
        </p>
        <p className="mt-1">Tempo: ♩ = {tempo} BPM</p>
      </div>
    </div>
  )
}

