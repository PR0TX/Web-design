// register-view.js
import { applySession, request } from '../shared.js';

export default {
  name: 'RegisterView',
  data() {
    return {
      form: {
        fullName: '',
        email: '',
        gender: '',
        birthDate: '',
        password: '',
        passwordConfirm: '',
      },
      feedback: null,
      loading: false,
    };
  },
  computed: {
    buttonLabel() {
      return this.loading ? 'Створення...' : 'Створити профіль';
    },
  },
  methods: {
    validateForm() {
      if (!this.form.fullName || !this.form.email || !this.form.gender || !this.form.birthDate) {
        return 'Заповніть усі обов’язкові поля.';
      }

      if (this.form.password.length < 8) {
        return 'Пароль має містити щонайменше 8 символів.';
      }

      if (!/[A-ZА-ЯІЇЄҐ]/u.test(this.form.password)
        || !/[a-zа-яіїєґ]/u.test(this.form.password)
        || !/\d/.test(this.form.password)) {
        return 'Пароль має містити великі, малі літери та цифри.';
      }

      if (this.form.password !== this.form.passwordConfirm) {
        return 'Підтвердження пароля не співпадає.';
      }

      return '';
    },
    async submitForm() {
      const validationError = this.validateForm();

      if (validationError) {
        this.feedback = { message: validationError, type: 'danger' };
        return;
      }

      this.loading = true;
      this.feedback = null;

      try {
        const response = await request('/register', {
          method: 'POST',
          body: JSON.stringify({
            fullName: this.form.fullName,
            email: this.form.email,
            gender: this.form.gender,
            birthDate: this.form.birthDate,
            password: this.form.password,
          }),
        });

        applySession(response.user);
        this.$router.push({ name: 'profile' });
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
      } finally {
        this.loading = false;
      }
    },
  },
  template: `
    <section class="container py-5 page-section">
      <div class="row justify-content-center">
        <div class="col-md-9 col-lg-6">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 p-lg-5">
              <h1 class="h4 section-title text-center">Реєстрація користувача</h1>
              <p class="text-muted text-center mb-4">Заповніть обов'язкові поля для створення профілю.</p>
              <form novalidate @submit.prevent="submitForm">
                <div class="mb-3">
                  <label class="form-label" for="register-name">Ім'я</label>
                  <input
                    id="register-name"
                    v-model.trim="form.fullName"
                    type="text"
                    class="form-control"
                    placeholder="Павло Протченко"
                    autocomplete="name"
                    required
                  >
                </div>
                <div class="mb-3">
                  <label class="form-label" for="register-email">Email</label>
                  <input
                    id="register-email"
                    v-model.trim="form.email"
                    type="email"
                    class="form-control"
                    placeholder="example@mail.com"
                    autocomplete="email"
                    required
                  >
                </div>
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label" for="register-gender">Стать</label>
                    <select id="register-gender" v-model="form.gender" class="form-select" required>
                      <option value="" disabled>Оберіть</option>
                      <option value="Чоловіча">Чоловіча</option>
                      <option value="Жіноча">Жіноча</option>
                      <option value="Інше">Інше</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label" for="register-birth-date">Дата народження</label>
                    <input
                      id="register-birth-date"
                      v-model="form.birthDate"
                      type="date"
                      class="form-control"
                      autocomplete="bday"
                      required
                    >
                  </div>
                </div>
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label" for="register-password">Пароль</label>
                    <input
                      id="register-password"
                      v-model="form.password"
                      type="password"
                      class="form-control"
                      placeholder="Не менше 8 символів"
                      autocomplete="new-password"
                      required
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label" for="register-password-confirm">Підтвердження пароля</label>
                    <input
                      id="register-password-confirm"
                      v-model="form.passwordConfirm"
                      type="password"
                      class="form-control"
                      placeholder="Повторіть пароль"
                      autocomplete="new-password"
                      required
                    >
                  </div>
                </div>
                <div v-if="feedback" :class="['alert', \`alert-\${feedback.type}\`, 'mb-3']" role="status" aria-live="polite">
                  {{ feedback.message }}
                </div>
                <button type="submit" class="btn btn-primary w-100" :disabled="loading">{{ buttonLabel }}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
};
