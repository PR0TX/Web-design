// about-view.js
export default {
  name: 'AboutView',
  template: `
    <section class="container py-5 page-section">
      <section class="text-center mb-5">
        <div class="about-logo">
          <img src="logo.png" alt="ChronoTrack logo">
        </div>
        <p class="text-muted mx-auto" style="max-width: 720px;">
          Інтерфейс для обліку робочого часу, де можна запускати таймер, призупиняти, зупиняти та фіксувати назву задачі з часом початку і завершення.
          Додаток працює через VueJS SPA-клієнт, який взаємодіє з Express-сервером та SQLite-базою.
        </p>
      </section>

      <section class="row g-4">
        <div class="col-md-4">
          <div class="feature-card">
            <h2 class="h5 section-title">Швидкий старт</h2>
            <p class="text-muted">Стартуйте сесію одним натисканням і одразу додавайте назву задачі.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="feature-card">
            <h2 class="h5 section-title">Контроль часу</h2>
            <p class="text-muted">Зупиняйте та відновлюйте сесії, фіксуючи точні проміжки роботи.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="feature-card">
            <h2 class="h5 section-title">Історія</h2>
            <p class="text-muted">Зберігайте сесії із часом початку, завершення та тривалістю.</p>
          </div>
        </div>
      </section>
    </section>
  `,
};
