'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const LS_KEY = 'qd4_music_v1';

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

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}

function ensureYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-yt-api]');
    if (existing) {
      const start = Date.now();
      const t = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(t);
          resolve();
        } else if (Date.now() - start > 15000) {
          clearInterval(t);
          reject(new Error('YT API timeout'));
        }
      }, 100);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.dataset.ytApi = '1';

    window.onYouTubeIframeAPIReady = () => resolve();
    tag.onerror = () => reject(new Error('YT API failed'));
    document.body.appendChild(tag);
  });
}

export default function MusicPlayer({ enabled }) {
  const categories = useMemo(() => Object.keys(PRESETS), []);
  const persisted = useMemo(() => loadState(), []);

  const [open, setOpen] = useState(persisted?.open ?? true);
  const [category, setCategory] = useState(persisted?.category ?? categories[0]);
  const [index, setIndex] = useState(persisted?.index ?? 0);
  const [volume, setVolume] = useState(persisted?.volume ?? 40);
  const [playing, setPlaying] = useState(false);

  const playerRef = useRef(null);
  const containerId = useRef(`yt_${Math.random().toString(36).slice(2)}`).current;

  const tracks = PRESETS[category] || [];
  const current = tracks[index] || tracks[0];

  useEffect(() => {
    if (!enabled) return;
    saveState({ open, category, index, volume });
  }, [enabled, open, category, index, volume]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        await ensureYouTubeApi();
        if (cancelled || playerRef.current) return;

        playerRef.current = new window.YT.Player(containerId, {
          height: '0',
          width: '0',
          videoId: current?.videoId,
          playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e) => {
              try { e.target.setVolume(volume); } catch {}
            },
            onStateChange: (e) => {
              if (e.data === 1) setPlaying(true);
              else if (e.data === 2) setPlaying(false);
              else if (e.data === 0) {
                setPlaying(false);
                setIndex((i) => (i + 1) % tracks.length);
              }
            }
          }
        });
      } catch {}
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !playerRef.current || !current?.videoId) return;
    try {
      playerRef.current.cueVideoById(current.videoId);
      playerRef.current.setVolume(volume);
      setPlaying(false);
    } catch {}
  }, [enabled, category, index]);

  useEffect(() => {
    if (!enabled || !playerRef.current) return;
    try { playerRef.current.setVolume(volume); } catch {}
  }, [enabled, volume]);

  if (!enabled) return null;

  const toggle = () => {
    if (!playerRef.current) return;
    try {
      if (playing) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    } catch {}
  };

  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-[1100]">
        <button className="glass-card px-4 py-3" onClick={() => setOpen(true)}>
          <span className="text-sm font-mono">Music</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[1100] w-[360px]">
      <div className="glass-card p-4">
        <div id={containerId} />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider small-muted">Now playing</div>
            <div className="text-sm font-semibold truncate">{current?.title || '—'}</div>
            <div className="text-xs small-muted truncate">{category}</div>
          </div>
          <button className="text-xs small-muted hover:text-white" onClick={() => setOpen(false)}>Hide</button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button className="px-3 py-2 rounded border border-white/10 hover:border-[rgba(0,240,255,0.35)]" onClick={() => setIndex((i) => (i - 1 + tracks.length) % tracks.length)}>Prev</button>
          <button className="cyber-button px-5 py-2" onClick={toggle}>{playing ? 'Pause' : 'Play'}</button>
          <button className="px-3 py-2 rounded border border-white/10 hover:border-[rgba(0,240,255,0.35)]" onClick={() => setIndex((i) => (i + 1) % tracks.length)}>Next</button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs small-muted">Vol</span>
            <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(parseInt(e.target.value, 10))} className="w-[110px]" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setIndex(0); }}
              className={`px-3 py-1 rounded text-xs border transition-colors ${c === category ? 'border-[rgba(0,240,255,0.6)] bg-[rgba(0,240,255,0.10)]' : 'border-white/10 small-muted hover:text-white hover:border-[rgba(0,240,255,0.35)]'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-2 text-[11px] small-muted">Click Play to start (browsers block autoplay).</div>
      </div>
    </div>
  );
}
