// In-memory store for compositions
const compositions: any[] = []

// Save a composition
export async function saveComposition(data: {
  title: string
  notation: string
  userId: string
  isPublic: boolean
}) {
  try {
    // Generate an ID
    const id = Math.random().toString(36).substring(2, 15)

    // Create composition object
    const composition = {
      id,
      title: data.title,
      notation: data.notation,
      userId: data.userId,
      isPublic: data.isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to our in-memory store
    compositions.push(composition)

    return { success: true, id, composition }
  } catch (error) {
    console.error("Error saving composition:", error)
    return { success: false, error: "Failed to save composition" }
  }
}

// Get all compositions
export async function getCompositions(userId?: string) {
  try {
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

// Get a specific composition by ID
export async function getComposition(id: string) {
  try {
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

