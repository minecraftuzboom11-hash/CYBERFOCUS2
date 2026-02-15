import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Volume2, Music2 } from 'lucide-react';

const LS_KEY = 'levelup_music_player_v1';

const PRESETS = {
  'Lo-fi': [
    { title: 'lofi hip hop radio', videoId: 'jfKfPfyJRdk' },
    { title: 'lofi beats', videoId: '5qap5aO4i9A' }
  ],
  'Ambient': [
    { title: 'ambient music', videoId: 'hHW1oY26kxQ' },
    { title: 'space ambience', videoId: 'qPr47vR9k7o' }
  ],
  'Synthwave': [
    { title: 'synthwave radio', videoId: '4xDzrJKXOOY' },
    { title: 'retrowave', videoId: 'MVPTGNGiI-4' }
  ],
  'Rain': [
    { title: 'rain sounds', videoId: 'mPZkdNFkNps' },
    { title: 'rain on window', videoId: 'yIQd2Ya0Ziw' }
  ],
  'White noise': [
    { title: 'white noise', videoId: 'nMfPqeZjc2c' },
    { title: 'brown noise', videoId: 'RqzGzwTY-6w' }
  ],
  'Piano': [
    { title: 'piano for studying', videoId: 'lCOF9LN_Zxs' },
    { title: 'relaxing piano', videoId: 'TzfnlPxCZv0' }
  ],
  'Nature': [
    { title: 'forest ambience', videoId: 'OdIJ2x3nxzQ' },
    { title: 'ocean waves', videoId: 'V-_O7nl0Ii0' }
  ],
  'Binaural focus': [
    { title: 'binaural beats focus', videoId: 'wp6oSVDdbXQ' },
    { title: 'focus binaural', videoId: 'zPyg4N7bcHM' }
  ]
};

function loadPersisted() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persist(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function ensureYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-youtube-iframe-api]');
    if (existing) {
      const start = Date.now();
      const t = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(t);
          resolve();
        } else if (Date.now() - start > 15000) {
          clearInterval(t);
          reject(new Error('YouTube IFrame API load timeout'));
        }
      }, 100);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.dataset.youtubeIframeApi = '1';

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve();
    };

    tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
    document.body.appendChild(tag);
  });
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function MusicPlayer() {
  const categories = useMemo(() => Object.keys(PRESETS), []);

  const persisted = useMemo(() => loadPersisted(), []);
  const [open, setOpen] = useState(persisted?.open ?? true);
  const [category, setCategory] = useState(persisted?.category ?? categories[0]);
  const [index, setIndex] = useState(persisted?.index ?? 0);
  const [volume, setVolume] = useState(clamp(persisted?.volume ?? 40, 0, 100));
  const [playing, setPlaying] = useState(false);

  const playerRef = useRef(null);
  const mountRef = useRef(false);
  const containerId = useRef(`yt_player_${Math.random().toString(36).slice(2)}`).current;

  const tracks = PRESETS[category] || [];
  const current = tracks[index] || tracks[0];

  useEffect(() => {
    if (!mountRef.current) {
      mountRef.current = true;
      return;
    }
    persist({ open, category, index, volume });
  }, [open, category, index, volume]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await ensureYouTubeApi();
        if (cancelled) return;

        if (playerRef.current) return;

        playerRef.current = new window.YT.Player(containerId, {
          height: '0',
          width: '0',
          videoId: current?.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1
          },
          events: {
            onReady: (e) => {
              try {
                e.target.setVolume(volume);
              } catch {
                // ignore
              }
            },
            onStateChange: (e) => {
              // 1 = playing, 2 = paused, 0 = ended
              if (e.data === 1) setPlaying(true);
              else if (e.data === 2) setPlaying(false);
              else if (e.data === 0) {
                setPlaying(false);
                // advance to next track safely
                setIndex((prevIndex) => {
                  const list = PRESETS[category] || [];
                  if (!list.length) return prevIndex;
                  return (prevIndex + 1) % list.length;
                });
              }
            }
          }
        });
      } catch {
        // ignore init failure
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [containerId, category, volume]);

  useEffect(() => {
    if (!playerRef.current || !current?.videoId) return;
    try {
      // Don’t autoplay on category/track change.
      playerRef.current.cueVideoById(current.videoId);
      playerRef.current.setVolume(volume);
      setPlaying(false);
    } catch {
      // ignore
    }
  }, [current?.videoId, volume]);

  useEffect(() => {
    if (!playerRef.current) return;
    try {
      playerRef.current.setVolume(volume);
    } catch {
      // ignore
    }
  }, [volume]);

  const toggle = () => {
    if (!playerRef.current) return;
    try {
      if (playing) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch {
      // ignore
    }
  };

  const prev = () => {
    const newIndex = (index - 1 + tracks.length) % tracks.length;
    setIndex(newIndex);
  };

  const next = () => {
    if (!tracks.length) return;
    const newIndex = (index + 1) % tracks.length;
    setIndex(newIndex);
  };

  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-[1100]">
        <button
          type="button"
          className="glass-card px-4 py-3 text-white flex items-center gap-2 hover:border-[#00F0FF]/50"
          onClick={() => setOpen(true)}
          aria-label="Open music player"
        >
          <Music2 className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-sm font-mono uppercase tracking-wider">Music</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[1100] w-[360px]">
      <div className="glass-card p-4">
        {/* Hidden YT player mount */}
        <div id={containerId} />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">Now playing</div>
            <div className="text-sm text-white font-semibold truncate">{current?.title || '—'}</div>
            <div className="text-xs text-[#94A3B8] truncate">{category}</div>
          </div>

          <button
            type="button"
            className="text-xs text-[#94A3B8] hover:text-white"
            onClick={() => setOpen(false)}
          >
            Hide
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={prev} className="p-2 rounded hover:bg-white/5" aria-label="Previous track">
            <SkipBack className="w-4 h-4 text-white" />
          </button>

          <button
            type="button"
            onClick={toggle}
            className="cyber-button px-5 py-2 flex items-center gap-2"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-xs">{playing ? 'Pause' : 'Play'}</span>
          </button>

          <button type="button" onClick={next} className="p-2 rounded hover:bg-white/5" aria-label="Next track">
            <SkipForward className="w-4 h-4 text-white" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="w-[110px]"
              aria-label="Volume"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setIndex(0);
              }}
              className={`px-3 py-1 rounded text-xs border transition-colors ${
                c === category
                  ? 'border-[#00F0FF]/60 text-white bg-[#00F0FF]/10'
                  : 'border-white/10 text-[#94A3B8] hover:text-white hover:border-[#00F0FF]/30'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-2 text-[11px] text-[#94A3B8]">
          Tip: Click <span className="text-white">Play</span> to start (autoplay is blocked by browsers).
        </div>
      </div>
    </div>
  );
}
