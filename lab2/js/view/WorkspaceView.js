// WorkspaceView.js
class WorkspaceView {
  constructor() {
    this.form = document.getElementById('workspace-session-form');
    this.taskInput = document.getElementById('task-name');
    this.startTimeInput = document.getElementById('session-start-time');
    this.endTimeInput = document.getElementById('session-end-time');
    this.timerDisplay = document.getElementById('timer-display');
    this.secondaryText = document.getElementById('workspace-secondary-text');
    this.statusBadge = document.getElementById('workspace-status-badge');
    this.startButton = document.getElementById('start-button');
    this.toggleButton = document.getElementById('toggle-button');
    this.stopButton = document.getElementById('stop-button');
    this.feedback = document.getElementById('workspace-feedback');
    this.historyBadge = document.getElementById('history-badge');
    this.historyBody = document.getElementById('history-table-body');
    this.emptyState = document.getElementById('history-empty-state');
  }

  bindStartSession(handler) {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler(this.taskInput.value);
    });

    this.startButton.addEventListener('click', () => {
      handler(this.taskInput.value);
    });
  }

  bindToggleSession(handler) {
    this.toggleButton.addEventListener('click', handler);
  }

  bindStopSession(handler) {
    this.stopButton.addEventListener('click', handler);
  }

  bindDeleteSession(handler) {
    this.historyBody.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-session-delete-id]');

      if (!actionButton) {
        return;
      }

      handler(actionButton.dataset.sessionDeleteId);
    });
  }

  render(viewModel) {
    this.taskInput.value = viewModel.taskName;
    this.taskInput.disabled = viewModel.isTaskLocked;
    this.startTimeInput.value = viewModel.startTime;
    this.endTimeInput.value = viewModel.endTime;
    this.timerDisplay.textContent = viewModel.timerValue;
    this.secondaryText.textContent = viewModel.secondaryText;
    this.historyBadge.textContent = viewModel.historyBadge;
    this.startButton.disabled = viewModel.isStartDisabled;
    this.toggleButton.disabled = viewModel.isToggleDisabled;
    this.toggleButton.textContent = viewModel.toggleButtonLabel;
    this.stopButton.disabled = viewModel.isStopDisabled;
    this.renderStatusBadge(viewModel.status);
    this.renderTimerState(viewModel.timerStateClass);
    this.renderHistory(viewModel.historyRows, viewModel.isHistoryEmpty);
  }

  renderStatusBadge(status) {
    this.statusBadge.textContent = status.label;
    this.statusBadge.className = `badge ${status.className}`;
  }

  renderTimerState(timerStateClass) {
    this.timerDisplay.classList.remove('is-running', 'is-paused', 'is-idle');
    this.timerDisplay.classList.add(timerStateClass);
  }

  renderHistory(rows, isHistoryEmpty) {
    this.historyBody.replaceChildren();
    this.emptyState.classList.toggle('d-none', !isHistoryEmpty);

    rows.forEach((row) => {
      const tableRow = document.createElement('tr');

      const taskCell = document.createElement('td');
      const title = document.createElement('div');
      title.className = 'history-task-name';
      title.textContent = row.taskName;
      taskCell.append(title);

      if (row.meta) {
        const meta = document.createElement('div');
        meta.className = 'history-task-meta text-muted';
        meta.textContent = row.meta;
        taskCell.append(meta);
      }

      const startCell = document.createElement('td');
      startCell.textContent = row.startTime;

      const endCell = document.createElement('td');
      endCell.textContent = row.endTime;

      const durationCell = document.createElement('td');
      const durationBadge = document.createElement('span');
      durationBadge.className = 'badge text-bg-primary';
      durationBadge.textContent = row.duration;
      durationCell.append(durationBadge);

      const actionCell = document.createElement('td');
      actionCell.className = 'text-end';

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'history-delete-button';
      deleteButton.dataset.sessionDeleteId = row.id;
      deleteButton.setAttribute('aria-label', `Видалити сесію ${row.taskName}`);
      deleteButton.textContent = 'Видалити';
      actionCell.append(deleteButton);

      tableRow.append(taskCell, startCell, endCell, durationCell, actionCell);
      this.historyBody.append(tableRow);
    });
  }

  showFeedback(message, type = 'info') {
    this.feedback.textContent = message;
    this.feedback.className = `alert alert-${type} mt-3 mb-0`;
  }

  clearFeedback() {
    this.feedback.textContent = '';
    this.feedback.className = 'alert d-none mt-3 mb-0';
  }
}

export default WorkspaceView;
