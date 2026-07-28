const { addDays, formatDate, parseDate } = require("./date");
const { bumpStateVersion } = require("./state-version");

const STORAGE_KEY = "jiyi_checkins_v1";

function getCheckins() {
  const stored = wx.getStorageSync(STORAGE_KEY);
  return Array.isArray(stored) ? Array.from(new Set(stored)).sort() : [];
}

function checkIn(date) {
  const target = parseDate(date) || new Date();
  const dateKey = formatDate(target);
  const checkins = getCheckins();
  if (!checkins.includes(dateKey)) {
    checkins.push(dateKey);
    checkins.sort();
    wx.setStorageSync(STORAGE_KEY, checkins.slice(-730));
    bumpStateVersion();
  }
  return dateKey;
}

function isCheckedIn(date) {
  const target = parseDate(date) || new Date();
  return getCheckins().includes(formatDate(target));
}

function getCheckinDateMap() {
  return getCheckins().reduce((result, dateKey) => {
    result[dateKey] = true;
    return result;
  }, {});
}

function getCheckinStats(referenceDate) {
  const today = parseDate(referenceDate) || new Date();
  const checkins = getCheckins();
  const dateSet = checkins.reduce((result, item) => {
    result[item] = true;
    return result;
  }, {});
  const todayKey = formatDate(today);
  const monthPrefix = todayKey.slice(0, 7);
  let cursor = dateSet[todayKey] ? today : addDays(today, -1);
  let streak = 0;

  while (dateSet[formatDate(cursor)]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    total: checkins.length,
    streak,
    monthCount: checkins.filter((item) => item.startsWith(monthPrefix)).length,
    checkedToday: Boolean(dateSet[todayKey])
  };
}

module.exports = {
  getCheckins,
  checkIn,
  isCheckedIn,
  getCheckinDateMap,
  getCheckinStats
};
