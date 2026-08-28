const { getPosterVisual } = require("../../data/visual-assets");
const { getProfile } = require("../../utils/profile");
const { getThemeConfig, getThemeKey } = require("../../utils/theme");
const { isClassicCopyEnabled, translateCopyText } = require("../../utils/vocabulary");

const POSTER_PREVIEW_CACHE = {};
const POSTER_PREVIEW_KEYS = [];
const GENERATION_SEQUENCE_KEY = "jiyi_poster_generation_sequence";
const POSTER_RENDER_VERSION = "landscape-7";

function getTitleSizeClass(title) {
  const length = Array.from(`${title || ""}`).length;
  if (length <= 4) return "title-size-large";
  if (length <= 7) return "title-size-medium";
  return "title-size-compact";
}

function setPreviewCache(key, path) {
  POSTER_PREVIEW_CACHE[key] = path;
  const existingIndex = POSTER_PREVIEW_KEYS.indexOf(key);
  if (existingIndex >= 0) POSTER_PREVIEW_KEYS.splice(existingIndex, 1);
  POSTER_PREVIEW_KEYS.push(key);
  while (POSTER_PREVIEW_KEYS.length > 18) {
    delete POSTER_PREVIEW_CACHE[POSTER_PREVIEW_KEYS.shift()];
  }
}

