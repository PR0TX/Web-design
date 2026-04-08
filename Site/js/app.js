// app.js

import { createApp } from 'vue';
import { MotionPlugin, animate } from 'motion-v';

const apiBase = '/api';
const PAGE_TRANSITION_MS = 300;
const PAGE_EXIT_OFFSET = -40;
const CLOCK_FLIP_MS = 500;
const MOTION_EASE = 'easeInOut';
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message || 'Сталася помилка під час виконання запиту.');
  }

  return payload;
}

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('uk-UA', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function formatDate(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return 'Немає даних';
  }

  return dateFormatter.format(new Date(timestamp));
}

function formatTime(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return '';
  }

  return timeFormatter.format(new Date(timestamp));
}

function formatDateTime(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return 'Немає даних';
  }

  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

function formatInputTime(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return '';
  }

  const date = new Date(timestamp);
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function formatDurationClock(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
}

function formatDurationHuman(durationMs) {
  const totalMinutes = Math.max(0, Math.floor(durationMs / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} год ${padNumber(minutes)} хв`;
  }

  if (minutes > 0) {
    return `${minutes} хв`;
  }

  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${seconds} сек`;
}

function formatRelativeDateTime(timestamp, now = Date.now()) {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return 'Немає даних';
  }

  const value = new Date(timestamp);
  const current = new Date(now);
  const isSameDay = value.getFullYear() === current.getFullYear()
    && value.getMonth() === current.getMonth()
    && value.getDate() === current.getDate();

  if (isSameDay) {
    return `Сьогодні, ${formatTime(timestamp)}`;
  }

  return formatDateTime(timestamp);
}

let globalAuthReady = false;
let globalIsAuthenticated = false;
let globalCurrentUser = null;

function createAuthState() {
  return {
    authReady: globalAuthReady,
    isAuthenticated: globalIsAuthenticated,
    currentUser: globalCurrentUser,
  };
}


function updateNavPill(instant = false) {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  let pill = nav.querySelector('.nav-pill-indicator');
  if (!pill) {
    pill = document.createElement('div');
    pill.className = 'nav-pill-indicator';
    nav.insertBefore(pill, nav.firstChild);
  }

  const activeLink = nav.querySelector('.nav-link.active');
  if (!activeLink) {
    pill.style.width = '0px';
    return;
  }

  const navRect = nav.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();

  if (instant) {
    pill.style.transition = 'none';
  } else {
    pill.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  }
  
  pill.style.width = `${linkRect.width}px`;
  pill.style.height = `${linkRect.height}px`;
  pill.style.transform = `translate(${linkRect.left - navRect.left}px, ${linkRect.top - navRect.top}px)`;

  if (instant) {
    void pill.offsetWidth;
    pill.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  }
}

let isLeaving = false;
let isTransitionsSetup = false;

