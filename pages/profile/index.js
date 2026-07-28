const { getAppSnapshot } = require("../../utils/app-state");
const { getBirthChart } = require("../../utils/bazi");
const { getPlanLifecycle } = require("../../utils/plans");
const { ensureProfileReady, getDisplayName, getProfile, saveProfile } = require("../../utils/profile");
const { getThemeConfig, getThemeOptions, setTheme } = require("../../utils/theme");

Page({
  data: {
    theme: "cinnabar",
    themeClass: "theme-cinnabar",
    themeColor: "#C94732",
    themeTextureTop: "/assets/materials/poster-coral-paper.jpg",
    themeTextureBody: "/assets/materials/poster-coral-flow.jpg",
    themeOptions: getThemeOptions("cinnabar"),
    profile: null,
    displayName: "",
    avatarText: "吉",
    avatarPath: "",
    hasAvatar: false,
    hasZodiac: false,
    zodiacText: "-",
    birthdayText: "未设置生日",
    profileDesc: "尚未设置生日",
    hasBirthChart: false,
    birthChartPillars: [],
    birthChartMeta: "",
    birthChartElements: "",
    birthChartStatus: "待完善",
    birthChartPrompt: "补充出生日期与时间，完善本地历法资料。",
    avoidOwnChong: true,
    termHelpEnabled: false,
    mode: "friendly",
    friendlyClass: "mode-choice mode-choice-active",
    professionalClass: "mode-choice",
    checkinStreak: 0,
    checkinMonthCount: 0,
    pendingPlanCount: 0,
    hasNextPlan: false,
    nextPlanTitle: "还没有待进行计划",
    nextPlanMeta: "找好日子后可以保存为计划"
  },

  onShow() {
    if (!ensureProfileReady()) return;
    this.renderProfile();
  },

  renderProfile() {
    const snapshot = getAppSnapshot(new Date());
    const profile = snapshot.profile;
    const displayName = getDisplayName(profile);
    const checkinStats = snapshot.checkinStats;
    const birthChart = getBirthChart(profile);
    const planStats = snapshot.planStats;
    const nextPlan = planStats.focusPlan;
    const nextPlanLifecycle = getPlanLifecycle(nextPlan, new Date());
    const theme = getThemeConfig(snapshot.theme);

    this.setData({
      theme: snapshot.theme,
      themeClass: snapshot.themeClass,
      themeColor: snapshot.themeColor,
      themeTextureTop: theme.textureTop,
      themeTextureBody: theme.textureBody,
      themeOptions: getThemeOptions(snapshot.theme),
      profile,
      displayName,
      avatarText: displayName.slice(0, 1),
      avatarPath: profile.avatarPath || "",
      hasAvatar: Boolean(profile.avatarPath),
      hasZodiac: Boolean(profile.zodiac),
      zodiacText: profile.zodiac || "-",
      birthdayText: profile.birthday || "未设置生日",
      profileDesc: profile.birthday ? `生肖${profile.zodiac || "-"} · ${profile.birthday}` : "尚未设置生日 · 点击完善",
      hasBirthChart: Boolean(birthChart),
      birthChartPillars: birthChart ? birthChart.pillars.map((item, index) => Object.assign({}, item, {
        label: ["出生年", "出生月", "出生日", "出生时"][index] || item.label
      })) : [],
      birthChartMeta: birthChart ? `${profile.birthday} · ${profile.birthTime} ${birthChart.timeZhi}时` : "",
      birthChartElements: birthChart ? "资料仅用于本地日期参考" : "",
      birthChartStatus: birthChart ? "已完善" : "待完善",
      birthChartPrompt: profile.birthday
        ? "补充出生时间，完善本地历法资料。"
        : "补充出生日期与时间，完善本地历法资料。",
      avoidOwnChong: profile.avoidOwnChong !== false,
      termHelpEnabled: profile.termHelpEnabled === true,
      mode: snapshot.mode,
      friendlyClass: snapshot.mode === "professional" ? "mode-choice" : "mode-choice mode-choice-active",
      professionalClass: snapshot.mode === "professional" ? "mode-choice mode-choice-active" : "mode-choice",
      checkinStreak: checkinStats.streak,
      checkinMonthCount: checkinStats.monthCount,
      pendingPlanCount: planStats.todayCount + planStats.upcomingCount,
      hasNextPlan: Boolean(nextPlan),
      nextPlanTitle: nextPlan ? nextPlan.title : "还没有待进行计划",
      nextPlanMeta: nextPlan
        ? `${nextPlanLifecycle.statusText} · ${nextPlan.date} · ${nextPlan.actionName}`
        : "找好日子后可以保存为计划"
    });
  },

  onAvatarError() {
    this.setData({ hasAvatar: false });
  },

  switchMode(event) {
    if (event.currentTarget.dataset.mode === this.data.mode) return;
    const profile = Object.assign({}, getProfile(), {
      defaultMode: event.currentTarget.dataset.mode
    });
    saveProfile(profile);
    this.renderKey = "";
    this.renderProfile();
  },

  selectTheme(event) {
    const theme = event.currentTarget.dataset.theme;
    if (theme === this.data.theme) return;
    setTheme(theme);
    this.renderProfile();
  },

  onAvoidChange(event) {
    if (!getProfile().zodiac) {
      wx.showToast({ title: "请先设置生日", icon: "none" });
      this.editProfile();
      return;
    }
    const profile = Object.assign({}, getProfile(), {
      avoidOwnChong: event.detail.value
    });
    saveProfile(profile);
    this.renderKey = "";
    this.renderProfile();
  },

  onTermHelpChange(event) {
    const profile = Object.assign({}, getProfile(), {
      termHelpEnabled: event.detail.value
    });
    saveProfile(profile);
    this.renderKey = "";
    this.renderProfile();
  },

  editProfile() {
    wx.navigateTo({ url: "/pages/onboarding/index?edit=1" });
  },

  editBirthChart() {
    wx.navigateTo({ url: "/pages/onboarding/index?edit=1&focus=bazi" });
  },

  openPlans() {
    wx.navigateTo({ url: "/pages/plans/index" });
  },

  openCalendar() {
    wx.switchTab({ url: "/pages/calendar/index" });
  }
});
