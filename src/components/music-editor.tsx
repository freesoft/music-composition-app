"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Play, Pause, Save, Copy, Plus, Download, FileText, Music } from "lucide-react"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Checkbox } from "./ui/checkbox"
import { toast } from "./ui/use-toast"
import MusicNotation from "./music-notation"
import MusicPlayer from "./music-player"
import { saveComposition } from "../utils/api"
import { createMidiFile, createDataUrl, generateScoreSVG } from "../utils/export-utils"
import { getSocket, disconnectSocket } from "../utils/socket"

interface MusicEditorProps {
  initialNotation?: string
  initialSessionId?: string
}

export default function MusicEditor({ initialNotation = "", initialSessionId = "" }: MusicEditorProps) {
  const [notation, setNotation] = useState<string>(
    initialNotation || "C4 D4 E4 F4 | G4 A4 B4 C5 | C5 B4 A4 G4 | F4 E4 D4 C4",
  )
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string>(initialSessionId || "")
  const [username, setUsername] = useState<string>("")
  const [activeUsers, setActiveUsers] = useState<string[]>(["You"])
  const [shareUrl, setShareUrl] = useState<string>("")
  const [title, setTitle] = useState<string>("Untitled Composition")
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false)
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)
  const socketRef = useRef<any>(null)
  const userId = useRef<string>(Math.random().toString(36).substring(2, 15))

  // Initialize socket connection
  useEffect(() => {
    // Create a random user ID if not set
    if (!userId.current) {
      userId.current = Math.random().toString(36).substring(2, 15)
    }

    // Generate a random session ID when the component mounts if not provided
    if (!sessionId) {
      const id = Math.random().toString(36).substring(2, 9)
      setSessionId(id)
    }

    // Set share URL
    setShareUrl(`${window.location.origin}?session=${sessionId || initialSessionId}`)

    return () => {
      // Clean up socket connection
      disconnectSocket()
    }
  }, [initialSessionId, sessionId])

  // Connect to socket when username and sessionId are set
  useEffect(() => {
    if (!username || !sessionId) return

    // Initialize socket connection
    socketRef.current = getSocket()

    // Set up event listeners
    socketRef.current.on("connect", () => {
      console.log("Connected to socket server")

      // Join the room
      socketRef.current.emit("join-room", { roomId: sessionId, username })
    })

    socketRef.current.on("user-joined", ({ username, users }: { username: string; users: string[] }) => {
      toast({
        title: "User joined",
        description: `${username} joined the session`,
      })
      setActiveUsers(users)
    })

    socketRef.current.on("user-left", ({ username, users }: { username: string; users: string[] }) => {
      toast({
        title: "User left",
        description: `${username} left the session`,
      })
      setActiveUsers(users)
    })

    socketRef.current.on("notation-updated", ({ notation, username }: { notation: string; username: string }) => {
      setNotation(notation)
      toast({
        title: "Notation updated",
        description: `${username} updated the notation`,
        variant: "default",
      })
    })

    socketRef.current.on("request-notation", ({ requesterId }: { requesterId: string }) => {
      socketRef.current.emit("share-notation", {
        roomId: sessionId,
        notation,
        requesterId,
      })
    })

    socketRef.current.on("notation-shared", ({ notation }: { notation: string }) => {
      setNotation(notation)
    })

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from socket server")
    })

    return () => {
      // Clean up event listeners but keep the connection
      if (socketRef.current) {
        socketRef.current.off("user-joined")
        socketRef.current.off("user-left")
        socketRef.current.off("notation-updated")
        socketRef.current.off("request-notation")
        socketRef.current.off("notation-shared")
      }
    }
  }, [username, sessionId, notation])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNotationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotation = e.target.value
    setNotation(newNotation)

    // Broadcast changes to other users
    if (socketRef.current && socketRef.current.connected && username) {
      socketRef.current.emit("update-notation", {
        roomId: sessionId,
        notation: newNotation,
        username,
      })
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    })
  }

  const handleSaveComposition = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title for your composition",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const result = await saveComposition({
        title,
        notation,
        userId: userId.current,
        isPublic,
      })

      if (result.success) {
        toast({
          title: "Composition saved",
          description: "Your composition has been saved successfully",
        })
        setSaveDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save composition",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving composition:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportMIDI = () => {
    try {
      setIsExporting(true)

      // Create MIDI file
      const midiData = createMidiFile(notation)

      // Create download link
      const dataUrl = createDataUrl(midiData, "audio/midi")

      // Create and trigger download
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${title.replace(/\s+/g, "_")}.mid`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Clean up
      URL.revokeObjectURL(dataUrl)

      toast({
        title: "MIDI exported",
        description: "Your composition has been exported as a MIDI file",
      })
    } catch (error) {
      console.error("Error exporting MIDI:", error)
      toast({
        title: "Error",
        description: "Failed to export MIDI file",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setExportDialogOpen(false)
    }
  }

  const handleExportSheet = () => {
    try {
      setIsExporting(true)

      // Generate SVG score
      const svgScore = generateScoreSVG(notation)

      // Create download link
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgScore)}`

      // Create and trigger download
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${title.replace(/\s+/g, "_")}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast({
        title: "Sheet music exported",
        description: "Your composition has been exported as sheet music (SVG)",
      })
    } catch (error) {
      console.error("Error exporting sheet music:", error)
      toast({
        title: "Error",
        description: "Failed to export sheet music",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setExportDialogOpen(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <Card className="md:col-span-3">
        <CardContent className="p-4">
          <Tabs defaultValue="edit">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Composition</DialogTitle>
                      <DialogDescription>Save your composition to access it later.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter a title for your composition"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="public"
                          checked={isPublic}
                          onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                        />
                        <Label htmlFor="public">Make this composition public</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveComposition} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Composition"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Export Composition</DialogTitle>
                      <DialogDescription>Export your composition in different formats.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Button onClick={handleExportMIDI} disabled={isExporting} className="w-full">
                        <Music className="w-4 h-4 mr-2" />
                        Export as MIDI
                      </Button>
                      <Button onClick={handleExportSheet} disabled={isExporting} className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        Export as Sheet Music (SVG)
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <TabsContent value="edit" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Music Notation</h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Use simple notation like: C4 D4 E4 (notes with octaves) | (bar lines)
              </div>
              <Textarea
                value={notation}
                onChange={handleNotationChange}
                placeholder="Enter your music notation here..."
                className="min-h-[200px] font-mono"
              />
            </TabsContent>
            <TabsContent value="visualize">
              <MusicNotation notation={notation} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-6 md:col-span-2">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Collaboration</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Your Display Name</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name to join collaboration"
                />
                {!username && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your name to enable real-time collaboration
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1 block">Session Link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly />
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Active Users</Label>
                <div className="flex flex-wrap gap-2">
                  {activeUsers.map((user, index) => (
                    <Badge key={index} variant="secondary">
                      {user}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6">
                    <Plus className="w-3 h-3 mr-1" /> Invite
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Player</h2>
            <MusicPlayer notation={notation} isPlaying={isPlaying} onPlayPauseToggle={handlePlayPause} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