function setupPageTransitions() {
  if (isTransitionsSetup) return;
  isTransitionsSetup = true;

  updateNavPill(true);
  window.addEventListener('resize', () => updateNavPill(true));
  
  window.addEventListener('popstate', () => {
    window.location.reload();
  });

  document.addEventListener('click', async (event) => {
    const link = event.target.closest('[data-page-link]');

    if (!link) {
      return;
    }

    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const href = link.getAttribute('href');

    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return;
    }

    let targetUrl;

    try {
      targetUrl = new URL(href, window.location.href);
    } catch (error) {
      return;
    }

    if (targetUrl.origin !== window.location.origin) {
      return;
    }

    if (targetUrl.pathname === window.location.pathname
      && targetUrl.search === window.location.search
      && targetUrl.hash === window.location.hash) {
      return;
    }

    event.preventDefault();

    if (isLeaving) {
      return;
    }

    isLeaving = true;

    if (prefersReducedMotion()) {
      window.location.href = targetUrl.href;
      return;
    }
    const allLinks = Array.from(document.querySelectorAll('.site-nav .nav-link'));
    let targetLink = null;
    let activeIndex = allLinks.findIndex(n => n.classList.contains('active'));
    let targetIndex = -1;

    allLinks.forEach((n, idx) => {
      n.classList.remove('active');
      const linkHref = n.getAttribute('href');
      if (linkHref === href || (targetUrl.pathname.endsWith(linkHref))) {
        n.classList.add('active');
        targetLink = n;
        targetIndex = idx;
      }
    });
    let exitX = PAGE_EXIT_OFFSET;
    let enterX = Math.abs(PAGE_EXIT_OFFSET);

    if (activeIndex !== -1 && targetIndex !== -1 && activeIndex !== targetIndex) {
      if (targetIndex < activeIndex) {
        exitX = Math.abs(PAGE_EXIT_OFFSET);
        enterX = -Math.abs(PAGE_EXIT_OFFSET);
      } else {
        exitX = -Math.abs(PAGE_EXIT_OFFSET);
        enterX = Math.abs(PAGE_EXIT_OFFSET);
      }
    }
    updateNavPill(false);

    const appRoot = document.getElementById('app');
    const fetchPromise = fetch(targetUrl.href).then(r => r.text());
    const mainEl = document.querySelector('main');
    let exitAnimationFinished = Promise.resolve();
    if (mainEl) {
      const exitAnimation = animate(
        mainEl,
        { opacity: [1, 0], x: [0, exitX] },
        { duration: PAGE_TRANSITION_MS / 1000, ease: MOTION_EASE }
      );
      if (exitAnimation && exitAnimation.finished) {
        exitAnimationFinished = Promise.all([
          exitAnimation.finished,
          new Promise(r => setTimeout(r, 520))
        ]);
      }
    }

    try {
      const [htmlRaw] = await Promise.all([fetchPromise, exitAnimationFinished]);
      const html = htmlRaw.replace(/(:initial=['"]\{\s*opacity:\s*0,\s*x:\s*)-?\d+(\s*\}['"])/g, `$1${enterX}$2`);

      const doc = new DOMParser().parseFromString(html, 'text/html');

      const newAppRoot = doc.getElementById('app');
      if (!newAppRoot) {
        window.location.href = targetUrl.href;
        return;
      }

      if (window.__vueApp) {
        window.__vueApp.unmount();
      }

      appRoot.innerHTML = newAppRoot.innerHTML;
      document.title = doc.title;
      document.body.dataset.page = doc.body.dataset.page;
      window.history.pushState({}, '', targetUrl.href);
      mountPage(false);
      updateNavPill(true);

      isLeaving = false;
    } catch(e) {
      window.location.href = targetUrl.href;
    }
  });
}

async function loadAuthState(vm, redirectIfGuest = false) {
  const response = await request('/session');
  vm.currentUser = response.user;
  vm.isAuthenticated = Boolean(response.user);
  vm.authReady = true;

  globalCurrentUser = vm.currentUser;
  globalIsAuthenticated = vm.isAuthenticated;
  globalAuthReady = true;

  if (redirectIfGuest && !vm.isAuthenticated) {
    window.location.href = 'login.html';
  }

  vm.$nextTick(() => {
    updateNavPill(true);
  });

  return response.user;
}

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

function buildWorkspaceViewModel(vm) {
  const now = vm.now;
  const activeSession = vm.workspace.activeSession;
  const historyRows = buildWorkspaceHistoryRows(vm.workspace.sessions);
  const lastResumedAt = activeSession?.lastResumedAt || now;
  const timerValue = activeSession
    ? formatDurationClock(activeSession.status === 'running'
      ? activeSession.elapsedMsBeforePause + Math.max(0, now - lastResumedAt)
      : activeSession.elapsedMsBeforePause)
    : '00:00:00';

  if (!activeSession) {
    return {
      taskName: '',
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
    taskName: activeSession.taskName,
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

function createLoginApp() {
  const app = createApp({
    data() {
      return {
        ...createAuthState(),
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
      async bootstrap() {
        const user = await loadAuthState(this);

        if (user) {
          window.location.href = 'profile.html';
        }
      },
      async submitForm() {
        if (!this.form.email || !this.form.password) {
          this.feedback = { message: 'Введіть email і пароль.', type: 'danger' };
          return;
        }

        this.loading = true;
        this.feedback = null;

        try {
          await request('/login', {
            method: 'POST',
            body: JSON.stringify({
              email: this.form.email,
              password: this.form.password,
              rememberMe: this.form.rememberMe,
            }),
          });
          this.feedback = { message: 'Вхід виконано успішно. Переадресація...', type: 'success' };
          window.location.href = 'profile.html';
        } catch (error) {
          this.feedback = { message: error.message, type: 'danger' };
        } finally {
          this.loading = false;
        }
      },
    },
    mounted() {
      this.bootstrap();
    },
  });

  app.use(MotionPlugin);
  return app;
}

function createRegisterApp() {
  const app = createApp({
    data() {
      return {
        ...createAuthState(),
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
      async bootstrap() {
        const user = await loadAuthState(this);

        if (user) {
          window.location.href = 'profile.html';
        }
      },
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
          await request('/register', {
            method: 'POST',
            body: JSON.stringify({
              fullName: this.form.fullName,
              email: this.form.email,
              gender: this.form.gender,
              birthDate: this.form.birthDate,
              password: this.form.password,
            }),
          });
          this.feedback = { message: 'Реєстрацію завершено успішно. Переадресація...', type: 'success' };
          window.location.href = 'profile.html';
        } catch (error) {
          this.feedback = { message: error.message, type: 'danger' };
        } finally {
          this.loading = false;
        }
      },
    },
    mounted() {
      this.bootstrap();
    },
  });

  app.use(MotionPlugin);
  return app;
}

function createAboutApp() {
  const app = createApp({
    data() {
      return {
        ...createAuthState(),
      };
    },
    methods: {
      async bootstrap() {
        await loadAuthState(this);
      },
    },
    mounted() {
      this.bootstrap();
    },
  });

  app.use(MotionPlugin);
  return app;
}

function createProfileApp() {
  const app = createApp({
    data() {
      return {
        ...createAuthState(),
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
      async bootstrap() {
        const user = await loadAuthState(this, true);

        if (!user) {
          return;
        }

        await this.loadProfile();
      },
      async loadProfile() {
        this.loading = true;
        this.feedback = null;

        try {
          this.profile = await request('/profile');
        } catch (error) {
          this.feedback = { message: error.message, type: 'danger' };
        } finally {
          this.loading = false;
        }
      },
      async logout() {
        this.loading = true;

        try {
          await request('/logout', { method: 'POST' });
          window.location.href = 'login.html';
        } catch (error) {
          this.feedback = { message: error.message, type: 'danger' };
          this.loading = false;
        }
      },
    },
    mounted() {
      this.bootstrap();
    },
  });

  app.use(MotionPlugin);
  return app;
}

const FlipDigit = {
  template: `
    <div class="flip-digit-container">
      <div class="flip-digit-half flip-digit-top">
        <div class="flip-digit-text-container-top">{{ digit }}</div>
        <div class="flip-digit-shadow-inset"></div>
      </div>
      <div class="flip-digit-half flip-digit-bottom">
        <div class="flip-digit-text-container-bottom">{{ prevDigit }}</div>
      </div>
      <div v-if="isFlipping" class="flip-digit-half flip-digit-top flip-digit-flap-top anim-flip-top">
        <div class="flip-digit-text-container-top">{{ prevDigit }}</div>
        <div style="position: absolute; inset: 0; background: black; z-index: 20;" class="anim-flash-top"></div>
      </div>
      <div v-if="isFlipping" class="flip-digit-half flip-digit-bottom flip-digit-flap-bottom anim-flip-bottom">
        <div class="flip-digit-text-container-bottom">{{ digit }}</div>
        <div style="position: absolute; inset: 0; background: black; z-index: 20;" class="anim-flash-bottom"></div>
      </div>
      <div class="flip-digit-center-line"></div>
    </div>
  `,
  props: {
    digit: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      prevDigit: this.digit,
      isFlipping: false,
      timeout: null,
    };
  },
  watch: {
    digit(newVal) {
      if (newVal !== this.prevDigit) {
        this.isFlipping = false;
        if (this.timeout) clearTimeout(this.timeout);

        this.$nextTick(() => {
          this.isFlipping = true;
          this.timeout = setTimeout(() => {
            this.prevDigit = newVal;
            this.isFlipping = false;
          }, 500);
        });
      }
    },
  },
};

const MechanicalTimer = {
  components: {
    FlipDigit,
  },
  template: `
    <div class="mechanical-timer-container">
      <template v-for="(char, i) in timeStrArr" :key="i">
        <div v-if="char === ':'" class="mechanical-timer-colon">
          <span></span>
          <span></span>
        </div>
        <flip-digit v-else :digit="char"></flip-digit>
      </template>
    </div>
  `,
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  computed: {
    timeStrArr() {
      return this.value.split('');
    },
  },
};

function createWorkspaceApp() {
  const app = createApp({
    data() {
      return {
        ...createAuthState(),
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
        return buildWorkspaceViewModel(this);
      },
    },
    methods: {
      async bootstrap() {
        const user = await loadAuthState(this, true);

        if (!user) {
          return;
        }

        await this.loadWorkspace();
        this.timerId = window.setInterval(() => {
          if (this.workspace.activeSession && this.workspace.activeSession.status === 'running') {
            this.now = Date.now();
          }
        }, 1000);
      },
      async loadWorkspace() {
        this.loading = true;
        this.feedback = null;

        try {
          this.workspace = await request('/workspace');
          this.taskName = this.workspace.activeSession ? this.workspace.activeSession.taskName : '';
          this.now = Date.now();
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
          this.workspace = response;
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
          this.workspace = response;
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
          this.workspace = response;
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

        const isConfirmed = window.confirm(`Видалити сесію "${session.taskName}" з історії?`);

        if (!isConfirmed) {
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
      async logout() {
        try {
          await request('/logout', { method: 'POST' });
          window.location.href = 'login.html';
        } catch (error) {
          this.feedback = { message: error.message, type: 'danger' };
        }
      },
    },
    beforeUnmount() {
      if (this.timerId) {
        window.clearInterval(this.timerId);
      }
    },
    mounted() {
      this.bootstrap();
    },
  });

  app.use(MotionPlugin);
  app.component('mechanical-timer', MechanicalTimer);
  return app;
}

function mountPage(initTransitions = true) {
  if (initTransitions) {
    setupPageTransitions();
  }

  const page = document.body.dataset.page;
  let app = null;

  if (page === 'login') {
    app = createLoginApp();
  } else if (page === 'register') {
    app = createRegisterApp();
  } else if (page === 'profile') {
    app = createProfileApp();
  } else if (page === 'workspace') {
    app = createWorkspaceApp();
  } else {
    app = createAboutApp();
  }

  window.__vueApp = app;
  app.mount('#app');
  setTimeout(() => updateNavPill(true), 50);
}

mountPage(true);
