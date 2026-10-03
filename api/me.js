'use strict';
const { HttpError, handler, send, verifySession, rpc, fallbackName } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'method_not_allowed');
  const me = await verifySession(req);
  const rows = await rpc('sgb_player_stats', { p_player_id: me.id });
  const s = Array.isArray(rows) && rows[0] ? rows[0] : null;
  send(res, 200, {
    player: { name: me.name || fallbackName(me.id), avatar: me.avatar },
    stats: {
      runs: s ? s.total_runs : 0, wins: s ? s.completed_runs : 0, bestStage: s ? s.best_stage : 0,
      bestTimeMs: s ? s.best_time_ms : null, rank: s ? s.rank : null,
    },
  });
});
