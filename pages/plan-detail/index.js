const { getAppSnapshot } = require("../../utils/app-state");
const { parseDate } = require("../../utils/date");
const { getPlan, getPlanDisplayLevel, getPlanLifecycle, removePlan, updatePlan } = require("../../utils/plans");
const { getVocabulary, translateCopyText } = require("../../utils/vocabulary");

Page({
  data: {
    themeClass: "theme-cinnabar",
    themeColor: "#C94732",
    copy: getVocabulary({}),
    classicCopyEnabled: false,
    planId: "",
    plan: null,
    title: "",
    note: "",
    day: "--",
    month: "",
    statusText: "",
    isPending: false,
    isCompleted: false,
    statusActionText: "标记为已完成",
    cancelActionText: "取消计划",
    displayLevel: "可选",
    showProfessionalScore: false,
    heroScoreClass: "hero-score hero-score-friendly",
    lifecycleHint: ""
  },

  onLoad(options) {
    this.planId = options && options.id ? options.id : "";
  },

  onShow() {
    this.renderPlan();
  },

  renderPlan() {
    const plan = getPlan(this.planId);
    if (!plan) {
      wx.showToast({ title: "计划不存在", icon: "none" });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }
    const date = parseDate(plan.date);
    const lifecycle = getPlanLifecycle(plan, new Date());
    const snapshot = getAppSnapshot(new Date());
    const mode = snapshot.mode;
    const displayPlan = Object.assign({}, plan, {
      reason: translateCopyText(plan.reason, snapshot.classicCopyEnabled),
      action: translateCopyText(plan.action, snapshot.classicCopyEnabled),
      risk: translateCopyText(plan.risk, snapshot.classicCopyEnabled),
      basisExplanation: translateCopyText(plan.basisExplanation, snapshot.classicCopyEnabled)
    });
    const lifecycleHints = {
      today: "计划日期就是今天，完成后记得回来确认。",
      review: "计划日期已经过去，请确认是否完成，或结束这项计划。",
      upcoming: lifecycle.countdown
    };
    this.setData({
      themeClass: snapshot.themeClass,
      themeColor: snapshot.themeColor,
      copy: snapshot.copy,
      classicCopyEnabled: snapshot.classicCopyEnabled,
      planId: plan.id,
      plan: displayPlan,
      title: plan.title,
      note: plan.note,
      day: date ? date.getDate() : "--",
      month: date ? `${date.getMonth() + 1}月` : plan.date,
      statusText: lifecycle.statusText,
      isPending: plan.status === "pending",
      isCompleted: plan.status === "completed",
      statusActionText: plan.status === "pending"
        ? lifecycle.phase === "review" ? "补记为已完成" : "标记为已完成"
        : "恢复计划",
      cancelActionText: lifecycle.phase === "review" ? "结束未完成计划" : "取消计划",
      displayLevel: getPlanDisplayLevel(plan),
      showProfessionalScore: mode === "professional",
      heroScoreClass: mode === "professional" ? "hero-score" : "hero-score hero-score-friendly",
      lifecycleHint: lifecycleHints[lifecycle.phase] || ""
    });
  },

  onTitleInput(event) {
    this.setData({ title: event.detail.value });
  },

  onNoteInput(event) {
    this.setData({ note: event.detail.value });
  },

  savePlan() {
    const title = this.data.title.trim();
    if (!title) {
      wx.showToast({ title: "请填写计划名称", icon: "none" });
      return;
    }
    updatePlan(this.planId, { title, note: this.data.note.trim() });
    this.renderPlan();
    wx.showToast({ title: "已保存", icon: "success" });
  },

  markCompleted() {
    const wasPending = this.data.isPending;
    updatePlan(this.planId, { status: wasPending ? "completed" : "pending" });
    this.renderPlan();
    wx.showToast({ title: wasPending ? "计划已完成" : "已恢复计划", icon: "success" });
  },

  cancelPlan() {
    updatePlan(this.planId, { status: "cancelled" });
    this.renderPlan();
    wx.showToast({ title: "计划已结束", icon: "success" });
  },

  deletePlan() {
    wx.showModal({
      title: "删除计划",
      content: "删除后无法恢复，确认继续吗？",
      confirmText: "删除",
      confirmColor: this.data.themeColor,
      success: (res) => {
        if (!res.confirm) return;
        removePlan(this.planId);
        wx.navigateBack();
      }
    });
  },

  openPoster() {
    wx.navigateTo({ url: `/pages/poster/index?type=plan&id=${this.planId}` });
  },

  onShareAppMessage() {
    const plan = this.data.plan;
    return {
      title: `${plan.date} · ${plan.title}｜吉易`,
      path: `/pages/calendar/index?date=${plan.date}`
    };
  },

  onShareTimeline() {
    const plan = this.data.plan;
    return {
      title: `${plan.date} · ${plan.title}｜吉易`,
      query: `date=${plan.date}`
    };
  }
});
