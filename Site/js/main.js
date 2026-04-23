// main.js
import { createApp } from 'vue';
import AppShell from './app-shell.js';
import router from './router.js';

const app = createApp(AppShell);

app.use(router);

router.isReady().finally(() => {
  app.mount('#app');
});
