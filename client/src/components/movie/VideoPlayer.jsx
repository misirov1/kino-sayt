import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, RotateCcw, PictureInPicture, AlertCircle, RefreshCw
} from 'lucide-react';

function sanitizeVideoSrc(url) {
  if (!url || typeof url !== 'string') return '';
  return url;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  onPlay,
  onPause,
  onSeek,
  onEnded,
  onRateChange,
  isSynced = false,
  externalIsPlaying = null,
  externalTime = null,
  isFullscreen = false,
  onToggleFullscreen
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);

  const [currentSrc, setCurrentSrc] = useState(() => sanitizeVideoSrc(src));
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('1080p');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const controlsTimeoutRef = useRef(null);

  // Update src when prop changes
  useEffect(() => {
    setCurrentSrc(sanitizeVideoSrc(src));
    setHasError(false);
  }, [src]);

  // Sync external play/pause from virtual room socket
  useEffect(() => {
    if (externalIsPlaying !== null && videoRef.current) {
      if (externalIsPlaying && videoRef.current.paused) {
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      } else if (!externalIsPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [externalIsPlaying]);

  // Sync external seek time from virtual room socket (with small jitter threshold)
  useEffect(() => {
    if (externalTime !== null && videoRef.current) {
      const diff = Math.abs(videoRef.current.currentTime - externalTime);
      if (diff > 1.5) {
        videoRef.current.currentTime = externalTime;
        setCurrentTime(externalTime);
      }
    }
  }, [externalTime]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
          if (onPlay) onPlay(videoRef.current.currentTime);
        }).catch((err) => {
          console.warn('Play error:', err);
          setIsPlaying(false);
        });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause(videoRef.current.currentTime);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const changeRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    if (onRateChange) onRateChange(rate);
    setIsSettingsOpen(false);
  };

  const togglePiP = async (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVideoError = () => {
    setHasError(true);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full h-full bg-black group select-none overflow-hidden rounded-xl"
    >
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        onClick={togglePlay}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Fallback Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 z-40 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 shadow-lg">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white mb-1.5">
            Video oqimini yuklab bo‘lmadi
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
            Video fayli topilmadi yoki format mos kelmadi.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-xl shadow-red-950/60 transition-transform active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Qayta urinish</span>
          </button>
        </div>
      )}

      {/* Sync Badge */}
      {isSynced && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-zinc-700/60 text-xs text-zinc-300 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-semibold">Sinxron jonli efir</span>
        </div>
      )}

      {/* Center Big Play overlay icon on pause */}
      {!isPlaying && !hasError && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer z-10"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Video Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="relative w-full h-2 bg-zinc-800/80 hover:h-3 rounded-full cursor-pointer transition-all mb-3 group/progress overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full relative"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
          
          {/* Left: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-red-500 transition-colors"
              title={isPlaying ? 'Pauza' : 'Ijro'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="p-1 hover:text-red-500 transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 accent-red-600 h-1 bg-zinc-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-zinc-300 font-mono text-xs">
              <span>{formatTime(currentTime)}</span>
              <span className="text-zinc-500 mx-1">/</span>
              <span className="text-zinc-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Rate, Quality, PiP, Fullscreen */}
          <div className="flex items-center gap-2">
            
            {/* Speed / Rate Setting */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-1.5 hover:text-amber-400 transition-colors flex items-center gap-1 text-xs font-semibold px-2 rounded-lg bg-zinc-800/60"
              >
                <span>{playbackRate}x</span>
                <Settings className="w-3.5 h-3.5" />
              </button>

              {isSettingsOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-40 text-xs">
                  <p className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800">
                    Tezlik
                  </p>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                    <button
                      key={r}
                      onClick={() => changeRate(r)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-between ${
                        playbackRate === r ? 'text-red-500 font-bold' : 'text-zinc-300'
                      }`}
                    >
                      <span>{r === 1 ? 'Standart (1x)' : `${r}x`}</span>
                      {playbackRate === r && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality badge */}
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] font-bold text-amber-400 border border-zinc-700/60 hidden sm:inline">
              {quality}
            </span>

            {/* PiP */}
            <button
              onClick={togglePiP}
              title="Kichik oyna (PiP)"
              className="p-1.5 hover:text-red-400 transition-colors hidden sm:block"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Ekranni kichraytirish' : 'Butun ekranga ochish'}
              className="p-1.5 hover:text-red-500 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
