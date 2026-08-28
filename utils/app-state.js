const { getCheckinDateMap, getCheckinStats } = require("./checkins");
const { getPlanDateMap, getPlanStats } = require("./plans");
const { getDisplayMode } = require("./preferences");
const { getProfile } = require("./profile");
const { getStateVersion } = require("./state-version");
const { getThemeConfig, getThemeKey } = require("./theme");
const { getVocabulary, isClassicCopyEnabled } = require("./vocabulary");

function getAppSnapshot(referenceDate, options) {
  const settings = options || {};
  const includeCheckins = settings.checkins !== false;
  const includePlans = settings.plans !== false;
  const profile = getProfile();
  const theme = getThemeKey();
  const themeConfig = getThemeConfig(theme);
  return {
    stateVersion: getStateVersion(),
    profile,
    classicCopyEnabled: isClassicCopyEnabled(profile),
    copy: getVocabulary(profile),
    mode: getDisplayMode(profile),
    theme,
    themeClass: themeConfig.className,
    themeColor: themeConfig.primary,
    checkinStats: includeCheckins ? getCheckinStats(referenceDate) : null,
    checkinDateMap: includeCheckins ? getCheckinDateMap() : null,
    planStats: includePlans ? getPlanStats(referenceDate) : null,
    planDateMap: includePlans ? getPlanDateMap() : null
  };
}

module.exports = {
  getAppSnapshot
};
