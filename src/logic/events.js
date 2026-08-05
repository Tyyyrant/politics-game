// src/logic/events.js
import { gameState, emit } from './state.js';
import { EVENT_POOL } from './data/event-pool.js';
import { spendResources, spendInfluence } from './resources.js';
import { FACTION_NAMES_CN } from './data/constants.js';

export function shuffleDeck(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function drawEvent(factionId) {
  if (gameState.eventDeck.length === 0) gameState.eventDeck = shuffleDeck([...EVENT_POOL]);
  const event = gameState.eventDeck.shift();
  gameState.currentEvent = { ...event, targetFactionId: factionId };
  emit('event:drawn', { factionId, event });
  return event;
}

// 每6轮触发一次的全局事件（法案结算后调用）
export function triggerGlobalEvent() {
  const globalEvents = EVENT_POOL.filter(e => e.effects.releaseRandomLocked || e.effects.seatDefection || e.effects.scandalHit);
  if (!globalEvents.length) return null;
  const event = globalEvents[Math.floor(Math.random() * globalEvents.length)];
  const eff = event.effects;
  let detail = '';

  if (eff.releaseRandomLocked) {
    const locked = gameState.npcSeats.filter(s => s.lockedById && !s._pendingRelease);
    const count = Math.min(3 + Math.floor(Math.random() * 3), locked.length);
    const released = [];
    for (let i = 0; i < count; i++) {
      const s = locked[Math.floor(Math.random() * locked.length)];
      s.lockedById = null; s.visitorId = null; s.lockedOnTurn = null; s.revealed = false; s.roundsRemaining = 3;
      released.push(s.name);
      locked.splice(locked.indexOf(s), 1);
    }
    detail = `释放了${count}个席位：${released.join('、')}`;
    gameState.roundLog.push({ factionId: 'system', action: 'event', target: '🔄 换届风波', result: detail });
  }

  if (eff.scandalHit) {
    let maxSeats = 0, topFaction = null;
    for (const [fid, f] of Object.entries(gameState.factions)) {
      if (f.lockedSeats > maxSeats) { maxSeats = f.lockedSeats; topFaction = fid; }
    }
    if (topFaction) {
      gameState.factions[topFaction].influence = Math.max(0, gameState.factions[topFaction].influence - 5);
      const topSeats = gameState.npcSeats.filter(s => s.lockedById === topFaction && !s._pendingRelease);
      if (topSeats.length > 0) {
        const s = topSeats[Math.floor(Math.random() * topSeats.length)];
        s.lockedById = null; s.visitorId = null; s.lockedOnTurn = null; s.revealed = false; s.roundsRemaining = 3;
      }
      const topLeader = gameState.factions[topFaction]?.leaderName || topFaction;
      detail = `${topLeader}影响力-5，失去1个席位`;
      gameState.roundLog.push({ factionId: 'system', action: 'event', target: '📰 丑闻曝光', result: detail });
    }
  }

  if (eff.seatDefection) {
    const locked = gameState.npcSeats.filter(s => s.lockedById && !s._pendingRelease);
    if (locked.length > 0) {
      const s = locked[Math.floor(Math.random() * locked.length)];
      let minSeats = 999, poorest = null;
      for (const [fid, f] of Object.entries(gameState.factions)) {
        if (fid !== s.lockedById && f.lockedSeats < minSeats) { minSeats = f.lockedSeats; poorest = fid; }
      }
      if (poorest) {
        const oldOwner = s.lockedById;
        s.lockedById = poorest; s.lockedOnTurn = gameState.turn;
        const oldLeader = gameState.factions[oldOwner]?.leaderName || oldOwner;
        const newLeader = gameState.factions[poorest]?.leaderName || poorest;
        detail = `${s.name}从${oldLeader}倒向${newLeader}`;
        gameState.roundLog.push({ factionId: 'system', action: 'event', target: '🔀 代表倒戈', result: detail });
      }
    }
  }

  return { name: event.name, detail: detail || event.description };
}

export function resolveEvent(factionId) {
  const event = gameState.currentEvent;
  if (!event) return null;
  const faction = gameState.factions[factionId];
  const eff = event.effects;
  if (eff.sasacResourceByRank) {
    for (const m of faction.members) {
      if (m.dept === 'sasac') faction.resources.sasac = (faction.resources.sasac || 0) + ((m.rank === '副厅' || m.rank === '正厅') ? 2 : 1);
    }
  }
  if (eff.educationDouble) faction.resources.education = (faction.resources.education || 0) * 2;
  if (eff.housingDouble) faction.resources.housing = (faction.resources.housing || 0) * 2;
  if (eff.ndrcHalve) faction.resources.ndrc = Math.floor((faction.resources.ndrc || 0) / 2);
  if (eff.payFinanceOrInfluence) { if (!spendResources(factionId, 'finance', 2)) spendInfluence(factionId, 1); }
  if (eff.blockPublicSecurityResource) gameState.activeBillEffects.push({ id: 'event_leader_patrol', name: '领导巡查（事件）', effects: { blockPublicSecurity: true }, duration: 1 });
  if (eff.educationResourceBonus) faction.resources.education = (faction.resources.education || 0) + eff.educationResourceBonus;
  if (eff.randomDeptDouble) {
    const depts = Object.keys(faction.resources).filter(d => faction.resources[d] > 0);
    if (depts.length) faction.resources[depts[Math.floor(Math.random() * depts.length)]] *= 2;
  }
  if (eff.disciplineMarksBonus) faction.disciplineMarks += eff.disciplineMarksBonus;
  if (eff.payPartyOrInfluence) { if (!spendResources(factionId, 'partyOffice', 1)) spendInfluence(factionId, 1); }
  if (eff.organizationResourceBonus) faction.resources.organization = (faction.resources.organization || 0) + eff.organizationResourceBonus;
  emit('event:resolved', { factionId, eventId: event.id });
  gameState.roundLog.push({ factionId, action: 'event', eventId: event.id });
  gameState.currentEvent = null;
  return event;
}
