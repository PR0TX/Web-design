// router.js
import { createRouter, createWebHashHistory } from 'vue-router';
import { appState, syncSession } from './shared.js';
import AboutView from './views/about-view.js';
import LoginView from './views/login-view.js';
import ProfileView from './views/profile-view.js';
import RegisterView from './views/register-view.js';
import WorkspaceView from './views/workspace-view.js';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'workspace' },
    },
    {
      path: '/workspace',
      name: 'workspace',
      component: WorkspaceView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'workspace' },
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  if (!appState.authReady) {
    await syncSession();
  }

  if (to.meta.requiresAuth && !appState.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.guestOnly && appState.isAuthenticated) {
    return { name: 'profile' };
  }

  return true;
});

export default router;
