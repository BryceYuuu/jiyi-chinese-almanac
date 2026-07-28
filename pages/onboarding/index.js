const { getBirthZodiac } = require("../../utils/calendar");
const { getBirthChart } = require("../../utils/bazi");
const { getDisplayMode } = require("../../utils/preferences");
const { getProfile, saveProfile } = require("../../utils/profile");
const { getThemeConfig, getThemeKey } = require("../../utils/theme");

Page({
  data: {
    themeClass: "theme-cinnabar",
    themeColor: "#C94732",
    isEdit: false,
    isBirthFocus: false,
    setupTitle: "完善个人信息",
    setupSubtitle: "所有内容都可以稍后修改。出生资料仅用于本地日期参考。",
    basicSectionTitle: "基本资料",
    birthTimeHelpText: "按北京时间整理出生时段信息；不清楚可以跳过。",
    nickname: "",
    avatarPath: "",
    avatarPreviewPath: "",
    avatarTempPath: "",
    avatarText: "吉",
    hasAvatar: false,
    birthday: "",
    birthdayText: "选择出生日期",
    birthdayEnd: "",
    hasBirthday: false,
    birthTime: "",
    birthTimeText: "选择出生时间",
    hasBirthTime: false,
    hasBirthChart: false,
    birthChartPillars: [],
    birthChartDayMaster: "",
    birthChartElements: "",
    birthTimePickerClass: "field-picker field-placeholder",
    zodiac: "",
    defaultMode: "friendly",
    isFriendly: true,
    isProfessional: false,
    friendlyClass: "setup-mode-item setup-mode-active",
    professionalClass: "setup-mode-item",
    birthdayPickerClass: "field-picker field-placeholder",
    avoidOwnChong: true,
    termHelpEnabled: false,
    canSave: true,
    isSaving: false,
    saveButtonClass: "section primary-button setup-button",
    saveButtonText: "进入吉易"
  },

  onLoad(options) {
    const profile = getProfile();
    const defaultMode = getDisplayMode(profile);
    const birthChart = getBirthChart(profile);
    const themeConfig = getThemeConfig(getThemeKey());
    const isEdit = options && options.edit === "1";
    const isBirthFocus = Boolean(isEdit && options && options.focus === "bazi");
    if (profile.completed && !isEdit) {
      wx.switchTab({
        url: "/pages/index/index"
      });
      return;
    }
    const initialData = {
      themeClass: themeConfig.className,
      themeColor: themeConfig.primary,
      isEdit,
      isBirthFocus,
      setupTitle: isBirthFocus ? "完善出生信息" : "完善个人信息",
      setupSubtitle: isBirthFocus
        ? "填写出生日期和时间，在本机完善个人历法资料。"
        : "所有内容都可以稍后修改。出生资料仅用于本地日期参考。",
      basicSectionTitle: isBirthFocus ? "出生信息" : "基本资料",
      birthTimeHelpText: isBirthFocus
        ? "请选择当地钟表记录的出生时间；当前按北京时间整理日期信息。"
        : "按北京时间整理出生时段信息；不清楚可以跳过。",
      birthdayEnd: this.formatDate(new Date()),
      nickname: profile.nickname || "",
      avatarPath: profile.avatarPath || "",
      avatarPreviewPath: profile.avatarPath || "",
      avatarText: (profile.nickname || "吉").slice(0, 1),
      hasAvatar: Boolean(profile.avatarPath),
      birthday: profile.birthday || "",
      birthdayText: profile.birthday || "选择出生日期",
      hasBirthday: Boolean(profile.birthday),
      birthTime: profile.birthTime || "",
      birthTimeText: profile.birthTime || "选择出生时间",
      hasBirthTime: Boolean(profile.birthTime),
      hasBirthChart: Boolean(birthChart),
      birthChartPillars: birthChart ? birthChart.pillars.map((item, index) => Object.assign({}, item, {
        label: ["出生年", "出生月", "出生日", "出生时"][index] || item.label
      })) : [],
      birthChartDayMaster: birthChart ? `出生时段 ${birthChart.timeZhi}时` : "",
      birthChartElements: birthChart ? "资料仅用于本地日期参考" : "",
      birthTimePickerClass: profile.birthTime ? "field-picker" : "field-picker field-placeholder",
      zodiac: profile.zodiac || "",
      defaultMode,
      isFriendly: defaultMode === "friendly",
      isProfessional: defaultMode === "professional",
      friendlyClass: defaultMode === "friendly" ? "setup-mode-item setup-mode-active" : "setup-mode-item",
      professionalClass: defaultMode === "professional" ? "setup-mode-item setup-mode-active" : "setup-mode-item",
      birthdayPickerClass: profile.birthday ? "field-picker" : "field-picker field-placeholder",
      avoidOwnChong: profile.avoidOwnChong !== false,
      termHelpEnabled: profile.termHelpEnabled === true,
      saveButtonText: isBirthFocus ? "保存出生信息" : isEdit ? "保存信息" : "进入吉易"
    };
    if (isBirthFocus) wx.setNavigationBarTitle({ title: "补充出生资料" });
    this.initialFormSignature = this.getFormSignature(initialData);
    this.setData(initialData, () => this.refreshCanSave());
  },

  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${date.getFullYear()}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;
  },

  onNicknameInput(event) {
    const nickname = event.detail.value;
    this.setData({
      nickname,
      avatarText: nickname.trim().slice(0, 1) || "吉"
    }, () => this.refreshCanSave());
  },

  chooseAvatar() {
    const onSelected = (tempFilePath) => this.cropAvatar(tempFilePath);

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album"],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          if (file && file.tempFilePath) onSelected(file.tempFilePath);
        }
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sourceType: ["album"],
      success: (res) => {
        if (res.tempFilePaths && res.tempFilePaths[0]) onSelected(res.tempFilePaths[0]);
      }
    });
  },

  cropAvatar(src) {
    if (!wx.cropImage) {
      wx.showModal({
        title: "暂时无法裁剪",
        content: "当前微信版本不支持图片裁剪，请升级微信后重试。",
        showCancel: false
      });
      return;
    }

    wx.cropImage({
      src,
      cropScale: "1:1",
      success: (res) => {
        this.setData({
          avatarTempPath: res.tempFilePath,
          avatarPreviewPath: res.tempFilePath,
          hasAvatar: true
        }, () => this.refreshCanSave());
      }
    });
  },

  onAvatarError() {
    this.setData({
      avatarPreviewPath: "",
      avatarTempPath: "",
      hasAvatar: false
    }, () => this.refreshCanSave());
  },

  onBirthdayChange(event) {
    const birthday = event.detail.value;
    this.setData({
      birthday,
      birthdayText: birthday,
      hasBirthday: true,
      birthdayPickerClass: "field-picker",
      zodiac: getBirthZodiac(birthday)
    }, () => {
      this.refreshBirthChart();
      this.refreshCanSave();
    });
  },

  onBirthTimeChange(event) {
    const birthTime = event.detail.value;
    this.setData({
      birthTime,
      birthTimeText: birthTime,
      hasBirthTime: true,
      birthTimePickerClass: "field-picker"
    }, () => {
      this.refreshBirthChart();
      this.refreshCanSave();
    });
  },

  clearBirthTime() {
    this.setData({
      birthTime: "",
      birthTimeText: "选择出生时间",
      hasBirthTime: false,
      birthTimePickerClass: "field-picker field-placeholder"
    }, () => {
      this.refreshBirthChart();
      this.refreshCanSave();
    });
  },

  refreshBirthChart() {
    const birthChart = getBirthChart({
      birthday: this.data.birthday,
      birthTime: this.data.birthTime
    });
    this.setData({
      hasBirthChart: Boolean(birthChart),
      birthChartPillars: birthChart ? birthChart.pillars.map((item, index) => Object.assign({}, item, {
        label: ["出生年", "出生月", "出生日", "出生时"][index] || item.label
      })) : [],
      birthChartDayMaster: birthChart ? `出生时段 ${birthChart.timeZhi}时` : "",
      birthChartElements: birthChart ? "资料仅用于本地日期参考" : ""
    });
  },

  switchMode(event) {
    const defaultMode = event.currentTarget.dataset.mode;
    if (defaultMode === this.data.defaultMode) return;
    this.setData({
      defaultMode,
      isFriendly: defaultMode === "friendly",
      isProfessional: defaultMode === "professional",
      friendlyClass: defaultMode === "friendly" ? "setup-mode-item setup-mode-active" : "setup-mode-item",
      professionalClass: defaultMode === "professional" ? "setup-mode-item setup-mode-active" : "setup-mode-item"
    }, () => this.refreshCanSave());
  },

  onAvoidChange(event) {
    this.setData({
      avoidOwnChong: event.detail.value
    }, () => this.refreshCanSave());
  },

  refreshCanSave() {
    const hasChanges = !this.data.isEdit || this.getFormSignature(this.data) !== this.initialFormSignature;
    const hasCompleteBirthInput = !this.data.isBirthFocus || Boolean(this.data.birthday && this.data.birthTime);
    const canSave = hasChanges && hasCompleteBirthInput;
    this.setData({
      canSave,
      saveButtonClass: canSave
        ? "section primary-button setup-button"
        : "section primary-button primary-button-disabled setup-button"
    });
  },

  getFormSignature(data) {
    return [
      (data.nickname || "").trim(),
      data.avatarPreviewPath || data.avatarPath || "",
      data.birthday || "",
      data.birthTime || "",
      data.zodiac || "",
      data.defaultMode || "friendly",
      data.avoidOwnChong === false ? "0" : "1"
    ].join("|");
  },

  save() {
    if (this.data.isSaving || !this.data.canSave) return;
    if (this.data.avatarTempPath) {
      this.setData({ isSaving: true });
      wx.saveFile({
        tempFilePath: this.data.avatarTempPath,
        success: (res) => this.commitProfile(res.savedFilePath),
        fail: () => {
          this.setData({ isSaving: false });
          wx.showToast({ title: "头像保存失败，请重试", icon: "none" });
        }
      });
      return;
    }

    this.commitProfile(this.data.avatarPath);
  },

  commitProfile(avatarPath) {
    const previousProfile = getProfile();

    saveProfile({
      nickname: this.data.nickname.trim(),
      avatarPath: avatarPath || "",
      birthday: this.data.birthday,
      birthTime: this.data.birthTime,
      zodiac: this.data.birthday ? this.data.zodiac || getBirthZodiac(this.data.birthday) : "",
      defaultMode: this.data.defaultMode,
      avoidOwnChong: this.data.avoidOwnChong,
      termHelpEnabled: this.data.termHelpEnabled
    });

    if (previousProfile.avatarPath && previousProfile.avatarPath !== avatarPath && wx.removeSavedFile) {
      wx.removeSavedFile({ filePath: previousProfile.avatarPath });
    }

    this.setData({ isSaving: false });

    if (this.data.isEdit && getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }

    wx.switchTab({
      url: "/pages/index/index"
    });
  }
});
