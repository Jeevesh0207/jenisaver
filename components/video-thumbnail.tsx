"use client"

import Image from "next/image"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface VideoThumbnailProps {
  videoId: string
  title: string
  isLoading?: boolean
}

export default function VideoThumbnail({ videoId, title, isLoading = false }: VideoThumbnailProps) {
  const [fallbackUsed, setFallbackUsed] = useState(false)

  // Try to use the highest quality thumbnail first
  const thumbnailUrl = fallbackUsed
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md">
      <Image
        src={thumbnailUrl || "/placeholder.svg"}
        alt={title || "Video thumbnail"}
        fill
        className="object-cover"
        onError={() => {
          if (!fallbackUsed) {
            setFallbackUsed(true)
          }
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        </div>
      )}
    </div>
  )
}

