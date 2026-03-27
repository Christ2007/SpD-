// ── API Base ──
const API = '/api';

function getToken() { return localStorage.getItem('sd_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('sd_user')); } catch { return null; }
}
function setAuth(token, user) {
  localStorage.setItem('sd_token', token);
  localStorage.setItem('sd_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('sd_token');
  localStorage.removeItem('sd_user');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function requireAuth(adminRequired = false) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) { window.location = '/'; return null; }
  if (adminRequired && !user.isAdmin) { window.location = '/dashboard.html'; return null; }
  return user;
}

function showAlert(containerId, type, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (type !== 'error') setTimeout(() => el.classList.add('hidden'), 4000);
}

function hoursFromQuarters(q) {
  return (q / 4).toFixed(2);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

// Tab functionality
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });
}
