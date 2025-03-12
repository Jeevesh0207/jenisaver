"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Link, Download, X } from "lucide-react"
import VideoFormats from "@/components/video-formats"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { io, Socket } from "socket.io-client";

// API endpoint
const API = "https://jenisaverbackend.onrender.com"

// Define types based on the provided JSON structure
interface VideoFormat {
  itag: number
  mimeType: string
  quality: string
  fps: number
  size: string
}

interface AudioFormat {
  itag: number
  mimeType: string
  quality: string
  size: string
}

interface VideoInfo {
  title: string
  duration: string
  thumbnail: string
  videoFormats: VideoFormat[]
  audioFormats: AudioFormat[]
}

interface DownloadProgress {
  progress: number
  size: string
}

interface ActiveDownload {
  title: string
  quality: string
  format: string
}

export default function Home() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [activeDownload, setActiveDownload] = useState<ActiveDownload | null>(null)
  const [controller, setController] = useState<AbortController | null>(null)

  useEffect(() => {
    const ws = io(API, {
      transports: ["websocket"],
    });

    ws.on("connect", () => {
      const sid = ws.id || "";
      console.log("WebSocket connected:", sid);
      localStorage.setItem("sid", sid);
    });

    ws.on("progressUpdate", (data) => {
      if (data.progress !== undefined && data.size !== undefined) {
        setDownloadProgress({
          progress: data.progress,
          size: data.size,
        });
      }
    });

    ws.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    return () => {
      ws.disconnect();
    };
  }, []);


  // Fetch video info when URL is submitted
  const fetchVideoInfo = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVideoInfo(null);

    try {
      const response = await fetch(`${API}/getinfo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch video information");
      }

      const result = await response.json();

      if (result.ok && result.data) {
        setVideoInfo(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch video information");
      }
    } catch (error) {
      console.error("Error fetching video info:", error);
      toast({
        title: "Error",
        description:
          "Failed to fetch video information. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download video function
  const downloadVideo = async (itag: number, quality: string, format: string, isAudioOnly = false) => {
    if (!url || !videoInfo) return

    const newController = new AbortController()
    setController(newController)

    setDownloading(true)
    setDownloadProgress({ progress: 0, size: "0MB" })
    setActiveDownload({
      title: videoInfo.title,
      quality,
      format: isAudioOnly ? "Audio" : "Video",
    })

    const sid = localStorage.getItem("sid") || ""

    try {
      // Simulate progress updates

      const response = await fetch(API + "/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, itag, isAudioOnly, sid }),
        signal: newController.signal,
      })

      // Handle the download response
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `${videoInfo.title || "download"}.${isAudioOnly ? "mp3" : "mp4"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      a.remove()
      
      setDownloadProgress({
        progress: 100,
        size: isAudioOnly
          ? videoInfo.audioFormats.find((f) => f.itag === itag)?.size || "0"
          : videoInfo.videoFormats.find((f) => f.itag === itag)?.size || "0",
      })

      toast({
        title: "Download Complete",
        description: "Your file has been downloaded successfully.",
      })

      // Reset download state after 3 seconds
      setTimeout(() => {
        setDownloading(false)
        setDownloadProgress(null)
        setActiveDownload(null)
      }, 3000)
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast({
          title: "Download Cancelled",
          description: "Download was cancelled by user.",
        })
      } else {
        console.error("Error downloading:", error)
        toast({
          title: "Download Failed",
          description: "There was an error downloading your file. Please try again.",
          variant: "destructive",
        })
      }

      setDownloading(false)
      setDownloadProgress(null)
      setActiveDownload(null)
    }
  }

  // Cancel download
  const cancelDownload = () => {
    if (controller) {
      controller.abort()
      setController(null)
    }
  }

  return (
    <main className="min-h-screen bg-primary-dark">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-teal mb-2">YouTube Downloader</h1>
          <p className="text-teal-dark">Download high-quality videos and audio from YouTube</p>
        </header>

        <div className="max-w-5xl mx-auto">
          {/* URL Input Card */}
          <Card className="bg-secondary-dark border-teal-dark shadow-lg mb-6">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Paste YouTube URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-primary-dark border-teal-dark text-white placeholder:text-gray-400 h-12 pr-10"
                    disabled={downloading}
                  />
                  <Link className="absolute right-3 top-3 text-teal-light" size={18} />
                </div>
                <Button
                  onClick={fetchVideoInfo}
                  disabled={isLoading || downloading || !url}
                  className="h-12 bg-teal hover:bg-teal-dark text-primary-dark border-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Video Info"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Download Status */}
          {downloading && downloadProgress && activeDownload && (
            <Card className="bg-secondary-dark border-teal-dark shadow-lg mb-6">
              <CardContent className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-teal">Downloading</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelDownload}
                    className="text-teal hover:text-white hover:bg-primary-dark"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {videoInfo?.thumbnail && (
                    <div className="relative aspect-video md:w-1/3 overflow-hidden rounded-lg">
                      <Image
                        src={videoInfo.thumbnail || "/placeholder.svg"}
                        alt={videoInfo.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=720&width=1280"
                        }}
                      />
                      <div className="absolute inset-0 bg-primary-dark/50 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 text-teal animate-spin" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-medium text-white truncate" title={activeDownload.title}>
                        {activeDownload.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-300 mt-1">
                        <span className="bg-teal-dark text-teal-light px-2 py-0.5 rounded mr-2">
                          {activeDownload.quality}
                        </span>
                        <span className="bg-teal-dark text-teal-light px-2 py-0.5 rounded">
                          {activeDownload.format}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Downloading...</span>
                        <span>{downloadProgress.size}</span>
                      </div>
                      <Progress value={downloadProgress.progress} className="h-2 bg-primary-dark" />
                      <div className="text-right text-sm text-gray-400">
                        {downloadProgress.progress}% Complete
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Info and Formats */}
          {videoInfo && !downloading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Info */}
              <Card className="bg-secondary-dark border-teal-dark shadow-lg lg:col-span-1">
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-xl font-semibold text-teal mb-4">Video Information</h2>

                  {videoInfo.thumbnail && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
                      <Image
                        src={videoInfo.thumbnail || "/placeholder.svg"}
                        alt={videoInfo.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=720&width=1280"
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-medium text-white line-clamp-2" title={videoInfo.title}>
                      {videoInfo.title}
                    </h3>

                    <div className="flex items-center text-sm text-gray-300">
                      <span className="bg-teal-dark px-2 py-1 rounded">Duration: {videoInfo.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formats */}
              <Card className="bg-secondary-dark border-teal-dark shadow-lg lg:col-span-2">
                <CardContent className="p-4 md:p-6">
                  <Tabs defaultValue="video">
                    <TabsList className="bg-primary-dark mb-4">
                      <TabsTrigger
                        value="video"
                        className="data-[state=active]:bg-teal data-[state=active]:text-primary-dark"
                      >
                        Video
                      </TabsTrigger>
                      <TabsTrigger
                        value="audio"
                        className="data-[state=active]:bg-teal-dark data-[state=active]:text-white"
                      >
                        Audio Only
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="video" className="mt-0">
                      <VideoFormats
                        formats={videoInfo.videoFormats}
                        onSelectFormat={(itag, quality) => downloadVideo(itag, quality, "Video")}
                        type="video"
                      />
                    </TabsContent>

                    <TabsContent value="audio" className="mt-0">
                      <VideoFormats
                        formats={videoInfo.audioFormats}
                        onSelectFormat={(itag, quality) => downloadVideo(itag, quality, "Audio", true)}
                        type="audio"
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!videoInfo && !isLoading && !downloading && (
            <Card className="bg-secondary-dark border-teal-dark shadow-lg">
              <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-teal-dark flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 md:h-10 md:w-10 text-teal" />
                </div>
                <h2 className="text-xl font-semibold text-teal mb-2">Ready to Download</h2>
                <p className="text-gray-400 max-w-md">
                  Enter a YouTube URL above and click "Get Video Info" to see available download options
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="bg-secondary-dark border-teal-dark shadow-lg">
              <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-teal animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-teal mb-2">Loading Video Information</h2>
                <p className="text-gray-400">Please wait while we fetch the available formats...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}

