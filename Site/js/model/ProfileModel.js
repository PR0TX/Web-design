// ProfileModel.js
import {
  formatDate,
  formatDurationHuman,
  formatRelativeDateTime,
} from '../utils/formatters.js';

class ProfileModel {
  constructor(timeTrackerModel) {
    this.timeTrackerModel = timeTrackerModel;
  }

  getViewModel(now = Date.now()) {
    const state = this.timeTrackerModel.getState();
    const completedSessions = [...state.sessions]
      .sort((firstSession, secondSession) => secondSession.startedAt - firstSession.startedAt);
    const totalDurationMs = completedSessions
      .reduce((total, session) => total + session.elapsedMs, 0);
    const averageDurationMs = completedSessions.length > 0
      ? totalDurationMs / completedSessions.length
      : 0;
    const lastActivityAt = state.activeSession
      ? now
      : state.profile.lastSeenAt || completedSessions[0]?.endedAt || state.profile.registeredAt;

    return {
      planLabel: `Статус: ${state.profile.plan}`,
      details: [
        {
          label: 'Ім\'я користувача',
          value: state.profile.fullName,
        },
        {
          label: 'Електронна пошта',
          value: state.profile.email,
        },
        {
          label: 'Стать',
          value: state.profile.gender,
        },
        {
          label: 'Дата народження',
          value: formatDate(state.profile.birthDate),
        },
        {
          label: 'Зареєстровано',
          value: formatDate(state.profile.registeredAt),
        },
        {
          label: 'Остання активність',
          value: state.activeSession
            ? `Триває сесія, ${formatRelativeDateTime(lastActivityAt, now)}`
            : formatRelativeDateTime(lastActivityAt, now),
        },
      ],
      stats: {
        totalTime: completedSessions.length > 0
          ? formatDurationHuman(totalDurationMs)
          : '0 год 00 хв',
        averageTime: completedSessions.length > 0
          ? formatDurationHuman(averageDurationMs)
          : '0 хв',
        sessionCount: String(completedSessions.length),
      },
      note: state.activeSession
        ? `Активна сесія "${state.activeSession.taskName}" ще не врахована у завершеній статистиці.`
        : 'Статистика розраховується на основі збережених робочих сесій.',
    };
  }
}

export default ProfileModel;
