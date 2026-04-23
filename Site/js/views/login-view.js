// login-view.js
import { applySession, request } from '../shared.js';

export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        email: '',
        password: '',
        rememberMe: false,
      },
      feedback: null,
      loading: false,
    };
  },
  computed: {
    buttonLabel() {
      return this.loading ? 'Виконується...' : 'Увійти';
    },
  },
  methods: {
    async submitForm() {
      if (!this.form.email || !this.form.password) {
        this.feedback = { message: 'Введіть email і пароль.', type: 'danger' };
        return;
      }

      this.loading = true;
      this.feedback = null;

      try {
        const response = await request('/login', {
          method: 'POST',
          body: JSON.stringify({
            email: this.form.email,
            password: this.form.password,
            rememberMe: this.form.rememberMe,
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
        <div class="col-md-8 col-lg-5">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 p-lg-5">
              <h1 class="h4 section-title text-center">Вхід до системи</h1>
              <p class="text-muted text-center mb-4">Використайте email та пароль для входу.</p>
              <form novalidate @submit.prevent="submitForm">
                <div class="mb-3">
                  <label class="form-label" for="login-email">Email</label>
                  <input
                    id="login-email"
                    v-model.trim="form.email"
                    type="email"
                    class="form-control"
                    placeholder="example@mail.com"
                    autocomplete="email"
                    required
                  >
                </div>
                <div class="mb-3">
                  <label class="form-label" for="login-password">Пароль</label>
                  <input
                    id="login-password"
                    v-model="form.password"
                    type="password"
                    class="form-control"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    required
                  >
                </div>
                <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <div class="form-check">
                    <input id="remember" v-model="form.rememberMe" class="form-check-input" type="checkbox">
                    <label class="form-check-label" for="remember">Запам'ятати мене</label>
                  </div>
                  <a class="small text-decoration-none" href="#">Забули пароль?</a>
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
