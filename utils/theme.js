const THEME_STORAGE_KEY = "jiyi_theme";
const { bumpStateVersion } = require("./state-version");

const THEMES = {
  cinnabar: {
    key: "cinnabar",
    name: "朱砂",
    description: "温暖明快",
    className: "theme-cinnabar",
    primary: "#C94732",
    background: "#F8F5EF",
    tabBackground: "#FFFDF9",
    iconSuffix: "",
    textureTop: "/assets/materials/poster-coral-paper.jpg",
    textureBody: "/assets/materials/poster-coral-flow.jpg"
  },
  pine: {
    key: "pine",
    name: "松青",
    description: "清润沉静",
    className: "theme-pine",
    primary: "#3F7468",
    background: "#F3F6F2",
    tabBackground: "#FAFCF9",
    iconSuffix: "-pine",
    textureTop: "/assets/materials/poster-bamboo-mountain.jpg",
    textureBody: "/assets/materials/poster-jade-mist.jpg"
  },
  indigo: {
    key: "indigo",
    name: "黛蓝",
    description: "克制雅致",
    className: "theme-indigo",
    primary: "#50677B",
    background: "#F3F5F6",
    tabBackground: "#FAFBFC",
    iconSuffix: "-indigo",
    textureTop: "/assets/materials/banner-mist.jpg",
    textureBody: "/assets/materials/poster-ink-mountain.jpg"
  },
  gold: {
    key: "gold",
    name: "金桂",
    description: "温润明亮",
    className: "theme-gold",
    primary: "#9B6D22",
    background: "#F7EEDB",
    tabBackground: "#FCF5E6",
    iconSuffix: "-gold",
    textureTop: "/assets/materials/banner-ink-circle.jpg",
    textureBody: "/assets/materials/poster-sun-mist.jpg"
  }
};

const THEME_KEYS = Object.keys(THEMES);
const TAB_ICONS = ["daily", "calendar", "goodday", "profile"];
let lastAppliedTheme = "";

function normalizeTheme(theme) {
  return THEME_KEYS.includes(theme) ? theme : "cinnabar";
}

function getThemeKey() {
  return normalizeTheme(wx.getStorageSync(THEME_STORAGE_KEY));
}

function getThemeConfig(theme) {
  return THEMES[normalizeTheme(theme || getThemeKey())];
}

function getThemeClass(theme) {
  return getThemeConfig(theme).className;
}

function getThemeOptions(selectedTheme) {
  const activeTheme = normalizeTheme(selectedTheme || getThemeKey());
  return THEME_KEYS.map((key) => {
    const theme = THEMES[key];
    return Object.assign({}, theme, {
      selected: key === activeTheme,
      className: `theme-option${key === activeTheme ? " theme-option-active" : ""}`
    });
  });
}

function applyNativeTheme(theme) {
  const config = getThemeConfig(theme);
  if (lastAppliedTheme === config.key) return config;
  lastAppliedTheme = config.key;
  if (wx.setNavigationBarColor) {
    wx.setNavigationBarColor({
      frontColor: "#000000",
      backgroundColor: config.background,
      animation: { duration: 180, timingFunc: "easeIn" },
      fail() {}
    });
  }
  if (wx.setBackgroundColor) {
    wx.setBackgroundColor({
      backgroundColor: config.background,
      backgroundColorTop: config.background,
      backgroundColorBottom: config.background,
      fail() {}
    });
  }
  if (wx.setTabBarStyle) {
    wx.setTabBarStyle({
      color: "#817A73",
      selectedColor: config.primary,
      backgroundColor: config.tabBackground,
      borderStyle: "white",
      fail() {}
    });
  }
  if (wx.setTabBarItem) {
    TAB_ICONS.forEach((name, index) => {
      wx.setTabBarItem({
        index,
        selectedIconPath: `assets/tabbar-png/tab-${name}-active${config.iconSuffix}.png`,
        fail() {}
      });
    });
  }
  return config;
}

function setTheme(theme) {
  const nextTheme = normalizeTheme(theme);
  const previousTheme = getThemeKey();
  wx.setStorageSync(THEME_STORAGE_KEY, nextTheme);
  applyNativeTheme(nextTheme);
  if (previousTheme !== nextTheme) bumpStateVersion();
  return nextTheme;
}

module.exports = {
  THEMES,
  getThemeKey,
  getThemeConfig,
  getThemeClass,
  getThemeOptions,
  applyNativeTheme,
  setTheme
};
