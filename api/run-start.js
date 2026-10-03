'use strict';
const { HttpError, MODES, handler, send, body, verifySession, rpc } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const me = await verifySession(req);
  const mode = MODES.includes(body(req).mode) ? body(req).mode : 'mixed';
  const runId = await rpc('sgb_start_run', {
    p_player_id: me.id, p_display_name: me.name, p_avatar_url: me.avatar, p_mode: mode,
  });
  if (typeof runId !== 'string') throw new HttpError(502, 'db_error');
  send(res, 200, { runId });
});
