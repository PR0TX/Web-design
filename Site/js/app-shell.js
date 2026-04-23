// app-shell.js
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { appState } from './shared.js';

function updateNavPill(instant = false) {
  const nav = document.querySelector('.site-nav');

  if (!nav) {
    return;
  }

  let pill = nav.querySelector('.nav-pill-indicator');
  if (!pill) {
    pill = document.createElement('div');
    pill.className = 'nav-pill-indicator';
    nav.insertBefore(pill, nav.firstChild);
  }

  const activeLink = nav.querySelector('.nav-link.active');

  if (!activeLink) {
    pill.style.width = '0px';
    pill.style.height = '0px';
    return;
  }

  const navRect = nav.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();

  pill.style.transition = instant ? 'none' : 'all 0.3s ease';
  pill.style.width = `${linkRect.width}px`;
  pill.style.height = `${linkRect.height}px`;
  pill.style.transform = `translate(${linkRect.left - navRect.left}px, ${linkRect.top - navRect.top}px)`;

  if (instant) {
    void pill.offsetWidth;
    pill.style.transition = 'all 0.3s ease';
  }
}

function queueNavPillUpdate(instant = false) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateNavPill(instant);
    });
  });
}

export default {
  name: 'AppShell',
  setup() {
    const route = useRoute();
    const handleResize = () => queueNavPillUpdate(true);

    watch(
      () => route.fullPath,
      () => nextTick(() => queueNavPillUpdate(false)),
      { flush: 'post' },
    );

    watch(
      () => [appState.authReady, appState.isAuthenticated],
      () => nextTick(() => queueNavPillUpdate(true)),
      { flush: 'post' },
    );

    onMounted(() => {
      queueNavPillUpdate(true);
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
    });

    return {
      route,
      state: appState,
    };
  },
  template: `
    <div class="app-shell">
      <header class="site-header border-bottom">
        <div class="container py-3 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
          <RouterLink to="/workspace" custom v-slot="{ href, navigate }">
            <a :href="href" class="text-decoration-none text-center text-sm-start brand-link" @click="navigate">
              <span class="brand-name">ChronoTrack</span>
            </a>
          </RouterLink>

          <nav class="nav nav-pills flex-row flex-wrap site-nav ms-sm-auto">
            <RouterLink to="/workspace" custom v-slot="{ href, navigate, isActive }">
              <a
                v-show="state.authReady && state.isAuthenticated"
                :href="href"
                class="nav-link"
                :class="{ active: isActive }"
                @click="navigate"
              >
                Робоча область
              </a>
            </RouterLink>

            <RouterLink to="/profile" custom v-slot="{ href, navigate, isActive }">
              <a
                v-show="state.authReady && state.isAuthenticated"
                :href="href"
                class="nav-link"
                :class="{ active: isActive }"
                @click="navigate"
              >
                Профіль
              </a>
            </RouterLink>

            <RouterLink to="/about" custom v-slot="{ href, navigate, isActive }">
              <a :href="href" class="nav-link" :class="{ active: isActive }" @click="navigate">Про додаток</a>
            </RouterLink>

            <RouterLink to="/login" custom v-slot="{ href, navigate, isActive }">
              <a
                v-show="state.authReady && !state.isAuthenticated"
                :href="href"
                class="nav-link"
                :class="{ active: isActive }"
                @click="navigate"
              >
                Вхід
              </a>
            </RouterLink>

            <RouterLink to="/register" custom v-slot="{ href, navigate, isActive }">
              <a
                v-show="state.authReady && !state.isAuthenticated"
                :href="href"
                class="nav-link"
                :class="{ active: isActive }"
                @click="navigate"
              >
                Реєстрація
              </a>
            </RouterLink>
          </nav>
        </div>
      </header>

      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="page-slide" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>

      <footer class="border-top bg-white mt-4">
        <div class="container py-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="small text-muted">ChronoTrack © 2026. Усі права захищені.</div>
          <div class="footer-links d-flex flex-wrap gap-3 small">
            <a href="#">Політика конфіденційності</a>
            <a href="#">Умови використання</a>
            <a href="#">Підтримка</a>
          </div>
        </div>
      </footer>
    </div>
  `,
};
