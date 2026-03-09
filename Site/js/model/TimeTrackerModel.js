// TimeTrackerModel.js
import { createDefaultState } from '../data/defaultState.js';

const STORAGE_KEY = 'chronotrack-state';

class TimeTrackerModel {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
    this.onChangeCallback = null;
    this.isBatching = false;
    this.hasPendingChange = false;
    this.state = this.initOnModelChange(this.loadState());
    this.syncStorage();
  }

  initOnModelChange(state) {
    return new Proxy(state, {
      set: (target, property, value) => {
        target[property] = value;

        if (this.isBatching) {
          this.hasPendingChange = true;
          return true;
        }

        this.syncStorage();
        this.notifyChange();
        return true;
      },
    });
  }

  bindStateChange(callback) {
    this.onChangeCallback = callback;
  }

  notifyChange() {
    if (this.onChangeCallback) {
      this.onChangeCallback(this.getState());
    }
  }

  applyState(mutator) {
    this.isBatching = true;
    mutator(this.state);
    this.isBatching = false;

    if (this.hasPendingChange) {
      this.hasPendingChange = false;
      this.syncStorage();
      this.notifyChange();
      return;
    }

    this.syncStorage();
  }

  loadState() {
    const fallback = createDefaultState();
    const savedState = window.localStorage.getItem(this.storageKey);

    if (!savedState) {
      return fallback;
    }

    try {
      const parsedState = JSON.parse(savedState);

      return {
        sessions: this.normalizeSessions(parsedState.sessions, fallback.sessions),
        activeSession: this.normalizeActiveSession(parsedState.activeSession),
        profile: {
          ...fallback.profile,
          ...(parsedState.profile || {}),
        },
      };
    } catch (error) {
      return fallback;
    }
  }

  normalizeSessions(sessions, fallbackSessions) {
    const source = Array.isArray(sessions) ? sessions : fallbackSessions;

    return source
      .map((session) => this.normalizeCompletedSession(session))
      .sort((firstSession, secondSession) => secondSession.startedAt - firstSession.startedAt);
  }

  normalizeCompletedSession(session) {
    const startedAt = Number(session?.startedAt) || Date.now();
    const endedAt = Number(session?.endedAt) || startedAt;
    const elapsedMs = Number(session?.elapsedMs) || Math.max(0, endedAt - startedAt);

    return {
      id: session?.id || this.createId('session'),
      taskName: String(session?.taskName || 'Без назви задачі'),
      startedAt,
      endedAt,
      elapsedMs,
    };
  }

  normalizeActiveSession(session) {
    if (!session) {
      return null;
    }

    const startedAt = Number(session.startedAt) || Date.now();
    const status = session.status === 'paused' ? 'paused' : 'running';
    const elapsedMsBeforePause = Math.max(0, Number(session.elapsedMsBeforePause) || 0);

    return {
      id: session.id || this.createId('active'),
      taskName: String(session.taskName || 'Без назви задачі'),
      startedAt,
      status,
      elapsedMsBeforePause,
      lastResumedAt: status === 'running'
        ? Number(session.lastResumedAt) || Date.now()
        : null,
      pausedAt: status === 'paused'
        ? Number(session.pausedAt) || Date.now()
        : null,
    };
  }

  createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  syncStorage() {
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getElapsedMs(session, now = Date.now()) {
    if (!session) {
      return 0;
    }

    if (session.status === 'running' && session.lastResumedAt) {
      return session.elapsedMsBeforePause + Math.max(0, now - session.lastResumedAt);
    }

    return session.elapsedMsBeforePause;
  }

  startSession(taskName) {
    if (this.state.activeSession) {
      throw new Error('Перед запуском нової сесії потрібно завершити поточну.');
    }

    const startedAt = Date.now();
    const activeSession = {
      id: this.createId('active'),
      taskName,
      startedAt,
      status: 'running',
      elapsedMsBeforePause: 0,
      lastResumedAt: startedAt,
      pausedAt: null,
    };

    this.applyState((state) => {
      state.activeSession = activeSession;
      state.profile = {
        ...state.profile,
        lastSeenAt: startedAt,
      };
    });

    return { ...activeSession };
  }

  togglePauseSession() {
    const activeSession = this.state.activeSession;

    if (!activeSession) {
      throw new Error('Немає активної сесії для зміни стану.');
    }

    const now = Date.now();
    let nextSession = null;

    this.applyState((state) => {
      if (activeSession.status === 'running') {
        nextSession = {
          ...activeSession,
          status: 'paused',
          elapsedMsBeforePause: this.getElapsedMs(activeSession, now),
          lastResumedAt: null,
          pausedAt: now,
        };
      } else {
        nextSession = {
          ...activeSession,
          status: 'running',
          lastResumedAt: now,
          pausedAt: null,
        };
      }

      state.activeSession = nextSession;
      state.profile = {
        ...state.profile,
        lastSeenAt: now,
      };
    });

    return { ...nextSession };
  }

  stopSession() {
    const activeSession = this.state.activeSession;

    if (!activeSession) {
      throw new Error('Немає активної сесії для завершення.');
    }

    const endedAt = Date.now();
    const completedSession = {
      id: this.createId('session'),
      taskName: activeSession.taskName,
      startedAt: activeSession.startedAt,
      endedAt,
      elapsedMs: this.getElapsedMs(activeSession, endedAt),
    };

    this.applyState((state) => {
      state.sessions = [completedSession, ...state.sessions]
        .sort((firstSession, secondSession) => secondSession.startedAt - firstSession.startedAt);
      state.activeSession = null;
      state.profile = {
        ...state.profile,
        lastSeenAt: endedAt,
      };
    });

    return { ...completedSession };
  }
}

export default TimeTrackerModel;
