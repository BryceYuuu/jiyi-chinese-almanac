const { getAppSnapshot } = require("../../utils/app-state");
const { getActionRule, getGoodDayRecommendationsAsync } = require("../../utils/calendar");
const { addDays, formatDate, getDayDiff, parseDate } = require("../../utils/date");
const { getPlanDisplayLevel, upsertPlan } = require("../../utils/plans");
const { getAlmanacTerm } = require("../../data/almanac-terms");
const { getThemeConfig } = require("../../utils/theme");
const { getVocabulary, translateCopyData, translateCopyText } = require("../../utils/vocabulary");

const CUSTOM_KEYWORDS = [
  { key: "marry", words: ["结婚", "婚礼", "领证", "订婚", "见家长"] },
  { key: "love", words: ["约会", "表白", "恋爱", "纪念日", "感情"] },
  { key: "social", words: ["聚会", "拜访", "见面", "沟通", "会面"] },
  { key: "move", words: ["搬家", "入宅", "安床", "装修", "居家"] },
  { key: "contract", words: ["签约", "合同", "付款", "合作", "交易"] },
  { key: "open", words: ["开业", "开工", "入职", "发布", "创业"] },
  { key: "study", words: ["学习", "考试", "报名", "开课", "培训"] },
  { key: "travel", words: ["旅行", "出差", "出发", "旅游", "远行"] }
];

