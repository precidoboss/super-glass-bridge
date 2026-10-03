import { withSupabase } from 'npm:@supabase/server@1.9.0'

const GROTTO_HOST = 'api.enterthegrotto.xyz'

type RuntimeInput = {
  apiBaseUrl: string
  sessionId: string
  gameId: string
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

function getRuntime(input: unknown): RuntimeInput {
  if (!input || typeof input !== 'object') throw new Error('Missing runtime')
  const value = input as Record<string, unknown>
  const apiBaseUrl = String(value.apiBaseUrl || '').replace(/\/+$/, '')
  const sessionId = String(value.sessionId || '')
  const gameId = String(value.gameId || '')
  let url: URL
  try {
    url = new URL(apiBaseUrl)
  } catch {
    throw new Error('Invalid runtime apiBaseUrl')
  }
  if (url.protocol !== 'https:' || url.hostname !== GROTTO_HOST) {
    throw new Error('Runtime host is not allowed')
  }
  if (!sessionId.startsWith('grs_')) throw new Error('Invalid runtime session')
  if (!gameId) throw new Error('Missing gameId')
  return { apiBaseUrl, sessionId, gameId }
}

async function authenticateRuntime(runtime: RuntimeInput) {
  const response = await fetch(`${runtime.apiBaseUrl}/session/me`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${runtime.sessionId}` }
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body?.authenticated || !body?.player?.id) {
    throw new Error('Grotto session is unavailable or expired')
  }

  const configuredGameId = Deno.env.get('GROTTO_GAME_ID')
  if (configuredGameId && body.gameId !== configuredGameId) {
    throw new Error('Runtime game does not match this Supabase service')
  }
  if (body.gameId !== runtime.gameId) {
    throw new Error('Runtime game identity mismatch')
  }

  return {
    gameId: body.gameId as string,
    player: {
      id: String(body.player.id),
      displayName: body.player.displayName ? String(body.player.displayName) : null,
      avatar: body.player.avatar ? String(body.player.avatar) : null
    }
  }
}

async function upsertPlayer(admin: any, player: { id: string; displayName: string | null; avatar: string | null }) {
  const { error } = await admin.from('glass_bridge_players').upsert({
    player_id: player.id,
    display_name: player.displayName,
    avatar_url: player.avatar,
    last_seen_at: new Date().toISOString()
  }, { onConflict: 'player_id' })
  if (error) throw error
}

export default {
  fetch: withSupabase({ auth: 'publishable' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

    try {
      const body = await req.json()
      const runtime = getRuntime(body.runtime)
      const identity = await authenticateRuntime(runtime)
      await upsertPlayer(ctx.supabaseAdmin, identity.player)

      const action = String(body.action || '')

      if (action === 'start') {
        const mode = ['mixed', 'avax', 'hood'].includes(body.mode) ? body.mode : 'mixed'
        const { data, error } = await ctx.supabaseAdmin
          .from('glass_bridge_runs')
          .insert({
            player_id: identity.player.id,
            mode,
            score: 0,
            stages_completed: 0,
            won: false
          })
          .select('id, started_at')
          .single()
        if (error) throw error

        const { data: stats, error: statsError } = await ctx.supabaseAdmin
          .from('glass_bridge_player_stats')
          .select('*')
          .eq('player_id', identity.player.id)
          .maybeSingle()
        if (statsError) throw statsError

        return json({ run: data, player: identity.player, stats })
      }

      if (action === 'finish') {
        const runId = Number(body.runId)
        if (!Number.isInteger(runId) || runId <= 0) return json({ error: 'Invalid runId' }, 400)

        const won = Boolean(body.won)
        const durationMs = Math.max(0, Math.min(24 * 60 * 60 * 1000, Math.round(Number(body.durationMs) || 0)))
        const stagesCompleted = Math.max(0, Math.min(12, Math.round(Number(body.stagesCompleted) || 0)))
        const score = Math.max(0, Math.min(12, Math.round(Number(body.score) || stagesCompleted)))
        const endedReason = body.endedReason ? String(body.endedReason).slice(0, 64) : (won ? 'completed' : 'failed')

        const { data: run, error: runError } = await ctx.supabaseAdmin
          .from('glass_bridge_runs')
          .update({
            finished_at: new Date().toISOString(),
            duration_ms: durationMs,
            score,
            stages_completed: stagesCompleted,
            won,
            ended_reason: endedReason
          })
          .eq('id', runId)
          .eq('player_id', identity.player.id)
          .select('id, finished_at, duration_ms, score, stages_completed, won, ended_reason')
          .maybeSingle()

        if (runError) throw runError
        if (!run) return json({ error: 'Run not found for this player' }, 404)

        const { data: stats, error: statsError } = await ctx.supabaseAdmin
          .from('glass_bridge_player_stats')
          .select('*')
          .eq('player_id', identity.player.id)
          .maybeSingle()
        if (statsError) throw statsError

        return json({ run, stats })
      }

      if (action === 'profile') {
        const { data: stats, error } = await ctx.supabaseAdmin
          .from('glass_bridge_player_stats')
          .select('*')
          .eq('player_id', identity.player.id)
          .maybeSingle()
        if (error) throw error
        return json({ player: identity.player, stats })
      }

      if (action === 'leaderboard') {
        const limit = Math.max(1, Math.min(50, Math.round(Number(body.limit) || 10)))
        const { data, error } = await ctx.supabaseAdmin
          .from('glass_bridge_leaderboard')
          .select('player_id, display_name, avatar_url, best_time_ms, best_score, total_runs')
          .order('best_time_ms', { ascending: true })
          .limit(limit)
        if (error) throw error

        return json({
          entries: (data || []).map((entry: any, index: number) => ({
            rank: index + 1,
            playerId: entry.player_id,
            displayName: entry.display_name || 'Anonymous Runner',
            avatar: entry.avatar_url,
            bestTimeMs: entry.best_time_ms,
            bestScore: entry.best_score,
            totalRuns: entry.total_runs
          }))
        })
      }

      return json({ error: 'Unknown action' }, 400)
    } catch (error) {
      console.error('glass-bridge-stats:', error instanceof Error ? error.message : String(error))
      return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 400)
    }
  })
}
