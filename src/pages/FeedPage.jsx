// ══════════════════════════════════════════════════════
//  FABER.NET · src/pages/FeedPage.jsx
// ══════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { PlusSquare, Filter, RefreshCw } from 'lucide-react';
import Stories from '../components/Stories';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { useToast } from '../components/Toast';
import API from '../api/client';

const TABS = [
  { value: 'all',      label: 'ALL' },
  { value: 'blog',     label: 'BLOG' },
  { value: 'spec',     label: 'SPEC' },
  { value: 'render',   label: 'RENDER' },
  { value: 'fieldlog', label: 'FIELD' },
  { value: 'my_posts', label: 'YOUR POSTS' },
];

export default function FeedPage() {
  const { push } = useToast();
  const [posts, setPosts]             = useState([]);
  const [filter, setFilter]           = useState('all');
  const [showCreate, setShowCreate]   = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);

  const fetchPosts = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      if (filter === 'my_posts') {
        const { data } = await API.get('/posts/my-posts');
        setPosts(data);
        setHasMore(false);
      } else {
        const { data } = await API.get('/posts', { params: { type: filter === 'all' ? undefined : filter, page: p, limit: 15 }});
        setPosts(prev => reset ? data : [...prev, ...data]);
        setHasMore(data.length === 15);
        if (!reset) setPage(p + 1);
      }
    } catch {
      push('Failed to load posts', 'error');
    } finally { setLoading(false); }
  }, [filter, page, push]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(true);
  }, [filter]);

  const handlePostCreated = (post) => setPosts(prev => [post, ...prev]);

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-20 md:pb-4">
      {/* Stories row */}
      <div className="pt-4 pb-2 border-b border-white/5">
        <Stories />
      </div>

      {/* Filter tabs */}
      <div className="sticky top-14 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)}
              className={`flex-shrink-0 text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg transition-all
                ${filter === t.value ? 'bg-sky-500/15 text-sky-400' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => fetchPosts(true)} className="ml-auto p-1.5 rounded-lg text-slate-600 hover:text-sky-400 hover:bg-white/5 transition-all flex-shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Posts feed */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-slate-600 font-bold tracking-widest">LOADING NETWORK FEED...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-600 text-xs font-bold">NO POSTS YET — BE THE FIRST</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={filter === 'my_posts' ? async () => {
                  if(confirm('Delete your post?')) {
                    try { 
                      await API.delete(`/posts/${post.id}`); 
                      setPosts(prev => prev.filter(p => p.id !== post.id)); 
                      push('Post deleted', 'success'); 
                    } catch(e) { push('Failed to delete', 'error'); }
                  }
                } : undefined}
                onEdit={filter === 'my_posts' ? () => setEditingPost(post) : undefined}
              />
            ))}
            {hasMore && filter !== 'my_posts' && (
              <button onClick={() => fetchPosts(false)}
                className="w-full py-3 text-[10px] font-bold text-slate-600 hover:text-sky-400 border border-white/5 hover:border-sky-500/30 rounded-xl transition-all">
                LOAD MORE
              </button>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-6 md:bottom-8 w-12 h-12 bg-sky-600 hover:bg-sky-500 rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(14,165,233,0.4)] transition-all hover:scale-110 z-40">
        <PlusSquare className="w-5 h-5 text-white" />
      </button>

      {(showCreate || editingPost) && <CreatePost postToEdit={editingPost} onClose={() => { setShowCreate(false); setEditingPost(null); }} onCreated={handlePostCreated} onUpdated={(updated) => setPosts(p => p.map(x => x.id === updated.id ? updated : x))} />}
    </div>
  );
}
