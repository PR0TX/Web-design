// mechanical-timer.js
const FLIP_DURATION_MS = 500;

const FlipDigit = {
  name: 'FlipDigit',
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
      timeoutId: null,
    };
  },
  watch: {
    digit(nextDigit) {
      if (nextDigit === this.prevDigit) {
        return;
      }

      this.isFlipping = false;

      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId);
      }

      this.$nextTick(() => {
        this.isFlipping = true;
        this.timeoutId = window.setTimeout(() => {
          this.prevDigit = nextDigit;
          this.isFlipping = false;
          this.timeoutId = null;
        }, FLIP_DURATION_MS);
      });
    },
  },
  beforeUnmount() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
  },
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
        <div class="anim-flash-top flip-digit-flash"></div>
      </div>
      <div v-if="isFlipping" class="flip-digit-half flip-digit-bottom flip-digit-flap-bottom anim-flip-bottom">
        <div class="flip-digit-text-container-bottom">{{ digit }}</div>
        <div class="anim-flash-bottom flip-digit-flash"></div>
      </div>
      <div class="flip-digit-center-line"></div>
    </div>
  `,
};

export default {
  name: 'MechanicalTimer',
  components: {
    FlipDigit,
  },
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
  template: `
    <div class="mechanical-timer-container">
      <template v-for="(char, index) in timeStrArr" :key="index">
        <div v-if="char === ':'" class="mechanical-timer-colon">
          <span></span>
          <span></span>
        </div>
        <FlipDigit v-else :digit="char" />
      </template>
    </div>
  `,
};
