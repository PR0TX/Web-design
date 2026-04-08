// ProfileView.js
class ProfileView {
  constructor() {
    this.planBadge = document.getElementById('profile-plan-badge');
    this.detailsBody = document.getElementById('profile-details-body');
    this.totalTime = document.getElementById('profile-total-time');
    this.averageTime = document.getElementById('profile-average-time');
    this.sessionCount = document.getElementById('profile-session-count');
    this.note = document.getElementById('profile-stats-note');
    this.feedback = document.getElementById('profile-feedback');
    this.logoutButton = document.getElementById('profile-logout-button');
  }

  render(viewModel) {
    this.planBadge.textContent = viewModel.planLabel;
    this.totalTime.textContent = viewModel.stats.totalTime;
    this.averageTime.textContent = viewModel.stats.averageTime;
    this.sessionCount.textContent = viewModel.stats.sessionCount;
    this.note.textContent = viewModel.note;
    this.renderDetails(viewModel.details);
  }

  renderDetails(details) {
    this.detailsBody.replaceChildren();

    details.forEach((detail) => {
      const row = document.createElement('tr');
      const labelCell = document.createElement('th');
      labelCell.scope = 'row';
      labelCell.className = 'text-muted';
      labelCell.textContent = detail.label;

      const valueCell = document.createElement('td');
      valueCell.textContent = detail.value;

      row.append(labelCell, valueCell);
      this.detailsBody.append(row);
    });
  }

  bindLogout(handler) {
    this.logoutButton?.addEventListener('click', handler);
  }

  setLogoutLoading(isLoading) {
    if (!this.logoutButton) {
      return;
    }

    this.logoutButton.disabled = isLoading;
    this.logoutButton.textContent = isLoading ? 'Вихід...' : 'Вийти';
  }

  showFeedback(message, type = 'info') {
    if (!this.feedback) {
      return;
    }

    this.feedback.textContent = message;
    this.feedback.className = `alert alert-${type} mt-3 mb-0`;
  }

  clearFeedback() {
    if (!this.feedback) {
      return;
    }

    this.feedback.textContent = '';
    this.feedback.className = 'alert d-none mt-3 mb-0';
  }
}

export default ProfileView;
