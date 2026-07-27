// src/logic/data/event-pool.js
export const EVENT_POOL = [
  { id: 'event_soe_restructure', name: '国企重组', type: 'positive', description: '省属国有企业大规模重组整合，国资委系统迎来资源注入。', effects: { sasacResourceByRank: true } },
  { id: 'event_grassroots_research', name: '基层调研', type: 'mixed', description: '省委要求各部门深入基层调研。教育和住建系统资源翻倍，但发改委被抽调人员导致资源减半。', effects: { educationDouble: true, housingDouble: true, ndrcHalve: true } },
  { id: 'event_party_school_special', name: '党校特训', type: 'mixed', description: '党校开设特别培训班，可获额外资源，但需放弃本轮法案投票权。', effects: { partySchoolExtra: 1, forfeitBillVote: true } },
  { id: 'event_policy_pilot', name: '政策试点', type: 'positive', description: '中央将我省列为改革试点，随机一个政府部门资源翻倍。', effects: { randomDeptDouble: true } },
  { id: 'event_international_forum', name: '国际合作论坛', type: 'positive', description: '国际经贸论坛在本省举办，发改委和国资委可半价完成商人项目，完成后额外锁定1个席位。', effects: { halfPriceBusinessProject: true, extraSeatOnComplete: 1 } },
  { id: 'event_university_expansion', name: '高校扩招', type: 'positive', description: '省属高校扩招计划获批，教育资源增加，入学任务成本大幅降低。', effects: { educationResourceBonus: 2, schoolTaskFixedCost1: true, partySchoolExtraEducation: 1 } },
  { id: 'event_audit_storm', name: '审计风暴', type: 'negative', description: '省审计厅突然启动全面审计，所有派系必须交出财政账目。', effects: { payFinanceOrInfluence: true } },
  { id: 'event_leader_patrol', name: '领导执勤', type: 'negative', description: '中央领导来省视察，公安系统全面停摆配合安保工作。', effects: { blockPublicSecurityResource: true } },
  { id: 'event_opinion_reversal', name: '舆情反转', type: 'mixed', description: '网络上一则旧闻突然发酵，宣传资源临时获得特殊转化能力。', effects: { propagandaToGeneric: true, negativePropagandaDouble: true } },
  { id: 'event_emergency_stability', name: '紧急维稳', type: 'mixed', description: '突发事件需要紧急处置，公安资源可临时等价于任意政府资源，但下轮公安资源无法获取。', effects: { publicSecurityAsGeneric: true, blockNextPublicSecurity: true } },
  { id: 'event_transition_inspection', name: '换届考察', type: 'negative', description: '省委启动换届考察，必须完成积累人脉任务，否则影响力受损。', effects: { mustCompleteConnections: true, organizationResourceBonus: 1 } },
  { id: 'event_integrity_week', name: '廉政教育周', type: 'mixed', description: '全省廉政教育周启动，纪委获得额外标记，查处成功率大幅提升。', effects: { disciplineMarksBonus: 2, disciplineSuccessRange: [3, 6], payPartyOrInfluence: true } }
];
