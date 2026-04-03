// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/PostCard.jsx
// ══════════════════════════════════════════════════════
import { useState } from 'react';
import { Zap, MessageSquare, Share2, FileCode, Download, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import API from '../api/client';

const TYPE_COLORS = {
  blog:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     label: 'BLOG' },
  spec:     { bg: 'bg-violet-500/10',  text: 'text-violet-400',  label: 'SPEC' },
  render:   { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '3D RENDER' },
  fieldlog: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   label: 'FIELD LOG' },
};

export default function PostCard({ post, onReact, onDelete, onEdit }) {
  const { user, setChatTarget } = useAuth();
  const { push } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState(post.comments || []);
  const [newComment, setNewComment]     = useState('');
  const [reactions, setReactions]       = useState(post.reaction_count || 0);
  const [isLiked, setIsLiked]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const tc = TYPE_COLORS[post.type] || TYPE_COLORS.blog;
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `Uploaded on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute:'2-digit' })}`;
  };

  const handleReact = async () => {
    if (!user) return push('Login to react', 'warn');
    try {
      const { data } = await API.post(`/posts/${post.id}/react`);
      setReactions(data.reactions);
      setIsLiked(prev => !prev);
    } catch { push('Failed to react', 'error'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await API.post(`/posts/${post.id}/comment`, { body: newComment });
      setComments(c => [...c, data]);
      setNewComment('');
    } catch { push('Failed to post comment', 'error'); }
    finally { setSubmitting(false); }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const { data } = await API.get(`/posts/${post.id}`);
        setComments(data.comments || []);
      } catch {}
    }
    setShowComments(v => !v);
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:border-white/10 transition-all slide-up">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-black text-sm flex-shrink-0">
          {(post.author_name || 'F')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <button onClick={() => setChatTarget({ id: post.author_id, name: post.author_name })}
            className="text-xs font-black text-white hover:text-sky-400 uppercase tracking-tight truncate transition-colors text-left">
            {post.author_name}
          </button>
          <p className="text-[9px] text-slate-600 font-mono">{post.author_node} · {formatTime(post.created_at)}</p>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${tc.bg} ${tc.text} tracking-widest`}>
          {tc.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <h3 className="text-sky-300 font-bold text-sm mb-2 leading-snug">{post.title}</h3>
        <div className="mt-3 text-xs leading-relaxed text-slate-300 break-words whitespace-pre-wrap">
          {post.body}
        </div>
        
        {post.mentions && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.mentions.split(',').map(m => m.trim()).filter(Boolean).map((mention, i) => (
              <span key={i} className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]">
                {mention.startsWith('@') ? mention : `@${mention}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image / Content Attachment */}
      {post.file_url && ['png', 'jpg', 'jpeg', 'webp'].includes(post.file_type) && (
        <div className="px-4 pb-3">
          <img src={post.file_url} alt="Attachment" loading="lazy" className="w-full rounded-xl border border-white/5 object-cover max-h-96" />
        </div>
      )}

      {/* File attachment */}
      {post.file_name && !['png', 'jpg', 'jpeg', 'webp'].includes(post.file_type) && (
        <div className="mx-4 mb-3 flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl hover:border-sky-500/30 transition-all group">
          <FileCode className="text-sky-500 w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-200 uppercase truncate">{post.file_name}</p>
            <p className="text-[9px] text-slate-600 uppercase">.{post.file_type} · design file</p>
          </div>
          <a download={post.file_name} href={post.file_url} rel="noopener noreferrer" className="text-[9px] bg-sky-500/20 text-sky-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 group-hover:bg-sky-500/30 transition-all cursor-pointer">
            <Download className="w-3 h-3" />DOWNLOAD
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-1 border-t border-white/5 pt-3">
        <button onClick={handleReact}
          className={`flex items-center gap-1.5 text-[10px] font-bold transition-all px-3 py-1.5 rounded-lg
            ${isLiked ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20' : 'text-slate-500 hover:text-sky-400 bg-white/3 hover:bg-sky-500/10'}`}>
          <Zap className="w-3.5 h-3.5" />{reactions || 0}
        </button>
        <button onClick={loadComments}
          className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all
            ${showComments ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500 hover:text-sky-400 hover:bg-sky-500/10'}`}>
          <MessageSquare className="w-3.5 h-3.5" />
          {post.comment_count || comments.length} {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        
        <div className="ml-auto flex items-center gap-1">
          {onEdit && (
             <button onClick={onEdit}
               className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-amber-400 hover:bg-amber-500/5 px-3 py-1.5 rounded-lg transition-all" title="Edit Post">
               EDIT
             </button>
          )}
          {onDelete && (
             <button onClick={onDelete}
               className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 px-3 py-1.5 rounded-lg transition-all" title="Delete Post">
               DEL
             </button>
          )}
          {user && post.author_id !== user.id && (
            <button onClick={async () => {
              const details = window.prompt("Would you like to report this post/user? (Briefly explain)");
              if (!details) return;
              try {
                await API.post('/reports', { reported_uid: post.author_id, reason: 'offensive_post', details });
                push('Report filed for admin review', 'success');
              } catch(e) { push('Failed to file report', 'error'); }
            }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 px-3 py-1.5 rounded-lg transition-all" title="Report Abuse">
              FLAG
            </button>
          )}
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); push('Link copied!', 'success'); }}
            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">
            <Share2 className="w-3.5 h-3.5" />SHARE
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-white/5 bg-black/20 px-4 pt-3 pb-4 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-[9px] font-black text-sky-400 flex-shrink-0">
                {(c.author_name || 'F')[0]}
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">{c.author_name}</p>
                <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{c.body}</p>
              </div>
            </div>
          ))}
          {user && (
            <form onSubmit={handleComment} className="flex gap-2 pt-1">
              <input value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..." disabled={submitting}
                className="flex-1 bg-black/40 border border-white/5 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-700 outline-none focus:border-sky-500/50 transition-all" />
              <button type="submit" disabled={submitting || !newComment.trim()}
                className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition-all">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
