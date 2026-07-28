const { parseDate } = require("../../utils/date");
const { getPlanLifecycle, getPlans, getPlanStats } = require("../../utils/plans");
const { getThemeClass, getThemeKey } = require("../../utils/theme");

Page({
  data: {
    themeClass: "theme-cinnabar",
    hasPlans: false,
    hasPending: false,
    hasToday: false,
    hasEnded: false,
    pendingPlans: [],
    todayPlans: [],
    endedPlans: [],
    nextPlan: null,
    nextPlanLabel: "下一个计划",
    pendingCount: 0,
    todayCount: 0,
    endedCount: 0
  },

  onShow() {
    this.renderPlans();
  },

  renderPlans() {
    const today = new Date();
    const plans = getPlans();
    const stats = getPlanStats(today);
    const mapPlan = (plan) => {
      const date = parseDate(plan.date);
      const lifecycle = getPlanLifecycle(plan, today);
      const statusClassMap = {
        completed: "plan-status plan-status-completed",
        cancelled: "plan-status plan-status-cancelled",
        review: "plan-status plan-status-review",
        today: "plan-status plan-status-today"
      };
      return Object.assign({}, plan, {
        day: date ? date.getDate() : "--",
        month: date ? `${date.getMonth() + 1}月` : "",
        countdown: lifecycle.countdown,
        lifecyclePhase: lifecycle.phase,
        statusText: lifecycle.statusText,
        statusClass: statusClassMap[lifecycle.phase] || "plan-status"
      });
    };
    const mappedPlans = plans.map(mapPlan);
    const todayPlans = mappedPlans.filter((item) => item.lifecyclePhase === "today");
    const pendingPlans = mappedPlans.filter((item) => item.lifecyclePhase === "upcoming");
    const endedPlans = mappedPlans.filter((item) => ["review", "completed", "cancelled"].includes(item.lifecyclePhase));
    const focusPlan = stats.focusPlan;
    const nextPlan = focusPlan ? mapPlan(focusPlan) : null;

    this.setData({
      themeClass: getThemeClass(getThemeKey()),
      hasPlans: plans.length > 0,
      hasPending: pendingPlans.length > 0,
      hasToday: todayPlans.length > 0,
      hasEnded: endedPlans.length > 0,
      pendingPlans,
      todayPlans,
      endedPlans,
      nextPlan,
      nextPlanLabel: nextPlan && nextPlan.lifecyclePhase === "today"
        ? "今日"
        : nextPlan && nextPlan.lifecyclePhase === "review" ? "已结束 · 待确认" : "下一个计划",
      pendingCount: stats.upcomingCount,
      todayCount: stats.todayCount,
      endedCount: stats.endedCount
    });
  },

  openPlan(event) {
    wx.navigateTo({ url: `/pages/plan-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  startSearch() {
    wx.switchTab({ url: "/pages/goodday/index" });
  }
});
