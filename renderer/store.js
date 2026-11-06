// Shared helpers: Local Storage wrapper + feedback messages
const Store = {
  get(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : v; }
    catch { return fallback; }            // corrupted data -> safe default
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

// Show feedback (type: ok | err | info) in the #msg element
function toast(text, type = 'ok') {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.className = 'msg ' + type;
}







