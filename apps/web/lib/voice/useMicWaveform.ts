"use client";

import { useCallback, useRef, useState } from "react";

const BAR_COUNT = 24;

interface UseMicWaveformResult {
  levels: number[];
  permission: "idle" | "granted" | "denied";
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Captures real microphone amplitude via the Web Audio API and exposes it
 * as a rolling array of normalized levels (0-1) for a genuine waveform —
 * not a decorative CSS animation.
 */
export function useMicWaveform(): UseMicWaveformResult {
  const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(0));
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermission("granted");

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const step = Math.floor(data.length / BAR_COUNT);
        const next = Array.from({ length: BAR_COUNT }, (_, i) => {
          const slice = data.slice(i * step, (i + 1) * step);
          const avg = slice.reduce((sum, v) => sum + v, 0) / (slice.length || 1);
          return Math.min(1, avg / 160);
        });
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setPermission("denied");
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    setLevels(Array(BAR_COUNT).fill(0));
  }, []);

  return { levels, permission, start, stop };
}
