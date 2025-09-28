import React, { useEffect, useState, useRef } from "react";
import { Box } from "@chakra-ui/react";

interface VideoResponse {
  videos: string[];
}

const VideoFeed: React.FC = () => {
  const [videos, setVideos] = useState<string[]>([]);
  const videoRefs = useRef<HTMLVideoElement[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/videos")
      .then((res) => res.json())
      .then((data: VideoResponse) => setVideos(data.videos));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play();
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [videos]);

  return (
    <Box
      overflowY="scroll"
      height="100vh"
      scrollSnapType="y mandatory"
      css={{ "&::-webkit-scrollbar": { display: "none" } }}
    >
      {videos.map((src, i) => (
        <video
          key={i}
          ref={(el) => (videoRefs.current[i] = el!)}
          src={`http://localhost:8000${src}`}
          style={{ width: "100%", height: "100vh", objectFit: "cover", scrollSnapAlign: "start" }}
          loop
          muted
          playsInline
          preload="auto"
        />
      ))}
    </Box>
  );
};

export default VideoFeed;
