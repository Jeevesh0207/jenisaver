import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle, Video } from "lucide-react"
import Image from "next/image"

interface DownloadStatusProps {
  downloading: boolean
  progress: number
  downloadSize: string
  isComplete: boolean
  videoTitle: string
  thumbnailUrl: string
}

export default function DownloadStatus({
  downloading,
  progress,
  downloadSize,
  isComplete,
  videoTitle,
  thumbnailUrl,
}: DownloadStatusProps) {
  if (!downloading && !isComplete) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-4">Download Status</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Video className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No active downloads</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Select a format to start downloading</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium mb-4">Download Status</h2>

        <div className="space-y-4">
          {thumbnailUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md mb-4">
              <Image
                src={thumbnailUrl || "/placeholder.svg"}
                alt={videoTitle}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to default thumbnail if high-res fails
                  const target = e.target as HTMLImageElement
                  const videoId = thumbnailUrl.split("/").pop()?.split(".")[0]
                  if (videoId && videoId.length === 11) {
                    target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  } else {
                    target.src = "/placeholder.svg?height=720&width=1280"
                  }
                }}
              />
              {downloading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
              )}
              {isComplete && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {downloading ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              )}
              <span className="font-medium">{downloading ? "Downloading..." : "Download Complete"}</span>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{downloadSize} MB</span>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium truncate" title={videoTitle}>
              {videoTitle}
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{progress.toFixed(1)}% Complete</span>
              <span>{downloading ? "In progress" : "Finished"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

