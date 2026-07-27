// src/logic/events.js
import { gameState, emit } from './state.js';
import { EVENT_POOL } from './data/event-pool.js';
import { spendResources, spendInfluence } from './resources.js';

export function shuffleDeck(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function drawEvent(factionId) {
  if (gameState.eventDeck.length === 0) gameState.eventDeck = shuffleDeck([...EVENT_POOL]);
  const event = gameState.eventDeck.shift();
  gameState.currentEvent = { ...event, targetFactionId: factionId };
  emit('event:drawn', { factionId, event });
  return event;
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
  if (eff.blockPublicSecurityResource) gameState.activeBillEffects.push({ id: 'event_leader_patrol', effects: { blockPublicSecurity: true }, duration: 1 });
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