Page({
  data: {
    themeClass: "theme-cinnabar",
    posterType: "daily",
    content: null,
    titleSizeClass: "title-size-large",
    selectedStyle: "sun",
    previewPath: "",
    styleOptions: [
      { key: "sun", name: "日光", className: "style-option style-option-active style-sun" },
      { key: "mountain", name: "山行", className: "style-option style-mountain" },
      { key: "paper", name: "书页", className: "style-option style-paper" }
    ],
    isReady: false,
    activeBackgroundPath: "",
    activeMotifPath: "",
    generationSequence: 0,
    isExporting: false,
    shareButtonText: "分享图片"
  },

  onLoad(options) {
    const themeConfig = getThemeConfig(getThemeKey());
    this.classicCopyEnabled = isClassicCopyEnabled(getProfile());
    this.posterType = options && options.type ? options.type : "daily";
    this.planId = options && options.id ? options.id : "";
    this.dateKey = options && options.date ? options.date : "";
    const content = this.buildContent();
    if (!content) {
      wx.showToast({ title: "海报内容不存在", icon: "none" });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }
    this.posterContent = content;
    this.generationSequence = this.nextGenerationSequence();
    this.visualSeed = [
      content.kind,
      content.dateKey || content.date,
      content.actionKey,
      content.title
    ].join("|");
    const variant = this.getVariant(content.dateKey || content.date) + this.generationSequence;
    const styles = ["sun", "mountain", "paper"];
    const selectedStyle = styles[variant % styles.length];
    const visual = getPosterVisual(this.visualSeed, selectedStyle, this.generationSequence);
    const previewPath = POSTER_PREVIEW_CACHE[this.getPreviewCacheKey(selectedStyle)] || "";
    this.cachedPreviewPath = previewPath;
    this.tempPosterPath = previewPath;
    this.setData({
      themeClass: themeConfig.className,
      posterType: this.posterType,
      content,
      titleSizeClass: getTitleSizeClass(content.title),
      selectedStyle,
      styleOptions: this.getStyleOptions(selectedStyle),
      previewPath,
      isReady: Boolean(previewPath),
      activeBackgroundPath: visual.backgroundPath,
      activeMotifPath: visual.motifPath,
      generationSequence: this.generationSequence
    });
  },

  onReady() {
    if (this.posterContent && !this.cachedPreviewPath) this.scheduleRender(900);
  },

  onUnload() {
    if (this.renderTimer) clearTimeout(this.renderTimer);
  },

  buildContent() {
    if (this.posterType === "plan") {
      const { getPlan, getPlanDisplayLevel } = require("../../utils/plans");
      const plan = getPlan(this.planId);
      if (!plan) return null;
      return {
        kind: "plan",
        dateKey: plan.date,
        date: plan.date,
        day: Number(plan.date.slice(8, 10)),
        monthDay: `${Number(plan.date.slice(5, 7))}月${Number(plan.date.slice(8, 10))}日`,
        weekday: plan.weekday,
        lunar: `农历${plan.lunar}`,
        title: plan.title,
        eyebrow: `${plan.actionName}计划`,
        headline: translateCopyText(`${getPlanDisplayLevel(plan)} · 状态参考`, this.classicCopyEnabled),
        primary: translateCopyText(plan.action, this.classicCopyEnabled),
        secondary: plan.recommendedTime
          ? translateCopyText(`推荐好时段 ${plan.recommendedTime}`, this.classicCopyEnabled)
          : "",
        footer: "把选好的日子，变成真正要完成的事。",
        actionKey: plan.actionKey
      };
    }

    if (this.posterType === "draft") {
      const draft = wx.getStorageSync("jiyi_poster_draft");
      if (!draft || !draft.dateKey) return null;
      const { getPlanDisplayLevel } = require("../../utils/plans");
      return {
        kind: "plan",
        dateKey: draft.dateKey,
        date: draft.dateKey,
        day: draft.day,
        monthDay: draft.date,
        weekday: draft.weekday,
        lunar: `农历${draft.lunar}`,
        title: draft.title,
        eyebrow: translateCopyText(`${draft.actionName}元气推荐`, this.classicCopyEnabled),
        headline: translateCopyText(`${getPlanDisplayLevel(draft)} · 状态参考`, this.classicCopyEnabled),
        primary: translateCopyText(draft.action, this.classicCopyEnabled),
        secondary: draft.recommendedGoodTime
          ? translateCopyText(`推荐好时段 ${draft.recommendedGoodTime}`, this.classicCopyEnabled)
          : draft.goodTimeList && draft.goodTimeList[0]
            ? translateCopyText(`推荐好时段 ${draft.goodTimeList[0]}`, this.classicCopyEnabled)
            : "",
        footer: translateCopyText("依据事项命中、日值、好时段与个人搭配综合计算。", this.classicCopyEnabled),
        actionKey: draft.actionKey
      };
    }

    const inspirations = require("../../data/inspirations");
    const { getDailyInspiration, getDailyModel } = require("../../utils/calendar");
    const { parseDate } = require("../../utils/date");
    const date = parseDate(this.dateKey) || new Date();
    const summary = getDailyModel(date, getProfile(), { professional: false });
    const inspiration = getDailyInspiration(inspirations, date);
    return {
      kind: "daily",
      dateKey: summary.solarLine,
      date: summary.solarLine,
      day: summary.day,
      monthDay: summary.monthDay,
      weekday: summary.weekday,
      lunar: summary.lunarDateLine,
      title: inspiration.keyword,
      eyebrow: translateCopyText("今日状态播报", this.classicCopyEnabled),
      headline: `${summary.grade} · ${summary.rhythm}`,
      primary: inspiration.text,
      secondary: `今日适合 ${summary.suitable.join(" · ")}`,
      footer: summary.reminder,
      actionKey: "daily"
    };
  },

  getVariant(value) {
    return `${value || ""}`.split("").reduce((total, item) => total + (Number(item) || 0), 0);
  },

  nextGenerationSequence() {
    const current = Number(wx.getStorageSync(GENERATION_SEQUENCE_KEY)) || 0;
    const next = current >= 999999 ? 1 : current + 1;
    wx.setStorageSync(GENERATION_SEQUENCE_KEY, next);
    return next;
  },

  getStyleOptions(selectedStyle) {
    return this.data.styleOptions.map((item) => Object.assign({}, item, {
      className: `style-option style-${item.key}${item.key === selectedStyle ? " style-option-active" : ""}`,
      previewPath: getPosterVisual(this.visualSeed, item.key, this.generationSequence).motifPath
    }));
  },

  getPreviewCacheKey(style) {
    const content = this.posterContent || {};
    const visual = getPosterVisual(this.visualSeed, style, this.generationSequence);
    return [
      POSTER_RENDER_VERSION,
      this.classicCopyEnabled ? "classic" : "modern",
      content.kind,
      content.dateKey,
      content.title,
      style,
      visual.key
    ].join("|");
  },

  scheduleRender(delay) {
    if (this.renderTimer) clearTimeout(this.renderTimer);
    wx.nextTick(() => {
      this.renderTimer = setTimeout(() => {
        this.renderTimer = null;
        this.renderPoster();
      }, typeof delay === "number" ? delay : 20);
    });
  },

  selectStyle(event) {
    const selectedStyle = event.currentTarget.dataset.key;
    this.renderToken = (this.renderToken || 0) + 1;
    const visual = getPosterVisual(this.visualSeed, selectedStyle, this.generationSequence);
    const previewPath = POSTER_PREVIEW_CACHE[this.getPreviewCacheKey(selectedStyle)] || "";
    this.tempPosterPath = previewPath;
    this.setData({
      selectedStyle,
      styleOptions: this.getStyleOptions(selectedStyle),
      isReady: Boolean(previewPath),
      activeBackgroundPath: visual.backgroundPath,
      activeMotifPath: visual.motifPath,
      previewPath
    });
    if (!previewPath) this.scheduleRender(120);
  },

  renderPoster() {
    this.renderToken = (this.renderToken || 0) + 1;
    const renderToken = this.renderToken;
    const query = wx.createSelectorQuery().in(this);
    query.select("#posterCanvas").fields({ node: true, size: true }).exec((res) => {
      if (renderToken !== this.renderToken || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const width = res[0].width;
      const height = res[0].height;
      const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const dpr = Math.min(systemInfo.pixelRatio || 2, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      this.canvas = canvas;
      this.canvasSize = { width, height };
      const visual = getPosterVisual(this.visualSeed, this.data.selectedStyle, this.generationSequence);
      this.loadVisualImages(canvas, visual, (images) => {
        if (renderToken !== this.renderToken) return;
        const { drawPoster } = require("../../utils/poster-renderer");
        const variant = this.getVariant(`${this.posterContent.dateKey}${visual.key}`) % 3;
        drawPoster(ctx, width, height, this.data.selectedStyle, this.posterContent, variant, Object.assign({}, visual, images));
        this.commitRenderedPoster(renderToken, visual, images);
      });
    });
  },

  commitRenderedPoster(renderToken, visual, images) {
    const cacheKey = this.getPreviewCacheKey(this.data.selectedStyle);
    let hasFinished = false;
    const finish = () => {
      if (hasFinished || renderToken !== this.renderToken) return;
      hasFinished = true;
      this.createPosterFile((path) => {
        if (renderToken !== this.renderToken) return;
        this.tempPosterPath = path;
        setPreviewCache(cacheKey, path);
        this.setData({
          previewPath: path,
          isReady: true,
          activeBackgroundPath: visual.backgroundPath,
          activeMotifPath: visual.motifPath,
          isExporting: false,
          shareButtonText: "分享图片"
        });
      }, () => {
        if (renderToken !== this.renderToken) return;
        this.setData({
          isReady: true,
          activeBackgroundPath: visual.backgroundPath,
          activeMotifPath: visual.motifPath,
          isExporting: false,
          shareButtonText: "分享图片"
        });
      });
    };
    if (this.canvas && this.canvas.requestAnimationFrame) {
      this.canvas.requestAnimationFrame(finish);
    }
    setTimeout(finish, 50);
  },

  loadVisualImages(canvas, visual, callback) {
    const output = { backgroundImage: null, motifImage: null };
    this.loadCanvasImage(canvas, visual.backgroundPath, (image) => {
      output.backgroundImage = image;
      callback(output);
    });
  },

  loadCanvasImage(canvas, path, callback) {
    this.visualImageCache = this.visualImageCache || {};
    if (this.visualImageCache[path]) {
      callback(this.visualImageCache[path]);
      return;
    }
    const image = canvas.createImage();
    image.onload = () => {
      this.visualImageCache[path] = image;
      callback(image);
    };
    image.onerror = () => callback(null);
    image.src = path;
  },

  createPosterFile(callback, fail) {
    if (!this.canvas) return;
    wx.canvasToTempFilePath({
      canvas: this.canvas,
      fileType: "png",
      quality: 1,
      success: (res) => {
        callback(res.tempFilePath);
      },
      fail
    }, this);
  },

  handlePreviewError() {
    const key = this.getPreviewCacheKey(this.data.selectedStyle);
    delete POSTER_PREVIEW_CACHE[key];
    this.tempPosterPath = "";
    this.setData({ previewPath: "", isReady: false });
    this.scheduleRender(120);
  },

  exportPoster(callback) {
    if (this.tempPosterPath) {
      callback(this.tempPosterPath);
      return;
    }
    if (!this.canvas) return;
    this.setData({ isExporting: true, shareButtonText: "生成中…" });
    this.createPosterFile((path) => {
      this.tempPosterPath = path;
      setPreviewCache(this.getPreviewCacheKey(this.data.selectedStyle), path);
      this.setData({
        previewPath: path,
        isReady: true,
        isExporting: false,
        shareButtonText: "分享图片"
      });
      callback(path);
    }, () => {
      this.setData({ isExporting: false, shareButtonText: "重新生成" });
      wx.showToast({ title: "海报生成失败，请重试", icon: "none" });
    });
  },

  sharePoster() {
    if (this.data.isExporting) return;
    const share = (path) => {
      if (wx.showShareImageMenu) {
        wx.showShareImageMenu({ path });
        return;
      }
      wx.previewImage({ urls: [path], current: path });
    };
    if (this.tempPosterPath) {
      share(this.tempPosterPath);
      return;
    }
    this.exportPoster(share);
  },

  onShareAppMessage() {
    const content = this.posterContent;
    return {
      title: `${content.monthDay} · ${content.title}｜吉易`,
      path: `/pages/calendar/index?date=${content.dateKey}`
    };
  },

  onShareTimeline() {
    const content = this.posterContent;
    return {
      title: `${content.monthDay} · ${content.title}｜吉易`,
      query: `date=${content.dateKey}`
    };
  }
});
