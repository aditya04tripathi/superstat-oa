"use client"

import React from "react"

interface VideoPlayerProps {
  url: string
  playerRef: React.RefObject<HTMLVideoElement>
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, playerRef }) => {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <video
        ref={playerRef as React.RefObject<HTMLVideoElement>}
        className="aspect-video w-full"
        src={url}
        controls={true}
      />
    </div>
  )
}

export default VideoPlayer
