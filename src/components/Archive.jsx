// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/Archive.jsx
// ══════════════════════════════════════════════════════
export default function Archive({ youtubeId, title }) {
  if (!youtubeId) return null;
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title || "YouTube video"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
