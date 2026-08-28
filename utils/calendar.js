let Solar = null;
let solarLoadFailed = false;

const { addDays, getDayDiff, parseDate } = require("./date");
const { getBirthChart, getDailyBaziInsight, getPersonalDayRelation } = require("./bazi");
const { isClassicCopyEnabled, translateCopyData } = require("./vocabulary");

const dateSummaryCache = {};
const goodDayCache = {};
const birthZodiacCache = {};
const monthCalendarCache = {};
const lunarDateCache = {};

const CALENDAR_RULE_VERSION = "2026.07.29-1";

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const ACTIONS = {
  love: {
    name: "感情",
    yi: ["会亲友", "纳采", "订盟", "出行"],
    ji: ["会亲友", "纳采", "订盟", "出行"],
    coreJi: ["会亲友", "纳采", "订盟"],
    yiWeights: { "会亲友": 20, "纳采": 16, "订盟": 14, "出行": 8 },
    explain: "适合见面、表达心意或自然推进关系。",
    action: "适合安排约会、表白和重要沟通，给彼此留出自然空间。"
  },
  marry: {
    name: "结婚",
    yi: ["嫁娶", "纳采", "订盟"],
    ji: ["嫁娶", "纳采", "订盟"],
    coreJi: ["嫁娶", "纳采", "订盟"],
    explain: "适合推进关系承诺，氛围更稳。",
    action: "适合定日期、沟通流程、确认双方家庭安排。"
  },
  social: {
    name: "社交",
    yi: ["会亲友", "进人口", "出行"],
    ji: ["会亲友", "进人口", "出行"],
    coreJi: ["会亲友", "进人口"],
    yiWeights: { "会亲友": 20, "进人口": 14, "出行": 10 },
    explain: "适合见面、拜访和推进重要沟通。",
    action: "适合聚会、拜访和第一次见面，重要话题先倾听再表达。"
  },
  move: {
    name: "搬家",
    yi: ["入宅", "移徙", "安床"],
    ji: ["入宅", "移徙", "安床"],
    coreJi: ["入宅", "移徙", "安床"],
    explain: "适合安顿空间，整理新生活。",
    action: "适合入宅、安床、整理动线，重物搬运提前安排。"
  },
  car: {
    name: "提车",
    yi: ["出行", "交易", "纳财", "立券"],
    ji: ["出行", "交易", "纳财"],
    coreJi: ["交易", "纳财"],
    explain: "适合办理交易和出行相关事项。",
    action: "适合验车、办手续、熟悉路线，避免赶时间交付。"
  },
  contract: {
    name: "签约",
    yi: ["立券", "立券交易", "交易", "纳财", "订盟"],
    ji: ["立券", "立券交易", "交易", "纳财", "订盟"],
    coreJi: ["立券", "立券交易", "交易", "纳财", "订盟"],
    yiWeights: { "立券": 20, "立券交易": 20, "交易": 16, "纳财": 14, "订盟": 12 },
    explain: "适合确认条款、交易和建立正式约定。",
    action: "适合签合同、付款或谈合作，签署前仍要逐项核对条款。"
  },
  travel: {
    name: "出行",
    yi: ["出行", "赴任", "移徙"],
    ji: ["出行", "赴任"],
    coreJi: ["出行", "赴任"],
    explain: "适合出门走动，行程推进更顺。",
    action: "适合定行程、出发、拜访，重要证件提前检查。"
  },
  open: {
    name: "开业",
    yi: ["开市", "交易", "立券", "纳财"],
    ji: ["开市", "交易", "立券", "纳财"],
    coreJi: ["开市", "交易", "立券", "纳财"],
    explain: "适合启动经营、发布和交易相关计划。",
    action: "适合开张、发布、签单，关键物料提前确认。"
  },
  study: {
    name: "学业",
    yi: ["入学", "习艺"],
    ji: ["入学", "习艺"],
    coreJi: ["入学", "习艺"],
    yiWeights: { "入学": 22, "习艺": 20 },
    explain: "适合开始课程、训练或新的学业计划。",
    action: "适合报名、开课和建立学业节奏，先完成一个明确的小目标。"
  }
};

const ACTION_ADVICE = {
  love: {
    "会亲友": "安排见面或共同活动",
    "纳采": "坦诚表达心意并确认彼此期待",
    "订盟": "把关系中的重要约定谈清楚",
    "出行": "用一次轻松出行增加相处时间"
  },
  marry: {
    "嫁娶": "推进领证、婚礼或仪式安排",
    "纳采": "沟通双方家庭与礼仪安排",
    "订盟": "确认日期、预算和共同约定"
  },
  social: {
    "会亲友": "安排聚会、拜访或第一次见面",
    "进人口": "推进家庭相关的重要沟通",
    "出行": "把见面安排在轻松的外出场景"
  },
  move: {
    "入宅": "完成入宅和主要物品归位",
    "移徙": "安排搬运、钥匙交接与路线确认",
    "安床": "布置卧室并确定床位"
  },
  car: {
    "出行": "完成试驾并熟悉常用路线",
    "交易": "确认车况、价格与交付清单",
    "纳财": "处理付款、保险和票据",
    "立券": "签署合同并复核车辆信息"
  },
  contract: {
    "立券": "签署文件并逐项复核条款",
    "立券交易": "完成签署、交易和凭证留存",
    "交易": "推进交易并确认交付边界",
    "纳财": "处理付款、回款与票据",
    "订盟": "确认合作承诺和后续节点"
  },
  travel: {
    "出行": "启程、拜访或推进主要行程",
    "赴任": "办理到岗和工作交接",
    "移徙": "完成跨城移动与落脚安排"
  },
  open: {
    "开市": "启动营业、上线或正式发布",
    "交易": "推进首批订单与客户确认",
    "立券": "完成合同、凭证和规则确认",
    "纳财": "安排收款、账目与资金核对"
  },
  study: {
    "入学": "完成报名、入学或课程启动",
    "习艺": "开始训练并建立固定学习节奏"
  }
};