Page({
  data: {
    themeClass: "theme-cinnabar",
    themeTextureTop: "/assets/materials/poster-coral-paper.jpg",
    themeTextureBody: "/assets/materials/poster-coral-flow.jpg",
    copy: getVocabulary({}),
    classicCopyEnabled: false,
    profile: null,
    mode: "friendly",
    showProfessionalScores: false,
    termHelpEnabled: false,
    resultSubtitle: "按真实条件与传统日值综合排序",
    resultRuleText: "按“结婚”类规则计算",
    filterText: "",
    selectedSceneName: "结婚",
    rangeText: "未来30天",
    resultTitle: "",
    selectedScene: "marry",
    selectedRange: 30,
    selectedRangeKey: "30",
    customStartDate: "",
    customEndDate: "",
    customEndMax: "",
    dateMin: "",
    dateMax: "",
    customTaskName: "",
    customRule: "travel",
    customRuleName: "出行",
    customRuleHint: "旅行、出差、启程或远行",
    customRuleFocus: "出门走动，行程推进更顺",
    customRuleMatch: "出行、赴任、移徙",
    customRuleExcludeText: "当天避坑清单出现出行、赴任时直接排除",
    customRulePenaltyText: "",
    customRuleHasPenalty: false,
    ruleSourceText: "请选择最接近的事项类型",
    showCustom: false,
    showAdvanced: false,
    advancedText: "更多条件",
    dayType: "all",
    preferredPeriod: "all",
    excludedDates: [],
    excludedDateOptions: [],
    excludePickerDate: "",
    hasSearched: false,
    isSearching: false,
    searchButtonText: "查找合适日期",
    visibleResultCount: 3,
    hasMoreResults: false,
    moreResultsText: "查看更多候选",
    results: [],
    showTermSheet: false,
    activeTerm: null,
    ranges: [
      { key: "30", label: "30天", value: 30 },
      { key: "60", label: "60天", value: 60 },
      { key: "90", label: "90天", value: 90 },
      { key: "custom", label: "自定义", value: 0 }
    ],
    dayTypes: [
      { key: "all", name: "全部日期" },
      { key: "weekday", name: "工作日" },
      { key: "weekend", name: "周末" }
    ],
    periods: [
      { key: "all", name: "不限" },
      { key: "morning", name: "上午" },
      { key: "afternoon", name: "下午" },
      { key: "evening", name: "晚上" }
    ],
    scenes: [
      { key: "marry", name: "结婚", iconPath: "/assets/scenes-png/marry.png" },
      { key: "move", name: "搬家", iconPath: "/assets/scenes-png/move.png" },
      { key: "car", name: "提车", iconPath: "/assets/scenes-png/car.png" },
      { key: "travel", name: "出行", iconPath: "/assets/scenes-png/travel.png" },
      { key: "open", name: "开业", iconPath: "/assets/scenes-png/open.png" },
      { key: "custom", name: "自定义", iconPath: "/assets/scenes-png/custom.png" }
    ],
    customRules: [
      { key: "love", name: "感情", hint: "约会、表白、确定关系或纪念日" },
      { key: "marry", name: "婚嫁", hint: "订婚、领证、婚礼或见双方父母" },
      { key: "social", name: "社交", hint: "聚会、拜访、第一次见面或重要沟通" },
      { key: "move", name: "居家", hint: "搬家、装修、安床或整理空间" },
      { key: "open", name: "事业", hint: "入职、开工、发布项目或开业" },
      { key: "contract", name: "签约", hint: "签合同、交易、付款或谈合作" },
      { key: "travel", name: "出行", hint: "旅行、出差、启程或远行" },
      { key: "study", name: "学业", hint: "报名、开课、考试或学业计划" }
    ],
    sceneOptions: [],
    rangeOptions: [],
    dayTypeOptions: [],
    periodOptions: [],
    customRuleOptions: []
  },

  onLoad(options) {
    const today = new Date();
    const sharedScene = options && options.scene;
    const sharedRange = Number(options && options.range);
    const selectedScene = this.data.scenes.some((item) => item.key === sharedScene) ? sharedScene : "marry";
    const selectedRange = [30, 60, 90].includes(sharedRange) ? sharedRange : 30;
    this.setData({
      selectedScene,
      selectedRange,
      selectedRangeKey: `${selectedRange}`,
      customStartDate: formatDate(today),
      customEndDate: formatDate(addDays(today, selectedRange - 1)),
      customEndMax: formatDate(addDays(today, 89)),
      dateMin: formatDate(today),
      dateMax: formatDate(addDays(today, 365)),
      excludePickerDate: formatDate(today),
      showCustom: selectedScene === "custom"
    });
  },

  onShow() {
    this.renderPageState();
  },

  selectScene(event) {
    const selectedScene = event.currentTarget.dataset.key;
    if (selectedScene === this.data.selectedScene) return;
    this.cancelPendingSearch();
    this.customRuleTouched = false;
    this.setData({
      selectedScene,
      showCustom: selectedScene === "custom",
      hasSearched: false,
      results: []
    });
    this.renderPageState();
  },

  selectRange(event) {
    const key = event.currentTarget.dataset.key;
    if (key === this.data.selectedRangeKey) return;
    this.cancelPendingSearch();
    const range = Number(event.currentTarget.dataset.range);
    const today = new Date();
    const nextData = {
      selectedRangeKey: key,
      hasSearched: false,
      results: []
    };
    if (key !== "custom") {
      nextData.selectedRange = range;
      nextData.customStartDate = formatDate(today);
      nextData.customEndDate = formatDate(addDays(today, range - 1));
      nextData.customEndMax = formatDate(addDays(today, 89));
    }
    this.setData(nextData);
    this.renderPageState();
  },

  onStartDateChange(event) {
    this.cancelPendingSearch();
    const startDate = parseDate(event.detail.value);
    const previousEnd = parseDate(this.data.customEndDate);
    const maxEnd = addDays(startDate, 89);
    const endDate = !previousEnd || previousEnd < startDate || previousEnd > maxEnd ? addDays(startDate, 29) : previousEnd;
    this.setData({
      customStartDate: formatDate(startDate),
      customEndDate: formatDate(endDate),
      customEndMax: formatDate(maxEnd),
      selectedRange: getDayDiff(endDate, startDate) + 1,
      hasSearched: false,
      results: []
    });
    this.renderPageState();
  },

  onEndDateChange(event) {
    this.cancelPendingSearch();
    const startDate = parseDate(this.data.customStartDate);
    const endDate = parseDate(event.detail.value);
    if (!startDate || !endDate || endDate < startDate) {
      wx.showToast({ title: "结束日期不能早于开始日期", icon: "none" });
      return;
    }
    this.setData({
      customEndDate: formatDate(endDate),
      selectedRange: Math.min(90, getDayDiff(endDate, startDate) + 1),
      hasSearched: false,
      results: []
    });
    this.renderPageState();
  },

  selectDayType(event) {
    if (event.currentTarget.dataset.key === this.data.dayType) return;
    this.cancelPendingSearch();
    this.setData({
      dayType: event.currentTarget.dataset.key,
      hasSearched: false,
      results: []
    });
    this.renderPageState();
  },

  selectPeriod(event) {
    if (event.currentTarget.dataset.key === this.data.preferredPeriod) return;
    this.cancelPendingSearch();
    this.setData({
      preferredPeriod: event.currentTarget.dataset.key,
      hasSearched: false,
      results: []
    });
    this.renderPageState();
  },

  toggleAdvanced() {
    const showAdvanced = !this.data.showAdvanced;
    this.setData({
      showAdvanced,
      advancedText: showAdvanced ? "收起条件" : "更多条件"
    });
  },

  onExcludeDateChange(event) {
    this.cancelPendingSearch();
    const dateKey = event.detail.value;
    const targetDate = parseDate(dateKey);
    const startDate = this.data.selectedRangeKey === "custom"
      ? parseDate(this.data.customStartDate)
      : new Date();
    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDate = this.data.selectedRangeKey === "custom"
      ? parseDate(this.data.customEndDate)
      : addDays(normalizedStart, this.data.selectedRange - 1);
    if (!targetDate || targetDate < normalizedStart || targetDate > endDate) {
      wx.showToast({ title: "该日期不在当前范围内", icon: "none" });
      return;
    }
    if (this.data.excludedDates.includes(dateKey)) {
      wx.showToast({ title: "该日期已排除", icon: "none" });
      return;
    }
    const excludedDates = this.data.excludedDates.concat(dateKey).sort();
    this.setData({ excludePickerDate: dateKey, excludedDates, hasSearched: false, results: [] });
    this.renderPageState();
  },

  removeExcludedDate(event) {
    this.cancelPendingSearch();
    const dateKey = event.currentTarget.dataset.date;
    this.setData({
      excludedDates: this.data.excludedDates.filter((item) => item !== dateKey),
      hasSearched: false,
      results: []
    });
    this.renderPageState();
  },

  onCustomTaskInput(event) {
    this.cancelPendingSearch();
    const customTaskName = event.detail.value;
    const update = {
      customTaskName,
      selectedSceneName: customTaskName.trim() || "自定义事项",
      hasSearched: false,
      results: []
    };
    if (!this.customRuleTouched) {
      const inferredRule = this.inferRule(customTaskName);
      if (inferredRule) {
        update.customRule = inferredRule;
        update.ruleSourceText = "已根据事项名称建议分类，你可以手动修改";
      }
    }
    this.setData(update);
    this.renderPageState();
  },

  selectCustomRule(event) {
    this.cancelPendingSearch();
    this.customRuleTouched = true;
    this.setData({
      customRule: event.currentTarget.dataset.key,
      ruleSourceText: "已按你的选择确认计算分类",
      hasSearched: false,
      results: []
    });
    this.renderPageState();
  },

  inferRule(value) {
    const text = value.trim();
    if (!text) return "";
    const matched = CUSTOM_KEYWORDS.find((group) => group.words.some((word) => text.includes(word)));
    return matched ? matched.key : "";
  },

  searchGoodDays() {
    if (this.data.isSearching) return;
    if (this.data.selectedScene === "custom" && !this.data.customTaskName.trim()) {
      wx.showToast({ title: "请填写事项名称", icon: "none" });
      return;
    }

    this.searchToken = (this.searchToken || 0) + 1;
    const searchToken = this.searchToken;
    const actionKey = this.getActionKey();
    const sceneName = this.getCurrentTaskName();
    const ruleName = this.data.selectedScene === "custom" ? this.data.customRuleName : sceneName;
    const filters = {
      startDate: this.data.selectedRangeKey === "custom" ? this.data.customStartDate : "",
      endDate: this.data.selectedRangeKey === "custom" ? this.data.customEndDate : "",
      dayType: this.data.dayType,
      preferredPeriod: this.data.preferredPeriod,
      excludedDates: this.data.excludedDates.slice()
    };
    this.setData({
      isSearching: true,
      searchButtonText: "正在筛选 0%",
      hasSearched: false,
      results: [],
      resultRuleText: `按“${ruleName}”类规则计算`
    });

    getGoodDayRecommendationsAsync(
      actionKey,
      this.data.selectedRange,
      this.data.profile,
      filters,
      (progress) => {
        if (searchToken !== this.searchToken || progress.complete) return;
        const percent = Math.round(progress.processed / progress.total * 100);
        const nextData = { searchButtonText: `正在筛选 ${percent}%` };
        if (progress.processed >= Math.min(24, progress.total) && progress.results.length) {
          const partialResults = progress.results.map((item, index) => this.decorateResult(item, index));
          Object.assign(nextData, {
            hasSearched: true,
            results: partialResults,
            visibleResultCount: Math.min(3, partialResults.length),
            hasMoreResults: false,
            resultTitle: `${sceneName} · 正在比较候选日`,
            resultSubtitle: `已筛选${progress.processed}/${progress.total}天，排名将在完成后确定`
          });
        }
        this.setData(nextData);
      }
    ).then((rawResults) => {
      if (searchToken !== this.searchToken) return;
      const results = rawResults.map((item, index) => this.decorateResult(item, index));
      this.setData({
        isSearching: false,
        searchButtonText: "重新查找",
        hasSearched: true,
        results,
        visibleResultCount: Math.min(3, results.length),
        hasMoreResults: results.length > 3,
        moreResultsText: "查看更多候选",
        resultSubtitle: this.data.showProfessionalScores
          ? "按事项命中、日值、时段和个人搭配综合排序"
          : "按真实条件与传统日值综合排序",
        resultTitle: translateCopyText(
          results.length ? `${sceneName} · ${results.length}个元气推荐` : `${sceneName} · 暂无明确推荐`,
          this.data.classicCopyEnabled
        )
      });
    }).catch(() => {
      if (searchToken !== this.searchToken) return;
      this.setData({ isSearching: false, searchButtonText: "重新查找" });
      wx.showToast({ title: "计算失败，请重试", icon: "none" });
    });
  },

  cancelPendingSearch() {
    if (!this.data.isSearching) return;
    this.searchToken = (this.searchToken || 0) + 1;
    this.setData({
      isSearching: false,
      searchButtonText: "查找合适日期"
    });
  },

  decorateResult(item, index, classicCopyEnabled) {
    const classicEnabled = typeof classicCopyEnabled === "boolean"
      ? classicCopyEnabled
      : this.data.classicCopyEnabled;
    const displayLevel = getPlanDisplayLevel(item);
    return Object.assign({}, item, {
      rank: item.rank || index + 1,
      expanded: Boolean(item.expanded),
      detailText: item.expanded ? "收起依据" : "查看依据",
      displayLevel,
      levelClass: displayLevel === "优选" ? "result-level result-level-best" : "result-level",
      dayStatusClass: `result-day-status ${item.dayRatingClass || "rating-neutral"}`,
      conflictClass: item.hasConflict ? "fact-chip fact-chip-warning" : "fact-chip fact-chip-clear",
      positiveEvidence: this.decorateEvidence(item.positiveEvidence, classicEnabled),
      neutralEvidence: this.decorateEvidence(item.neutralEvidence, classicEnabled),
      conflictEvidence: this.decorateEvidence(item.conflictEvidence, classicEnabled),
      personalEvidence: this.decorateEvidence(item.personalEvidence, classicEnabled)
    });
  },

  decorateEvidence(list, classicCopyEnabled) {
    return (list || []).map((evidence) => {
      const term = getAlmanacTerm(evidence.label, "", classicCopyEnabled);
      return Object.assign({}, evidence, {
        termKey: term ? evidence.label : "",
        termClass: term ? "evidence-row evidence-row-explainable" : "evidence-row"
      });
    });
  },

  openTerm(event) {
    if (!this.data.termHelpEnabled) return;
    const term = getAlmanacTerm(
      event.currentTarget.dataset.term,
      event.currentTarget.dataset.value,
      this.data.classicCopyEnabled
    );
    if (!term) return;
    this.setData({ activeTerm: term, showTermSheet: true });
  },

  closeTerm() {
    this.setData({ showTermSheet: false });
  },

  toggleMoreResults() {
    const isShowingAll = this.data.visibleResultCount >= this.data.results.length;
    this.setData({
      visibleResultCount: isShowingAll ? Math.min(3, this.data.results.length) : this.data.results.length,
      moreResultsText: isShowingAll ? "查看更多候选" : "收起更多候选"
    });
  },

  toggleResultDetail(event) {
    const index = Number(event.currentTarget.dataset.index);
    const results = this.data.results.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const expanded = !item.expanded;
      return Object.assign({}, item, {
        expanded,
        detailText: expanded ? "收起依据" : "查看依据"
      });
    });
    this.setData({ results });
  },

  saveResultPlan(event) {
    const result = this.data.results[Number(event.currentTarget.dataset.index)];
    if (!result) return;
    const taskName = this.getCurrentTaskName();
    const saved = upsertPlan({
      title: taskName,
      actionKey: result.actionKey,
      actionName: result.actionName,
      date: result.dateKey,
      weekday: result.weekday,
      lunar: result.lunar,
      score: result.score,
      level: result.level,
      recommendedTime: result.recommendedGoodTime || result.goodTimeList[0] || result.goodTimes,
      reason: result.reason,
      action: result.bestAction || result.action,
      risk: result.riskNotice || result.caution,
      dayGrade: result.dayGrade,
      dayRhythm: result.dayRhythm,
      chongSha: result.chong,
      basisExplanation: result.basisExplanation
    });
    wx.showModal({
      title: saved.created ? "已加入计划" : "计划已更新",
      content: `${taskName} · ${result.date}`,
      cancelText: "继续看看",
      confirmText: "查看计划",
      success: (res) => {
        if (res.confirm) wx.navigateTo({ url: `/pages/plan-detail/index?id=${saved.plan.id}` });
      }
    });
  },

  generateResultPoster(event) {
    const result = this.data.results[Number(event.currentTarget.dataset.index)];
    if (!result) return;
    wx.setStorageSync("jiyi_poster_draft", Object.assign({}, result, {
      title: this.getCurrentTaskName()
    }));
    wx.navigateTo({ url: "/pages/poster/index?type=draft" });
  },

  openProfile() {
    wx.navigateTo({ url: "/pages/onboarding/index?edit=1" });
  },

  renderPageState() {
    const snapshot = getAppSnapshot(new Date(), { plans: false, checkins: false });
    const profile = snapshot.profile;
    const showProfessionalScores = snapshot.mode === "professional";
    const theme = getThemeConfig(snapshot.theme);
    const actionRule = translateCopyData(
      getActionRule(this.data.customRule),
      snapshot.classicCopyEnabled
    );
    const customRule = this.data.customRules.find((item) => item.key === this.data.customRule);
    const calculationRuleName = this.data.selectedScene === "custom"
      ? customRule ? customRule.name : actionRule.name
      : this.getSceneName(this.data.selectedScene);
    const customStart = parseDate(this.data.customStartDate);
    const customEnd = parseDate(this.data.customEndDate);
    const selectedRange = this.data.selectedRangeKey === "custom" && customStart && customEnd
      ? Math.min(90, getDayDiff(customEnd, customStart) + 1)
      : this.data.selectedRange;

    this.setData({
      themeClass: snapshot.themeClass,
      themeTextureTop: theme.textureTop,
      themeTextureBody: theme.textureBody,
      copy: snapshot.copy,
      classicCopyEnabled: snapshot.classicCopyEnabled,
      profile,
      mode: snapshot.mode,
      showProfessionalScores,
      termHelpEnabled: profile.termHelpEnabled === true,
      resultSubtitle: showProfessionalScores
        ? "按事项命中、日值、时段和个人关系综合排序"
        : "按真实条件与传统日值综合排序",
      resultRuleText: `按“${calculationRuleName}”类规则计算`,
      results: this.data.results.map((item, index) => this.decorateResult(item, index, snapshot.classicCopyEnabled)),
      selectedRange,
      filterText: translateCopyText(profile.birthTime
        ? `已结合密码关系，并${profile.avoidOwnChong ? "避开不合拍日" : "保留不合拍日"}`
        : profile.zodiac
          ? `已按生肖${profile.zodiac}${profile.avoidOwnChong ? "避开不合拍日" : "保留全部日期"}`
        : "当前按通用规则计算 · 设置生日可开启生肖搭配提醒", snapshot.classicCopyEnabled),
      showCustom: this.data.selectedScene === "custom",
      sceneOptions: this.data.scenes.map((scene) => ({
        ...scene,
        iconPath: `/assets/scenes-png/${scene.key}${snapshot.theme === "cinnabar" ? "" : `-${snapshot.theme}`}.png`,
        className: scene.key === this.data.selectedScene ? "scene-option scene-option-active" : "scene-option"
      })),
      rangeOptions: this.data.ranges.map((range) => ({
        ...range,
        className: range.key === this.data.selectedRangeKey ? "range-option range-option-active" : "range-option"
      })),
      dayTypeOptions: this.data.dayTypes.map((item) => ({
        ...item,
        className: item.key === this.data.dayType ? "constraint-option constraint-option-active" : "constraint-option"
      })),
      periodOptions: this.data.periods.map((item) => ({
        ...item,
        className: item.key === this.data.preferredPeriod ? "period-option period-option-active" : "period-option"
      })),
      customRuleOptions: this.data.customRules.map((rule) => ({
        ...rule,
        className: rule.key === this.data.customRule ? "rule-option rule-option-active" : "rule-option"
      })),
      customRuleName: customRule ? customRule.name : actionRule.name,
      customRuleHint: customRule ? customRule.hint : "请选择最接近的事项类型",
      customRuleFocus: actionRule.focus,
      customRuleMatch: actionRule.match.join("、"),
      customRuleExcludeText: actionRule.excludeText,
      customRulePenaltyText: actionRule.penaltyText,
      customRuleHasPenalty: actionRule.penalty.length > 0,
      selectedSceneName: this.data.selectedScene === "custom"
        ? this.data.customTaskName.trim() || "自定义事项"
        : this.getSceneName(this.data.selectedScene),
      rangeText: this.data.selectedRangeKey === "custom"
        ? `${this.data.customStartDate.slice(5)} 至 ${this.data.customEndDate.slice(5)}`
        : `未来${selectedRange}天`,
      excludedDateOptions: this.data.excludedDates.map((dateKey) => ({
        dateKey,
        label: dateKey.slice(5).replace("-", "月") + "日"
      }))
    });
    wx.setNavigationBarTitle({ title: snapshot.copy.tabGoodDay });
  },

  getActionKey() {
    return this.data.selectedScene === "custom" ? this.data.customRule : this.data.selectedScene;
  },

  getCurrentTaskName() {
    return this.data.selectedScene === "custom"
      ? this.data.customTaskName.trim() || "自定义事项"
      : this.getSceneName(this.data.selectedScene);
  },

  getSceneName(key) {
    const scene = this.data.scenes.find((item) => item.key === key);
    return scene ? scene.name : "事项";
  },

  onShareAppMessage() {
    const title = this.data.hasSearched && this.data.results.length
      ? `${this.getCurrentTaskName()} · ${this.data.results[0].date}｜吉易`
      : "找个更顺手的日子｜吉易";
    return {
      title,
      path: `/pages/goodday/index?scene=${this.data.selectedScene}&range=${this.data.selectedRange}`
    };
  },

  onShareTimeline() {
    return {
      title: "找个更顺手的日子｜吉易",
      query: `scene=${this.data.selectedScene}&range=${this.data.selectedRange}`
    };
  }
});
