import { useRef, useState, type MouseEvent } from "react";
import { Pause, Play } from "lucide-react";

export default function PropertyVideoPreview({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);

  const togglePlayback = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  return (
    <div
      className="group relative h-full w-full overflow-hidden bg-black"
      onClick={togglePlayback}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        aria-label={label}
        loop
        muted
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        title={playing ? "Pause video" : "Play video"}
        onClick={togglePlayback}
        className={`absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-md transition-opacity focus-visible:opacity-100 ${playing && !hovered ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
      </button>
    </div>
  );
}