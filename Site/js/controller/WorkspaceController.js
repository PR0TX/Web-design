// WorkspaceController.js
import {
  formatDate,
  formatDurationClock,
  formatDurationHuman,
  formatInputTime,
} from '../utils/formatters.js';

class WorkspaceController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.timerId = null;

    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleStartSession = this.handleStartSession.bind(this);
    this.handleToggleSession = this.handleToggleSession.bind(this);
    this.handleStopSession = this.handleStopSession.bind(this);
  }

  init() {
    this.view.bindStartSession(this.handleStartSession);
    this.view.bindToggleSession(this.handleToggleSession);
    this.view.bindStopSession(this.handleStopSession);
    this.model.bindStateChange(this.handleStateChange);
    this.handleStateChange(this.model.getState());
  }

  handleStateChange(state) {
    this.view.render(this.createViewModel(state));
    this.syncTimer(state);
  }

  syncTimer(state) {
    const hasRunningSession = Boolean(state.activeSession && state.activeSession.status === 'running');

    if (hasRunningSession && !this.timerId) {
      this.timerId = window.setInterval(() => {
        this.view.render(this.createViewModel(this.model.getState()));
      }, 1000);
      return;
    }

    if (!hasRunningSession && this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  createViewModel(state) {
    const now = Date.now();
    const activeSession = state.activeSession;
    const timerValue = activeSession
      ? formatDurationClock(this.model.getElapsedMs(activeSession, now))
      : '00:00:00';
    const historyRows = state.sessions.map((session) => ({
      id: session.id,
      taskName: session.taskName,
      meta: formatDate(session.startedAt),
      startTime: formatInputTime(session.startedAt),
      endTime: formatInputTime(session.endedAt),
      duration: formatDurationHuman(session.elapsedMs),
    }));

    if (!activeSession) {
      return {
        taskName: '',
        startTime: '',
        endTime: '',
        timerValue,
        secondaryText: 'Запустіть таймер, щоб почати фіксацію робочої сесії.',
        historyBadge: `Усього: ${historyRows.length}`,
        historyRows,
        isHistoryEmpty: historyRows.length === 0,
        isTaskLocked: false,
        isStartDisabled: false,
        isToggleDisabled: true,
        isStopDisabled: true,
        toggleButtonLabel: 'Призупинити',
        status: {
          label: 'Очікує запуску',
          className: 'text-bg-light',
        },
        timerStateClass: 'is-idle',
      };
    }

    const isPaused = activeSession.status === 'paused';
    const endTime = isPaused
      ? formatInputTime(activeSession.pausedAt)
      : formatInputTime(now);

    return {
      taskName: activeSession.taskName,
      startTime: formatInputTime(activeSession.startedAt),
      endTime,
      timerValue,
      secondaryText: isPaused
        ? 'Сесію призупинено. Можна продовжити або завершити її із поточним результатом.'
        : `Сесія триває з ${formatInputTime(activeSession.startedAt)}. Таймер оновлюється щосекунди.`,
      historyBadge: `Усього: ${historyRows.length}`,
      historyRows,
      isHistoryEmpty: historyRows.length === 0,
      isTaskLocked: true,
      isStartDisabled: true,
      isToggleDisabled: false,
      isStopDisabled: false,
      toggleButtonLabel: isPaused ? 'Продовжити' : 'Призупинити',
      status: isPaused
        ? {
          label: 'Призупинено',
          className: 'text-bg-warning',
        }
        : {
          label: 'Виконується',
          className: 'text-bg-primary',
        },
      timerStateClass: isPaused ? 'is-paused' : 'is-running',
    };
  }

  handleStartSession(taskName) {
    const normalizedTaskName = taskName.trim();

    if (!normalizedTaskName) {
      this.view.showFeedback('Вкажіть назву задачі перед запуском таймера.', 'danger');
      return;
    }

    try {
      this.model.startSession(normalizedTaskName);
      this.view.showFeedback(`Сесію "${normalizedTaskName}" запущено.`, 'success');
    } catch (error) {
      this.view.showFeedback(error.message, 'danger');
    }
  }

  handleToggleSession() {
    try {
      const activeSession = this.model.togglePauseSession();
      const feedbackMessage = activeSession.status === 'paused'
        ? 'Сесію призупинено.'
        : 'Сесію знову запущено.';
      const feedbackType = activeSession.status === 'paused' ? 'warning' : 'success';

      this.view.showFeedback(feedbackMessage, feedbackType);
    } catch (error) {
      this.view.showFeedback(error.message, 'danger');
    }
  }

  handleStopSession() {
    try {
      const completedSession = this.model.stopSession();
      this.view.showFeedback(
        `Сесію "${completedSession.taskName}" збережено з тривалістю ${formatDurationHuman(completedSession.elapsedMs)}.`,
        'success',
      );
    } catch (error) {
      this.view.showFeedback(error.message, 'danger');
    }
  }
}

export default WorkspaceController;
