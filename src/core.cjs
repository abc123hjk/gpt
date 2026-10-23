'use strict';
const DEFAULTS = Object.freeze({ version: 1, fish: 3, affection: 0, completed: 0, focusMinutes: 0, timer: null, settings: { duration: 25, scale: 1, roam: true, alwaysOnTop: true }, position: null });
function initialState() { return structuredClone(DEFAULTS); }
function bounded(value, min, max, fallback) { return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }
function hydrate(raw) {
  const s = initialState();
  if (!raw || typeof raw !== 'object') return s;
  for (const k of ['fish', 'affection', 'completed', 'focusMinutes']) s[k] = Math.floor(bounded(raw[k], 0, k === 'affection' ? 100 : 1000000, s[k]));
  const p = raw.settings || {};
  s.settings = { duration: Math.round(bounded(p.duration, 5, 120, 25)), scale: [0.8, 1, 1.3].includes(p.scale) ? p.scale : 1, roam: p.roam !== false, alwaysOnTop: p.alwaysOnTop !== false };
  if (raw.position && Number.isFinite(raw.position.x) && Number.isFinite(raw.position.y)) s.position = { x: Math.round(raw.position.x), y: Math.round(raw.position.y) };
  const t = raw.timer;
  if (t && Number.isFinite(t.totalMs) && t.totalMs >= 300000 && t.totalMs <= 7200000 && typeof t.paused === 'boolean' && Number.isFinite(t.remainingMs) && t.remainingMs >= 0 && t.remainingMs <= t.totalMs && Number.isFinite(t.endsAt)) {
    s.timer = { totalMs: t.totalMs, remainingMs: t.remainingMs, endsAt: t.endsAt, paused: t.paused };
  }
  return s;
}
function remaining(s, now = Date.now()) { return s.timer ? Math.max(0, s.timer.paused ? s.timer.remainingMs : s.timer.endsAt - now) : 0; }
function completeIfDue(s, now = Date.now()) {
  if (!s.timer || s.timer.paused || remaining(s, now) > 0) return false;
  s.focusMinutes += Math.round(s.timer.totalMs / 60000);
  s.completed++;
  s.fish += Math.max(1, Math.floor(s.timer.totalMs / 1500000));
  s.affection = Math.min(100, s.affection + 5);
  s.timer = null;
  return true;
}
function command(s, action, now = Date.now()) {
  completeIfDue(s, now);
  switch (action.type) {
    case 'start': {
      if (s.timer) return { ok: false, message: '已经有一段专注进行中啦。' };
      const minutes = Math.round(bounded(action.minutes, 5, 120, s.settings.duration));
      s.settings.duration = minutes;
      s.timer = { totalMs: minutes * 60000, remainingMs: minutes * 60000, endsAt: now + minutes * 60000, paused: false };
      return { ok: true, animation: 'focus', message: '你忙你的，我陪你。' };
    }
    case 'pause':
      if (s.timer && !s.timer.paused) { s.timer.remainingMs = remaining(s, now); s.timer.paused = true; }
      return { ok: true, message: '休息一下，我等你。' };
    case 'resume':
      if (s.timer?.paused) { s.timer.endsAt = now + s.timer.remainingMs; s.timer.paused = false; }
      return { ok: true, animation: s.timer ? 'focus' : 'idle', message: '继续一起加油。' };
    case 'cancel': s.timer = null; return { ok: true, animation: 'idle', message: '这次先到这里。' };
    case 'feed':
      if (s.fish < 1) return { ok: false, message: '鱼干吃完啦，完成一次专注就能赚到。' };
      s.fish--; s.affection = Math.min(100, s.affection + 3);
      return { ok: true, animation: 'eat', message: '咔嚓咔嚓，喜欢你！' };
    case 'pet': s.affection = Math.min(100, s.affection + 1); return { ok: true, animation: 'pet', message: '呼噜呼噜……' };
    case 'sleep': return { ok: true, animation: 'sleep', message: '借你的桌面打个盹。' };
    case 'wake': return { ok: true, animation: s.timer && !s.timer.paused ? 'focus' : 'idle', message: '我醒啦！' };
    case 'settings': {
      const p = action.value || {};
      if ('duration' in p) s.settings.duration = Math.round(bounded(p.duration, 5, 120, s.settings.duration));
      if ([0.8, 1, 1.3].includes(p.scale)) s.settings.scale = p.scale;
      for (const key of ['roam', 'alwaysOnTop']) if (typeof p[key] === 'boolean') s.settings[key] = p[key];
      return { ok: true };
    }
    default: return { ok: false, message: '没有这个操作。' };
  }
}
module.exports = { initialState, hydrate, remaining, completeIfDue, command };
