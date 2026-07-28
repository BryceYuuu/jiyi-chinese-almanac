const DISPLAY_MODE_KEY = "displayMode";
const CALENDAR_TARGET_KEY = "jiyi_calendar_target";
const VALID_MODES = ["friendly", "professional"];
const { bumpStateVersion } = require("./state-version");

function normalizeMode(mode) {
  return VALID_MODES.includes(mode) ? mode : "friendly";
}

function getDisplayMode(profile) {
  const storedMode = wx.getStorageSync(DISPLAY_MODE_KEY);
  if (VALID_MODES.includes(storedMode)) return storedMode;
  return normalizeMode(profile && profile.defaultMode);
}

function setDisplayMode(mode, options) {
  const nextMode = normalizeMode(mode);
  const previousMode = wx.getStorageSync(DISPLAY_MODE_KEY);
  if (previousMode === nextMode) return nextMode;
  wx.setStorageSync(DISPLAY_MODE_KEY, nextMode);
  if (!options || !options.silent) bumpStateVersion();
  return nextMode;
}

function setCalendarTarget(dateKey) {
  if (!dateKey) return;
  wx.setStorageSync(CALENDAR_TARGET_KEY, dateKey);
}

function consumeCalendarTarget() {
  const target = wx.getStorageSync(CALENDAR_TARGET_KEY) || "";
  if (target) wx.removeStorageSync(CALENDAR_TARGET_KEY);
  return target;
}

module.exports = {
  getDisplayMode,
  setDisplayMode,
  setCalendarTarget,
  consumeCalendarTarget
};
