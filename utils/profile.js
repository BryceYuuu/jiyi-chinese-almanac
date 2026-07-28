const STORAGE_KEY = "jiyi_user_profile";
const { setDisplayMode } = require("./preferences");
const { bumpStateVersion } = require("./state-version");

const DEFAULT_PROFILE = {
  nickname: "",
  avatarPath: "",
  birthday: "",
  birthTime: "",
  zodiac: "",
  defaultMode: "friendly",
  avoidOwnChong: true,
  termHelpEnabled: false,
  completed: false
};

function getProfile() {
  return Object.assign({}, DEFAULT_PROFILE, wx.getStorageSync(STORAGE_KEY) || {});
}

function hasProfile() {
  const profile = getProfile();
  return Boolean(profile.completed);
}

function hasBirthday() {
  return Boolean(getProfile().birthday);
}

function saveProfile(profile) {
  const nextProfile = Object.assign({}, DEFAULT_PROFILE, profile, {
    completed: true
  });
  wx.setStorageSync(STORAGE_KEY, nextProfile);
  setDisplayMode(nextProfile.defaultMode, { silent: true });
  bumpStateVersion();
  return nextProfile;
}

function getDisplayName(profile) {
  if (profile && profile.nickname) return profile.nickname;
  return "山海有清欢";
}

function getModeText(mode) {
  return mode === "professional" ? "专业版" : "友好版";
}

function ensureProfileReady() {
  return true;
}

module.exports = {
  getProfile,
  hasProfile,
  hasBirthday,
  saveProfile,
  getDisplayName,
  getModeText,
  ensureProfileReady
};