const ACTION_DATE_GUIDANCE = {
  love: {
    execution: [
      "把重点放在坦诚表达，不急着一次谈完所有问题",
      "安排一段不被打断的相处时间，先确认彼此感受",
      "重要话题先说清期待，再讨论下一步安排",
      "用轻松见面建立氛围，承诺类决定留出回应时间"
    ],
    risk: [
      "避免在情绪上升时追问答案",
      "临时改变约定前先说明原因",
      "涉及关系承诺时不要用含糊表达代替确认",
      "双方节奏不一致时先留缓冲，不宜催促表态"
    ]
  },
  marry: {
    execution: [
      "优先锁定日期、场地和关键参与人",
      "把预算、证件与流程拆成可核对的清单",
      "先完成双方家庭共识，再确认对外安排",
      "仪式与文书分开复核，避免关键节点遗漏"
    ],
    risk: [
      "涉及证件和正式登记时应再次核对信息",
      "预算与人数未确认前不宜仓促支付大额定金",
      "双方家庭意见不同处应提前留出协调时间",
      "仪式流程变更需同步所有关键参与人"
    ]
  },
  social: {
    execution: [
      "先确认见面目的，再选择更合适的交流场景",
      "把重要沟通放在人数较少、干扰较低的时段",
      "第一次见面以建立信任为主，不急着推进结论",
      "多人协作先明确发言顺序和后续责任人"
    ],
    risk: [
      "避免在信息不完整时替他人作出承诺",
      "重要口头约定应在会后形成简短确认",
      "多人场合不宜临时讨论敏感议题",
      "行程和参与人变化时要及时同步"
    ]
  },
  move: {
    execution: [
      "先完成钥匙、水电和主要动线确认",
      "重物搬运与易碎物品分批安排",
      "优先归位卧室和日常必需品，再处理装饰",
      "把搬运、保洁和安装时间错开，减少现场等待"
    ],
    risk: [
      "搬运前再次确认电梯、停车和物业限制",
      "贵重物品与重要文件应单独保管",
      "临时施工和大件安装要预留安全空间",
      "床位、电器和燃气相关安排不宜仓促决定"
    ]
  },
  car: {
    execution: [
      "先验车并核对车架号，再进入签署和付款环节",
      "保险、发票与交付清单应逐项确认",
      "试驾重点检查制动、灯光和常用功能",
      "提车后先熟悉路线与车辆设置，不急于长途驾驶"
    ],
    risk: [
      "付款前不要省略车辆信息与合同复核",
      "发现外观或配置差异时应现场留证",
      "交付时间紧张也不要跳过试驾和功能检查",
      "票据、保险和临牌未齐全前不宜匆忙离店"
    ]
  },
  contract: {
    execution: [
      "先确认权责、金额与交付边界，再进入签署",
      "把付款节点、违约责任和验收条件单独标记",
      "口头补充内容应同步写入合同或确认文件",
      "签署前核对主体信息、附件和最终版本"
    ],
    risk: [
      "不可逆条款和自动续约内容需要重点复核",
      "付款账户与合同主体不一致时应暂停确认",
      "版本临时变更时要重新核对修改位置",
      "授权范围和违约责任不清晰时不宜直接签署"
    ]
  },
  travel: {
    execution: [
      "先核对证件、票务和交通衔接",
      "给换乘、天气和行李处理预留缓冲",
      "把出发前事项与抵达后的安排分开确认",
      "重要拜访提前确认时间、地址和联系人"
    ],
    risk: [
      "临近出发不宜再加入过多临时行程",
      "交通和天气变化时应保留替代路线",
      "证件、票据与重要物品应出发前集中复核",
      "跨城衔接较紧时不要压缩必要休息时间"
    ]
  },
  open: {
    execution: [
      "优先确认营业流程、收款与现场责任人",
      "把对外发布、客户承接和售后安排连成完整流程",
      "先完成物料、库存与系统检查，再正式启动",
      "首日目标宜聚焦关键客户与核心产品"
    ],
    risk: [
      "收款、合同和库存数据需要交叉核对",
      "宣传内容与实际交付能力不宜出现偏差",
      "关键岗位和应急联系人未确认前不要仓促启动",
      "首日安排过满容易影响服务质量，应预留机动时间"
    ]
  },
  study: {
    execution: [
      "先明确课程目标和第一阶段完成标准",
      "把报名、资料准备和学习时间一次安排清楚",
      "优先建立固定节奏，再逐步增加学习强度",
      "先完成一个可验证的小目标，及时检查理解程度"
    ],
    risk: [
      "不要同时开启过多课程或训练计划",
      "资料和报名信息未核对前不宜匆忙付款",
      "学习安排过满时应保留复习和休息时间",
      "目标过于宽泛会降低执行感，需要拆成具体节点"
    ]
  }
};

const DAY_OFFICER_SCORES = {
  "成": 3,
  "开": 3,
  "定": 2,
  "满": 1,
  "建": 1,
  "除": 1,
  "执": 0,
  "收": 0,
  "平": 0,
  "危": -1,
  "闭": -2,
  "破": -4
};

const DAY_OFFICER_FOCUS = {
  "成": "落实与收口",
  "开": "启动与公开",
  "定": "确认与敲定",
  "满": "完善与补足",
  "建": "建立新安排",
  "除": "清理阻碍",
  "执": "按计划执行",
  "收": "整理与确认",
  "平": "平稳推进",
  "危": "检查与留缓冲",
  "闭": "准备与沉淀",
  "破": "调整与止损"
};

const TIAN_SHEN_GUIDANCE = {
  "青龙": { label: "沟通协作", adviceIndex: 0, reason: "适合先建立共识，再推进关键步骤" },
  "明堂": { label: "流程确认", adviceIndex: 1, reason: "适合处理公开确认、预约与流程安排" },
  "天刑": { label: "细节复核", adviceIndex: 2, reason: "更需要把规则、边界和责任核对清楚" },
  "朱雀": { label: "表达沟通", adviceIndex: 0, reason: "沟通可以推进，但重要约定宜留下书面确认" },
  "金匮": { label: "文书预算", adviceIndex: 2, reason: "适合关注凭证、预算与重要物品" },
  "天德": { label: "协调共识", adviceIndex: 1, reason: "适合兼顾双方需求，减少临时分歧" },
  "白虎": { label: "风险检查", adviceIndex: 2, reason: "执行前应多留一轮安全与细节检查" },
  "玉堂": { label: "仪式文书", adviceIndex: 0, reason: "适合处理仪式、文书和对外呈现" },
  "天牢": { label: "边界确认", adviceIndex: 2, reason: "宜先确认限制条件，再安排不可逆步骤" },
  "玄武": { label: "信息核验", adviceIndex: 1, reason: "重要信息与口头承诺适合再次核验" },
  "司命": { label: "执行落地", adviceIndex: 0, reason: "适合按明确清单和时间节点推进" },
  "勾陈": { label: "资源协调", adviceIndex: 1, reason: "宜先处理人员、物资与流程衔接" }
};

const WEEKDAY_EXECUTION_GUIDANCE = [
  "周日更适合安排家人共同参与，并给流程留出缓冲",
  "周一适合先确认清单、预约和责任人",
  "周二适合处理文书、供应商与执行细节",
  "周三适合集中沟通，把分歧提前谈清",
  "周四适合推进多方确认与流程衔接",
  "周五适合完成定案，并为后续安排预留准备",
  "周六适合安排见面、仪式或需要多人参与的环节"
];

const WEEKDAY_FOCUS_LABELS = [
  "家庭协调",
  "清单启动",
  "文书细节",
  "集中沟通",
  "多方衔接",
  "定案准备",
  "仪式参与"
];

const FRIENDLY_YI = [
  { keys: ["嫁娶", "纳采", "订盟"], label: "表达心意" },
  { keys: ["出行", "赴任"], label: "出行" },
  { keys: ["开市", "交易", "立券", "纳财"], label: "推进合作" },
  { keys: ["修造", "动土", "栽种", "扫舍"], label: "整理空间" },
  { keys: ["祈福", "祭祀"], label: "静心祈愿" },
  { keys: ["入宅", "移徙", "安床"], label: "安顿生活" },
  { keys: ["求嗣", "进人口"], label: "家人相处" },
  { keys: ["开光", "挂匾"], label: "开启新事" }
];

const FRIENDLY_JI = [
  { keys: ["嫁娶", "纳采", "订盟"], label: "关系大决定" },
  { keys: ["出行", "赴任"], label: "临时远行" },
  { keys: ["开市", "交易", "立券", "纳财"], label: "冲动消费" },
  { keys: ["修造", "动土", "破土"], label: "装修动工" },
  { keys: ["安葬", "入殓", "启钻"], label: "沉重事务" },
  { keys: ["入宅", "移徙", "安床"], label: "仓促搬动" }
];

