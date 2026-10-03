'use strict';
const { HttpError, handler, send, body, verifySession, rpc } = require('./_lib');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const me = await verifySession(req);
  const b = body(req);
  if (typeof b.runId !== 'string' || !UUID.test(b.runId)) throw new HttpError(400, 'bad_request');
  const stage = Number.isInteger(b.stage) ? Math.max(0, Math.min(12, b.stage)) : 0;
  const r = await rpc('sgb_finish_run', {
    p_run_id: b.runId, p_player_id: me.id, p_stage: stage, p_completed: b.completed === true,
  });
  if (!r || typeof r !== 'object') throw new HttpError(502, 'db_error');
  send(res, 200, {
    durationMs: r.duration_ms, completed: r.completed, stage: r.stage, newBest: r.new_best,
    stats: {
      runs: r.stats.total_runs, wins: r.stats.completed_runs, bestStage: r.stats.best_stage,
      bestTimeMs: r.stats.best_time_ms, rank: r.stats.rank,
    },
  });
});
