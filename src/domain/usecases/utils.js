export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function pad(text = "", len = 20) {
  const value = String(text);
  return value.length >= len ? value.slice(0, len) : value + " ".repeat(len - value.length);
}

export function center(text = "", len = 20) {
  const value = String(text);
  if (value.length >= len) return value.slice(0, len);
  const left = Math.floor((len - value.length) / 2);
  return " ".repeat(left) + value + " ".repeat(len - value.length - left);
}

export function formatMmSs(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
