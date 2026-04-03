// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/ModelViewer.jsx
//  Interactive 3D viewer for GLB/GLTF files
//  Uses Google's <model-viewer> web component (loaded in index.html)
// ══════════════════════════════════════════════════════
import { useRef, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Box } from 'lucide-react';

const SUPPORTED_3D = new Set(['glb', 'gltf']);
const SUPPORTED_IMG = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg']);
const SUPPORTED_VIDEO = new Set(['mp4', 'mov', 'webm']);

export default function ModelViewer({ fileUrl, fileType, title, previewUrl }) {
  const mvRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  const ext = (fileType || '').toLowerCase();
  const is3D    = SUPPORTED_3D.has(ext);
  const isImg   = SUPPORTED_IMG.has(ext);
  const isVideo = SUPPORTED_VIDEO.has(ext);

  const reset = () => { if (mvRef.current) { mvRef.current.cameraOrbit = '0deg 75deg 105%'; mvRef.current.fieldOfView = '45deg'; } };

  if (!fileUrl && !previewUrl) return null;

  return (
    <div className={`relative bg-black/60 rounded-2xl overflow-hidden border border-white/5 transition-all ${fullscreen ? 'fixed inset-4 z-[200]' : 'w-full aspect-video'}`}>
      {/* 3D GLB/GLTF */}
      {is3D && fileUrl ? (
        <>
          {/* @ts-ignore — model-viewer is a custom element */}
          <model-viewer
            ref={mvRef}
            src={fileUrl}
            alt={title || '3D Model'}
            camera-controls
            auto-rotate
            auto-rotate-delay="0"
            rotation-per-second="30deg"
            environment-image="neutral"
            shadow-intensity="1"
            exposure="0.8"
            style={{ width: '100%', height: '100%', minHeight: '240px', background: 'transparent' }}
          />
          {/* Controls */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <button onClick={reset} className="p-1.5 bg-black/60 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all" title="Reset view">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setFullscreen(f => !f)} className="p-1.5 bg-black/60 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all" title="Fullscreen">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg border border-sky-500/20">
            <Box className="w-3 h-3 text-sky-400" />
            <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">3D INTERACTIVE</span>
          </div>
        </>
      ) : isVideo && (fileUrl || previewUrl) ? (
        // Video preview
        <video
          src={fileUrl || previewUrl}
          controls
          loop
          className="w-full h-full object-contain"
          style={{ minHeight: '200px' }}
        />
      ) : isImg && (fileUrl || previewUrl) ? (
        // Image preview
        <img src={fileUrl || previewUrl} alt={title} className="w-full h-full object-contain" />
      ) : (
        // Generic file — show icon + download prompt
        <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Box className="w-7 h-7 text-sky-400" />
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-white">.{ext?.toUpperCase()} FILE</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Download to view in your CAD application</p>
          </div>
          {fileUrl && (
            <a href={`http://localhost:4000${fileUrl}`} download
              className="text-[10px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 transition-all">
              DOWNLOAD FILE
            </a>
          )}
        </div>
      )}

      {/* Fullscreen close */}
      {fullscreen && (
        <button onClick={() => setFullscreen(false)}
          className="absolute top-3 right-3 p-2 bg-black/80 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all text-xs font-bold">
          ✕ CLOSE
        </button>
      )}
    </div>
  );
}
