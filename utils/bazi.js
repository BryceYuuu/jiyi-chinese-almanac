let Solar = null;
let solarLoadFailed = false;

const chartCache = {};

const STEM_META = {
  "甲": { element: "木", polarity: "阳" },
  "乙": { element: "木", polarity: "阴" },
  "丙": { element: "火", polarity: "阳" },
  "丁": { element: "火", polarity: "阴" },
  "戊": { element: "土", polarity: "阳" },
  "己": { element: "土", polarity: "阴" },
  "庚": { element: "金", polarity: "阳" },
  "辛": { element: "金", polarity: "阴" },
  "壬": { element: "水", polarity: "阳" },
  "癸": { element: "水", polarity: "阴" }
};

const ELEMENTS = ["木", "火", "土", "金", "水"];

const ELEMENT_GENERATES = {
  "木": "火",
  "火": "土",
  "土": "金",
  "金": "水",
  "水": "木"
};

const ELEMENT_CONTROLS = {
  "木": "土",
  "土": "水",
  "水": "火",
  "火": "金",
  "金": "木"
};

const BRANCH_ELEMENT = {
  "子": "水",
  "丑": "土",
  "寅": "木",
  "卯": "木",
  "辰": "土",
  "巳": "火",
  "午": "火",
  "未": "土",
  "申": "金",
  "酉": "金",
  "戌": "土",
  "亥": "水"
};

