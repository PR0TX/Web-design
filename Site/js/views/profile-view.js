// profile-view.js
import {
  applySession,
  formatDate,
  formatDurationHuman,
  formatRelativeDateTime,
  logoutUser,
  request,
} from '../shared.js';

export default {
  name: 'ProfileView',
  data() {
    return {
      profile: null,
      feedback: null,
      loading: false,
    };
  },
  computed: {
    planLabel() {
      return this.profile ? `Статус: ${this.profile.user.plan}` : 'Статус: Premium';
    },
    profileDetails() {
      if (!this.profile) {
        return [];
      }

      return [
        {
          label: 'Ім\'я користувача',
          value: this.profile.user.fullName,
        },
        {
          label: 'Електронна пошта',
          value: this.profile.user.email,
        },
        {
          label: 'Стать',
          value: this.profile.user.gender,
        },
        {
          label: 'Дата народження',
          value: formatDate(this.profile.user.birthDate),
        },
        {
          label: 'Зареєстровано',
          value: formatDate(this.profile.user.registeredAt),
        },
        {
          label: 'Остання активність',
          value: this.profile.activeSession
            ? `Триває сесія, ${formatRelativeDateTime(this.profile.lastActivityAt, Date.now())}`
            : formatRelativeDateTime(this.profile.lastActivityAt, Date.now()),
        },
      ];
    },
    stats() {
      if (!this.profile) {
        return {
          totalTime: '0 год 00 хв',
          averageTime: '0 хв',
          sessionCount: '0',
        };
      }

      return {
        totalTime: this.profile.totalDurationMs > 0
          ? formatDurationHuman(this.profile.totalDurationMs)
          : '0 год 00 хв',
        averageTime: this.profile.sessionCount > 0
          ? formatDurationHuman(this.profile.averageDurationMs)
          : '0 хв',
        sessionCount: String(this.profile.sessionCount),
      };
    },
    note() {
      if (!this.profile) {
        return '';
      }

      return this.profile.activeSession
        ? `Активна сесія "${this.profile.activeSession.taskName}" ще не врахована у завершеній статистиці.`
        : 'Статистика розраховується на основі збережених робочих сесій.';
    },
  },
  methods: {
    async loadProfile() {
      this.loading = true;
      this.feedback = null;

      try {
        const payload = await request('/profile');
        this.profile = payload;
        applySession(payload.user);
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      this.loading = true;

      try {
        await logoutUser();
        this.$router.push({ name: 'login' });
      } catch (error) {
        this.feedback = { message: error.message, type: 'danger' };
        this.loading = false;
      }
    },
  },
  mounted() {
    this.loadProfile();
  },
  template: `
    <section class="container py-5 page-section">
      <div class="row g-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <h1 class="h4 section-title mb-1">Профіль користувача</h1>
                  <p class="text-muted mb-0">Інформація виводиться у табличному вигляді.</p>
                </div>
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <span class="badge text-bg-light">{{ planLabel }}</span>
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="logout" :disabled="loading">Вийти</button>
                </div>
              </div>
              <div v-if="feedback" :class="['alert', \`alert-\${feedback.type}\`, 'mt-3', 'mb-0']" role="status" aria-live="polite">
                {{ feedback.message }}
              </div>
              <div class="table-responsive mt-3">
                <table class="table align-middle">
                  <tbody>
                    <tr v-for="detail in profileDetails" :key="detail.label">
                      <th scope="row" class="text-muted">{{ detail.label }}</th>
                      <td>{{ detail.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h2 class="h5 section-title mb-3">Статистика</h2>
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="feature-card">
                    <p class="text-muted mb-1">Всього годин</p>
                    <div class="h4 mb-0">{{ stats.totalTime }}</div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="feature-card">
                    <p class="text-muted mb-1">Середня тривалість</p>
                    <div class="h4 mb-0">{{ stats.averageTime }}</div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="feature-card">
                    <p class="text-muted mb-1">Кількість сесій</p>
                    <div class="h4 mb-0">{{ stats.sessionCount }}</div>
                  </div>
                </div>
              </div>
              <p class="text-muted small mt-3 mb-0">{{ note }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
};
