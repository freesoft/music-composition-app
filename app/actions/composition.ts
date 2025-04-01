"use server"

import { revalidatePath } from "next/cache"

// In a real app, you would use a database like Prisma
// This is a simple in-memory store for demonstration
const compositions: any[] = []

export async function saveComposition(formData: FormData) {
  const title = formData.get("title") as string
  const notation = formData.get("notation") as string
  const userId = formData.get("userId") as string
  const isPublic = formData.get("isPublic") === "true"

  if (!title || !notation) {
    return { success: false, error: "Title and notation are required" }
  }

  try {
    // Generate an ID
    const id = Math.random().toString(36).substring(2, 15)

    // In a real app, you would save to a database
    const composition = {
      id,
      title,
      notation,
      userId,
      isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to our in-memory store
    compositions.push(composition)

    // Revalidate the compositions page
    revalidatePath("/compositions")

    return { success: true, id, composition }
  } catch (error) {
    console.error("Error saving composition:", error)
    return { success: false, error: "Failed to save composition" }
  }
}

export async function getCompositions(userId?: string) {
  try {
    // In a real app, you would query your database
    // Filter compositions based on userId or public status
    const userCompositions = userId
      ? compositions.filter((c) => c.userId === userId || c.isPublic)
      : compositions.filter((c) => c.isPublic)

    return { success: true, compositions: userCompositions }
  } catch (error) {
    console.error("Error getting compositions:", error)
    return { success: false, error: "Failed to get compositions" }
  }
}

export async function getComposition(id: string) {
  try {
    // In a real app, you would query your database
    const composition = compositions.find((c) => c.id === id)

    if (!composition) {
      return { success: false, error: "Composition not found" }
    }

    return { success: true, composition }
  } catch (error) {
    console.error("Error getting composition:", error)
    return { success: false, error: "Failed to get composition" }
  }
}

