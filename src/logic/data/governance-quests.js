// src/logic/data/governance-quests.js
// 政务任务池：30个独立任务 + 20个连锁任务

export const GOVERNANCE_QUESTS = [
  // ============================================================
  // 🔵 民生工程（8个独立 + 4个连锁）
  // ============================================================
  {
    id: 'G001', category: '民生', title: '老旧小区供水改造',
    desc: '某老旧小区居民联名反映供水管道老化，经常停水，群众意见很大。',
    deadline: 3,
    options: [
      { label: '全面更换管道', cost: { housing: 3 }, effects: { popularity: 5, influence: 1 }, followUp: 'G001-F' },
      { label: '临时维修应付', cost: { housing: 1 }, effects: { popularity: 1 } },
      { label: '置之不理', cost: {}, effects: { popularity: -3 } },
    ],
  },
  {
    id: 'G002', category: '民生', title: '农民工讨薪事件',
    desc: '某建筑工地30余名农民工聚集讨薪，包工头跑路，劳动监察部门请你去处理。',
    deadline: 2,
    options: [
      { label: '动用财政垫付工资', cost: { finance: 2, finance: 1 }, effects: { popularity: 4, influence: 1 } },
      { label: '责令公安抓包工头', cost: { publicSecurity: 1 }, effects: { popularity: 2 } },
      { label: '称不在职责范围内', cost: {}, effects: { popularity: -4 } },
    ],
  },
  {
    id: 'G003', category: '民生', title: '学区划分争议',
    desc: '新学年学区重新划分，两拨家长分别上访要求将自己小区划入名校学区。',
    deadline: 2,
    options: [
      { label: '扩建学校增加学位', cost: { education: 3, housing: 1 }, effects: { popularity: 4 } },
      { label: '摇号决定公平公正', cost: { education: 1 }, effects: { popularity: 1 } },
      { label: '优先照顾关系户', cost: {}, effects: { popularity: -2, influence: 2 } },
    ],
  },
  {
    id: 'G004', category: '民生', title: '冬季供暖故障',
    desc: '供暖季来临，某大型供热站设备故障，数个小区面临停暖风险。',
    deadline: 1,
    options: [
      { label: '紧急调拨抢修资金', cost: { finance: 2, finance: 1 }, effects: { popularity: 3 } },
      { label: '协调其他热源调剂', cost: { sasac: 1, finance: 1 }, effects: { popularity: 2 } },
      { label: '发通告让居民理解', cost: {}, effects: { popularity: -3 } },
    ],
  },
  {
    id: 'G005', category: '民生', title: '农村危房改造申请',
    desc: '某乡镇提交了一批危房改造申请，涉及50余户困难家庭，资金缺口较大。',
    deadline: 3,
    options: [
      { label: '全额拨付改造资金', cost: { housing: 4, finance: 1 }, effects: { popularity: 6 }, followUp: 'G005-F' },
      { label: '分批拨付先改最危', cost: { housing: 2 }, effects: { popularity: 3 } },
      { label: '要求乡镇自筹', cost: {}, effects: { popularity: -2 } },
    ],
  },
  {
    id: 'G006', category: '民生', title: '医保报销难问题',
    desc: '多名慢性病患者反映医保报销比例低、流程繁琐，希望提高报销标准。',
    deadline: 3,
    options: [
      { label: '推动提高报销上限', cost: { finance: 3, finance: 1 }, effects: { popularity: 5 } },
      { label: '简化流程加快审批', cost: { finance: 1 }, effects: { popularity: 2 } },
      { label: '解释政策不变', cost: {}, effects: { popularity: -1 } },
    ],
  },
  {
    id: 'G007', category: '民生', title: '保障性住房分配',
    desc: '新一批保障房建成，但申请人数远超房源，如何分配成了难题。',
    deadline: 2,
    options: [
      { label: '严格审核摇号分配', cost: { housing: 1 }, effects: { popularity: 3 } },
      { label: '预留部分给引进人才', cost: {}, effects: { popularity: -1, influence: 2 } },
      { label: '暂缓分配继续审批', cost: {}, effects: { popularity: -2 } },
    ],
  },
  {
    id: 'G008', category: '民生', title: '食品安全抽检',
    desc: '市场监管部门发现某大型超市销售过期食品，涉及面广，需要处理。',
    deadline: 1,
    options: [
      { label: '重罚并公示曝光', cost: { finance: 1, propaganda: 1 }, effects: { popularity: 3 } },
      { label: '私下约谈罚款了事', cost: { funds: 1 }, effects: { popularity: -1 } },
      { label: '压下来不予处理', cost: {}, effects: { popularity: -4 } },
    ],
  },

  // ============================================================
  // 🟢 经济发展（6个独立 + 4个连锁）
  // ============================================================
  {
    id: 'G009', category: '经济', title: '招商引资洽谈会',
    desc: '某大型央企有意在本地投资建厂，需要你出面洽谈并提供优惠政策。',
    deadline: 3,
    options: [
      { label: '全力争取签订协议', cost: { ndrc: 3, sasac: 2 }, effects: { popularity: 3, funds: 3 }, followUp: 'G009-F' },
      { label: '提供基本条件看看', cost: { ndrc: 1 }, effects: { popularity: 1, funds: 1 } },
      { label: '婉拒推给隔壁市', cost: {}, effects: { popularity: -2 } },
    ],
  },
  {
    id: 'G010', category: '经济', title: '中小企业融资难',
    desc: '本地中小企业反映银行贷款审批严、利率高，要求政府协调解决。',
    deadline: 2,
    options: [
      { label: '设立担保基金贴息', cost: { finance: 3, finance: 1 }, effects: { popularity: 4, influence: 1 } },
      { label: '召开银企对接会', cost: { finance: 1 }, effects: { popularity: 1 } },
      { label: '回复自行解决', cost: {}, effects: { popularity: -3 } },
    ],
  },
  {
    id: 'G011', category: '经济', title: '特色产业扶持',
    desc: '某县提出打造特色农产品品牌的方案，请求省里资金和技术支持。',
    deadline: 3,
    options: [
      { label: '列入省级重点项目', cost: { finance: 2, ndrc: 2 }, effects: { popularity: 4 }, followUp: 'G011-F' },
      { label: '给予部分补贴', cost: { finance: 1 }, effects: { popularity: 2 } },
      { label: '建议自筹资金', cost: {}, effects: { popularity: -1 } },
    ],
  },
  {
    id: 'G012', category: '经济', title: '高新区土地审批',
    desc: '某科技企业申请在高新区拿地建研发中心，但土地指标紧张。',
    deadline: 2,
    options: [
      { label: '优先调配土地指标', cost: { housing: 2, ndrc: 1 }, effects: { popularity: 2, funds: 2 } },
      { label: '协调闲置厂房改造', cost: { ndrc: 1 }, effects: { popularity: 1 } },
      { label: '排队等指标', cost: {}, effects: { popularity: -2 } },
    ],
  },
  {
    id: 'G013', category: '经济', title: '交通基础设施修复',
    desc: '某国道多段路面破损严重，交通事故频发，沿线居民强烈要求修复。',
    deadline: 3,
    options: [
      { label: '全面翻修升级', cost: { ndrc: 4, housing: 2 }, effects: { popularity: 5 }, followUp: 'G013-F' },
      { label: '先修补最危险路段', cost: { housing: 1, housing: 1 }, effects: { popularity: 2 } },
      { label: '列入明年计划', cost: {}, effects: { popularity: -3 } },
    ],
  },
  {
    id: 'G014', category: '经济', title: '国企改制遗留问题',
    desc: '某改制国企退休职工反映养老金偏低，要求按照新标准重新核算。',
    deadline: 2,
    options: [
      { label: '按新标准差额补发', cost: { finance: 3, sasac: 2 }, effects: { popularity: 5 } },
      { label: '部分提高并解释', cost: { finance: 1 }, effects: { popularity: 2 } },
      { label: '维持原标准不变', cost: {}, effects: { popularity: -4 } },
    ],
  },

  // ============================================================
  // 🔴 维稳执法（6个独立 + 4个连锁）
  // ============================================================
  {
    id: 'G015', category: '维稳', title: '群体性事件预警',
    desc: '某乡镇因征地补偿纠纷，上百名村民准备集体上访，需要紧急应对。',
    deadline: 1,
    options: [
      { label: '连夜谈判提高补偿', cost: { finance: 2, publicSecurity: 2 }, effects: { popularity: 3 } },
      { label: '派公安维持秩序', cost: { publicSecurity: 2 }, effects: { popularity: -1 } },
      { label: '要求县里自行解决', cost: {}, effects: { popularity: -3 } },
    ],
  },
  {
    id: 'G016', category: '维稳', title: '网络谣言处置',
    desc: '某社交媒体流传关于本地某领导的负面信息，阅读量已达数十万。',
    deadline: 1,
    options: [
      { label: '公开调查及时回应', cost: { propaganda: 1 }, effects: { popularity: 2, influence: 1 } },
      { label: '删帖封号压制舆论', cost: { propaganda: 2 }, effects: { popularity: -2 } },
      { label: '不做回应冷处理', cost: {}, effects: { popularity: -1 } },
    ],
  },
  {
    id: 'G017', category: '维稳', title: '打黑除恶专项行动',
    desc: '上级要求开展新一轮打黑除恶行动，需要你组织部署。',
    deadline: 3,
    options: [
      { label: '全力推进从严打击', cost: { publicSecurity: 3, legalAffairs: 2 }, effects: { popularity: 5 }, followUp: 'G017-F' },
      { label: '常规部署按部就班', cost: { publicSecurity: 1 }, effects: { popularity: 2 } },
      { label: '象征性应付检查', cost: {}, effects: { popularity: -2 } },
    ],
  },
  {
    id: 'G018', category: '维稳', title: '信访积案化解',
    desc: '某上访户的案子拖了五年，近期频繁出现在省委门口，影响不好。',
    deadline: 2,
    options: [
      { label: '成立专班彻底解决', cost: { legalAffairs: 2, legalAffairs: 1 }, effects: { popularity: 3 } },
      { label: '给笔钱劝返了事', cost: { funds: 1 }, effects: { popularity: 1 } },
      { label: '继续拖着', cost: {}, effects: { popularity: -2 } },
    ],
  },
  {
    id: 'G019', category: '维稳', title: '校园欺凌事件',
    desc: '某中学发生严重校园欺凌事件，视频在网上热传，社会影响恶劣。',
    deadline: 1,
    options: [
      { label: '成立调查组严肃处理', cost: { education: 1, education: 1 }, effects: { popularity: 4 } },
      { label: '责令学校内部处理', cost: {}, effects: { popularity: -1 } },
      { label: '发声明表示关注', cost: {}, effects: { popularity: 0 } },
    ],
  },
  {
    id: 'G020', category: '维稳', title: '环保督查整改',
    desc: '中央环保督查组发现某化工厂违规排放，要求限期整改，企业威胁裁员。',
    deadline: 2,
    options: [
      { label: '坚决关停整改', cost: { publicSecurity: 2 }, effects: { popularity: 3 }, followUp: 'G020-F' },
      { label: '限产整改保就业', cost: { sasac: 1, publicSecurity: 1 }, effects: { popularity: 1 } },
      { label: '给企业打招呼放水', cost: {}, effects: { popularity: -4 } },
    ],
  },

  // ============================================================
  // 🟣 政治博弈（6个独立 + 4个连锁）
  // ============================================================
  {
    id: 'G021', category: '政治', title: '干部考察选拔',
    desc: '某重要岗位空缺，多名候选人竞争激烈，都在找你活动关系。',
    deadline: 2,
    options: [
      { label: '严格按程序选拔', cost: { organization: 1 }, effects: { influence: 3 } },
      { label: '提拔自己派系的人', cost: { organization: 2 }, effects: { influence: 2, popularity: -1 } },
      { label: '让各方推荐人选', cost: {}, effects: { popularity: 1 } },
    ],
  },
  {
    id: 'G022', category: '政治', title: '上级调研接待',
    desc: '省委主要领导近期要到本地调研，需要精心准备。',
    deadline: 1,
    options: [
      { label: '全面准备展示政绩', cost: { propaganda: 2, organization: 1 }, effects: { influence: 3 } },
      { label: '实事求是安排行程', cost: { propaganda: 1 }, effects: { influence: 1 } },
      { label: '敷衍了事', cost: {}, effects: { influence: -2 } },
    ],
  },
  {
    id: 'G023', category: '政治', title: '民主生活会',
    desc: '年度民主生活会即将召开，需要准备材料并决定会议基调。',
    deadline: 2,
    options: [
      { label: '严肃认真自我批评', cost: {}, effects: { influence: 1, popularity: 2 } },
      { label: '形式化走流程', cost: {}, effects: { influence: -1, popularity: -1 } },
      { label: '借机批评竞争对手', cost: { propaganda: 2 }, effects: { influence: 2, popularity: -2 } },
    ],
  },
  {
    id: 'G024', category: '政治', title: '人大代表提案',
    desc: '某人大代表联名提出一项重要提案，需要你在常委会上表态。',
    deadline: 1,
    options: [
      { label: '旗帜鲜明支持', cost: { organization: 1 }, effects: { influence: 2, popularity: 1 } },
      { label: '附条件支持', cost: {}, effects: { influence: 1 } },
      { label: '反对提案', cost: {}, effects: { influence: -1, popularity: -1 } },
    ],
  },
  {
    id: 'G025', category: '政治', title: '媒体专访邀约',
    desc: '省级党报邀请你接受专访，谈谈本年度工作成绩和未来规划。',
    deadline: 2,
    options: [
      { label: '精心准备深度访谈', cost: { propaganda: 2 }, effects: { influence: 3, popularity: 2 } },
      { label: '简单应付一下', cost: {}, effects: { influence: 1 } },
      { label: '推掉采访', cost: {}, effects: { influence: -1 } },
    ],
  },
  {
    id: 'G026', category: '政治', title: '党校培训名额分配',
    desc: '今年省委党校青干班名额有限，多个部门都在争取。',
    deadline: 1,
    options: [
      { label: '优先推荐本派系', cost: { organization: 1 }, effects: { influence: 2 } },
      { label: '公开选拔竞争', cost: {}, effects: { influence: 1, popularity: 1 } },
      { label: '把名额让给其他部门', cost: {}, effects: { influence: -1, popularity: 1 } },
    ],
  },

  // ============================================================
  // 🟠 危机处理（4个独立 + 4个连锁）
  // ============================================================
  {
    id: 'G027', category: '危机', title: '自然灾害应急',
    desc: '某县突发暴雨引发山洪，部分村庄被淹，需要紧急部署救灾。',
    deadline: 1,
    options: [
      { label: '立即启动应急响应', cost: { finance: 3, publicSecurity: 2 }, effects: { popularity: 5 }, followUp: 'G027-F' },
      { label: '调拨救灾基本物资', cost: { finance: 1 }, effects: { popularity: 2 } },
      { label: '等上面拨钱救灾', cost: {}, effects: { popularity: -5 } },
    ],
  },
  {
    id: 'G028', category: '危机', title: '突发公共卫生事件',
    desc: '某学校爆发聚集性食物中毒，已有数十名学生送医。',
    deadline: 1,
    options: [
      { label: '立即调查封锁源头', cost: { finance: 2, education: 1 }, effects: { popularity: 3 } },
      { label: '先控制舆论再处理', cost: { propaganda: 2 }, effects: { popularity: -1 } },
      { label: '等医院报告出来再说', cost: {}, effects: { popularity: -4 } },
    ],
  },
  {
    id: 'G029', category: '危机', title: '安全生产事故',
    desc: '某煤矿发生瓦斯爆炸，初步统计有人员伤亡，需要马上应对。',
    deadline: 1,
    options: [
      { label: '亲赴现场指挥救援', cost: { finance: 3 }, effects: { popularity: 4 }, followUp: 'G029-F' },
      { label: '派工作组处理', cost: { finance: 1 }, effects: { popularity: 1 } },
      { label: '压住消息内部处理', cost: { propaganda: 2 }, effects: { popularity: -5 } },
    ],
  },
  {
    id: 'G030', category: '危机', title: '财政预算缺口',
    desc: '年底盘账发现今年财政预算出现较大缺口，直接影响明年的支出计划。',
    deadline: 3,
    options: [
      { label: '压缩行政开支开源', cost: { finance: 2, finance: 2 }, effects: { popularity: 2 } },
      { label: '发行地方债补充', cost: { finance: 3 }, effects: { popularity: 0, funds: 2 }, followUp: 'G030-F' },
      { label: '砍掉部分民生项目', cost: {}, effects: { popularity: -4 } },
    ],
  },
];

