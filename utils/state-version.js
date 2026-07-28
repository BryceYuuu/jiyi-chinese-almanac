const STORAGE_KEY = "jiyi_state_version_v1";

let memoryVersion = 0;

function getStateVersion() {
  if (typeof wx === "undefined") return memoryVersion;
  const stored = Number(wx.getStorageSync(STORAGE_KEY)) || 0;
  memoryVersion = Math.max(memoryVersion, stored);
  return memoryVersion;
}

function bumpStateVersion() {
  const nextVersion = Math.max(Date.now(), getStateVersion() + 1);
  memoryVersion = nextVersion;
  if (typeof wx !== "undefined") wx.setStorageSync(STORAGE_KEY, nextVersion);
  return nextVersion;
}

module.exports = {
  getStateVersion,
  bumpStateVersion
};
