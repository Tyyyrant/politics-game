// src/logic/data/independent-officials.js
// Pool of unaffiliated officials who can be recruited by any faction
// When recruited, they gain the "曾受你的提拔" (mentored) trait and join the faction

export const INDEPENDENT_OFFICIALS = [
  // === 政府办公厅 ===
  { name: '王建民', dept: 'govOffice', position: '秘书二处处长', rank: '正处' },
  { name: '陈文华', dept: 'govOffice', position: '档案处处长', rank: '正处' },
  { name: '赵志强', dept: 'govOffice', position: '一处副处长', rank: '副处' },
  { name: '孙丽萍', dept: 'govOffice', position: '二处副处长', rank: '副处' },

  // === 发改委 ===
  { name: '周明远', dept: 'ndrc', position: '投资处处长', rank: '正处' },
  { name: '吴国强', dept: 'ndrc', position: '产业处处长', rank: '正处' },
  { name: '郑伟', dept: 'ndrc', position: '审批处处长', rank: '正处' },
  { name: '冯建军', dept: 'ndrc', position: '一处副处长', rank: '副处' },

  // === 国资委 ===
  { name: '褚建国', dept: 'sasac', position: '一处处长', rank: '正处' },
  { name: '韩雪梅', dept: 'sasac', position: '二处处长', rank: '正处' },
  { name: '沈志刚', dept: 'sasac', position: '一处副处长', rank: '副处' },

  // === 公安厅 ===
  { name: '杨卫东', dept: 'publicSecurity', position: '二处处长', rank: '正处' },
  { name: '朱学军', dept: 'publicSecurity', position: '三处处长', rank: '正处' },
  { name: '秦大明', dept: 'publicSecurity', position: '一处副处长', rank: '副处' },
  { name: '许建华', dept: 'publicSecurity', position: '二处副处长', rank: '副处' },

  // === 人社厅 ===
  { name: '何耀华', dept: 'hrss', position: '一处处长', rank: '正处' },
  { name: '吕秀英', dept: 'hrss', position: '二处处长', rank: '正处' },
  { name: '施国栋', dept: 'hrss', position: '一处副处长', rank: '副处' },

  // === 财政厅 ===
  { name: '张德奎', dept: 'finance', position: '一处处长', rank: '正处' },
  { name: '孔祥瑞', dept: 'finance', position: '四处处长', rank: '正处' },
  { name: '曹丽华', dept: 'finance', position: '一处副处长', rank: '副处' },

  // === 住建厅 ===
  { name: '严志明', dept: 'housing', position: '二处处长', rank: '正处' },
  { name: '华国强', dept: 'housing', position: '三处处长', rank: '正处' },
  { name: '金卫东', dept: 'housing', position: '一处副处长', rank: '副处' },

  // === 教育厅 ===
  { name: '魏文博', dept: 'education', position: '三处处长', rank: '正处' },
  { name: '陶明华', dept: 'education', position: '四处处长', rank: '正处' },
  { name: '姜桂英', dept: 'education', position: '一处副处长', rank: '副处' },

  // === 审计厅 ===
  { name: '戚建国', dept: 'audit', position: '二处处长', rank: '正处' },
  { name: '谢志强', dept: 'audit', position: '三处处长', rank: '正处' },
  { name: '邹丽娟', dept: 'audit', position: '一处副处长', rank: '副处' },

  // === 党委办公厅 ===
  { name: '苏建华', dept: 'partyOffice', position: '综合处处长', rank: '正处' },
  { name: '潘国栋', dept: 'partyOffice', position: '会议处处长', rank: '正处' },
  { name: '葛明辉', dept: 'partyOffice', position: '信息处处长', rank: '正处' },
  { name: '范学军', dept: 'partyOffice', position: '一处副处长', rank: '副处' },

  // === 组织部 ===
  { name: '彭志远', dept: 'organization', position: '干部处处长', rank: '正处' },
  { name: '鲁建华', dept: 'organization', position: '人才处处长', rank: '正处' },
  { name: '马红梅', dept: 'organization', position: '一处副处长', rank: '副处' },

  // === 宣传部 ===
  { name: '方文华', dept: 'propaganda', position: '舆论处处长', rank: '正处' },
  { name: '袁志刚', dept: 'propaganda', position: '文化处处长', rank: '正处' },
  { name: '柳建民', dept: 'propaganda', position: '一处副处长', rank: '副处' },

  // === 纪委 ===
  { name: '任国强', dept: 'discipline', position: '二处处长', rank: '正处' },
  { name: '董建军', dept: 'discipline', position: '三处处长', rank: '正处' },
  { name: '史文斌', dept: 'discipline', position: '一处副处长', rank: '副处' },

  // === 政法委 ===
  { name: '唐志华', dept: 'legalAffairs', position: '执法处处长', rank: '正处' },
  { name: '薛明远', dept: 'legalAffairs', position: '维稳处处长', rank: '正处' },
  { name: '贺国栋', dept: 'legalAffairs', position: '一处副处长', rank: '副处' },

  // === 党校 ===
  { name: '倪建华', dept: 'partySchool', position: '教务处处长', rank: '正处' },
  { name: '汤志强', dept: 'partySchool', position: '科研处处长', rank: '正处' },
  { name: '殷学文', dept: 'partySchool', position: '一处副处长', rank: '副处' },

  // === 人大 ===
  { name: '罗卫国', dept: 'congress', position: '监督处处长', rank: '正处' },
  { name: '毕建国', dept: 'congress', position: '代表处处长', rank: '正处' },

  // === 政协 ===
  { name: '郝志刚', dept: 'cppcc', position: '提案处处长', rank: '正处' },
  { name: '邬明华', dept: 'cppcc', position: '文史处处长', rank: '正处' },

  // === 检察院 ===
  { name: '安国栋', dept: 'procuratorate', position: '一处处长', rank: '正处' },
  { name: '常志强', dept: 'procuratorate', position: '二处处长', rank: '正处' },
  { name: '乐建华', dept: 'procuratorate', position: '一处副处长', rank: '副处' },
];
