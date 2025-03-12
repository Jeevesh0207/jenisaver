"use client"

import { Button } from "@/components/ui/button"
import { Download, Video, FileAudio } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Format {
  itag: number
  mimeType: string
  quality: string
  size: string
  fps?: number
}

interface VideoFormatsProps {
  formats: Format[]
  onSelectFormat: (itag: number, quality: string) => void
  type: "video" | "audio"
}

export default function VideoFormats({ formats, onSelectFormat, type }: VideoFormatsProps) {
  // Sort formats by quality (highest first for video, smallest file size first for audio)
  const sortedFormats = [...formats].sort((a, b) => {
    if (type === "video") {
      // Extract numeric part from quality (e.g., "1080p60" -> 1080)
      const getQualityNumber = (quality: string) => {
        const match = quality.match(/(\d+)/)
        return match ? Number.parseInt(match[1], 10) : 0
      }

      return getQualityNumber(b.quality) - getQualityNumber(a.quality)
    } else {
      // Sort audio by file size (smallest first)
      const getSizeInBytes = (size: string) => {
        const match = size.match(/(\d+(\.\d+)?)\s*(KB|MB|GB)/i)
        if (!match) return 0

        const value = Number.parseFloat(match[1])
        const unit = match[3].toUpperCase()

        if (unit === "KB") return value * 1024
        if (unit === "MB") return value * 1024 * 1024
        if (unit === "GB") return value * 1024 * 1024 * 1024
        return value
      }

      return getSizeInBytes(a.size) - getSizeInBytes(b.size)
    }
  })

  // Function to get codec name from mimeType
  const getCodec = (mimeType: string) => {
    const codecMatch = mimeType.match(/codecs="([^"]+)"/)
    if (codecMatch && codecMatch[1]) {
      // Simplify codec name for display
      const codec = codecMatch[1]
      if (codec.includes("avc1")) return "H.264"
      if (codec.includes("vp9")) return "VP9"
      if (codec.includes("av01")) return "AV1"
      if (codec.includes("mp4a")) return "AAC"
      if (codec.includes("opus")) return "Opus"
      return codec
    }
    return "Unknown"
  }

  // Function to get container format from mimeType
  const getContainer = (mimeType: string) => {
    if (mimeType.includes("mp4")) return "MP4"
    if (mimeType.includes("webm")) return "WebM"
    return "Unknown"
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
        {sortedFormats.map((format) => (
          <div
            key={format.itag}
            className="flex items-center justify-between p-3 md:p-4 bg-primary-dark border border-teal-dark rounded-lg hover:bg-teal-dark/20 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  type === "video" ? "bg-teal/20 text-teal" : "bg-teal-dark/30 text-teal-light"
                }`}
              >
                {type === "video" ? <Video className="h-5 w-5" /> : <FileAudio className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h4 className="font-medium text-white">{format.quality}</h4>

                  {format.fps && format.fps > 30 && (
                    <Badge className="bg-yellow-500 text-black border-0">{format.fps}fps</Badge>
                  )}

                  <Badge variant="outline" className="bg-teal-dark/30 text-teal-light border-teal-dark">
                    {getContainer(format.mimeType)}
                  </Badge>
                  <Badge variant="outline" className="bg-teal-dark/30 text-teal-light border-teal-dark">
                    {getCodec(format.mimeType)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 mt-1">Size: {format.size}</p>
              </div>
            </div>
            <Button
              onClick={() => onSelectFormat(format.itag, format.quality)}
              size="sm"
              className={`ml-2 md:ml-4 ${
                type === "video"
                  ? "bg-teal hover:bg-teal-dark text-primary-dark"
                  : "bg-teal-dark hover:bg-teal text-white hover:text-primary-dark"
              }`}
            >
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

