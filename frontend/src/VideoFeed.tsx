// src/VideoFeed.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, Flex, Spinner, Text, VStack, IconButton, Tag } from "@chakra-ui/react";
import { FaDownload, FaShareAlt, FaCrop } from "react-icons/fa";

interface VideoResponse { videos: string[] }

// Tunables
const BATCH_SIZE = 10;   // N: how many to fetch per request
const FETCH_AHEAD = 3;   // X: when remaining items <= X, fetch next batch

const SERVER_HOST = process.env.REACT_APP_SERVER_HOST || null;
if (!SERVER_HOST) throw new Error("REACT_APP_SERVER_HOST is not defined");

const getMediaType = (src: string) => {
  const ext = src.split(".").pop()?.toLowerCase();
  if (!ext) return "image";
  if (["mp4", "webm", "ogg"].includes(ext)) return "video";
  if (["gif"].includes(ext)) return "gif";
  return "image";
};

const VideoFeed: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLVideoElement | HTMLImageElement | null)[]>([]);

  const fetchMedia = useCallback(async () => {
    const res = await fetch(`${SERVER_HOST}/api/videos?limit=${BATCH_SIZE}`);
    const data: VideoResponse = await res.json();
    setMediaFiles((prev) => [...prev, ...data.videos]);
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Play/pause only with a simple observer on visible items
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLVideoElement | HTMLImageElement;
          if (el.tagName === "VIDEO") {
            const v = el as HTMLVideoElement;
            if (entry.isIntersecting) v.play();
            else v.pause();
          }
        }
      },
      { threshold: 0.6 }
    );
    itemRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [mediaFiles.length]);

  // Single sentinel to fetch when near end
  useEffect(() => {
    if (!sentinelRef.current) return;
    const endObserver = new IntersectionObserver((entries) => {
      const hit = entries.some((e) => e.isIntersecting);
      if (!hit) return;
      // Only fetch if within FETCH_AHEAD from the end
      const remaining = 0; // because sentinel is placed after last item
      if (remaining <= FETCH_AHEAD) fetchMedia();
    });
    endObserver.observe(sentinelRef.current);
    return () => endObserver.disconnect();
  }, [fetchMedia, mediaFiles.length]);

  const downloadMedia = (src: string) => {
    const link = document.createElement("a");
    link.href = `${SERVER_HOST}${src}`;
    link.download = src.split("/").pop() || "file";
    link.click();
  };

  const shareMedia = async (src: string) => {
    if (navigator.canShare && navigator.canShare({ files: [] })) {
      try {
        const response = await fetch(`${SERVER_HOST}${src}`);
        const blob = await response.blob();
        const file = new File([blob], src.split("/").pop() || "file", { type: blob.type });
        await navigator.share({ files: [file] });
      } catch {
        downloadMedia(src);
      }
    } else downloadMedia(src);
  };

  return (
    <Box
      height="100dvh"
      width="100%"
      overflowY="auto"
      overflowX="hidden"
      scrollSnapType="y mandatory"
      css={{
        "&::-webkit-scrollbar": { display: "none" },
        height: "100dvh",
        "@supports (height: 100svh)": { height: "100svh" },
      }}
      style={{ overscrollBehaviorX: "contain" }}
      position="relative"
      bg="black"
    >
      {/* Header */}
      <Flex
        position="fixed"
        top={0}
        left={0}
        width="100%"
        height={`calc(50px + env(safe-area-inset-top))`}
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
        bg="transparent"
        paddingTop="env(safe-area-inset-top)"
        pointerEvents="none"
      >
        <Text
          fontSize="2xl"
          fontWeight="extrabold"
          bgGradient="linear(to-r, purple.400, pink.400)"
          bgClip="text"
          fontFamily="'Poppins', sans-serif"
        >
          TikVid
        </Text>
      </Flex>

      {/* Splash */}
      {loading && (
        <Flex
          height="100dvh"
          width="100%"
          alignItems="center"
          justifyContent="center"
          bg="black"
          position="fixed"
          top={0}
          left={0}
          zIndex={1000}
          css={{ height: "100dvh", "@supports (height: 100svh)": { height: "100svh" } }}
        >
          <Spinner size="xl" color="white" />
        </Flex>
      )}

      {mediaFiles.map((src, i) => {
        const type = getMediaType(src);
        const filename = src.split("/").pop()?.split(".")[0] || "";

        return (
          <Box
            key={`${src}-${i}`}
            height="100dvh"
            width="100%"
            position="relative"
            scrollSnapAlign="start"
            css={{
              height: "100dvh",
              "@supports (height: 100svh)": { height: "100svh" },
            }}
          >
            {type === "video" ? (
              <video
                ref={(el) => (itemRefs.current[i] = el)}
                src={`${SERVER_HOST}${src}`}
                style={{ width: "100%", height: "100%", objectFit: fitMode }}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => { if (i === 0) setLoading(false); }}
                onError={() => { /* optionally handle video load errors */ }}
              />
            ) : type === "gif" ? (
              <img
                ref={(el) => (itemRefs.current[i] = el)}
                src={`${SERVER_HOST}${src}`}
                alt={filename}
                style={{ width: "100%", height: "100%", objectFit: fitMode }}
                onLoad={() => { if (i === 0) setLoading(false); }}
                onError={() => { /* optionally handle gif load errors */ }}
              />
            ) : (
              <img
                ref={(el) => (itemRefs.current[i] = el)}
                src={`${SERVER_HOST}${src}`}
                alt={filename}
                style={{ width: "100%", height: "100%", objectFit: fitMode }}
                onLoad={() => { if (i === 0) setLoading(false); }}
              />
            )}

            <Text
              position="absolute"
              top="60px"
              left="50%"
              transform="translateX(-50%)"
              color="whiteAlpha.800"
              fontSize="sm"
              opacity={1}
              animation="fadeOut 2s forwards"
              style={{ pointerEvents: "none" }}
            >
              {filename}
            </Text>

            <Tag
              position="absolute"
              bottom={`calc(10px + env(safe-area-inset-bottom))`}
              left="10px"
              size="sm"
              variant="subtle"
              colorScheme="whiteAlpha"
            >
              {type}
            </Tag>

            <VStack
              position="absolute"
              bottom={`calc(80px + env(safe-area-inset-bottom))`}
              right="20px"
              spacing={2}
            >
              <IconButton
                aria-label="Toggle Crop"
                icon={<FaCrop />}
                variant="outline"
                colorScheme="purple"
                size="sm"
                onClick={() => setFitMode((p) => (p === "cover" ? "contain" : "cover"))}
              />
              <IconButton
                aria-label="Download"
                icon={<FaDownload />}
                variant="outline"
                colorScheme="blue"
                size="sm"
                onClick={() => downloadMedia(src)}
              />
              <IconButton
                aria-label="Share"
                icon={<FaShareAlt />}
                variant="outline"
                colorScheme="green"
                size="sm"
                onClick={() => shareMedia(src)}
              />
            </VStack>
          </Box>
        );
      })}

      {/* Sentinel for infinite load */}
      <Box ref={sentinelRef} height="1px" />

    </Box>
  );
};

export default VideoFeed;
