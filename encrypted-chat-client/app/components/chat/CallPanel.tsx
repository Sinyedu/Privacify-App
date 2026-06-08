"use client";

import { useEffect, useRef } from "react";

type VideoTileProps = {
  label: string;
  muted?: boolean;
  stream: MediaStream | null;
};

function VideoTile({ label, muted = false, stream }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="min-h-48 bg-neutral-950 text-white overflow-hidden rounded">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-48 w-full object-cover bg-neutral-900"
      />
      <div className="px-3 py-2 text-xs text-neutral-300">{label}</div>
    </div>
  );
}

type CallPanelProps = {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peerCount: number;
  error: string | null;
  onEndCall: () => void;
};

export default function CallPanel({
  localStream,
  remoteStreams,
  peerCount,
  error,
  onEndCall,
}: CallPanelProps) {
  const remoteEntries = Array.from(remoteStreams.entries());

  return (
    <div className="border-b border-neutral-800 p-3 bg-neutral-950 text-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold">Private call</h2>
          <span className="text-xs text-neutral-400">Peers: {peerCount}</span>
        </div>
        <button
          onClick={onEndCall}
          className="px-3 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-500"
        >
          End call
        </button>
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <VideoTile label="You" stream={localStream} muted />

        {remoteEntries.length === 0 && (
          <div className="h-48 flex items-center justify-center rounded border border-dashed text-sm text-neutral-500">
            Waiting for the other person...
          </div>
        )}

        {remoteEntries.map(([peerId, stream]) => (
          <VideoTile key={peerId} label="Remote caller" stream={stream} />
        ))}
      </div>
    </div>
  );
}
