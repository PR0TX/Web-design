// workspace-view.js
import MechanicalTimer from '../components/mechanical-timer.js';
import {
  applySession,
  formatDate,
  formatDurationClock,
  formatDurationHuman,
  formatInputTime,
  request,
} from '../shared.js';

function buildWorkspaceHistoryRows(sessions) {
  return sessions.map((session) => ({
    id: session.id,
    taskName: session.taskName,
    meta: formatDate(session.startedAt),
    startTime: formatInputTime(session.startedAt),
    endTime: formatInputTime(session.endedAt),
    duration: formatDurationHuman(session.elapsedMs),
  }));
}

function buildWorkspaceViewModel(workspace, now) {
  const activeSession = workspace.activeSession;
  const historyRows = buildWorkspaceHistoryRows(workspace.sessions);
  const lastResumedAt = activeSession?.lastResumedAt || now;
  const timerValue = activeSession
    ? formatDurationClock(activeSession.status === 'running'
      ? activeSession.elapsedMsBeforePause + Math.max(0, now - lastResumedAt)
      : activeSession.elapsedMsBeforePause)
    : '00:00:00';

  if (!activeSession) {
    return {
      startTime: '',
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

  return {
    startTime: formatInputTime(activeSession.startedAt),
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

export default {
  name: 'WorkspaceView',
  components: {
    MechanicalTimer,
  },
  data() {
    return {
      workspace: {
        activeSession: null,
        sessions: [],
      },
      feedback: null,
      loading: false,
      now: Date.now(),
      timerId: null,
      taskName: '',
    };
  },
  computed: {
    viewModel() {
      return buildWorkspaceViewModel(this.workspace, this.now);
    },
  },
  methods: {
    async loadWorkspace() {
      this.loading = true;
      this.feedback = null;

      try {
        const payload = await request('/workspace');
        this.workspace = {
          activeSession: payload.activeSession,
          sessions: payload.sessions,
        };
        this.taskName = payload.activeSession ? payload.activeSession.taskName : '';
        this.now = Date.now();
        applySession(payload.user);
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
      } finally {
        this.loading = false;
      }
    },
    async startSession() {
      const normalizedTaskName = this.taskName.trim();

      if (!normalizedTaskName) {
        this.feedback = { message: 'Вкажіть назву задачі перед запуском таймера.', type: 'danger' };
        return;
      }

      this.loading = true;
      this.feedback = null;

      try {
        const response = await request('/workspace/start', {
          method: 'POST',
          body: JSON.stringify({ taskName: normalizedTaskName }),
        });
        this.workspace = {
          activeSession: response.activeSession,
          sessions: response.sessions,
        };
        this.taskName = response.activeSession.taskName;
        this.now = Date.now();
        this.feedback = { message: `Сесію "${normalizedTaskName}" запущено.`, type: 'success' };
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
      } finally {
        this.loading = false;
      }
    },
    async toggleSession() {
      this.loading = true;
      this.feedback = null;

      try {
        const response = await request('/workspace/toggle', { method: 'POST' });
        this.workspace = {
          activeSession: response.activeSession,
          sessions: response.sessions,
        };
        this.taskName = response.activeSession.taskName;
        this.now = Date.now();
        this.feedback = response.activeSession.status === 'paused'
          ? { message: 'Сесію призупинено.', type: 'warning' }
          : { message: 'Сесію знову запущено.', type: 'success' };
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
      } finally {
        this.loading = false;
      }
    },
    async stopSession() {
      this.loading = true;
      this.feedback = null;

      try {
        const response = await request('/workspace/stop', { method: 'POST' });
        this.workspace = {
          activeSession: response.activeSession,
          sessions: response.sessions,
        };
        this.taskName = '';
        this.now = Date.now();
        this.feedback = {
          message: `Сесію "${response.completedSession.taskName}" збережено з тривалістю ${formatDurationHuman(response.completedSession.elapsedMs)}.`,
          type: 'success',
        };
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
      } finally {
        this.loading = false;
      }
    },
    async deleteSession(sessionId) {
      const session = this.workspace.sessions.find((item) => item.id === sessionId);

      if (!session) {
        this.feedback = { message: 'Не вдалося знайти сесію для видалення.', type: 'danger' };
        return;
      }

      if (!window.confirm(`Видалити сесію "${session.taskName}" з історії?`)) {
        return;
      }

      this.loading = true;
      this.feedback = null;

      try {
        await request(`/workspace/sessions/${sessionId}`, { method: 'DELETE' });
        await this.loadWorkspace();
        this.feedback = { message: `Сесію "${session.taskName}" видалено з історії.`, type: 'warning' };
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.loadWorkspace();
    this.timerId = window.setInterval(() => {
      if (this.workspace.activeSession?.status === 'running') {
        this.now = Date.now();
      }
    }, 1000);
  },
  beforeUnmount() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
  },
  template: `
    <section class="container py-4 page-section">
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <h1 class="h5 section-title mb-0">Поточна сесія</h1>
                <span :class="['badge', viewModel.status.className]">{{ viewModel.status.label }}</span>
              </div>
              <form class="mt-3" novalidate @submit.prevent="startSession">
                <div class="mb-3">
                  <label class="form-label" for="task-name">Назва задачі</label>
                  <input
                    id="task-name"
                    v-model.trim="taskName"
                    type="text"
                    class="form-control"
                    placeholder="Напр., Розробка макету"
                    maxlength="120"
                    :disabled="viewModel.isTaskLocked || loading"
                  >
                </div>
                <div class="mb-3">
                  <label class="form-label" for="session-start-time">Час старту</label>
                  <input id="session-start-time" type="time" class="form-control w-100" readonly :value="viewModel.startTime">
                </div>
                <div :class="['timer-display', viewModel.timerStateClass, 'mb-2', 'p-0', 'bg-transparent', 'border-0', 'shadow-none']">
                  <MechanicalTimer :value="viewModel.timerValue" />
                </div>
                <p class="text-muted small mb-3">{{ viewModel.secondaryText }}</p>
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="loading || viewModel.isStartDisabled || !taskName.trim()">Запустити</button>
                  <button type="button" class="btn btn-warning" @click="toggleSession" :disabled="loading || viewModel.isToggleDisabled">
                    {{ viewModel.toggleButtonLabel }}
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="stopSession" :disabled="loading || viewModel.isStopDisabled">
                    Зупинити
                  </button>
                </div>
                <div v-if="feedback" :class="['alert', \`alert-\${feedback.type}\`, 'mt-3', 'mb-0']" role="status" aria-live="polite">
                  {{ feedback.message }}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <h2 class="h5 section-title mb-0">Історія сесій</h2>
                <span class="badge text-bg-light">{{ viewModel.historyBadge }}</span>
              </div>
              <div class="table-responsive mt-3">
                <table class="table align-middle">
                  <thead>
                    <tr>
                      <th>Назва</th>
                      <th>Початок</th>
                      <th>Завершення</th>
                      <th>Тривалість</th>
                      <th class="text-end">Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in viewModel.historyRows" :key="row.id">
                      <td>
                        <div class="history-task-name">{{ row.taskName }}</div>
                        <div v-if="row.meta" class="history-task-meta text-muted">{{ row.meta }}</div>
                      </td>
                      <td>{{ row.startTime }}</td>
                      <td>{{ row.endTime }}</td>
                      <td><span class="badge text-bg-primary">{{ row.duration }}</span></td>
                      <td class="text-end">
                        <button
                          type="button"
                          class="history-delete-button"
                          :disabled="loading"
                          :aria-label="\`Видалити сесію \${row.taskName}\`"
                          @click="deleteSession(row.id)"
                        >
                          Видалити
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-show="viewModel.isHistoryEmpty" class="text-muted small mb-0">
                Сесій ще немає. Після зупинки таймера запис з’явиться у таблиці.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
};
