const { applyNativeTheme, getThemeKey } = require("./utils/theme");

App({
  onLaunch() {
    applyNativeTheme(getThemeKey());
  },

  onShow() {
    applyNativeTheme(getThemeKey());
  },

  globalData: {
    mode: "friendly",
    profile: null,
    theme: "cinnabar"
  }
});
