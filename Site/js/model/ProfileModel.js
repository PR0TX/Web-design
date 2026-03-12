// ProfileModel.js
import {
  formatDate,
  formatDurationHuman,
  formatRelativeDateTime,
} from '../utils/formatters.js';

class ProfileModel {
  constructor(timeTrackerModel) {
    this.timeTrackerModel = timeTrackerModel;
    this.authUser = null;
  }

  setAuthUser(user) {
    this.authUser = user;
  }

  normalizeDateValue(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value}T12:00:00`;
    }

    return value;
  }

  getViewModel(now = Date.now()) {
    const state = this.timeTrackerModel.getState();
    const authUser = this.authUser;
    const completedSessions = [...state.sessions]
      .sort((firstSession, secondSession) => secondSession.startedAt - firstSession.startedAt);
    const totalDurationMs = completedSessions
      .reduce((total, session) => total + session.elapsedMs, 0);
    const averageDurationMs = completedSessions.length > 0
      ? totalDurationMs / completedSessions.length
      : 0;
    const profileSource = authUser
      ? {
        fullName: authUser.fullName,
        email: authUser.email,
        gender: authUser.gender,
        birthDate: this.normalizeDateValue(authUser.birthDate),
        registeredAt: authUser.registeredAt,
        plan: authUser.plan || 'Локальний профіль',
      }
      : state.profile;
    const lastActivityAt = state.activeSession
      ? now
      : state.profile.lastSeenAt || completedSessions[0]?.endedAt || profileSource.registeredAt;

    return {
      planLabel: `Статус: ${profileSource.plan || 'Standard'}`,
      details: [
        {
          label: 'Ім\'я користувача',
          value: profileSource.fullName,
        },
        {
          label: 'Електронна пошта',
          value: profileSource.email,
        },
        {
          label: 'Стать',
          value: profileSource.gender,
        },
        {
          label: 'Дата народження',
          value: formatDate(profileSource.birthDate),
        },
        {
          label: 'Зареєстровано',
          value: formatDate(profileSource.registeredAt),
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
