'use strict';
const crypto = require('crypto');

// Identity is ALWAYS verified server-side against Grotto. The base URL is fixed here
// and never taken from the browser (that would let anyone fake a session).
const GROTTO_API = (process.env.GROTTO_API_BASE || 'https://api.enterthegrotto.xyz/api/game-runtime/v1').replace(/\/+$/, '');
const MODES = ['mixed', 'avax', 'hood'];

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // bearer-token auth, no cookies
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true; }
  return false;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string') { try { return JSON.parse(b) || {}; } catch (_) {} }
  return {};
}

function cleanName(v) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 40);
  return s || null;
}

function cleanAvatar(v) {
  if (typeof v !== 'string' || v.length > 500) return null;
  try { const u = new URL(v); return u.protocol === 'https:' ? u.toString() : null; } catch (_) { return null; }
}

function fallbackName(playerId) {
  // Never expose any part of the wallet-like id; use a stable hash instead.
  return 'Player ' + crypto.createHash('sha256').update(String(playerId)).digest('hex').slice(0, 4).toUpperCase();
}

function bearer(req) {
  const m = /^Bearer\s+(grs_\S{4,512})$/.exec(req.headers['authorization'] || '');
  return m ? m[1] : null;
}

// Returns { id, name, avatar } for a valid Grotto runtime session, else throws HttpError.
async function verifySession(req) {
  const token = bearer(req);
  if (!token) throw new HttpError(401, 'unauthorized');
  let r;
  try {
    r = await fetch(GROTTO_API + '/session/me', {
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(8000),
    });
  } catch (_) { throw new HttpError(502, 'grotto_unreachable'); }
  if (r.status === 401 || r.status === 403 || r.status === 404) throw new HttpError(401, 'unauthorized');
  if (!r.ok) throw new HttpError(502, 'grotto_unreachable');
  const j = await r.json().catch(() => null);
  if (!j || j.authenticated !== true || !j.player || typeof j.player.id !== 'string') throw new HttpError(401, 'unauthorized');
  const want = process.env.GROTTO_GAME_ID;
  if (want && j.gameId !== want) throw new HttpError(401, 'wrong_game');
  const id = j.player.id.trim().toLowerCase();
  if (!id || id.length > 100) throw new HttpError(401, 'unauthorized');
  return { id, name: cleanName(j.player.displayName), avatar: cleanAvatar(j.player.avatar) };
}

const DB_ERRORS = {
  run_not_found: 404, run_already_finished: 409, run_too_fast: 422, run_expired: 410,
};

async function rpc(fn, args) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:\/])/.test(url)) throw new HttpError(503, 'not_configured');
  const headers = { apikey: key, 'Content-Type': 'application/json', Accept: 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key; // legacy JWT keys only
  let r;
  try {
    r = await fetch(url.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST', headers, body: JSON.stringify(args), signal: AbortSignal.timeout(8000),
    });
  } catch (_) { throw new HttpError(502, 'db_unreachable'); }
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}
  if (!r.ok) {
    const msg = (data && data.message) || '';
    const code = Object.keys(DB_ERRORS).find((k) => msg.includes(k));
    if (code) throw new HttpError(DB_ERRORS[code], code);
    console.error('supabase rpc failed', fn, r.status, msg);
    throw new HttpError(502, 'db_error');
  }
  return data;
}

function handler(fn) {
  return async (req, res) => {
    if (cors(req, res)) return;
    try { await fn(req, res); }
    catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.code });
      console.error('unhandled', e);
      send(res, 500, { error: 'server_error' });
    }
  };
}

module.exports = { HttpError, MODES, handler, send, body, verifySession, rpc, fallbackName };
