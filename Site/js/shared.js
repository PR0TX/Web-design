// shared.js
import { reactive } from 'vue';

const apiBase = '/api';

export const appState = reactive({
  authReady: false,
  isAuthenticated: false,
  currentUser: null,
  sessionPromise: null,
});

export async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Сталася помилка під час виконання запиту.');
  }

  return payload;
}

export function applySession(user) {
  appState.currentUser = user;
  appState.isAuthenticated = Boolean(user);
  appState.authReady = true;
}

export async function syncSession(force = false) {
  if (appState.sessionPromise && !force) {
    return appState.sessionPromise;
  }

  const sessionPromise = (async () => {
    try {
      const response = await request('/session');
      applySession(response.user);
      return response.user;
    } catch (error) {
      applySession(null);
      return null;
    }
  })();

  appState.sessionPromise = sessionPromise.finally(() => {
    appState.sessionPromise = null;
  });

  return appState.sessionPromise;
}

export async function logoutUser() {
  await request('/logout', { method: 'POST' });
  applySession(null);
}

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('uk-UA', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function padNumber(value) {
  return String(value).padStart(2, '0');
}

export function formatDate(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return 'Немає даних';
  }

  return dateFormatter.format(new Date(timestamp));
}

export function formatTime(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return '';
  }

  return timeFormatter.format(new Date(timestamp));
}

export function formatDateTime(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return 'Немає даних';
  }

  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

export function formatInputTime(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return '';
  }

  const date = new Date(timestamp);
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

export function formatDurationClock(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
}

export function formatDurationHuman(durationMs) {
  const totalMinutes = Math.max(0, Math.floor(durationMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} год ${padNumber(minutes)} хв`;
  }

  if (minutes > 0) {
    return `${minutes} хв`;
  }

  return `${Math.max(0, Math.floor(durationMs / 1000))} сек`;
}

export function formatRelativeDateTime(timestamp, now = Date.now()) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return 'Немає даних';
  }

  const value = new Date(timestamp);
  const current = new Date(now);
  const isSameDay = value.getFullYear() === current.getFullYear()
    && value.getMonth() === current.getMonth()
    && value.getDate() === current.getDate();

  if (isSameDay) {
    return `Сьогодні, ${formatTime(timestamp)}`;
  }

  return formatDateTime(timestamp);
}
