"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check, Upload, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type ScannerState = "idle" | "streaming" | "captured" | "processing";

export default function MobileScanner({ onCapture, onClose }: MobileScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [zoom, setZoom] = useState(1);

  const startCamera = useCallback(async (mode: "environment" | "user" = "environment") => {
    setError(null);
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("streaming");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not start camera: " + (err.message || "Unknown error"));
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      // Clean up stream on unmount
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply a subtle auto-contrast filter to improve document readability
    applyDocumentFilter(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);
    setState("captured");

    // Stop the camera stream after capture
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  /**
   * Basic document filter: increases contrast and slightly desaturates.
   * For production, a proper edge-detection algorithm (Canny) would be used.
   */
  function applyDocumentFilter(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert to grayscale luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Sharpen: boost contrast around mid-tone (document whites/blacks)
      const contrast = 1.3;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      const adj = factor * (lum - 128) + 128;
      const clamped = Math.min(255, Math.max(0, adj));

      data[i] = clamped;
      data[i + 1] = clamped;
      data[i + 2] = clamped;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const retake = useCallback(() => {
    setCapturedDataUrl(null);
    setState("idle");
    startCamera(facingMode);
  }, [facingMode, startCamera]);

  const flipCamera = useCallback(() => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  const confirmCapture = useCallback(async () => {
    if (!canvasRef.current) return;
    setState("processing");

    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to process image.");
          setState("captured");
          return;
        }
        const filename = `scan_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top py-3 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-white font-semibold text-sm">Document Scanner</span>
        <button
          onClick={flipCamera}
          disabled={state !== "streaming"}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-40"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {/* Live camera */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${state === "captured" ? "hidden" : ""}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        />

        {/* Captured image preview */}
        {capturedDataUrl && (
          <img
            src={capturedDataUrl}
            alt="Captured document"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Document guide overlay (only during streaming) */}
        {state === "streaming" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="border-2 border-white/60 rounded-lg"
              style={{ width: "85%", height: "65%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }}
            >
              {/* Corner marks */}
              {[
                "top-0 left-0 border-t-2 border-l-2",
                "top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2",
                "bottom-0 right-0 border-b-2 border-r-2",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-5 h-5 border-white ${cls}`} />
              ))}
            </div>
            <p className="absolute bottom-[22%] text-white/70 text-xs font-medium">
              Align document within the frame
            </p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center space-y-4">
            <Camera className="h-12 w-12 text-white/40" />
            <p className="text-white text-sm leading-relaxed">{error}</p>
            <Button variant="outline" onClick={() => startCamera(facingMode)} size="sm">
              Try Again
            </Button>
          </div>
        )}

        {/* Processing overlay */}
        {state === "processing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
            <p className="text-white text-sm mt-3">Processing document...</p>
          </div>
        )}
      </div>

      {/* Zoom controls (during streaming) */}
      {state === "streaming" && (
        <div className="flex items-center justify-center gap-4 py-3 bg-black/80">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            className="p-2 text-white/70 hover:text-white"
            disabled={zoom <= 1}
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-white/60 text-xs font-mono min-w-[3rem] text-center">
            {zoom.toFixed(2)}×
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-2 text-white/70 hover:text-white"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-8 px-6 py-6 bg-black/90 pb-safe-bottom">
        {state === "streaming" && (
          <button
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full bg-white border-4 border-white/30 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Camera className="h-6 w-6 text-black" />
          </button>
        )}

        {state === "captured" && (
          <>
            <button
              onClick={retake}
              className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="text-[10px]">Retake</span>
            </button>

            <button
              onClick={confirmCapture}
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Check className="h-8 w-8 text-white" />
            </button>

            <button
              onClick={confirmCapture}
              className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
            >
              <Upload className="h-6 w-6" />
              <span className="text-[10px]">Upload</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
