// ══════════════════════════════════════════════════════
//  FABER.NET · Logic.js
//  Kept for utility only — auth logic now lives in
//  AuthContext.jsx + backend/routes/auth.js
// ══════════════════════════════════════════════════════

export function generateNodeID() {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FBR-${seg()}-MMUST`;
}