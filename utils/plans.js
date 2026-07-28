const { formatDate, getDayDiff, parseDate } = require("./date");
const { bumpStateVersion } = require("./state-version");

const STORAGE_KEY = "jiyi_plans_v1";
const VALID_STATUSES = ["pending", "completed", "cancelled"];

function readPlans() {
  const stored = wx.getStorageSync(STORAGE_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.map(normalizePlan).filter((item) => item.id && item.date);
}

function writePlans(plans) {
  const nextPlans = plans.slice(0, 200);
  wx.setStorageSync(STORAGE_KEY, nextPlans);
  bumpStateVersion();
  return nextPlans;
}

function normalizePlan(plan) {
  return {
    id: plan.id || "",
    title: plan.title || "未命名计划",
    actionKey: plan.actionKey || "custom",
    actionName: plan.actionName || "自定义事项",
    date: plan.date || "",
    weekday: plan.weekday || "",
    lunar: plan.lunar || "",
    score: Number(plan.score) || 0,
    level: plan.level || "参考",
    recommendedTime: plan.recommendedTime || "",
    reason: plan.reason || "",
    action: plan.action || "",
    risk: plan.risk || "",
    dayGrade: plan.dayGrade || "",
    dayRhythm: plan.dayRhythm || "",
    chongSha: plan.chongSha || "",
    basisExplanation: plan.basisExplanation || "",
    note: plan.note || "",
    status: VALID_STATUSES.includes(plan.status) ? plan.status : "pending",
    createdAt: Number(plan.createdAt) || Date.now(),
    updatedAt: Number(plan.updatedAt) || Date.now()
  };
}

function sortPlans(plans) {
  const statusOrder = { pending: 0, completed: 1, cancelled: 2 };
  return plans.slice().sort((first, second) => {
    const statusDiff = statusOrder[first.status] - statusOrder[second.status];
    if (statusDiff) return statusDiff;
    if (first.status === "pending") return first.date.localeCompare(second.date);
    return second.updatedAt - first.updatedAt;
  });
}

function getPlans() {
  return sortPlans(readPlans());
}

function getPlan(id) {
  return readPlans().find((item) => item.id === id) || null;
}

function getPlanDisplayLevel(plan) {
  const score = Number(plan && plan.score) || 0;
  const level = plan && plan.level;
  if (level === "优选" || score >= 84) return "优选";
  if (["适合", "合适", "可用"].includes(level) || score >= 70) return "适合";
  return "可选";
}

function getPlanLifecycle(plan, referenceDate) {
  const today = parseDate(referenceDate) || new Date();
  if (!plan) return null;
  if (plan.status === "completed") {
    return { phase: "completed", statusText: "已结束", countdown: "已完成", isPending: false };
  }
  if (plan.status === "cancelled") {
    return { phase: "cancelled", statusText: "已结束", countdown: "已取消", isPending: false };
  }

  const diff = getDayDiff(plan.date, today);
  if (diff < 0) {
    return {
      phase: "review",
      statusText: "已结束",
      countdown: `已过${Math.abs(diff)}天`,
      isPending: true
    };
  }
  if (diff === 0) {
    return { phase: "today", statusText: "今日", countdown: "就是今天", isPending: true };
  }
  return { phase: "upcoming", statusText: "待进行", countdown: `还有${diff}天`, isPending: true };
}

function upsertPlan(input) {
  const plans = readPlans();
  const duplicateIndex = plans.findIndex((item) => (
    item.status === "pending"
    && item.date === input.date
    && item.actionKey === input.actionKey
    && item.title === input.title
  ));
  const now = Date.now();

  if (duplicateIndex >= 0) {
    const updated = normalizePlan(Object.assign({}, plans[duplicateIndex], input, {
      id: plans[duplicateIndex].id,
      createdAt: plans[duplicateIndex].createdAt,
      updatedAt: now
    }));
    plans[duplicateIndex] = updated;
    writePlans(sortPlans(plans));
    return { plan: updated, created: false };
  }

  const plan = normalizePlan(Object.assign({}, input, {
    id: `plan_${now}_${Math.floor(Math.random() * 10000)}`,
    status: "pending",
    createdAt: now,
    updatedAt: now
  }));
  plans.push(plan);
  writePlans(sortPlans(plans));
  return { plan, created: true };
}

function updatePlan(id, patch) {
  const plans = readPlans();
  const index = plans.findIndex((item) => item.id === id);
  if (index < 0) return null;
  plans[index] = normalizePlan(Object.assign({}, plans[index], patch, {
    id,
    createdAt: plans[index].createdAt,
    updatedAt: Date.now()
  }));
  writePlans(sortPlans(plans));
  return plans[index];
}

function removePlan(id) {
  const plans = readPlans();
  const nextPlans = plans.filter((item) => item.id !== id);
  writePlans(nextPlans);
  return nextPlans.length !== plans.length;
}

function getPlanDateMap() {
  return readPlans().reduce((result, plan) => {
    if (!result[plan.date]) result[plan.date] = [];
    result[plan.date].push(plan);
    return result;
  }, {});
}

function getPlanStats(referenceDate) {
  const today = parseDate(referenceDate) || new Date();
  const todayKey = formatDate(today);
  const plans = readPlans();
  const pending = plans.filter((item) => item.status === "pending");
  const upcoming = pending
    .filter((item) => item.date > todayKey)
    .sort((first, second) => first.date.localeCompare(second.date));
  const todayPlans = pending.filter((item) => item.date === todayKey);
  const review = pending
    .filter((item) => item.date < todayKey)
    .sort((first, second) => second.date.localeCompare(first.date));
  const completed = plans.filter((item) => item.status === "completed");
  const cancelled = plans.filter((item) => item.status === "cancelled");
  const nextPlan = upcoming[0] || null;
  const todayPlan = todayPlans[0] || null;
  const reviewPlan = review[0] || null;

  return {
    total: plans.length,
    pendingCount: upcoming.length,
    upcomingCount: upcoming.length,
    reviewCount: review.length,
    todayCount: todayPlans.length,
    completedCount: completed.length,
    cancelledCount: cancelled.length,
    endedCount: review.length + completed.length + cancelled.length,
    nextPlan,
    todayPlan,
    reviewPlan,
    focusPlan: todayPlan || nextPlan || reviewPlan,
    nextPlanDays: nextPlan ? getDayDiff(nextPlan.date, today) : 0
  };
}

module.exports = {
  getPlans,
  getPlan,
  getPlanDisplayLevel,
  getPlanLifecycle,
  upsertPlan,
  updatePlan,
  removePlan,
  getPlanDateMap,
  getPlanStats
};
