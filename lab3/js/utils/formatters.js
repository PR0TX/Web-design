// formatters.js
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

const padNumber = (value) => String(value).padStart(2, '0');

export function formatDate(timestamp) {
  if (!timestamp && timestamp !== 0) {
    return 'Немає даних';
  }

  return dateFormatter.format(new Date(timestamp));
}

export function formatTime(timestamp) {
  if (!timestamp && timestamp !== 0) {
    return '';
  }

  return timeFormatter.format(new Date(timestamp));
}

export function formatDateTime(timestamp) {
  if (!timestamp && timestamp !== 0) {
    return 'Немає даних';
  }

  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

export function formatInputTime(timestamp) {
  if (!timestamp && timestamp !== 0) {
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

  const seconds = Math.max(0, Math.floor(durationMs / 1000));

  return `${seconds} сек`;
}

export function formatRelativeDateTime(timestamp, now = Date.now()) {
  if (!timestamp && timestamp !== 0) {
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