const BRANCH_HIDDEN_STEMS = {
  "子": ["癸"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["乙"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "戊", "庚"],
  "午": ["丁", "己"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["辛"],
  "戌": ["戊", "辛", "丁"],
  "亥": ["壬", "甲"]
};

const TEN_GOD_THEMES = {
  "比肩": "自我立场与同辈关系",
  "劫财": "竞争、分享与资源分配",
  "食神": "表达、创造与舒展感",
  "伤官": "突破、质疑与输出欲",
  "偏财": "外部资源、交换与机会感",
  "正财": "秩序、兑现与现实投入",
  "七杀": "压力、速度与挑战感",
  "正官": "规则、责任与边界感",
  "偏印": "直觉、重构与独立思考",
  "正印": "学习、支持与安全感"
};

const TEN_GOD_KEYWORDS = {
  "比肩": ["自我立场", "同伴关系"],
  "劫财": ["竞争协作", "资源分配"],
  "食神": ["表达创造", "松弛舒展"],
  "伤官": ["突破质疑", "表达输出"],
  "偏财": ["外部资源", "交换机会"],
  "正财": ["秩序兑现", "现实投入"],
  "七杀": ["压力速度", "应对挑战"],
  "正官": ["规则责任", "边界意识"],
  "偏印": ["直觉重构", "独立思考"],
  "正印": ["学习支持", "安全感受"]
};

function getTenGodKeywords(tenGod) {
  return (TEN_GOD_KEYWORDS[tenGod] || ["今日重点", "从容安排"]).slice();
}

const STEM_RELATIONS = {
  harmony: ["甲己", "乙庚", "丙辛", "丁壬", "戊癸"],
  clash: ["甲庚", "乙辛", "丙壬", "丁癸"]
};

const BRANCH_RELATIONS = {
  harmony: ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"],
  clash: ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"],
  harm: ["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"],
  break: ["子酉", "丑辰", "寅亥", "卯午", "巳申", "未戌"]
};

const PILLAR_PRIORITY = {
  day: 4,
  month: 3,
  time: 2,
  year: 1
};

const PERSONAL_STAR_GROUPS = [
  { branches: "申子辰", peach: "酉", travel: "寅", canopy: "辰" },
  { branches: "寅午戌", peach: "卯", travel: "申", canopy: "戌" },
  { branches: "巳酉丑", peach: "午", travel: "亥", canopy: "丑" },
  { branches: "亥卯未", peach: "子", travel: "巳", canopy: "未" }
];

const TIAN_YI = {
  "甲": ["丑", "未"],
  "戊": ["丑", "未"],
  "庚": ["丑", "未"],
  "乙": ["子", "申"],
  "己": ["子", "申"],
  "丙": ["亥", "酉"],
  "丁": ["亥", "酉"],
  "辛": ["午", "寅"],
  "壬": ["卯", "巳"],
  "癸": ["卯", "巳"]
};

const WEN_CHANG = {
  "甲": "巳",
  "乙": "午",
  "丙": "申",
  "戊": "申",
  "丁": "酉",
  "己": "酉",
  "庚": "亥",
  "辛": "子",
  "壬": "寅",
  "癸": "卯"
};

const LU_SHEN = {
  "甲": "寅",
  "乙": "卯",
  "丙": "巳",
  "戊": "巳",
  "丁": "午",
  "己": "午",
  "庚": "申",
  "辛": "酉",
  "壬": "亥",
  "癸": "子"
};

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

function parseBirthInput(profile) {
  if (!profile || !profile.birthday || !profile.birthTime) return null;
  const dateParts = profile.birthday.split("-").map((item) => Number(item));
  const timeParts = profile.birthTime.split(":").map((item) => Number(item));
  if (
    dateParts.length !== 3 ||
    timeParts.length !== 2 ||
    dateParts.some((item) => Number.isNaN(item)) ||
    timeParts.some((item) => Number.isNaN(item))
  ) {
    return null;
  }
  const [year, month, day] = dateParts;
  const [hour, minute] = timeParts;
  if (
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { year, month, day, hour, minute };
}

function countFiveElements(pillars) {
  const counts = ELEMENTS.reduce((result, element) => {
    result[element] = 0;
    return result;
  }, {});
  pillars.forEach((pillar) => {
    `${pillar.wuXing || ""}`.split("").forEach((element) => {
      if (Object.prototype.hasOwnProperty.call(counts, element)) counts[element] += 1;
    });
  });
  return ELEMENTS.map((element) => ({
    name: element,
    count: counts[element],
    text: `${element}${counts[element]}`
  }));
}

function getBirthChart(profile) {
  const input = parseBirthInput(profile);
  if (!input) return null;
  const cacheKey = `${profile.birthday}|${profile.birthTime}`;
  if (chartCache[cacheKey]) return chartCache[cacheKey];

  const solar = getSolar();
  if (!solar) return null;

  try {
    const lunar = solar
      .fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0)
      .getLunar();
    const eightChar = lunar.getEightChar();
    eightChar.setSect(2);
    const pillars = [
      {
        key: "year",
        label: "年柱",
        value: eightChar.getYear(),
        wuXing: eightChar.getYearWuXing(),
        naYin: eightChar.getYearNaYin()
      },
      {
        key: "month",
        label: "月柱",
        value: eightChar.getMonth(),
        wuXing: eightChar.getMonthWuXing(),
        naYin: eightChar.getMonthNaYin()
      },
      {
        key: "day",
        label: "日柱",
        value: eightChar.getDay(),
        wuXing: eightChar.getDayWuXing(),
        naYin: eightChar.getDayNaYin()
      },
      {
        key: "time",
        label: "时柱",
        value: eightChar.getTime(),
        wuXing: eightChar.getTimeWuXing(),
        naYin: eightChar.getTimeNaYin()
      }
    ];
    const dayMeta = STEM_META[eightChar.getDayGan()] || { element: "", polarity: "" };
    const fiveElements = countFiveElements(pillars);
    const chart = {
      pillars,
      dayGan: eightChar.getDayGan(),
      dayZhi: eightChar.getDayZhi(),
      dayMaster: `${eightChar.getDayGan()}${dayMeta.element}`,
      dayMasterDetail: `${dayMeta.polarity}${dayMeta.element}`,
      timeZhi: eightChar.getTimeZhi(),
      fiveElements,
      fiveElementsText: fiveElements.map((item) => item.text).join(" · "),
      birthText: `${profile.birthday} ${profile.birthTime}`,
      lunarBirthText: `农历${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${eightChar.getTimeZhi()}时`
    };
    chartCache[cacheKey] = chart;
    return chart;
  } catch (error) {
    return null;
  }
}

function matchesRelation(first, second, pairs) {
  if (first === second) return false;
  return pairs.some((pair) => pair.includes(first) && pair.includes(second));
}

function getTenGod(dayGan, targetGan) {
  const self = STEM_META[dayGan];
  const target = STEM_META[targetGan];
  if (!self || !target) return "";
  const samePolarity = self.polarity === target.polarity;
  if (self.element === target.element) return samePolarity ? "比肩" : "劫财";
  if (ELEMENT_GENERATES[self.element] === target.element) return samePolarity ? "食神" : "伤官";
  if (ELEMENT_CONTROLS[self.element] === target.element) return samePolarity ? "偏财" : "正财";
  if (ELEMENT_CONTROLS[target.element] === self.element) return samePolarity ? "七杀" : "正官";
  if (ELEMENT_GENERATES[target.element] === self.element) return samePolarity ? "偏印" : "正印";
  return "";
}

function getElementLink(first, second) {
  if (!first || !second) return "";
  if (first === second) return `${first}气相并`;
  if (ELEMENT_GENERATES[first] === second) return `${first}生${second}`;
  if (ELEMENT_CONTROLS[first] === second) return `${first}克${second}`;
  if (ELEMENT_GENERATES[second] === first) return `${second}生${first}`;
  if (ELEMENT_CONTROLS[second] === first) return `${second}克${first}`;
  return "";
}

function isBranchPunishment(first, second) {
  if (first === second) return ["辰", "午", "酉", "亥"].includes(first);
  if ("子卯".includes(first) && "子卯".includes(second)) return true;
  if ("寅巳申".includes(first) && "寅巳申".includes(second)) return true;
  return "丑未戌".includes(first) && "丑未戌".includes(second);
}

function getBranchInteraction(current, natal) {
  if (current === natal) {
    if (isBranchPunishment(current, natal)) {
      return { key: "punishment", label: "自刑", tone: "caution", priority: 88 };
    }
    return { key: "same", label: "同频", tone: "neutral", priority: 40 };
  }
  if (matchesRelation(current, natal, BRANCH_RELATIONS.clash)) {
    return { key: "clash", label: "不合", tone: "caution", priority: 100 };
  }
  if (isBranchPunishment(current, natal)) {
    return { key: "punishment", label: "相刑", tone: "caution", priority: 90 };
  }
  if (matchesRelation(current, natal, BRANCH_RELATIONS.harmony)) {
    return { key: "harmony", label: "合拍", tone: "positive", priority: 76 };
  }
  if (matchesRelation(current, natal, BRANCH_RELATIONS.harm)) {
    return { key: "harm", label: "内耗", tone: "caution", priority: 82 };
  }
  if (matchesRelation(current, natal, BRANCH_RELATIONS.break)) {
    return { key: "break", label: "打破", tone: "caution", priority: 66 };
  }
  return null;
}

function getStemInteraction(current, natal) {
  if (matchesRelation(current, natal, STEM_RELATIONS.harmony)) {
    return { key: "stem-harmony", label: "干合", tone: "positive", priority: 54 };
  }
  if (matchesRelation(current, natal, STEM_RELATIONS.clash)) {
    return { key: "stem-clash", label: "干冲", tone: "caution", priority: 58 };
  }
  return null;
}

function buildPillarInteractions(chart, dayGan, dayZhi) {
  const interactions = [];
  chart.pillars.forEach((pillar) => {
    const natalGan = pillar.value.slice(0, 1);
    const natalZhi = pillar.value.slice(1, 2);
    const branchInteraction = getBranchInteraction(dayZhi, natalZhi);
    const stemInteraction = getStemInteraction(dayGan, natalGan);
    if (branchInteraction) {
      interactions.push(Object.assign({}, branchInteraction, {
        key: `${pillar.key}-branch-${branchInteraction.key}`,
        pillarKey: pillar.key,
        pillarLabel: pillar.label,
        source: `今日运行${dayZhi}`,
        target: `${pillar.label}${natalZhi}`,
        shortText: `${pillar.label}${natalZhi} · ${branchInteraction.label}`,
        detail: `今日运行地支${dayZhi}与本命${pillar.label}${natalZhi}${branchInteraction.label}`
      }));
    }
    if (stemInteraction) {
      interactions.push(Object.assign({}, stemInteraction, {
        key: `${pillar.key}-stem-${stemInteraction.key}`,
        pillarKey: pillar.key,
        pillarLabel: pillar.label,
        source: `今日运行${dayGan}`,
        target: `${pillar.label}${natalGan}`,
        shortText: `${pillar.label}${natalGan} · ${stemInteraction.label}`,
        detail: `今日运行天干${dayGan}与本命${pillar.label}${natalGan}${stemInteraction.label}`
      }));
    }
  });
  return interactions.sort((first, second) => {
    const firstScore = first.priority * 10 + (PILLAR_PRIORITY[first.pillarKey] || 0);
    const secondScore = second.priority * 10 + (PILLAR_PRIORITY[second.pillarKey] || 0);
    return secondScore - firstScore;
  });
}

function getGroupStarTarget(branch, key) {
  const group = PERSONAL_STAR_GROUPS.find((item) => item.branches.includes(branch));
  return group ? group[key] : "";
}

function getPersonalStars(chart, dayZhi) {
  const birthYearZhi = chart.pillars[0].value.slice(1, 2);
  const bases = Array.from(new Set([chart.dayZhi, birthYearZhi]));
  const stars = [];
  const pushStar = (name, description) => {
    if (!stars.some((item) => item.name === name)) stars.push({ name, description });
  };

  if (bases.some((branch) => getGroupStarTarget(branch, "peach") === dayZhi)) {
    pushStar("桃花", "人际吸引与情感感受被触发");
  }
  if (bases.some((branch) => getGroupStarTarget(branch, "travel") === dayZhi)) {
    pushStar("驿马", "变动、迁移与外部节奏被触发");
  }
  if (bases.some((branch) => getGroupStarTarget(branch, "canopy") === dayZhi)) {
    pushStar("华盖", "独处、审美与精神兴趣被触发");
  }
  if ((TIAN_YI[chart.dayGan] || []).includes(dayZhi)) {
    pushStar("天乙贵人", "协助、转圜与贵人象被触发");
  }
  if (WEN_CHANG[chart.dayGan] === dayZhi) {
    pushStar("文昌", "学习、表达与文书象被触发");
  }
  if (LU_SHEN[chart.dayGan] === dayZhi) {
    pushStar("禄神", "资源承接与执行感被触发");
  }
  return stars;
}

function getDailyBaziInsight(lunar, profile) {
  const chart = getBirthChart(profile);
  if (!chart || !lunar) return null;
  const dayGan = lunar.getDayGan();
  const dayZhi = lunar.getDayZhi();
  const dailyPillar = `${dayGan}${dayZhi}`;
  const primaryTenGod = getTenGod(chart.dayGan, dayGan);
  const hiddenTenGods = (BRANCH_HIDDEN_STEMS[dayZhi] || []).map((stem) => ({
    stem,
    tenGod: getTenGod(chart.dayGan, stem)
  }));
  const mainHiddenTenGod = hiddenTenGods[0] || { stem: "", tenGod: "" };
  const interactions = buildPillarInteractions(chart, dayGan, dayZhi);
  const primaryTrigger = interactions[0] || null;
  const personalStars = getPersonalStars(chart, dayZhi);
  const selfElement = STEM_META[chart.dayGan].element;
  const stemElement = STEM_META[dayGan].element;
  const branchElement = BRANCH_ELEMENT[dayZhi];
  const flowParts = Array.from(new Set([
    getElementLink(selfElement, stemElement),
    getElementLink(stemElement, branchElement),
    getElementLink(branchElement, selfElement)
  ].filter(Boolean)));
  const primaryTheme = TEN_GOD_THEMES[primaryTenGod] || "当日主题";
  const hiddenTheme = TEN_GOD_THEMES[mainHiddenTenGod.tenGod] || "";
  const friendlySummary = primaryTenGod === mainHiddenTenGod.tenGod
    ? `今天可以多关注${primaryTheme}，安排事情时先把重点放清楚。`
    : `今天可以多关注${primaryTheme}，同时为${hiddenTheme}留出空间。`;

  return {
    dailyPillar,
    dayGan,
    dayZhi,
    dayMaster: chart.dayMaster,
    dayMasterDetail: chart.dayMasterDetail,
    primaryTenGod,
    primaryTenGodTheme: primaryTheme,
    primaryThemeKeywords: getTenGodKeywords(primaryTenGod),
    hiddenTenGods,
    hiddenTenGodText: hiddenTenGods.map((item) => `${item.stem}·${item.tenGod}`).join("、"),
    friendlySummary,
    hasTrigger: Boolean(primaryTrigger),
    primaryTrigger,
    triggerToneClass: primaryTrigger ? `bazi-trigger-${primaryTrigger.tone}` : "bazi-trigger-neutral",
    triggerText: primaryTrigger
      ? primaryTrigger.detail
      : "当日干支与出生资料无明显关系变化，整体节奏相对平稳",
    interactions: interactions.slice(0, 5),
    hasStars: personalStars.length > 0,
    personalStars,
    starText: personalStars.map((item) => item.name).join(" · "),
    primaryStarDescription: personalStars.length ? personalStars[0].description : "",
    flowText: flowParts.join(" · "),
    currentStemElement: stemElement,
    currentBranchElement: branchElement
  };
}

function getPersonalDayRelation(lunar, profile) {
  const chart = getBirthChart(profile);
  if (!chart || !lunar) return null;
  const dayZhi = lunar.getDayZhi();
  const birthDayZhi = chart.dayZhi;
  const base = {
    birthDayZhi,
    dayZhi,
    dayMaster: chart.dayMaster,
    available: true
  };

  if (birthDayZhi === dayZhi) {
    return Object.assign({}, base, {
      key: "same",
      label: "同频",
      tone: "neutral",
      className: "personal-relation-neutral",
      scoreModifier: 1,
      shortText: `日支${dayZhi}与状态图同频`,
      description: "行动节奏更熟悉，仍以现实安排为先。"
    });
  }
  if (matchesRelation(birthDayZhi, dayZhi, BRANCH_RELATIONS.harmony)) {
    return Object.assign({}, base, {
      key: "harmony",
      label: "合拍",
      tone: "positive",
      className: "personal-relation-positive",
      scoreModifier: 3,
      shortText: `日支${dayZhi}与状态图合拍`,
      description: "沟通与协作条件较顺，适合推进准备充分的事项。"
    });
  }
  if (matchesRelation(birthDayZhi, dayZhi, BRANCH_RELATIONS.clash)) {
    return Object.assign({}, base, {
      key: "clash",
      label: "不合",
      tone: "caution",
      className: "personal-relation-caution",
      scoreModifier: -4,
      shortText: `日支${dayZhi}与状态图不合`,
      description: "节奏容易互相牵扯，重要决定建议多留一次确认。"
    });
  }
  if (matchesRelation(birthDayZhi, dayZhi, BRANCH_RELATIONS.harm)) {
    return Object.assign({}, base, {
      key: "harm",
      label: "内耗",
      tone: "caution",
      className: "personal-relation-caution",
      scoreModifier: -2,
      shortText: `日支${dayZhi}与状态图内耗`,
      description: "细节和沟通宜多留余量，避免只凭临时感受决定。"
    });
  }
  if (matchesRelation(birthDayZhi, dayZhi, BRANCH_RELATIONS.break)) {
    return Object.assign({}, base, {
      key: "break",
      label: "打破",
      tone: "caution",
      className: "personal-relation-caution",
      scoreModifier: -1,
      shortText: `日支${dayZhi}与状态图打破`,
      description: "执行中容易出现小变动，关键步骤提前复核更稳妥。"
    });
  }
  return Object.assign({}, base, {
    key: "balanced",
    label: "平和",
    tone: "neutral",
    className: "personal-relation-neutral",
    scoreModifier: 0,
    shortText: `日支${dayZhi}与状态图无明显合冲`,
    description: "个人关系较平稳，以当日历法和现实条件为主要参考。"
  });
}

module.exports = {
  getBirthChart,
  getDailyBaziInsight,
  getPersonalDayRelation,
  getTenGodKeywords
};
