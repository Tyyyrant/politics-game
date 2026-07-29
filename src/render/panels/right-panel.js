// src/render/panels/right-panel.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES_CN, ACTION_NAMES_CN } from '../../logic/data/constants.js';

function describeEffects(eff) {
  if (!eff) return '';
  const parts = [];
  if (eff.globalResourceBonus) parts.push(`全体资源+${eff.globalResourceBonus}`);
  if (eff.govResourceBonus) parts.push(`政府资源+${eff.govResourceBonus}`);
  if (eff.financeResourceBonus) parts.push(`财政资源+${eff.financeResourceBonus}`);
  if (eff.taskCostReduction) parts.push(`任务消耗-${eff.taskCostReduction}`);
  if (eff.appointmentCostReduction) parts.push(`任用消耗-${eff.appointmentCostReduction}`);
  if (eff.govPartyExchange) parts.push('政府与党委资源互通');
  if (eff.blockPublicSecurity) parts.push('本轮公安资源封锁');
  if (eff.disableResources) parts.push('目标下轮资源瘫痪');
  if (eff.partySchoolBonus) parts.push('党校额外+1资源');
  if (eff.disciplineSuccessBoost) parts.push('纪委查处成功率提升');
  if (eff.banDisciplineAction) parts.push('禁止纪委行动');
  if (eff.supporterInfluenceBonus) parts.push(`支持方影响力+${eff.supporterInfluenceBonus}`);
  if (eff.disciplineMarksBonus) parts.push(`纪委标记+${eff.disciplineMarksBonus}`);
  if (eff.propagandaToInfluence) parts.push('宣传资源可换影响力');
  if (eff.govOfficeToGeneric) parts.push('办公厅资源可换通用');
  if (eff.hrssResourcePenalty) parts.push(`人社资源-${eff.hrssResourcePenalty}`);
  if (eff.propagandaResourcePenalty) parts.push(`宣传资源-${eff.propagandaResourcePenalty}`);
  if (eff.partyResourcePenalty) parts.push(`党委资源-${eff.partyResourcePenalty}`);
  if (eff.payPartyResourceOrInfluence) parts.push('需支付党委资源或影响力');
  if (eff.banOpinionGuide) parts.push('禁止使用舆论引导');
  if (eff.govAppointmentCostIncrease) parts.push('干部任用消耗增加');
  if (eff.supporterPropagandaPenalty) parts.push('支持方宣传资源减少');
  if (eff.immunityAuditStorm) parts.push('免疫审计风暴');
  return parts.join('，');
}

export function renderRightPanel() {
  const el = document.getElementById('right-panel');
  if (!el) return;
  let h = '<div class="panel-section"><h3>📜 事件日志</h3><div class="log-stream">';
  for (const e of [...gameState.roundLog].reverse().slice(0, 25)) {
    if (e.factionId === 'system') {
      if (e.action === 'roundStart') h += `<div class="log-round">━━━ ${e.target} ━━━</div>`;
      else if (e.action === 'billResult') h += `<div class="log-bill">📜 ${e.target}：${e.result}（${e.detail || ''}）</div>`;
      else if (e.action === 'seatRefresh') h += `<div class="log-bill">🔄 ${e.target}，${e.result}</div>`;
      else h += `<div class="log-system">${e.target} ${e.result || ''}</div>`;
    } else {
      const factionName = FACTION_NAMES_CN[e.factionId] || e.factionId || '未知';
      const actionName = ACTION_NAMES_CN[e.action] || e.action || '未知行动';
      let target = e.target || '';
      // Translate faction IDs in target to Chinese
      for (const [fid, fname] of Object.entries(FACTION_NAMES_CN)) {
        target = target.replace(fid, fname);
      }
      const resultText = e.result ? ` → ${e.result}` : '';
      h += `<div class="log-entry"><b>${factionName}</b> ${actionName} ${target}${resultText}</div>`;
    }
  }
  if (!gameState.roundLog.length) h += `<div class="log-empty">第${gameState.turn}轮行动开始，暂无事件</div>`;
  h += '</div></div>';

  // Current bill being voted
  if (gameState.currentBill) {
    const b = gameState.currentBill;
    const playerVoted = [...b.votes.support, ...b.votes.oppose, ...b.votes.abstain]
      .some(v => v.factionId === gameState.playerFactionId);
    const statusText = playerVoted ? '已投票，等待结算...' : '投票中';
    h += `<div class="panel-section bill-status"><h3>📜 本轮法案${statusText}</h3>
      <div class="bill-name">${b.name}</div><div style="font-size:0.8em;">${b.description || ''}</div>
      <div style="font-size:0.8em;margin-top:4px;">支持 ${b.votes.support.length} | 反对 ${b.votes.oppose.length} | 弃权 ${b.votes.abstain.length}</div></div>`;
  }

  // Last resolved bill result(s)
  function renderBillResult(r, label) {
    const icon = r.passed ? '✅ 通过' : '❌ 未通过';
    const appliedEffects = r.passed ? r.passEffects : r.failEffects;
    const effText = describeEffects(appliedEffects);
    return `<div class="panel-section bill-result ${r.passed ? 'bill-passed' : 'bill-failed'}">
      <h3>${label}</h3>
      <div class="bill-name">${icon} ${r.billName}</div>
      <div style="font-size:0.75em;margin-top:4px;">支持 ${r.supportWeight}票 | 反对 ${r.opposeWeight}票</div>
      <div class="bill-effect-detail">${effText || '（无特殊效果）'}</div>
    </div>`;
  }
  if (gameState.lastBillResult) {
    h += renderBillResult(gameState.lastBillResult, '📋 法案结果');
  }
  if (gameState.lastBillResult2) {
    h += renderBillResult(gameState.lastBillResult2, '📋 常规法案结果');
  }

  el.innerHTML = h;
}