// ============================================================
// 连锁任务（20个）— 完成特定选项后触发
// ============================================================
export const FOLLOWUP_QUESTS = {
  // 民生连锁
  'G001-F': {
    id: 'G001-F', category: '民生', title: '老旧小区改造后续：加装电梯',
    desc: '供水改造完成后，该小区居民又提出加装电梯的需求，高层住户尤其是老年人呼声强烈。',
    deadline: 2,
    options: [
      { label: '拨款补贴加装', cost: { housing: 3, housing: 1 }, effects: { popularity: 4 } },
      { label: '协调业主自筹', cost: { housing: 1 }, effects: { popularity: 1 } },
      { label: '暂不处理', cost: {}, effects: { popularity: -1 } },
    ],
  },
  'G005-F': {
    id: 'G005-F', category: '民生', title: '危房改造后续：新农村建设',
    desc: '危房改造完成反响很好，该乡镇请求继续支持新农村整体规划建设。',
    deadline: 3,
    options: [
      { label: '纳入新农村示范点', cost: { housing: 3, ndrc: 2 }, effects: { popularity: 6 } },
      { label: '提供部分配套资金', cost: { housing: 1, housing: 1 }, effects: { popularity: 3 } },
      { label: '建议自行规划', cost: {}, effects: { popularity: -1 } },
    ],
  },
  'G003-F': {
    id: 'G003-F', category: '民生', title: '学区后续：教师资源分配',
    desc: '学校扩建后，家长们又开始关注师资质量问题，要求调配优秀教师。',
    deadline: 2,
    options: [
      { label: '推动教师轮岗制度', cost: { education: 2, organization: 1 }, effects: { popularity: 3 } },
      { label: '招聘新教师补充', cost: { education: 1, education: 1 }, effects: { popularity: 2 } },
      { label: '维持现状', cost: {}, effects: { popularity: -2 } },
    ],
  },
  'G008-F': {
    id: 'G008-F', category: '民生', title: '食品安全后续：建立长效机制',
    desc: '超市处罚后，市民要求建立食品安全常态监管机制。',
    deadline: 2,
    options: [
      { label: '建立智慧监管平台', cost: { finance: 2, finance: 1 }, effects: { popularity: 3 } },
      { label: '加大抽检频率', cost: { finance: 1 }, effects: { popularity: 1 } },
      { label: '口头承诺改进', cost: {}, effects: { popularity: -1 } },
    ],
  },

  // 经济连锁
  'G009-F': {
    id: 'G009-F', category: '经济', title: '招商后续：配套产业链引入',
    desc: '央企入驻后，需要引入上下游配套企业，打造完整产业链。',
    deadline: 3,
    options: [
      { label: '规划产业园区', cost: { housing: 3, ndrc: 2, finance: 1 }, effects: { popularity: 3, funds: 3 } },
      { label: '提供税收优惠', cost: { finance: 2 }, effects: { popularity: 1, funds: 1 } },
      { label: '让市场自行发展', cost: {}, effects: { popularity: 0 } },
    ],
  },
  'G011-F': {
    id: 'G011-F', category: '经济', title: '特色产业后续：举办展销会',
    desc: '特色产业初具规模，需要打开市场，县里请求省级举办展销推广活动。',
    deadline: 2,
    options: [
      { label: '举办省级农博会', cost: { propaganda: 3, propaganda: 2 }, effects: { popularity: 3, funds: 2 } },
      { label: '线上推广补贴', cost: { propaganda: 1 }, effects: { popularity: 1 } },
      { label: '让县里自行推广', cost: {}, effects: { popularity: -1 } },
    ],
  },
  'G013-F': {
    id: 'G013-F', category: '经济', title: '公路修复后续：沿线经济开发',
    desc: '公路修好后，沿线乡镇纷纷提出开发请求，希望借此带动当地经济。',
    deadline: 3,
    options: [
      { label: '制定沿线开发规划', cost: { ndrc: 3, housing: 2 }, effects: { popularity: 4, funds: 2 } },
      { label: '试点开发一两个镇', cost: { ndrc: 1 }, effects: { popularity: 2 } },
      { label: '暂不开发保护耕地', cost: {}, effects: { popularity: -1 } },
    ],
  },
  'G014-F': {
    id: 'G014-F', category: '危机', title: '养老金后续：社保基金安全',
    desc: '养老金补发后，社保基金面临压力，需要想办法充实基金池。',
    deadline: 3,
    options: [
      { label: '划转国资充实社保', cost: { sasac: 3, finance: 2 }, effects: { popularity: 3, influence: 1 } },
      { label: '提高缴费比例', cost: {}, effects: { popularity: -3 } },
      { label: '申请上级转移支付', cost: { finance: 1 }, effects: { popularity: 1 } },
    ],
  },

  // 维稳连锁
  'G015-F': {
    id: 'G015-F', category: '维稳', title: '征地后续：失地农民就业',
    desc: '征地补偿完成后，失地农民面临就业问题，要求安排工作或技能培训。',
    deadline: 3,
    options: [
      { label: '开展职业技能培训', cost: { education: 2, education: 2 }, effects: { popularity: 4 } },
      { label: '安排到附近工厂', cost: { sasac: 1, education: 1 }, effects: { popularity: 2 } },
      { label: '发一次性补偿了事', cost: { finance: 1 }, effects: { popularity: 0 } },
    ],
  },
  'G017-F': {
    id: 'G017-F', category: '维稳', title: '打黑后续：建立长效机制',
    desc: '打黑除恶取得成效，上级要求建立防止黑恶势力反弹的长效机制。',
    deadline: 2,
    options: [
      { label: '设立专项举报平台', cost: { publicSecurity: 2, publicSecurity: 1 }, effects: { popularity: 3 } },
      { label: '定期巡查排查', cost: { publicSecurity: 1 }, effects: { popularity: 1 } },
      { label: '打黑结束解散专班', cost: {}, effects: { popularity: -1 } },
    ],
  },
  'G019-F': {
    id: 'G019-F', category: '民生', title: '校园欺凌后续：心理健康教育',
    desc: '事件处理后，教育局建议在各校推广心理健康教育和反欺凌课程。',
    deadline: 2,
    options: [
      { label: '全面推广心理课程', cost: { education: 2, education: 1 }, effects: { popularity: 4 } },
      { label: '试点几所学校', cost: { education: 1 }, effects: { popularity: 2 } },
      { label: '暂不推广', cost: {}, effects: { popularity: -1 } },
    ],
  },
  'G020-F': {
    id: 'G020-F', category: '经济', title: '环保整改后续：绿色产业转型',
    desc: '化工厂关停后，当地经济受损，需要引导产业转型发展绿色经济。',
    deadline: 3,
    options: [
      { label: '引导发展环保产业', cost: { ndrc: 3, sasac: 2 }, effects: { popularity: 3, funds: 2 } },
      { label: '招商引资填补空缺', cost: { ndrc: 2 }, effects: { popularity: 1 } },
      { label: '让市场自行调节', cost: {}, effects: { popularity: -2 } },
    ],
  },

  // 政治连锁
  'G021-F': {
    id: 'G021-F', category: '政治', title: '干部选拔后续：新干部培训',
    desc: '新任干部已到位，但业务不熟效率低，需要组织培训。',
    deadline: 2,
    options: [
      { label: '组织系统培训', cost: { education: 1, organization: 1 }, effects: { influence: 2 } },
      { label: '老带新帮带', cost: {}, effects: { influence: 1 } },
      { label: '让其自学成才', cost: {}, effects: { influence: -1 } },
    ],
  },
  'G022-F': {
    id: 'G022-F', category: '政治', title: '调研后续：落实领导指示',
    desc: '调研结束后，领导留下多项指示，需要逐条落实并汇报。',
    deadline: 3,
    options: [
      { label: '逐条落实定期汇报', cost: { organization: 3, organization: 2 }, effects: { influence: 4 } },
      { label: '选择性落实几条', cost: { organization: 1 }, effects: { influence: 1 } },
      { label: '写份报告交差', cost: {}, effects: { influence: -2 } },
    ],
  },
  'G024-F': {
    id: 'G024-F', category: '政治', title: '提案后续：推动立法调研',
    desc: '提案获得通过后，需要进行深入的立法调研，为正式立法做准备。',
    deadline: 3,
    options: [
      { label: '组织专题调研', cost: { legalAffairs: 2, legalAffairs: 1 }, effects: { influence: 3, popularity: 1 } },
      { label: '委托专家起草', cost: { legalAffairs: 1 }, effects: { influence: 1 } },
      { label: '搁置等待时机', cost: {}, effects: { influence: -1 } },
    ],
  },
  'G025-F': {
    id: 'G025-F', category: '政治', title: '专访后续：舆论热度管理',
    desc: '专访发表后引发热议，有赞有贬，需要管理后续舆论走向。',
    deadline: 1,
    options: [
      { label: '跟进正面宣传', cost: { propaganda: 2 }, effects: { influence: 2 } },
      { label: '冷处理降温', cost: {}, effects: { influence: 0 } },
      { label: '回应质疑开撕', cost: { propaganda: 1 }, effects: { influence: 1, popularity: -1 } },
    ],
  },

  // 危机连锁
  'G027-F': {
    id: 'G027-F', category: '危机', title: '救灾后续：灾后重建规划',
    desc: '救灾基本结束，需要制定灾后重建计划，帮助受灾群众恢复生活。',
    deadline: 3,
    options: [
      { label: '全面统筹重建', cost: { housing: 4, finance: 3, ndrc: 2 }, effects: { popularity: 6 } },
      { label: '分批重建先急后缓', cost: { housing: 2, finance: 1 }, effects: { popularity: 3 } },
      { label: '发放救灾款自行重建', cost: { finance: 2 }, effects: { popularity: 1 } },
    ],
  },
  'G028-F': {
    id: 'G028-F', category: '危机', title: '食物中毒后续：全市食品安全检查',
    desc: '事件平息后，市政府要求开展全市范围的食品安全大检查。',
    deadline: 2,
    options: [
      { label: '全覆盖拉网式检查', cost: { publicSecurity: 3, publicSecurity: 1 }, effects: { popularity: 4 } },
      { label: '抽查重点区域', cost: { publicSecurity: 1 }, effects: { popularity: 2 } },
      { label: '发文要求自查', cost: {}, effects: { popularity: -1 } },
    ],
  },
  'G029-F': {
    id: 'G029-F', category: '危机', title: '矿难后续：安全生产整治',
    desc: '事故调查结束后，上级要求开展全省安全生产大整治。',
    deadline: 2,
    options: [
      { label: '关停不合规企业', cost: { publicSecurity: 2 }, effects: { popularity: 3, funds: -1 } },
      { label: '整改排查隐患', cost: { publicSecurity: 1, sasac: 1 }, effects: { popularity: 2 } },
      { label: '开会强调安全', cost: {}, effects: { popularity: -2 } },
    ],
  },
  'G030-F': {
    id: 'G030-F', category: '经济', title: '债务后续：提高财政效率',
    desc: '发债缓解了短期压力，但长远需要提高财政资金使用效率。',
    deadline: 3,
    options: [
      { label: '推进绩效预算改革', cost: { finance: 3, finance: 2 }, effects: { popularity: 2, influence: 1 } },
      { label: '削减非必要开支', cost: {}, effects: { popularity: -1, funds: 1 } },
      { label: '维持现状不管', cost: {}, effects: { popularity: -2 } },
    ],
  },
};
