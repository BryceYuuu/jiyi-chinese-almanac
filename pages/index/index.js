const inspirations = require("../../data/inspirations");
const { getHomeBanner } = require("../../data/visual-assets");
const { getAppSnapshot } = require("../../utils/app-state");
const { getDailyInspiration, getDailyModel } = require("../../utils/calendar");
const { checkIn } = require("../../utils/checkins");
const { addDays } = require("../../utils/date");
const { setCalendarTarget, setDisplayMode } = require("../../utils/preferences");
const { ensureProfileReady, getDisplayName } = require("../../utils/profile");
const { getAlmanacTerm } = require("../../data/almanac-terms");
const { getThemeConfig } = require("../../utils/theme");
const { getTenGodKeywords } = require("../../utils/bazi");

const HOME_VIEW_VERSION = "2026.07.27-2";

Page({
  data: {
    themeClass: "theme-cinnabar",
    themeTextureTop: "/assets/materials/poster-coral-paper.jpg",
    themeTextureBody: "/assets/materials/poster-coral-flow.jpg",
    mode: "friendly",
    isFriendly: true,
    isProfessional: false,
    showFriendly: false,
    showProfessional: false,
    friendlyModeClass: "mode-item mode-item-active",
    professionalModeClass: "mode-item",
    profile: null,
    displayName: "",
    profileLine: "",
    greeting: "今天好",
    today: null,
    baziThemeKeywords: [],
    inspiration: null,
    inspirationImage: "/assets/materials/banner-mist.jpg",
    isCheckedIn: false,
    checkinText: "今日留印",
    checkinClass: "home-checkin",
    isOpeningPoster: false,
    posterButtonText: "生成今日卡片",
    upcomingDays: [],
    termHelpEnabled: false,
    showTermSheet: false,
    activeTerm: null
  },

  onShow() {
    if (!ensureProfileReady()) return;
    if (this.data.isOpeningPoster) {
      this.setData({ isOpeningPoster: false, posterButtonText: "生成今日卡片" });
    }
    const date = new Date();
    const snapshot = getAppSnapshot(date, { plans: false });
    const profile = snapshot.profile;
    const checkinStats = snapshot.checkinStats;
    const mode = snapshot.mode;
    const theme = getThemeConfig(snapshot.theme);
    const renderKey = [
      HOME_VIEW_VERSION,
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      mode,
      snapshot.theme,
      snapshot.stateVersion
    ].join("|");

    if (this.renderKey === renderKey) return;
    this.renderKey = renderKey;

    const today = getDailyModel(date, profile, {
      professional: mode === "professional",
      bazi: true
    });
    const inspiration = getDailyInspiration(inspirations, date);
    const upcomingDays = [1, 2, 3].map((offset) => {
      const summary = getDailyModel(addDays(date, offset), profile, { professional: false });
      return {
        dateKey: summary.solarLine,
        day: summary.day,
        weekday: summary.weekday.replace("星期", "周"),
        lunar: summary.lunarShort,
        grade: summary.grade,
        rhythm: summary.rhythm,
        markerClass: `forecast-marker ${summary.ratingClass}`
      };
    });
    this.setData({
      themeClass: snapshot.themeClass,
      themeTextureTop: theme.textureTop,
      themeTextureBody: theme.textureBody,
      mode,
      isFriendly: mode === "friendly",
      isProfessional: mode === "professional",
      showFriendly: mode === "friendly",
      showProfessional: mode === "professional",
      friendlyModeClass: mode === "friendly" ? "mode-item mode-item-active" : "mode-item",
      professionalModeClass: mode === "professional" ? "mode-item mode-item-active" : "mode-item",
      profile,
      termHelpEnabled: profile.termHelpEnabled === true,
      displayName: getDisplayName(profile),
      profileLine: profile.birthTime
        ? "四柱已完善 · 个人提醒已启用"
        : profile.zodiac
          ? `生肖${profile.zodiac} · 已启用个人提醒`
        : "通用日历 · 点此完善生日",
      greeting: this.getGreeting(date),
      today,
      baziThemeKeywords: today.baziInsight
        ? getTenGodKeywords(today.baziInsight.primaryTenGod)
        : [],
      inspiration,
      inspirationImage: getHomeBanner(today.solarLine),
      isCheckedIn: checkinStats.checkedToday,
      checkinText: checkinStats.checkedToday ? "已留印" : "今日留印",
      checkinClass: checkinStats.checkedToday ? "home-checkin home-checkin-done" : "home-checkin",
      isOpeningPoster: false,
      posterButtonText: "生成今日卡片",
      upcomingDays
    });
  },

  getGreeting(date) {
    const hour = date.getHours();
    if (hour < 11) return "早上好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  },

  onPullDownRefresh() {
    this.renderKey = "";
    this.onShow();
    wx.stopPullDownRefresh();
  },

  switchMode(event) {
    const mode = event.currentTarget.dataset.mode;
    this.setMode(mode);
  },

  setMode(mode) {
    if (mode === this.data.mode) return;
    setDisplayMode(mode);
    this.renderKey = "";
    this.onShow();
  },

  openTerm(event) {
    if (!this.data.termHelpEnabled) return;
    const term = getAlmanacTerm(event.currentTarget.dataset.term, event.currentTarget.dataset.value);
    if (!term) return;
    this.setData({ activeTerm: term, showTermSheet: true });
  },

  closeTerm() {
    this.setData({ showTermSheet: false });
  },

  handleCheckin() {
    if (this.data.isCheckedIn) {
      wx.showToast({ title: "今天已经留印", icon: "none" });
      return;
    }
    checkIn(new Date());
    this.renderKey = "";
    this.onShow();
    wx.showToast({ title: "今日已留印", icon: "success" });
  },

  openCalendar() {
    wx.switchTab({ url: "/pages/calendar/index" });
  },

  openUpcomingDate(event) {
    setCalendarTarget(event.currentTarget.dataset.date);
    wx.switchTab({ url: "/pages/calendar/index" });
  },

  openProfile() {
    wx.navigateTo({ url: "/pages/onboarding/index?edit=1" });
  },

  openBirthProfile() {
    wx.navigateTo({ url: "/pages/onboarding/index?edit=1&focus=bazi" });
  },

  openPoster() {
    if (this.data.isOpeningPoster) return;
    const today = this.data.today;
    this.setData({ isOpeningPoster: true, posterButtonText: "正在打开" });
    wx.navigateTo({
      url: `/pages/poster/index?type=daily&date=${today.solarLine}`,
      fail: () => this.setData({ isOpeningPoster: false, posterButtonText: "生成今日卡片" })
    });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.today.monthDay} · ${this.data.today.rhythm}｜吉易`,
      path: `/pages/calendar/index?date=${this.data.today.solarLine}`
    };
  },

  onShareTimeline() {
    return {
      title: `${this.data.today.monthDay} · ${this.data.today.rhythm}｜吉易`,
      query: `date=${this.data.today.solarLine}`
    };
  }
});
