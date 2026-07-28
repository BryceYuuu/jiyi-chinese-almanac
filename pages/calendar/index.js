const inspirations = require("../../data/inspirations");
const { getAppSnapshot } = require("../../utils/app-state");
const { getDailyInspiration, getDailyModel, getMonthCalendar } = require("../../utils/calendar");
const { checkIn } = require("../../utils/checkins");
const { formatDate, parseDate } = require("../../utils/date");
const { getPlanLifecycle } = require("../../utils/plans");
const { consumeCalendarTarget } = require("../../utils/preferences");
const { getAlmanacTerm } = require("../../data/almanac-terms");
const { getThemeConfig } = require("../../utils/theme");

Page({
  data: {
    themeClass: "theme-cinnabar",
    themeTextureTop: "/assets/materials/poster-coral-paper.jpg",
    themeTextureBody: "/assets/materials/poster-coral-flow.jpg",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    viewYear: 0,
    viewMonth: 0,
    monthTitle: "",
    selectedDate: "",
    selectedSummary: null,
    selectedInspiration: null,
    selectedPlans: [],
    hasSelectedPlans: false,
    calendarCells: [],
    showFriendly: true,
    showProfessional: false,
    isSelectedToday: false,
    isCheckedIn: false,
    checkinText: "今日留印",
    checkinClass: "checkin-button",
    profileNotice: "设置生日后，可增加生肖避冲提醒",
    termHelpEnabled: false,
    showTermSheet: false,
    activeTerm: null
  },

  onLoad(options) {
    const requestedDate = parseDate(options && options.date);
    this.initialDate = requestedDate || new Date();
  },

  onShow() {
    const pendingDate = parseDate(consumeCalendarTarget());
    const target = pendingDate || this.initialDate || parseDate(this.data.selectedDate) || new Date();
    this.initialDate = null;
    const snapshot = getAppSnapshot(new Date());
    this.renderMonth(target.getFullYear(), target.getMonth() + 1, formatDate(target), snapshot);
  },

  onTabItemTap() {
    this.refreshCheckinState();
  },

  refreshCheckinState() {
    if (!this.data.calendarCells.length) return;
    const todayKey = formatDate(new Date());
    const snapshot = getAppSnapshot(new Date());
    const checkinMap = snapshot.checkinDateMap;
    const checkinStats = snapshot.checkinStats;
    const isCheckedIn = Boolean(checkinMap[todayKey]);
    this.setData({
      calendarCells: this.data.calendarCells.map((item) => Object.assign({}, item, {
        isChecked: Boolean(checkinMap[item.dateKey])
      })),
      isCheckedIn,
      checkinText: isCheckedIn ? `已留印 · 连续${checkinStats.streak}天` : "今日留印",
      checkinClass: isCheckedIn ? "checkin-button checkin-button-done" : "checkin-button"
    });
  },

  renderMonth(year, month, selectedDate, currentSnapshot) {
    const snapshot = currentSnapshot || getAppSnapshot(new Date());
    const profile = snapshot.profile;
    const todayKey = formatDate(new Date());
    const planMap = snapshot.planDateMap;
    const checkinMap = snapshot.checkinDateMap;
    const cells = getMonthCalendar(year, month, profile).map((item) => {
      const hasPlan = Boolean(planMap[item.dateKey] && planMap[item.dateKey].length);
      const isSelected = item.dateKey === selectedDate;
      const classes = ["calendar-cell"];
      if (!item.isCurrentMonth) classes.push("calendar-cell-outside");
      if (item.isToday) classes.push("calendar-cell-today");
      if (isSelected) classes.push("calendar-cell-selected");

      return Object.assign({}, item, {
        className: classes.join(" "),
        label: item.festival || item.lunarShort,
        labelClass: item.festival ? "cell-lunar cell-festival" : "cell-lunar",
        statusClass: this.getStatusClass(item.ratingClass),
        hasPlan,
        isChecked: Boolean(checkinMap[item.dateKey])
      });
    });

    const selected = parseDate(selectedDate) || new Date(year, month - 1, 1);
    const mode = snapshot.mode || "friendly";
    const theme = getThemeConfig(snapshot.theme);
    const summary = getDailyModel(selected, profile, { professional: mode === "professional" });
    const selectedPlans = (planMap[selectedDate] || []).map((plan) => ({
      id: plan.id,
      title: plan.title,
      statusText: getPlanLifecycle(plan, new Date()).statusText
    }));
    const checkinStats = snapshot.checkinStats;
    const isSelectedToday = selectedDate === todayKey;
    const isCheckedIn = Boolean(checkinMap[todayKey]);
    this.setData({
      themeClass: snapshot.themeClass,
      themeTextureTop: theme.textureTop,
      themeTextureBody: theme.textureBody,
      viewYear: year,
      viewMonth: month,
      monthTitle: `${year}年${month}月`,
      selectedDate,
      selectedSummary: summary,
      selectedInspiration: getDailyInspiration(inspirations, selected),
      selectedPlans,
      hasSelectedPlans: selectedPlans.length > 0,
      calendarCells: cells,
      isSelectedToday,
      isCheckedIn,
      checkinText: isCheckedIn ? `已留印 · 连续${checkinStats.streak}天` : "今日留印",
      checkinClass: isCheckedIn ? "checkin-button checkin-button-done" : "checkin-button",
      profileNotice: profile.birthTime
        ? "已结合出生资料生成个人日期参考"
        : profile.zodiac
          ? "已结合生日资料生成个人日期参考"
          : "设置生日后，可增加个人日期参考",
      termHelpEnabled: profile.termHelpEnabled === true,
      showFriendly: mode === "friendly",
      showProfessional: mode === "professional"
    });
  },

  getStatusClass(ratingClass) {
    if (ratingClass === "rating-positive") return "cell-status cell-status-positive";
    if (ratingClass === "rating-caution") return "cell-status cell-status-caution";
    return "cell-status cell-status-neutral";
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

  selectDate(event) {
    const selectedDate = event.currentTarget.dataset.date;
    if (selectedDate === this.data.selectedDate) return;
    const date = parseDate(selectedDate);
    if (!date) return;
    this.renderMonth(date.getFullYear(), date.getMonth() + 1, selectedDate);
  },

  changeMonth(event) {
    const delta = Number(event.currentTarget.dataset.delta);
    const target = new Date(this.data.viewYear, this.data.viewMonth - 1 + delta, 1);
    const today = new Date();
    const selected = target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth()
      ? today
      : target;
    this.renderMonth(target.getFullYear(), target.getMonth() + 1, formatDate(selected));
  },

  handleCheckin() {
    if (!this.data.isSelectedToday) {
      wx.showToast({ title: "仅支持今日留印", icon: "none" });
      return;
    }
    if (!this.data.isCheckedIn) checkIn(new Date());
    this.renderMonth(this.data.viewYear, this.data.viewMonth, this.data.selectedDate);
    wx.showToast({ title: "今日已留印", icon: "success" });
  },

  openProfile() {
    wx.navigateTo({ url: "/pages/onboarding/index?edit=1" });
  },

  openPlan(event) {
    wx.navigateTo({ url: `/pages/plan-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openPoster() {
    wx.navigateTo({ url: `/pages/poster/index?type=daily&date=${this.data.selectedDate}` });
  },

  onShareAppMessage() {
    const summary = this.data.selectedSummary;
    return {
      title: `${summary.monthDay} · ${summary.rhythm}｜吉易`,
      path: `/pages/calendar/index?date=${this.data.selectedDate}`
    };
  },

  onShareTimeline() {
    const summary = this.data.selectedSummary;
    return {
      title: `${summary.monthDay} · ${summary.rhythm}｜吉易`,
      query: `date=${this.data.selectedDate}`
    };
  }
});
