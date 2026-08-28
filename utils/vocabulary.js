const CLASSIC_TO_MODERN_PAIRS = [
  ["今日吉易", "今日状态播报"],
  ["找个好日子", "找元气日"],
  ["去找好日子", "去查状态"],
  ["好日子", "元气日"],
  ["专业黄历参数", "深度指标"],
  ["今日黄历全览", "今日全景报告"],
  ["查看传统黄历", "查看深度报告"],
  ["完整黄历", "完整报告"],
  ["专业黄历", "深度报告"],
  ["推荐分数", "状态分"],
  ["推荐日", "元气推荐"],
  ["推荐日期", "推荐状态日"],
  ["推荐吉时", "推荐好时段"],
  ["可用吉时", "可用时段"],
  ["今日吉时", "今日好时段"],
  ["吉时", "好时段"],
  ["黄历宜项命中", "状态命中"],
  ["核心忌项", "重点避坑"],
  ["无明显忌项", "无明显雷区"],
  ["宜项", "适合清单"],
  ["忌项", "避坑清单"],
  ["吉神宜趋", "加成建议"],
  ["凶煞宜忌", "减益提醒"],
  ["个人相冲", "个人撞点"],
  ["日冲煞", "今日撞点"],
  ["冲煞", "撞点提醒"],
  ["建除日值", "今日状态类型"],
  ["建除", "状态类型"],
  ["值神", "当值能量"],
  ["吉神", "加成能量"],
  ["凶煞", "减益能量"],
  ["黄道", "顺行日"],
  ["黑道", "逆行日"],
  ["时辰吉凶", "时段状态"],
  ["星宿吉凶", "星域状态"],
  ["彭祖百忌", "古法提醒"],
  ["九星", "九型能量"],
  ["日禄", "今日顺手气"],
  ["胎神", "孕期留意区"],
  ["财神方位", "好运方位"],
  ["喜神方位", "好事方位"],
  ["福神方位", "好福方位"],
  ["四柱已完善", "密码已完善"],
  ["四柱关系", "密码关系"],
  ["四柱作用", "密码作用"],
  ["四柱八字", "出生密码"],
  ["本命日主", "专属主标签"],
  ["今日流日", "今日状态"],
  ["流日干支", "今日代码"],
  ["透干十神", "显性人格标签"],
  ["日支藏干", "隐性标签"],
  ["五行流转", "元素流转"],
  ["个人神煞", "个人加减能量"],
  ["命盘关系", "状态图关系"],
  ["命盘", "状态图"],
  ["日主", "主标签"],
  ["流日", "今日运行"],
  ["十神", "人格标签"],
  ["五行", "元素属性"],
  ["生肖避冲", "生肖搭配提醒"],
  ["个人避冲", "个人搭配"],
  ["个人避冲", "个人搭配提醒"],
  ["避开生肖冲日", "避开不合拍日"],
  ["生肖冲日", "不合拍日"],
  ["相合", "合拍"],
  ["相冲", "不合"],
  ["相害", "内耗"],
  ["相破", "打破"],
  ["同气", "同频"],
  ["择日参考", "状态参考"],
  ["择日依据", "状态依据"],
  ["择日辅助", "状态助手"],
  ["择日", "选状态"],
  ["择吉", "选元气"],
  ["吉日", "元气日"],
  ["凶日", "摆烂日"],
  ["每日结论", "每日状态"],
  ["当日神煞", "当日加减能量"],
  ["吉凶神", "加减能量"],
  ["通用黄历", "通用历法"],
  ["吉凶倾向", "状态倾向"],
  ["传统吉凶属性", "传统状态属性"]
];

