// src/logic/save.js
import { gameState, serializeState, deserializeState, emit } from './state.js';

function getSaveAPI() { return window.saveAPI || null; }

export async function saveGame(slot) {
  const data = { version: '1.0.0', timestamp: Date.now(), gameState: serializeState(), meta: { turn: gameState.turn, playerFaction: gameState.playerFactionId, playerSeats: gameState.factions[gameState.playerFactionId].lockedSeats } };
  const api = getSaveAPI();
  if (api) { await api.write(slot, data); }
  else { localStorage.setItem(`policy_save_${slot}`, JSON.stringify(data)); }
  emit('save:success', { slot });
  return { success: true };
}

export async function loadGame(slot) {
  let data = null;
  const api = getSaveAPI();
  if (api) { data = await api.read(slot); }
  else { const raw = localStorage.getItem(`policy_save_${slot}`); if (raw) data = JSON.parse(raw); }
  if (!data?.gameState) return { success: false, message: '存档不存在' };
  deserializeState(data.gameState);
  emit('load:success', { slot, meta: data.meta });
  return { success: true, meta: data.meta };
}

export async function deleteSave(slot) {
  const api = getSaveAPI();
  if (api) { await api.write(slot, null); }
  else { localStorage.removeItem(`policy_save_${slot}`); }
}

export async function listSaves() {
  const api = getSaveAPI();
  if (api) return await api.list();
  const saves = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('policy_save_')) {
      try { const d = JSON.parse(localStorage.getItem(key)); saves.push({ slot: key.replace('policy_save_', ''), meta: d.meta, timestamp: d.timestamp }); } catch (e) { /* skip */ }
    }
  }
  return saves;
}
