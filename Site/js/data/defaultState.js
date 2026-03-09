// defaultState.js
const buildTimestamp = (value) => new Date(value).getTime();

const defaultSessions = [
  {
    id: 'session-demo-1',
    taskName: 'Аналіз вимог проєкту',
    startedAt: buildTimestamp('2026-03-09T09:00:00'),
    endedAt: buildTimestamp('2026-03-09T10:30:00'),
    elapsedMs: 90 * 60 * 1000,
  },
  {
    id: 'session-demo-2',
    taskName: 'Дизайн інтерфейсу',
    startedAt: buildTimestamp('2026-03-09T11:00:00'),
    endedAt: buildTimestamp('2026-03-09T13:45:00'),
    elapsedMs: 165 * 60 * 1000,
  },
  {
    id: 'session-demo-3',
    taskName: 'Нарада з командою',
    startedAt: buildTimestamp('2026-03-09T15:00:00'),
    endedAt: buildTimestamp('2026-03-09T15:30:00'),
    elapsedMs: 30 * 60 * 1000,
  },
];

const defaultProfile = {
  fullName: 'Павло Протченко',
  email: 'pavlo.protchenko@gmail.com',
  gender: 'Чоловіча',
  birthDate: buildTimestamp('2006-06-16T12:00:00'),
  registeredAt: buildTimestamp('2026-02-04T12:00:00'),
  plan: 'Premium',
  lastSeenAt: buildTimestamp('2026-03-09T15:30:00'),
};

export function createDefaultState() {
  return {
    sessions: defaultSessions.map((session) => ({ ...session })),
    activeSession: null,
    profile: { ...defaultProfile },
  };
}
