const { applyNativeTheme, getThemeKey } = require("./utils/theme");
const { getProfile } = require("./utils/profile");
const { applyCopyNavigation } = require("./utils/vocabulary");

App({
  onLaunch() {
    applyNativeTheme(getThemeKey());
    applyCopyNavigation(getProfile());
  },

  onShow() {
    applyNativeTheme(getThemeKey());
    applyCopyNavigation(getProfile());
  },

  globalData: {
    mode: "friendly",
    profile: null,
    theme: "cinnabar"
  }
});