function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatYmd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getProfileSignature(profile) {
  if (!profile) return "general";
  return [
    profile.birthday || "",
    profile.birthTime || "",
    profile.zodiac || "",
    profile.avoidOwnChong === false ? "keep-chong" : "avoid-chong",
    isClassicCopyEnabled(profile) ? "classic-copy" : "modern-copy"
  ].join(":");
}

function uniq(list) {
  return Array.from(new Set(list)).filter(Boolean);
}

function getStableIndex(value, length) {
  if (!length) return 0;
  const hash = `${value || ""}`.split("").reduce((total, character) => {
    return (total * 31 + character.charCodeAt(0)) >>> 0;
  }, 0);
  return hash % length;
}

function normalizeTaboos(list) {
  return list.length === 1 && list[0] === "无" ? [] : list;
}

function formatStatusLevel(value) {
  const labels = {
    "大吉": "元气",
    "吉": "在线",
    "中": "平淡",
    "凶": "低落",
    "大凶": "摆烂"
  };
  return labels[value] || value;
}

function formatDayType(value) {
  if (value === "黄道") return "顺行日";
  if (value === "黑道") return "逆行日";
  return value;
}

function buildDayChongSha(lunar) {
  return `冲${lunar.getDayChongDesc()} · 煞${lunar.getDaySha()}`;
}

