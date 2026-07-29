// src/logic/state.js
import { FACTION_DEFS, createInitialFactionState, getFactionResources } from './data/factions.js';
import { BILL_POOL, shuffleDeck } from './data/bill-pool.js';
import { EVENT_POOL } from './data/event-pool.js';
import { generateSeatTasks } from './data/seat-tasks.js';
import { INDEPENDENT_OFFICIALS } from './data/independent-officials.js';
import { FACTION_IDS, TOTAL_NPC_SEATS } from './data/constants.js';

export let gameState = null;

export function createNewGame(playerFactionId) {
  if (!FACTION_DEFS[playerFactionId] || !FACTION_DEFS[playerFactionId].leader.isPlayerControllable) {
    throw new Error(`Invalid player faction: ${playerFactionId}`);
  }
  const factions = {};
  for (const fid of FACTION_IDS) {
    factions[fid] = createInitialFactionState(fid);
    factions[fid].resources = {};  // 从零开始，每轮产出时获取
    factions[fid].influence = getFactionInfluenceFromMembers(factions[fid]);
  }
  const npcSeats = generateSeatTasks(TOTAL_NPC_SEATS);
  // Ensure visitedOnTurn is set (backward compat)
  for (const s of npcSeats) { if (s.visitedOnTurn === undefined) s.visitedOnTurn = 0; }
  if (npcSeats.length >= 2) {
    npcSeats[0].lockedById = 'npcCongress'; npcSeats[0].lockedOnTurn = 0;
    npcSeats[1].lockedById = 'npcCongress'; npcSeats[1].lockedOnTurn = 0;
  }
  // Clear any stale scouted state
  for (const fid of FACTION_IDS) {
    for (const m of factions[fid].members) {
      delete m.scoutedQuestsBy;
    }
  }

  // TEST: boost propaganda faction for testing
  if (factions.propaganda) {
    factions.propaganda.influence = 100;
    factions.propaganda.funds = 30;
    factions.propaganda.genericResources = 30;
    factions.propaganda.disciplineMarks = 10;
  }

  gameState = {
    turn: 0, phase: 'dice', turnOrder: [], currentPlayerIndex: 0,
    playerFactionId, factions, npcSeats,
    currentBill: null, billDeck: shuffleDeck([...BILL_POOL]),
    eventDeck: shuffleDeck([...EVENT_POOL]),
    _fiveYearPlanTriggered: false, _pendingFiveYearPlan: null, _fiveYearPlanFaction: null,
    activeBillEffects: [], roundLog: [], history: [],
    globalDisciplineMarkPool: 0, diceResult: null, pendingActions: [],
    lastBillResult: null,
    independentOfficials: JSON.parse(JSON.stringify(INDEPENDENT_OFFICIALS))  // 可招募的无派系干部池
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
