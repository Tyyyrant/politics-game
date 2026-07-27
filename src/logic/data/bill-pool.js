// src/logic/data/bill-pool.js
export const BILL_POOL = [
  { id: 'bill_tax_cut', name: '《减税降费法案》', type: 'finance', dept: 'finance', description: '减轻企业税负，激发市场活力', passEffects: { globalResourceBonus: 1, duration: 1 }, failEffects: { financeVoteWeight: -0.5, duration: 1 } },
  { id: 'bill_debt', name: '《地方债务化解法案》', type: 'finance', dept: 'finance', description: '化解地方债务风险，增强财政可持续性', passEffects: { immunityAuditStorm: true, financeResourceBonus: 1, duration: 2 }, failEffects: {} },
  { id: 'bill_flexible_employment', name: '《灵活就业促进法案》', type: 'hrss', dept: 'hrss', description: '促进灵活就业，拓宽就业渠道', passEffects: { extraSchoolTask: 1, schoolTaskCostReduction: 1 }, failEffects: { hrssResourcePenalty: 1, duration: 2 } },
  { id: 'bill_performance_reform', name: '《公务员绩效改革法案》', type: 'hrss', dept: 'hrss', description: '改革公务员绩效考核制度，提升行政效率', passEffects: { govResourceBonus: 1, appointmentCostReduction: 1, duration: 2 }, failEffects: { hrssResourcePenalty: 2, duration: 1 } },
  { id: 'bill_media_supervision', name: '《媒体监管强化法案》', type: 'propaganda', dept: 'propaganda', description: '加强媒体监管，引导舆论方向', passEffects: { supporterInfluenceBonus: 2 }, failEffects: { supporterPropagandaPenalty: 1, duration: 1 } },
  { id: 'bill_opinion_emergency', name: '《舆情应急管理法案》', type: 'propaganda', dept: 'propaganda', description: '建立舆情应急管理体系', passEffects: { propagandaToInfluence: true, maxConversion: 5 }, failEffects: { propagandaResourcePenalty: 3, banOpinionGuide: true, duration: 1 } },
  { id: 'bill_open_government', name: '《政务公开法案》', type: 'government', dept: 'govOffice', description: '推进政务公开，增强政府透明度', passEffects: { govOfficeToGeneric: true }, failEffects: { govAppointmentCostIncrease: 0.2, duration: 2 } },
  { id: 'bill_cross_dept', name: '《跨部门协作条例》', type: 'government', dept: 'partyOffice', description: '促进政府部门与党委部门间资源互通', passEffects: { govPartyExchange: true, partySchoolBonus: 1, duration: 3 }, failEffects: { partyResourcePenalty: 4, duration: 1 } },
  { id: 'bill_discipline_strengthen', name: '《党内纪律整顿法案》', type: 'party', dept: 'discipline', description: '严肃党内纪律，强化纪检监督', passEffects: { disciplineSuccessBoost: true }, failEffects: { banDisciplineAction: true, duration: 3 } },
  { id: 'bill_integrity_education', name: '《廉政教育周》', type: 'party', dept: 'discipline', description: '开展廉政教育，提升廉洁意识', passEffects: { disciplineMarksBonus: 2, disciplineSuccessRange: [3, 6] }, failEffects: { payPartyResourceOrInfluence: true } }
];

export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