function buildProfessionalData(lunar, yi, ji, goodTimes) {
  const nineStar = lunar.getDayNineStar();
  const tianShenLuck = lunar.getDayTianShenLuck();
  const tianShenType = lunar.getDayTianShenType();
  const tianShenName = lunar.getDayTianShen();
  const jiShen = lunar.getDayJiShen();
  const xiongSha = lunar.getDayXiongSha();
  const timeDetails = lunar.getTimes().map((time) => {
    const luck = time.getTianShenLuck();
    return {
      key: `${time.getZhi()}-${time.getMinHm()}`,
      zhi: `${time.getZhi()}时`,
      range: `${time.getMinHm()}-${time.getMaxHm()}`,
      ganZhi: time.getGanZhi(),
      naYin: time.getNaYin(),
      tianShen: time.getTianShen(),
      luck: formatStatusLevel(luck),
      luckClass: luck === "吉" ? "pro-time-luck pro-time-luck-good" : "pro-time-luck pro-time-luck-bad",
      chongSha: `冲${time.getChongDesc()} · 煞${time.getSha()}`,
      yiText: time.getYi().slice(0, 3).join("、") || "无",
      jiText: time.getJi().slice(0, 3).join("、") || "无"
    };
  });

  return {
    yi: yi.slice(0, 12),
    ji: ji.length ? ji.slice(0, 12) : ["无"],
    ganZhiLine: `${lunar.getYearInGanZhi()}年 · ${lunar.getMonthInGanZhi()}月 · ${lunar.getDayInGanZhi()}日`,
    dayPillar: lunar.getDayInGanZhi(),
    dayNaYin: lunar.getDayNaYin(),
    zhiXing: `${lunar.getZhiXing()}日`,
    tianShenName,
    tianShenLuck: formatStatusLevel(tianShenLuck),
    tianShenType: formatDayType(tianShenType),
    tianShenClass: tianShenLuck === "吉" ? "pro-day-badge pro-day-badge-good" : "pro-day-badge pro-day-badge-bad",
    tianShen: `${tianShenName}（${formatStatusLevel(tianShenLuck)}）`,
    xiu: `${lunar.getXiu()}宿 · ${formatStatusLevel(lunar.getXiuLuck())}`,
    xiuSong: lunar.getXiuSong(),
    nineStar: `${nineStar.getNumber()}${nineStar.getColor()}${nineStar.getWuXing()}`,
    nineStarDetail: `${nineStar.getNameInBeiDou()} · ${nineStar.getPositionDesc()} · 玄空${nineStar.getNameInXuanKong()}${formatStatusLevel(nineStar.getLuckInXuanKong())}`,
    liuYao: lunar.getLiuYao(),
    yueXiang: lunar.getYueXiang(),
    wuHou: `${lunar.getHou()} · ${lunar.getWuHou()}`,
    chongSha: buildDayChongSha(lunar),
    dayShengXiao: lunar.getDayShengXiao(),
    cai: lunar.getDayPositionCaiDesc(),
    jiShen: jiShen.length ? jiShen.slice(0, 10) : ["加成能量不显"],
    xiongSha: xiongSha.length ? xiongSha.slice(0, 10) : ["减益能量不显"],
    goodTimes: goodTimes.length ? goodTimes : ["今日好时段不明显"],
    coreFacts: [
      { label: "日柱", value: lunar.getDayInGanZhi(), detail: `纳音 ${lunar.getDayNaYin()}` },
      { label: "状态类型", value: `${lunar.getZhiXing()}日`, detail: "状态类型十二神" },
      { label: "当值能量", value: tianShenName, detail: `${formatDayType(tianShenType)} · ${formatStatusLevel(tianShenLuck)}` },
      { label: "二十八宿", value: `${lunar.getXiu()}宿`, detail: formatStatusLevel(lunar.getXiuLuck()) },
      { label: "日九型能量", value: `${nineStar.getNumber()}${nineStar.getColor()}${nineStar.getWuXing()}`, detail: `${nineStar.getNameInBeiDou()} · ${nineStar.getPositionDesc()}` },
      { label: "六曜月相", value: lunar.getLiuYao(), detail: lunar.getYueXiang() }
    ],
    positionFacts: [
      { label: "好事方位", value: lunar.getDayPositionXiDesc() },
      { label: "好福方位", value: lunar.getDayPositionFuDesc() },
      { label: "好运方位", value: lunar.getDayPositionCaiDesc() },
      { label: "阳贵", value: lunar.getDayPositionYangGuiDesc() },
      { label: "阴贵", value: lunar.getDayPositionYinGuiDesc() },
      { label: "太岁", value: lunar.getDayPositionTaiSuiDesc() }
    ],
    observationFacts: [
      { label: "孕期留意区", value: lunar.getDayPositionTai() },
      { label: "旬空", value: lunar.getDayXunKong() },
      { label: "物候", value: `${lunar.getHou()} · ${lunar.getWuHou()}` },
      { label: "今日顺手气", value: lunar.getDayLu() },
      { label: "九型能量玄空", value: `${nineStar.getNameInXuanKong()} · ${formatStatusLevel(nineStar.getLuckInXuanKong())} · ${nineStar.getPositionDesc()}` },
      { label: "古法提醒·干", value: lunar.getPengZuGan() },
      { label: "古法提醒·支", value: lunar.getPengZuZhi() }
    ],
    timeDetails
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getSolar() {
  if (Solar || solarLoadFailed) return Solar;

  try {
    Solar = require("lunar-javascript").Solar;
  } catch (error) {
    solarLoadFailed = true;
    Solar = null;
  }

  return Solar;
}

function pickFriendly(source, rules, fallback) {
  const labels = [];
  rules.forEach((rule) => {
    if (rule.keys.some((key) => source.includes(key))) {
      labels.push(rule.label);
    }
  });
  return uniq(labels).slice(0, 4).concat(fallback).slice(0, 4);
}

function getLunarByDate(date) {
  const dateKey = formatYmd(date);
  if (lunarDateCache[dateKey]) return lunarDateCache[dateKey];
  const solar = getSolar();
  if (!solar) return null;
  const lunar = solar.fromDate(date).getLunar();
  lunarDateCache[dateKey] = lunar;
  return lunar;
}

function getDateSummary(date, profile, options) {
  const includeProfessional = !options || options.professional !== false;
  const includeBazi = Boolean(options && options.bazi === true);
  const cacheKey = [
    CALENDAR_RULE_VERSION,
    formatYmd(date),
    getProfileSignature(profile),
    includeProfessional ? "pro" : "basic",
    includeBazi ? "bazi" : "no-bazi"
  ].join("|");
  if (dateSummaryCache[cacheKey]) return dateSummaryCache[cacheKey];

  const solar = getSolar();
  if (!solar) return translateCopyData(getFallbackDateSummary(date), isClassicCopyEnabled(profile));
  const solarDate = solar.fromDate(date);
  const lunar = solarDate.getLunar();
  lunarDateCache[formatYmd(date)] = lunar;
  const yi = lunar.getDayYi();
  const ji = normalizeTaboos(lunar.getDayJi());
  const friendlySuitable = pickFriendly(yi, FRIENDLY_YI, ["学业", "整理", "沟通"]);
  const friendlyAvoid = ji.length ? pickFriendly(ji, FRIENDLY_JI, ["做重大决定"]) : ["冲动消费", "临时拍板"];
  const goodTimes = includeProfessional
    ? lunar
      .getTimes()
      .filter((time) => time.getTianShenLuck() === "吉")
      .slice(0, 3)
      .map((time) => `${time.getMinHm()}-${time.getMaxHm()} ${time.getZhi()}时`)
    : [];
  const rating = buildDayRating(lunar, yi, ji, profile);
  const personalRelation = getPersonalDayRelation(lunar, profile);
  const reminder = buildDailyReminder(lunar, rating, date);
  const chongSha = buildDayChongSha(lunar);
  const lunarFestivals = lunar.getFestivals();
  const solarFestivals = solarDate.getFestivals();
  const jieQi = lunar.getJieQi();
  const festival = jieQi || lunarFestivals[0] || solarFestivals[0] || "";
  const lunarShort = lunar.getDayInChinese() === "初一"
    ? `${lunar.getMonthInChinese()}月`
    : lunar.getDayInChinese();

  const summary = {
    modelVersion: CALENDAR_RULE_VERSION,
    day: date.getDate(),
    weekday: WEEKDAYS[date.getDay()],
    monthDay: `${date.getMonth() + 1}月${date.getDate()}日`,
    dateLine: `${WEEKDAYS[date.getDay()]} · ${date.getMonth() + 1}月${date.getDate()}日`,
    solarLine: formatYmd(date),
    lunarLine: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    lunarDateLine: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    lunarShort,
    festival,
    dayOfficer: `${lunar.getZhiXing()}日`,
    suitable: friendlySuitable.slice(0, 3),
    avoid: friendlyAvoid.slice(0, 2),
    reminder,
    chongSha,
    personalTip: buildPersonalTip(lunar, profile),
    personalRelation,
    baziInsight: includeBazi ? getDailyBaziInsight(lunar, profile) : null,
    statusText: rating.rhythm,
    grade: rating.grade,
    rhythm: rating.rhythm,
    ratingScore: rating.score,
    rhythmDescription: rating.description,
    ratingClass: rating.className,
    dailyConclusion: {
      grade: rating.grade,
      rhythm: rating.rhythm,
      ratingScore: rating.score,
      ratingClass: rating.className,
      suitable: friendlySuitable.slice(0, 3),
      avoid: friendlyAvoid.slice(0, 2),
      reminder,
      chongSha
    },
    professional: includeProfessional ? buildProfessionalData(lunar, yi, ji, goodTimes) : null
  };
  const displaySummary = translateCopyData(summary, isClassicCopyEnabled(profile));
  dateSummaryCache[cacheKey] = displaySummary;
  return displaySummary;
}

function getFallbackDateSummary(date) {
  return {
    day: date.getDate(),
    weekday: WEEKDAYS[date.getDay()],
    monthDay: `${date.getMonth() + 1}月${date.getDate()}日`,
    dateLine: `${WEEKDAYS[date.getDay()]} · ${date.getMonth() + 1}月${date.getDate()}日`,
    solarLine: formatYmd(date),
    lunarLine: "请先在开发者工具中构建 npm",
    lunarDateLine: "农历信息待构建",
    lunarShort: "--",
    festival: "",
    dayOfficer: "--",
    suitable: ["学业", "整理", "沟通"],
    avoid: ["冲动消费", "临时拍板"],
    reminder: "适合稳步推进，但别急着做重大决定。",
    chongSha: "撞点提醒信息待构建",
    personalTip: "",
    personalRelation: null,
    baziInsight: null,
    modelVersion: CALENDAR_RULE_VERSION,
    statusText: "守成",
    grade: "平淡",
    rhythm: "守成",
    ratingScore: 50,
    rhythmDescription: "按既定安排稳步推进，先把已有事项做好。",
    ratingClass: "rating-neutral",
    dailyConclusion: {
      grade: "平淡",
      rhythm: "守成",
      ratingScore: 50,
      ratingClass: "rating-neutral",
      suitable: ["学业", "整理", "沟通"],
      avoid: ["冲动消费", "临时拍板"],
      reminder: "适合稳步推进，但别急着做重大决定。",
      chongSha: "撞点提醒信息待构建"
    },
    professional: {
      yi: ["构建 npm 后显示"],
      ji: ["构建 npm 后显示"],
      ganZhiLine: "干支信息待构建",
      dayPillar: "--",
      dayNaYin: "--",
      zhiXing: "--",
      tianShenName: "--",
      tianShenLuck: "--",
      tianShenType: "--",
      tianShenClass: "pro-day-badge",
      chongSha: "构建 npm 后显示",
      tianShen: "构建 npm 后显示",
      cai: "构建 npm 后显示",
      xiu: "--",
      xiuSong: "",
      nineStar: "--",
      nineStarDetail: "--",
      liuYao: "--",
      yueXiang: "--",
      wuHou: "--",
      dayShengXiao: "--",
      jiShen: ["构建 npm 后显示"],
      xiongSha: ["构建 npm 后显示"],
      goodTimes: ["构建 npm 后显示"],
      coreFacts: [],
      positionFacts: [],
      observationFacts: [],
      timeDetails: []
    }
  };
}

function buildDayRating(lunar, yi, ji, profile) {
  let score = 50;
  score += lunar.getDayTianShenLuck() === "吉" ? 18 : -12;
  score += Math.min(yi.length, 8) * 2;
  score -= Math.min(ji.length, 8) * 2;
  if (ji.length === 0) score += 8;
  score += (DAY_OFFICER_SCORES[lunar.getZhiXing()] || 0) * 3;
  score += clamp(lunar.getDayJiShen().length - lunar.getDayXiongSha().length, -6, 6);

  const isOwnChong = Boolean(
    profile &&
    profile.zodiac &&
    lunar.getDayChongShengXiao() === profile.zodiac
  );
  if (isOwnChong) score -= 28;
  const personalRelation = getPersonalDayRelation(lunar, profile);
  if (personalRelation) score += personalRelation.scoreModifier;

  score = clamp(score, 0, 100);
  const grade = score >= 78
    ? "元气"
    : score >= 62 ? "在线" : score >= 46 ? "平淡" : score >= 30 ? "低落" : "摆烂";
  const dayOfficer = lunar.getZhiXing();
  const tianShenLuck = lunar.getDayTianShenLuck();
  let rhythm = "守成";

  if (isOwnChong || score < 30) {
    rhythm = "慎行";
  } else if (score < 42 || ["闭", "破"].includes(dayOfficer)) {
    rhythm = "静待";
  } else if (score < 58 || tianShenLuck !== "吉" || dayOfficer === "危") {
    rhythm = "宜缓";
  } else if (score >= 66 && ["成", "开", "定", "满", "建"].includes(dayOfficer)) {
    rhythm = "宜进";
  }

  const descriptions = {
    "宜进": "整体条件较顺，适合推进已准备好的事项，同时保留必要确认。",
    "守成": "按既定安排稳步推进，先把已有事项做好。",
    "宜缓": "可以准备与协调，重要决定建议多留一次确认。",
    "静待": "更适合整理、复盘和补足细节，不必刻意求快。",
    "慎行": "减少高风险和不可逆决定，优先检查与复核。"
  };

  return {
    score,
    grade,
    rhythm,
    description: descriptions[rhythm],
    className: grade === "元气" || grade === "在线"
      ? "rating-positive"
      : grade === "平淡" ? "rating-neutral" : "rating-caution"
  };
}

function buildDailyReminder(lunar, rating, date) {
  const dayOfficerFocus = DAY_OFFICER_FOCUS[lunar.getZhiXing()] || "稳妥推进";
  const guidance = TIAN_SHEN_GUIDANCE[lunar.getDayTianShen()] || {
    label: "稳妥推进",
    reason: "建议按现实条件逐项确认"
  };
  const weekdayFocus = WEEKDAY_FOCUS_LABELS[date.getDay()] || "现实安排";
  const rhythmOpeners = {
    "宜进": `更适合${dayOfficerFocus}，准备充分的事项可以向前推进`,
    "守成": `适合围绕${dayOfficerFocus}稳步处理，先把已有安排做实`,
    "宜缓": `可以先做${dayOfficerFocus}与协调，关键决定建议多留一次确认`,
    "静待": `更适合${dayOfficerFocus}、整理和复盘，不必刻意求快`,
    "慎行": `优先检查${guidance.label}与关键细节，减少高风险或不可逆安排`
  };
  return `${rhythmOpeners[rating.rhythm] || rating.description}。${guidance.reason}，现实安排可优先照顾${weekdayFocus}。`;
}

function buildPersonalTip(lunar, profile) {
  if (!profile) return "";
  if (profile.zodiac && lunar.getDayChongShengXiao() === profile.zodiac) {
    return `今天冲你的生肖${profile.zodiac}，重大决定可以多留一点缓冲。`;
  }
  const personalRelation = getPersonalDayRelation(lunar, profile);
  if (personalRelation) {
    return `${personalRelation.shortText}，${personalRelation.description}`;
  }
  if (!profile.zodiac) return "";
  return `已结合你的生肖${profile.zodiac}做今日提醒。`;
}

function getDailyInspiration(inspirations, date) {
  const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return inspirations[key % inspirations.length];
}

function getBirthZodiac(birthday) {
  if (!birthday) return "";
  if (birthZodiacCache[birthday]) return birthZodiacCache[birthday];

  const solar = getSolar();
  if (!solar) return "";

  const parts = birthday.split("-").map((item) => Number(item));
  if (parts.length !== 3 || parts.some((item) => !item)) return "";
  const zodiac = solar.fromYmd(parts[0], parts[1], parts[2]).getLunar().getYearShengXiao();
  birthZodiacCache[birthday] = zodiac;
  return zodiac;
}

function getActionConfig(key) {
  return ACTIONS[key] || ACTIONS.travel;
}

function getDisplayActionItems(items) {
  return uniq((items || []).map((item) => item === "立券交易" ? "立券" : item));
}

function getActionRule(key) {
  const action = getActionConfig(key);
  const coreJi = action.coreJi || action.ji;
  const penaltyJi = action.ji.filter((item) => !coreJi.includes(item));
  const match = getDisplayActionItems(action.yi);
  const exclude = getDisplayActionItems(coreJi);
  const penalty = getDisplayActionItems(penaltyJi);
  const repeatsMatch = match.length === exclude.length
    && match.every((item) => exclude.includes(item));
  return {
    key: ACTIONS[key] ? key : "travel",
    name: action.name,
    focus: action.explain.replace(/^适合/, "").replace(/[。.]$/, ""),
    match,
    exclude,
    penalty,
    excludeText: repeatsMatch
      ? "若上述核心事项出现在当日避坑清单中，该日期直接排除"
      : `当天避坑清单出现${exclude.join("、")}时直接排除`,
    penaltyText: penalty.length ? `当天避坑清单出现${penalty.join("、")}时保留候选，但降低排名` : "",
    yi: action.yi.slice(),
    ji: coreJi.slice()
  };
}

function getMonthCalendar(year, month, profile) {
  const cacheKey = `${CALENDAR_RULE_VERSION}|${year}-${month}|${getProfileSignature(profile)}`;
  if (monthCalendarCache[cacheKey]) return monthCalendarCache[cacheKey];

  const firstDay = new Date(year, month - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const startDate = addDays(firstDay, -mondayOffset);
  const todayKey = formatYmd(new Date());
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(startDate, index);
    const summary = getDateSummary(date, profile, { professional: false });
    const dateKey = formatYmd(date);
    cells.push({
      dateKey,
      day: date.getDate(),
      lunarShort: summary.lunarShort,
      festival: summary.festival,
      rhythm: summary.rhythm,
      grade: summary.grade,
      ratingClass: summary.ratingClass,
      isCurrentMonth: date.getFullYear() === year && date.getMonth() === month - 1,
      isToday: dateKey === todayKey
    });
  }

  monthCalendarCache[cacheKey] = cells;
  return cells;
}

function matchesPreferredPeriod(time, preferredPeriod) {
  const hour = Number(time.getMinHm().slice(0, 2));
  if (preferredPeriod === "morning") return hour >= 7 && hour < 11;
  if (preferredPeriod === "afternoon") return hour >= 11 && hour < 18;
  if (preferredPeriod === "evening") return hour >= 18 && hour <= 20;
  return hour >= 7 && hour <= 20;
}

function getGoodTimeInfo(lunar, preferredPeriod) {
  const allGoodTimes = lunar
    .getTimes()
    .filter((time) => time.getTianShenLuck() === "吉");
  const practicalTimes = allGoodTimes.filter((time) => matchesPreferredPeriod(time, "all"));
  const matchedTimes = preferredPeriod && preferredPeriod !== "all"
    ? practicalTimes.filter((time) => matchesPreferredPeriod(time, preferredPeriod))
    : practicalTimes;
  const displayTimes = matchedTimes.length
    ? matchedTimes
    : preferredPeriod && preferredPeriod !== "all" ? [] : allGoodTimes;

  return {
    practicalCount: matchedTimes.length,
    totalCount: allGoodTimes.length,
    display: displayTimes
      .slice(0, 2)
      .map((time) => `${time.getMinHm()}-${time.getMaxHm()} ${time.getZhi()}时`)
  };
}

function calculateRecommendationScore(action, yiHit, lightJiHit, yi, ji, lunar, practicalTimeCount, hasPersonalChong, personalRelation) {
  const weightedMatch = yiHit.reduce((total, item) => {
    const weight = action.yiWeights && action.yiWeights[item];
    return total + (weight || 14);
  }, 0);
  const matchScore = yiHit.length
    ? 4 + yiHit.length * 4 + Math.min(8, Math.round(weightedMatch / 9))
    : -8;
  const spiritScore = clamp(
    lunar.getDayJiShen().length - lunar.getDayXiongSha().length,
    -8,
    8
  );
  const breadthScore = clamp(Math.round((yi.length - ji.length) / 6), -4, 4);
  const dayValueScore = (lunar.getDayTianShenLuck() === "吉" ? 6 : -6)
    + (DAY_OFFICER_SCORES[lunar.getZhiXing()] || 0) * 2;
  const timeScore = Math.min(6, practicalTimeCount);
  const conflictPenalty = lightJiHit.length * 16 + (hasPersonalChong ? 12 : 0);
  let score = 46
    + matchScore
    + dayValueScore
    + spiritScore
    + timeScore
    + (ji.length === 0 ? 3 : 0)
    + breadthScore
    + (personalRelation ? personalRelation.scoreModifier : 0)
    - conflictPenalty;

  score = clamp(score, 38, 94);
  if (lightJiHit.length) score = Math.min(score, 72);
  if (hasPersonalChong) score = Math.min(score, 68);
  return {
    score,
    breakdown: {
      base: 46,
      match: matchScore,
      dayValue: dayValueScore,
      spirits: spiritScore,
      goodTimes: timeScore,
      breadth: breadthScore,
      personal: personalRelation ? personalRelation.scoreModifier : 0,
      conflict: -conflictPenalty
    }
  };
}

function buildDateRecommendation(actionKey, action, context) {
  const {
    dateKey,
    yiHit,
    goodTimes,
    dayOfficerName,
    tianShenName,
    tianShenLuck,
    jiShen,
    xiongSha,
    weekdayIndex,
    chongText,
    lightJiHit,
    hasPersonalChong
  } = context;
  const adviceMap = ACTION_ADVICE[actionKey] || {};
  const matchedAdvice = uniq(yiHit.map((item) => adviceMap[item]));
  const shenGuidance = TIAN_SHEN_GUIDANCE[tianShenName] || {
    label: "稳妥推进",
    adviceIndex: 0,
    reason: "适合按现实条件逐项确认"
  };
  const officerFocus = DAY_OFFICER_FOCUS[dayOfficerName] || "稳妥推进";
  const selectedAdvice = matchedAdvice.length
    ? matchedAdvice[shenGuidance.adviceIndex % matchedAdvice.length]
    : action.action.replace(/[。.]$/, "");
  const dateGuidance = ACTION_DATE_GUIDANCE[actionKey] || {
    execution: [action.action.replace(/[。.]$/, "")],
    risk: ["不可逆步骤仍需保留必要复核"]
  };
  const variantSeed = `${dateKey}|${actionKey}|${dayOfficerName}|${tianShenName}`;
  const executionDetail = dateGuidance.execution[getStableIndex(`${variantSeed}|execution`, dateGuidance.execution.length)];
  const riskDetail = dateGuidance.risk[getStableIndex(`${variantSeed}|risk`, dateGuidance.risk.length)];
  const jiShenText = jiShen.length ? `加成能量见${jiShen.slice(0, 2).join("、")}` : "加成能量助力不突出";
  const xiongShaText = xiongSha.length ? `另见${xiongSha.slice(0, 2).join("、")}` : "减益能量影响不突出";
  const weekdayFocus = WEEKDAY_FOCUS_LABELS[weekdayIndex] || "现实安排";
  const matchVariants = yiHit.length ? [
    `状态命中${yiHit.length}项：${yiHit.join("、")}`,
    `${yiHit.join("、")}列入当日适合清单，对${action.name}形成直接支持`,
    `当天对${action.name}的正向依据为${yiHit.join("、")}`
  ] : [
    "未直接命中特定适合项，以日值与时段条件进入候选",
    "事项适合项不突出，本次主要由日值、当值能量与好时段支持",
    "当日无直接适合项，依综合条件保留为候选"
  ];
  const matchText = matchVariants[getStableIndex(`${variantSeed}|reason`, matchVariants.length)];
  const whyRecommended = `${matchText}；${dayOfficerName}日侧重${officerFocus}，${tianShenName}值日，${shenGuidance.reason}。`;
  const reason = `${matchText}。${dayOfficerName}日侧重${officerFocus}，${tianShenName}（${formatStatusLevel(tianShenLuck)}）值日，${shenGuidance.reason}；${jiShenText}，${xiongShaText}，执行条件偏向${weekdayFocus}。`;
  const weekdayGuidance = WEEKDAY_EXECUTION_GUIDANCE[weekdayIndex] || "按当天现实安排预留缓冲";
  const preferredGoodTime = goodTimes.length
    ? goodTimes[getStableIndex(`${variantSeed}|time`, goodTimes.length)]
    : "";
  const actionBase = `${selectedAdvice}；${executionDetail}。${weekdayGuidance}`;
  let caution = `已排除${action.name}重点避坑。${riskDetail}；${chongText}，${xiongShaText}。`;
  if (lightJiHit.length) {
    caution = `当天仍有避坑项：${lightJiHit.join("、")}。${riskDetail}；${chongText}，${xiongShaText}。`;
  }
  if (hasPersonalChong) {
    caution = `该日与你的生肖不合，因你选择保留全部日期而继续展示。${riskDetail}，并为关键步骤预留替代时间。`;
  }

  return {
    focusTitle: `${officerFocus} · ${shenGuidance.label} · ${weekdayFocus}`,
    whyRecommended,
    reason,
    actionBase,
    preferredGoodTime,
    goodTimeFocus: `${officerFocus} · ${shenGuidance.label}`,
    executionDetail,
    executionOptions: dateGuidance.execution.slice(),
    riskDetail,
    riskOptions: dateGuidance.risk.slice(),
    caution
  };
}

function buildPersonalBasis(profile) {
  if (!profile || !profile.zodiac) return "未设置生肖，本次按通用历法筛选";
  const chart = getBirthChart(profile);
  if (chart && profile.avoidOwnChong) {
    return `已结合主标签${chart.dayMaster}，并避开与生肖${profile.zodiac}不合的日期`;
  }
  if (chart) return `已结合主标签${chart.dayMaster}，本次保留全部日期`;
  if (profile.avoidOwnChong) return `已避开与生肖${profile.zodiac}不合的日期`;
  return `已识别生肖${profile.zodiac}，本次保留全部日期`;
}

function createGoodDaySearchContext(actionKey, rangeDays, profile, options) {
  const action = getActionConfig(actionKey);
  const filters = options || {};
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const requestedStart = parseDate(filters.startDate) || todayStart;
  const startDate = requestedStart < todayStart ? todayStart : requestedStart;
  const requestedEnd = parseDate(filters.endDate);
  const fallbackDays = clamp(Number(rangeDays) || 30, 1, 90);
  const searchDays = requestedEnd && requestedEnd >= startDate
    ? clamp(getDayDiff(requestedEnd, startDate) + 1, 1, 90)
    : fallbackDays;
  const dayType = filters.dayType || "all";
  const preferredPeriod = filters.preferredPeriod || "all";
  const excludedDates = Array.isArray(filters.excludedDates) ? filters.excludedDates.slice().sort() : [];
  const cacheKey = [
    CALENDAR_RULE_VERSION,
    formatYmd(todayStart),
    actionKey,
    searchDays,
    formatYmd(startDate),
    dayType,
    preferredPeriod,
    excludedDates.join(","),
    getProfileSignature(profile)
  ].join("|");

  return {
    actionKey,
    action,
    profile: profile || {},
    classicCopyEnabled: isClassicCopyEnabled(profile),
    startDate,
    searchDays,
    dayType,
    preferredPeriod,
    excludedDateMap: excludedDates.reduce((map, dateKey) => {
      map[dateKey] = true;
      return map;
    }, {}),
    cacheKey,
    limit: getResultLimit(searchDays)
  };
}

function formatScoreContribution(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function evaluateGoodDayDate(context, index) {
  const {
    actionKey,
    action,
    profile,
    startDate,
    dayType,
    preferredPeriod,
    excludedDateMap
  } = context;
  const date = addDays(startDate, index);
  const dateKey = formatYmd(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  if (excludedDateMap[dateKey]) return null;
  if (dayType === "weekday" && isWeekend) return null;
  if (dayType === "weekend" && !isWeekend) return null;

  const lunar = getLunarByDate(date);
  if (!lunar) return null;
  const yi = lunar.getDayYi();
  const ji = normalizeTaboos(lunar.getDayJi());
  const yiHit = action.yi.filter((item) => yi.includes(item));
  const jiHit = action.ji.filter((item) => ji.includes(item));
  const coreJiHit = (action.coreJi || action.ji).filter((item) => ji.includes(item));
  const lightJiHit = jiHit.filter((item) => !coreJiHit.includes(item));
  const chongZodiac = lunar.getDayChongShengXiao();
  const hasPersonalChong = Boolean(profile.zodiac && profile.zodiac === chongZodiac);
  const personalRelation = getPersonalDayRelation(lunar, profile);

  if (profile.avoidOwnChong && hasPersonalChong) return null;
  if (coreJiHit.length) return null;

  const goodTimeInfo = getGoodTimeInfo(lunar, preferredPeriod);
  if (preferredPeriod !== "all" && !goodTimeInfo.display.length) return null;
  const scoreResult = calculateRecommendationScore(
    action,
    yiHit,
    lightJiHit,
    yi,
    ji,
    lunar,
    goodTimeInfo.practicalCount,
    hasPersonalChong,
    personalRelation
  );
  if (!yiHit.length && scoreResult.score < 64) return null;

  const tianShenName = lunar.getDayTianShen();
  const tianShenLuck = lunar.getDayTianShenLuck();
  const tianShen = `${tianShenName}（${formatStatusLevel(tianShenLuck)}）`;
  const dayOfficerName = lunar.getZhiXing();
  const dayOfficer = `${dayOfficerName}日`;
  const jiShen = lunar.getDayJiShen();
  const xiongSha = lunar.getDayXiongSha();
  const availableGoodTimeCount = goodTimeInfo.practicalCount || goodTimeInfo.totalCount;
  const dailyModel = getDateSummary(date, profile, { professional: false });
  const dailyConclusion = dailyModel.dailyConclusion;
  const chongText = dailyConclusion.chongSha;
  const recommendation = buildDateRecommendation(actionKey, action, {
    dateKey,
    yiHit,
    goodTimes: goodTimeInfo.display,
    dayOfficerName,
    tianShenName,
    tianShenLuck,
    jiShen,
    xiongSha,
    weekdayIndex: date.getDay(),
    chongText,
    lightJiHit,
    hasPersonalChong
  });
  const jiShenText = jiShen.length ? jiShen.slice(0, 4).join("、") : "当日加成能量助力不突出";
  const xiongShaText = xiongSha.length ? xiongSha.slice(0, 4).join("、") : "当日减益能量影响不突出";
  const goodTimesText = goodTimeInfo.display.length ? goodTimeInfo.display.join(" / ") : "无符合当前时段的明显好时段";
  const personalBasis = buildPersonalBasis(profile);
  const personalConflictText = !profile.zodiac
    ? "未设置生肖，本次不执行个人搭配提醒"
    : hasPersonalChong
      ? `与生肖${profile.zodiac}不合，按你的设置保留并已降低排名`
      : `与生肖${profile.zodiac}搭配平稳`;
  const personalRelationText = personalRelation
    ? `${personalRelation.shortText} · ${personalRelation.label}`
    : "未设置出生时间，本次不计算密码关系";
  const hasPersonalRelationRisk = Boolean(
    personalRelation && ["clash", "harm", "break"].includes(personalRelation.key)
  );

  return {
    id: dateKey,
    dateKey,
    modelVersion: CALENDAR_RULE_VERSION,
    actionKey,
    actionName: action.name,
    day: date.getDate(),
    date: `${date.getMonth() + 1}月${date.getDate()}日`,
    weekday: WEEKDAYS[date.getDay()],
    lunar: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    score: scoreResult.score,
    scoreBreakdown: [
      { label: "事项匹配", value: formatScoreContribution(scoreResult.breakdown.match) },
      { label: "日值条件", value: formatScoreContribution(scoreResult.breakdown.dayValue) },
      { label: "加减能量", value: formatScoreContribution(scoreResult.breakdown.spirits) },
      { label: "可用时段", value: formatScoreContribution(scoreResult.breakdown.goodTimes) },
      ...(personalRelation
        ? [{ label: "状态图关系", value: formatScoreContribution(scoreResult.breakdown.personal) }]
        : []),
      { label: "冲突扣分", value: formatScoreContribution(scoreResult.breakdown.conflict) }
    ],
    level: getRecommendLevel(scoreResult.score),
    dayGrade: dailyConclusion.grade,
    dayRhythm: dailyConclusion.rhythm,
    dayRatingClass: dailyConclusion.ratingClass,
    daySuitable: dailyConclusion.suitable.join("、"),
    dayAvoid: dailyConclusion.avoid.join("、"),
    dayReminder: dailyConclusion.reminder,
    focusTitle: recommendation.focusTitle,
    reason: recommendation.reason,
    whyRecommended: recommendation.whyRecommended,
    action: `${recommendation.actionBase}${recommendation.preferredGoodTime ? `，关键环节可放在${recommendation.preferredGoodTime}` : ""}。`,
    actionBase: recommendation.actionBase,
    preferredGoodTime: recommendation.preferredGoodTime,
    goodTimeFocus: recommendation.goodTimeFocus,
    executionDetail: recommendation.executionDetail,
    executionOptions: recommendation.executionOptions,
    riskDetail: recommendation.riskDetail,
    riskOptions: recommendation.riskOptions,
    chong: chongText,
    tianShen,
    dayOfficer,
    jiShen: jiShenText,
    xiongSha: xiongShaText,
    goodTimes: goodTimesText,
    goodTimeList: goodTimeInfo.display.slice(),
    yiBasis: yiHit.length ? yiHit.join("、") : "未直接命中，以日值条件进入候选",
    jiBasis: lightJiHit.length ? lightJiHit.join("、") : "重点避坑已在筛选阶段排除",
    hasConflict: lightJiHit.length > 0 || hasPersonalChong || hasPersonalRelationRisk,
    conflictText: hasPersonalChong
      ? "个人不合拍日已降权"
      : hasPersonalRelationRisk
        ? `状态图日支${personalRelation.label}，已小幅调整排序`
        : lightJiHit.length ? `仍有避坑项：${lightJiHit.join("、")}` : "重点避坑已排除",
    positiveEvidence: [
      { label: "事项匹配", value: yiHit.length ? `命中${yiHit.length}项：${yiHit.join("、")}` : "无直接适合项，以综合条件进入候选" },
      { label: "当值能量", value: tianShen },
      { label: "可用时段", value: `${availableGoodTimeCount}段 · ${goodTimesText}` }
    ],
    neutralEvidence: [
      { label: "每日状态", value: `${dailyConclusion.grade} · ${dailyConclusion.rhythm}；${dailyConclusion.reminder}` },
      { label: "今日状态类型", value: `${dayOfficer} · ${DAY_OFFICER_FOCUS[dayOfficerName] || "稳妥推进"}` },
      { label: "现实安排", value: WEEKDAY_EXECUTION_GUIDANCE[date.getDay()] }
    ],
    conflictEvidence: [
      { label: "避坑清单", value: lightJiHit.length ? `仍有避坑项：${lightJiHit.join("、")}` : "重点避坑已排除" },
      { label: "减益能量", value: xiongShaText },
      { label: "撞点提醒", value: chongText }
    ],
    personalEvidence: [
      { label: "生肖筛选", value: personalBasis },
      { label: "个人撞点", value: personalConflictText },
      { label: "密码关系", value: personalRelationText }
    ],
    basisExplanation: `${recommendation.reason} 综合${availableGoodTimeCount}段可用时段、当日加减能量与个人关系后进入当前排名。`,
    personalBasis,
    caution: recommendation.caution
  };
}

function finalizeGoodDayResults(results, limit) {
  const sortedResults = results
    .slice()
    .sort((first, second) => second.score - first.score || first.dateKey.localeCompare(second.dateKey))
    .slice(0, limit);
  const goodTimeFrequency = sortedResults.reduce((frequency, item) => {
    (item.goodTimeList || []).forEach((time) => {
      frequency[time] = (frequency[time] || 0) + 1;
    });
    return frequency;
  }, {});
  const usedGoodTimes = {};
  const usedExecutionDetails = {};
  const usedRiskDetails = {};
  return sortedResults.map((item, index) => {
      const goodTimeList = item.goodTimeList || [];
      const rotatedGoodTimes = goodTimeList.length
        ? goodTimeList.slice(index % goodTimeList.length).concat(goodTimeList.slice(0, index % goodTimeList.length))
        : [];
      const distinctGoodTimes = rotatedGoodTimes
        .filter((time) => !usedGoodTimes[time])
        .sort((first, second) => goodTimeFrequency[first] - goodTimeFrequency[second]);
      const recommendedGoodTime = distinctGoodTimes[0]
        || item.preferredGoodTime
        || rotatedGoodTimes[0]
        || "";
      if (recommendedGoodTime) usedGoodTimes[recommendedGoodTime] = true;
      const executionOptions = item.executionOptions || [];
      const rotatedExecutionOptions = executionOptions.length
        ? executionOptions.slice(index % executionOptions.length).concat(executionOptions.slice(0, index % executionOptions.length))
        : [];
      const executionDetail = rotatedExecutionOptions.find((detail) => !usedExecutionDetails[detail])
        || item.executionDetail
        || "";
      if (executionDetail) usedExecutionDetails[executionDetail] = true;
      const riskOptions = item.riskOptions || [];
      const rotatedRiskOptions = riskOptions.length
        ? riskOptions.slice(index % riskOptions.length).concat(riskOptions.slice(0, index % riskOptions.length))
        : [];
      const riskDetail = rotatedRiskOptions.find((detail) => !usedRiskDetails[detail])
        || item.riskDetail
        || "";
      if (riskDetail) usedRiskDetails[riskDetail] = true;
      const actionBase = executionDetail && item.executionDetail
        ? item.actionBase.replace(item.executionDetail, executionDetail)
        : item.actionBase;
      const caution = riskDetail && item.riskDetail
        ? item.caution.replace(item.riskDetail, riskDetail)
        : item.caution;
      const recommendedGoodTimeText = recommendedGoodTime
        ? `${recommendedGoodTime} · ${item.goodTimeFocus}`
        : "";

      const positiveEvidence = item.positiveEvidence.map((evidence) => {
        if (evidence.label !== "可用时段") return evidence;
        const extraCount = Math.max(0, goodTimeList.length - 1);
        return {
          label: "推荐好时段",
          value: recommendedGoodTimeText
            ? `${recommendedGoodTimeText}${extraCount ? ` · 另有${extraCount}段可用` : ""}`
            : "当前条件下无明显好时段"
        };
      });
      const finalized = Object.assign({}, item, {
        action: `${actionBase}${recommendedGoodTime ? `，关键环节可放在${recommendedGoodTime}，侧重${item.goodTimeFocus}` : ""}。`,
        caution,
        recommendedGoodTime,
        recommendedGoodTimeText,
        bestAction: `${actionBase}。`,
        bestTime: recommendedGoodTimeText || "当前条件下无明显好时段，按现实安排预留缓冲",
        riskNotice: caution,
        positiveEvidence
      });
      delete finalized.actionBase;
      delete finalized.preferredGoodTime;
      delete finalized.goodTimeFocus;
      delete finalized.executionDetail;
      delete finalized.executionOptions;
      delete finalized.riskDetail;
      delete finalized.riskOptions;
      return finalized;
    });
}

function getGoodDayRecommendations(actionKey, rangeDays, profile, options) {
  const context = createGoodDaySearchContext(actionKey, rangeDays, profile, options);
  if (goodDayCache[context.cacheKey]) return goodDayCache[context.cacheKey];
  if (!getSolar()) return [];
  const results = [];

  for (let index = 0; index < context.searchDays; index += 1) {
    const result = evaluateGoodDayDate(context, index);
    if (result) results.push(result);
  }

  const recommendations = translateCopyData(
    finalizeGoodDayResults(results, context.limit),
    context.classicCopyEnabled
  );
  goodDayCache[context.cacheKey] = recommendations;
  return recommendations;
}

function getGoodDayRecommendationsAsync(actionKey, rangeDays, profile, options, onProgress) {
  const context = createGoodDaySearchContext(actionKey, rangeDays, profile, options);
  const cached = goodDayCache[context.cacheKey];
  if (cached) {
    if (typeof onProgress === "function") {
      onProgress({ processed: context.searchDays, total: context.searchDays, results: cached, complete: true, cached: true });
    }
    return Promise.resolve(cached);
  }
  if (!getSolar()) return Promise.resolve([]);

  return new Promise((resolve) => {
    const results = [];
    const chunkSize = 12;
    let cursor = 0;

    const processChunk = () => {
      const chunkEnd = Math.min(context.searchDays, cursor + chunkSize);
      for (; cursor < chunkEnd; cursor += 1) {
        const result = evaluateGoodDayDate(context, cursor);
        if (result) results.push(result);
      }
      const complete = cursor >= context.searchDays;
      const visibleResults = translateCopyData(
        finalizeGoodDayResults(results, context.limit),
        context.classicCopyEnabled
      );
      if (typeof onProgress === "function") {
        onProgress({ processed: cursor, total: context.searchDays, results: visibleResults, complete, cached: false });
      }
      if (complete) {
        goodDayCache[context.cacheKey] = visibleResults;
        resolve(visibleResults);
        return;
      }
      setTimeout(processChunk, 0);
    };

    setTimeout(processChunk, 0);
  });
}

function getRecommendLevel(score) {
  if (score >= 84) return "优选";
  if (score >= 70) return "适合";
  return "可选";
}

function getResultLimit(rangeDays) {
  if (rangeDays >= 90) return 15;
  if (rangeDays >= 60) return 10;
  return 5;
}

module.exports = {
  CALENDAR_RULE_VERSION,
  getDailyModel: getDateSummary,
  getDateSummary,
  getMonthCalendar,
  getDailyInspiration,
  getGoodDayRecommendations,
  getGoodDayRecommendationsAsync,
  getBirthZodiac,
  getActionRule
};
