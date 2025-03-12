import type React from "react"
import type { Metadata } from "next"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: "YouTube Downloader",
  description: "Download YouTube videos with high quality",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}



import './globals.css'