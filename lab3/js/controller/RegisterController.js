// RegisterController.js
class RegisterController {
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
    const validationError = this.validatePayload(payload);

    if (validationError) {
      this.view.showFeedback(validationError, 'danger');
      return;
    }

    this.view.setLoading(true);
    this.view.clearFeedback();

    try {
      await this.authModel.register({
        fullName: payload.fullName,
        email: payload.email,
        gender: payload.gender,
        birthDate: payload.birthDate,
        password: payload.password,
      });
      await this.authModel.login({
        email: payload.email,
        password: payload.password,
      });
      this.view.showFeedback('Реєстрацію завершено успішно. Переадресація...', 'success');
      window.location.href = 'profile.html';
    } catch (error) {
      this.view.showFeedback(error.message, 'danger');
    } finally {
      this.view.setLoading(false);
    }
  }

  validatePayload(payload) {
    if (!payload.fullName || !payload.email || !payload.gender || !payload.birthDate) {
      return 'Заповніть усі обов’язкові поля.';
    }

    if (payload.password.length < 8) {
      return 'Пароль має містити щонайменше 8 символів.';
    }

    if (!/[A-ZА-ЯІЇЄҐ]/u.test(payload.password)
      || !/[a-zа-яіїєґ]/u.test(payload.password)
      || !/\d/.test(payload.password)) {
      return 'Пароль має містити великі, малі літери та цифри.';
    }

    if (payload.password !== payload.passwordConfirm) {
      return 'Підтвердження пароля не співпадає.';
    }

    return '';
  }
}

export default RegisterController;
