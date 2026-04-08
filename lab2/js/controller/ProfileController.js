// ProfileController.js
class ProfileController {
  constructor(timeTrackerModel, profileModel, view, authModel) {
    this.timeTrackerModel = timeTrackerModel;
    this.profileModel = profileModel;
    this.view = view;
    this.authModel = authModel;
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  async init() {
    this.view.bindLogout(this.handleLogout);
    this.timeTrackerModel.bindStateChange(this.handleStateChange);

    try {
      const user = await this.authModel.getCurrentUser();
      this.profileModel.setAuthUser(user);
      this.view.clearFeedback();
      this.handleStateChange();
    } catch (error) {
      this.view.showFeedback('Для перегляду профілю потрібно увійти в систему.', 'warning');
      window.setTimeout(() => {
        window.location.href = 'login.html';
      }, 900);
    }
  }

  handleStateChange() {
    this.view.render(this.profileModel.getViewModel());
  }

  async handleLogout() {
    this.view.setLogoutLoading(true);

    try {
      await this.authModel.logout();
      window.location.href = 'login.html';
    } catch (error) {
      this.view.showFeedback(error.message, 'danger');
      this.view.setLogoutLoading(false);
    }
  }
}

export default ProfileController;
