// LoginController.js
class LoginController {
  constructor(authModel, view) {
    this.authModel = authModel;
    this.view = view;
    this.handleExistingSession = this.handleExistingSession.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async init() {
    this.view.bindSubmit(this.handleSubmit);
    await this.handleExistingSession();
  }

  async handleExistingSession() {
    try {
      await this.authModel.getCurrentUser();
      window.location.href = 'profile.html';
    } catch (error) {
      this.view.clearFeedback();
    }
  }

  async handleSubmit(payload) {
    if (!payload.email || !payload.password) {
      this.view.showFeedback('Введіть email і пароль.', 'danger');
      return;
    }

    this.view.setLoading(true);
    this.view.clearFeedback();

    try {
      await this.authModel.login({
        email: payload.email,
        password: payload.password,
        rememberMe: payload.rememberMe,
      });
      this.view.showFeedback('Вхід виконано успішно. Переадресація...', 'success');
      window.location.href = 'profile.html';
    } catch (error) {
      this.view.showFeedback(error.message, 'danger');
    } finally {
      this.view.setLoading(false);
    }
  }
}

export default LoginController;
