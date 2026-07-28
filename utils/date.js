const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const parts = `${value || ""}`.split("-").map((item) => Number(item));
  if (parts.length !== 3 || parts.some((item) => !item)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function addDays(date, count) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
}

function getDayDiff(target, source) {
  const targetDate = parseDate(target);
  const sourceDate = parseDate(source);
  if (!targetDate || !sourceDate) return 0;
  return Math.round((targetDate.getTime() - sourceDate.getTime()) / 86400000);
}

function isSameDay(first, second) {
  const firstDate = parseDate(first);
  const secondDate = parseDate(second);
  return Boolean(firstDate && secondDate && formatDate(firstDate) === formatDate(secondDate));
}

function getWeekday(date) {
  return WEEKDAYS[date.getDay()];
}

function formatMonthDay(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

module.exports = {
  WEEKDAYS,
  pad,
  formatDate,
  parseDate,
  addDays,
  getDayDiff,
  isSameDay,
  getWeekday,
  formatMonthDay
};
