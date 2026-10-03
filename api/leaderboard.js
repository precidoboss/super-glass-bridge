'use strict';
const { HttpError, handler, send, verifySession, rpc, fallbackName } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'method_not_allowed');
  const raw = parseInt(new URL(req.url, 'http://x').searchParams.get('limit'), 10);
  const limit = Number.isFinite(raw) ? Math.max(1, Math.min(50, raw)) : 20;

  // Optional: only used to highlight the viewer's own row. Never required.
  let viewer = null;
  if (req.headers['authorization']) { try { viewer = (await verifySession(req)).id; } catch (_) {} }

  const rows = await rpc('sgb_leaderboard', { p_limit: limit });
  if (!Array.isArray(rows)) throw new HttpError(502, 'db_error');
  send(res, 200, {
    entries: rows.map((r) => ({
      rank: Number(r.rank),
      name: r.display_name || fallbackName(r.player_id),
      avatar: r.avatar_url || null,
      timeMs: r.best_time_ms,
      wins: r.completed_runs,
      you: viewer !== null && r.player_id === viewer,
    })),
  });
});
