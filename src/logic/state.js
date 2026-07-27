// src/logic/state.js
import { FACTION_DEFS, createInitialFactionState, getFactionResources } from './data/factions.js';
import { BILL_POOL, shuffleDeck } from './data/bill-pool.js';
import { EVENT_POOL } from './data/event-pool.js';
import { generateSeatTasks } from './data/seat-tasks.js';
import { FACTION_IDS, TOTAL_NPC_SEATS } from './data/constants.js';

export let gameState = null;

export function createNewGame(playerFactionId) {
  if (!FACTION_DEFS[playerFactionId] || !FACTION_DEFS[playerFactionId].leader.isPlayerControllable) {
    throw new Error(`Invalid player faction: ${playerFactionId}`);
  }
  const factions = {};
  for (const fid of FACTION_IDS) {
    factions[fid] = createInitialFactionState(fid);
    factions[fid].resources = getFactionResources(factions[fid]);
    factions[fid].influence = getFactionInfluenceFromMembers(factions[fid]);
  }
  const npcSeats = generateSeatTasks(TOTAL_NPC_SEATS);
  if (npcSeats.length >= 2) {
    npcSeats[0].lockedById = 'npcCongress';
    npcSeats[1].lockedById = 'npcCongress';
  }
  gameState = {
    turn: 0, phase: 'dice', turnOrder: [], currentPlayerIndex: 0,
    playerFactionId, factions, npcSeats,
    currentBill: null, billDeck: shuffleDeck([...BILL_POOL]),
    eventDeck: shuffleDeck([...EVENT_POOL]),
    activeBillEffects: [], roundLog: [], history: [],
    globalDisciplineMarkPool: 0, diceResult: null, pendingActions: [],
    lastBillResult: null
  };
  return gameState;
}

function getFactionInfluenceFromMembers(faction) {
  let inf = 0;
  for (const m of faction.members) inf += { '副处': 1, '正处': 2, '副厅': 4, '正厅': 6, '副部': 10 }[m.rank] || 0;
  inf += { '副部': 10, '正厅': 6 }[faction.leaderRank] || 0;
  return inf;
}

const listeners = {};
export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
}
export function emit(event, data) {
  if (listeners[event]) for (const cb of listeners[event]) cb(data);
}
export function serializeState() { return JSON.parse(JSON.stringify(gameState)); }
export function deserializeState(data) { gameState = data; return gameState; }
