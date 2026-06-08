"use client";

import { useEffect, useState } from "react";

type CallMediaState = {
  localStream: MediaStream | null;
  error: string | null;
};

export function useCallMedia(enabled: boolean): CallMediaState {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setLocalStream(stream);
        setError(null);
      } catch (err) {
        console.error("[webrtc] media failed:", err);
        setError("Camera or microphone permission was denied");
      }
    }

    void startMedia();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    };
  }, [enabled]);

  return {
    localStream: enabled ? localStream : null,
    error: enabled ? error : null,
  };
}
