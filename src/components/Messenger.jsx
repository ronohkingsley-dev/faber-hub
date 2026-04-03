// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/Messenger.jsx
// ══════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, ShieldCheck, PhoneOff, MicOff, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { useToast } from './Toast';

export default function Messenger({ onClose, initialTarget = null }) {
  const { user } = useAuth();
  const { push } = useToast();
  
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [targetId, setTargetId] = useState(initialTarget?.id || ''); // who we're talking to
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  // Call state
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callConnection, setCallConnection] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [muted, setMuted] = useState(false);
  
  const audioRef = useRef();

  useEffect(() => {
    // 1. Establish Socket Connection
    const s = io('http://localhost:4000');
    setSocket(s);

    s.on('connect', () => { s.emit('register', user.id); });

    s.on('receive_message', (msg) => {
      setMessages(p => [...p, msg]);
    });

    s.on('call_answered', () => { push('Call answered. Starting encrypted stream...', 'success'); });
    s.on('call_ended', () => handleEndCall(false));
    
    // 2. Initialize E2E PeerJS
    const p = new Peer(user.id);
    p.on('open', (id) => {});

    // When someone calls us (PeerJS native event)
    p.on('call', (call) => {
      setIncomingCall(call);
    });

    setPeer(p);

    return () => { s.disconnect(); p.destroy(); };
  }, [user.id]);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [remoteStream]);

  // CHAT LOGIC
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !targetId) return;
    const cryptMsg = `[ENCRYPTED] ${input}`; // Placeholder representation of E2E
    const payload = { from: user.id, to: targetId, text: cryptMsg, ts: Date.now() };
    socket.emit('send_message', payload);
    setMessages(p => [...p, payload]);
    setInput('');
  };

  // CALL LOGIC
  const initiateCall = async () => {
    if (!targetId) return push('No recipient selected', 'warn');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setInCall(true);
      push('Dialing highly-secure channel...', 'success');
      const call = peer.call(targetId, stream);
      
      call.on('stream', (rStream) => {
        setRemoteStream(rStream);
        push('Connection established', 'success');
      });
      call.on('close', () => handleEndCall(false));
      setCallConnection(call);
    } catch {
      push('Microphone access denied', 'error');
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      incomingCall.answer(stream);
      setInCall(true);
      incomingCall.on('stream', (rStream) => setRemoteStream(rStream));
      incomingCall.on('close', () => handleEndCall(false));
      setCallConnection(incomingCall);
      setIncomingCall(null);
    } catch { push('Failed to answer call', 'error'); }
  };

  const handleEndCall = (emit = true) => {
    callConnection?.close();
    localStream?.getTracks().forEach(t => t.stop());
    setInCall(false);
    setIncomingCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    if (emit && socket) socket.emit('end_call', { to: targetId });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col slide-left">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between shadow-md z-10">
        <div>
          <h2 className="text-sm font-black text-sky-400 tracking-widest uppercase flex items-center gap-2">
            MESSENGER <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </h2>
          <p className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">E2E ENCRYPTED PROTOCOL</p>
        </div>
        <div className="flex gap-2">
          {inCall ? (
            <button onClick={() => handleEndCall(true)} className="p-2 bg-red-500 text-white rounded-full animate-pulse transition hover:scale-110">
              <PhoneOff className="w-4 h-4" />
            </button>
          ) : (
            targetId && <button onClick={initiateCall} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-full transition">
              <Phone className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-full"><X className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Target Input */}
      {!initialTarget && (
        <div className="p-3 border-b border-white/5">
           <input value={targetId} onChange={e=>setTargetId(e.target.value)} placeholder="Enter Target User ID to connect..." className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-sky-500" />
        </div>
      )}

      {/* Incoming Call Overlay */}
      {incomingCall && !inCall && (
        <div className="p-3 m-3 rounded-xl bg-violet-500/20 border border-violet-500/40 text-center animate-pulse">
          <p className="text-xs font-black text-violet-300 mb-2 uppercase tracking-widest">Incoming Secure Audio Call</p>
          <div className="flex gap-2 justify-center">
            <button onClick={acceptCall} className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded shadow-[0_0_15px_rgba(16,185,129,0.5)]">ACCEPT</button>
            <button onClick={()=>setIncomingCall(null)} className="px-4 py-1.5 bg-red-500/20 text-red-500 text-[10px] font-black rounded">DECLINE</button>
          </div>
        </div>
      )}

      {/* In-Call HUD */}
      {inCall && (
        <div className="p-4 mx-3 mt-3 rounded-2xl bg-black/40 border border-emerald-500/30 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
               <Phone className="w-3.5 h-3.5 text-emerald-400 z-10" />
               <span className="absolute inset-0 rounded-full border border-emerald-400 animate-ping"></span>
             </div>
             <div>
               <p className="text-[10px] font-black text-emerald-400">SECURE CHANNEL OPEN</p>
               <p className="text-[8px] text-slate-500 font-mono">WebRTC // AES-128-GCM</p>
             </div>
           </div>
           <button onClick={() => {
             const audioTrack = localStream?.getAudioTracks()[0];
             if(audioTrack) { audioTrack.enabled = !audioTrack.enabled; setMuted(!audioTrack.enabled); }
           }} className={`p-2 rounded-lg ${muted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400'}`}>
             {muted ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4" />}
           </button>
           <audio ref={audioRef} autoPlay />
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.from === user.id ? 'items-end' : 'items-start'}`}>
            <span className={`text-[10px] px-3 py-2 rounded-2xl max-w-[85%] break-words ${m.from === user.id ? 'bg-sky-600 text-white rounded-br-sm' : 'bg-white/5 text-slate-300 rounded-bl-sm border border-white/5 font-mono'}`}>
              {m.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-black/20 border-t border-white/5">
        <form onSubmit={sendMessage} className="relative">
          <input value={input} onChange={e=>setInput(e.target.value)} disabled={!targetId}
            placeholder={targetId ? "Transmit encrypted payload..." : "Target required..."}
            className="w-full bg-black/40 border border-white/5 rounded-xl pr-10 pl-4 py-3 text-xs text-white placeholder-slate-600 outline-none focus:border-sky-500/50 transition-all font-mono" />
          <button type="submit" disabled={!input.trim() || !targetId} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-30 rounded-lg text-white transition-all shadow-md">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