const MODERN_TO_CLASSIC_PAIRS = CLASSIC_TO_MODERN_PAIRS
  .map(([classic, modern]) => [modern, classic]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createReplacer(pairs) {
  const sorted = pairs.slice().sort((left, right) => right[0].length - left[0].length);
  const map = sorted.reduce((result, pair) => {
    if (!Object.prototype.hasOwnProperty.call(result, pair[0])) result[pair[0]] = pair[1];
    return result;
  }, {});
  const matcher = new RegExp(sorted.map((pair) => escapeRegExp(pair[0])).join("|"), "g");
  return (value) => value.replace(matcher, (matched) => map[matched]);
}

const toModern = createReplacer(CLASSIC_TO_MODERN_PAIRS);
const toClassic = createReplacer(MODERN_TO_CLASSIC_PAIRS);

const CLASSIC_LEVELS = {
  "大吉": "元气",
  "吉": "在线",
  "中": "平淡",
  "凶": "低落",
  "大凶": "摆烂"
};

const MODERN_LEVELS = Object.keys(CLASSIC_LEVELS).reduce((result, key) => {
  result[CLASSIC_LEVELS[key]] = key;
  return result;
}, {});

function normalizeLevelContexts(value) {
  return value
    .replace(/（大吉）/g, "（元气）")
    .replace(/（吉）/g, "（在线）")
    .replace(/（中）/g, "（平淡）")
    .replace(/（凶）/g, "（低落）")
    .replace(/（大凶）/g, "（摆烂）")
    .replace(/ · 大吉/g, " · 元气")
    .replace(/ · 吉/g, " · 在线")
    .replace(/ · 中/g, " · 平淡")
    .replace(/ · 凶/g, " · 低落")
    .replace(/ · 大凶/g, " · 摆烂");
}

function restoreLevelContexts(value) {
  const restored = value
    .replace(/（元气）/g, "（大吉）")
    .replace(/（在线）/g, "（吉）")
    .replace(/（平淡）/g, "（中）")
    .replace(/（低落）/g, "（凶）")
    .replace(/（摆烂）/g, "（大凶）")
    .replace(/ · 元气/g, " · 大吉")
    .replace(/ · 在线/g, " · 吉")
    .replace(/ · 平淡/g, " · 中")
    .replace(/ · 低落/g, " · 凶")
    .replace(/ · 摆烂/g, " · 大凶");
  return restored.replace(
    /(玄空[^·\s]{1,8})(元气|在线|平淡|低落|摆烂)/g,
    (matched, prefix, level) => `${prefix}${MODERN_LEVELS[level] || level}`
  );
}

function translateCopyText(value, classicEnabled) {
  if (typeof value !== "string" || !value) return value;
  const exactModern = CLASSIC_LEVELS[value] || (value === "宜" ? "适合" : value === "忌" ? "别做" : "");
  let modern = exactModern || normalizeLevelContexts(toModern(value));
  if (!classicEnabled) return modern;
  if (MODERN_LEVELS[modern]) return MODERN_LEVELS[modern];
  if (modern === "适合") return "宜";
  if (modern === "别做") return "忌";
  return restoreLevelContexts(toClassic(modern))
    .replace(/与生肖([^，。；\s]+)搭配平稳/g, "未与生肖$1相冲");
}

function translateCopyData(value, classicEnabled) {
  if (typeof value === "string") return translateCopyText(value, classicEnabled);
  if (Array.isArray(value)) return value.map((item) => translateCopyData(item, classicEnabled));
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  return Object.keys(value).reduce((result, key) => {
    result[key] = translateCopyData(value[key], classicEnabled);
    return result;
  }, {});
}

function isClassicCopyEnabled(profile) {
  return Boolean(profile && profile.classicCopyEnabled === true);
}

function getVocabulary(profile) {
  const classic = isClassicCopyEnabled(profile);
  const text = (value) => translateCopyText(value, classic);
  return {
    classic,
    tabGoodDay: text("元气日"),
    goodDayTitle: text("找元气日"),
    goFindDay: text("去查状态"),
    calendarPositive: classic ? "吉以上" : "在线以上",
    calendarNeutral: classic ? "中" : "平淡",
    calendarCaution: classic ? "凶以下" : "低落以下",
    suitableLabel: classic ? "宜" : "适合",
    avoidLabel: classic ? "忌" : "别做",
    calendarReportTitle: text("深度指标"),
    todayReportTitle: text("今日全景报告"),
    stateAssistant: text("状态助手"),
    positiveAdvice: text("加成建议"),
    negativeAdvice: text("减益提醒"),
    collisionAndPosition: classic ? "冲煞与方位" : "撞点提醒与方位",
    todayCollision: text("今日撞点"),
    timeStatus: text("时段状态"),
    personalSubtitle: classic ? "结合出生资料与当日干支" : "结合你的信息与今日状态",
    personalFallbackSubtitle: classic ? "你的个人历法资料" : "你的个人历法资料",
    dayMasterLabel: text("专属主标签"),
    dailyStatusLabel: text("今日状态"),
    visibleTagLabel: text("显性人格标签"),
    hiddenTagLabel: text("隐性标签"),
    passwordEffect: text("密码作用"),
    elementFlow: text("元素流转"),
    personalEnergy: text("个人加减能量"),
    personalEmptyDescription: classic
      ? "补充出生资料后，可查看当日干支、十神与四柱关系等专业信息。"
      : "补充出生资料后，可查看当日干支、人格标签与密码关系等专业信息。",
    birthInfoTitle: classic ? "出生历法资料" : "出生信息",
    modeDescription: classic ? "友好版更简洁，专业版显示完整黄历" : "友好版更简洁，专业版显示完整报告",
    professionalOnboardingDescription: classic ? "完整宜忌与传统信息" : "完整清单与传统信息",
    nextPlanEmpty: classic ? "找好日子后可以保存为计划" : "找元气日后可以保存为计划",
    plansEmpty: classic ? "找好日子后保存计划，日期和行动会出现在这里。" : "找元气日后保存计划，日期和行动会出现在这里。",
    recommendedTime: text("推荐好时段"),
    rulePositive: classic ? "宜中加分" : "适合项加分",
    ruleMethod: classic
      ? "另结合建除日值、值神、吉时与个人避冲综合排序。"
      : "另结合今日状态类型、当值能量、好时段与个人搭配综合排序。",
    riskAndCompatibility: classic ? "风险与避冲" : "风险与搭配提醒",
    classicSettingName: "经典术语",
    classicSettingDescription: classic ? "已使用原版历法文案" : "开启后使用原版历法文案"
  };
}

function applyCopyNavigation(profile) {
  if (typeof wx === "undefined" || typeof wx.setTabBarItem !== "function") return;
  wx.setTabBarItem({
    index: 2,
    text: "元气日",
    fail() {}
  });
}

module.exports = {
  applyCopyNavigation,
  getVocabulary,
  isClassicCopyEnabled,
  translateCopyData,
  translateCopyText
};
