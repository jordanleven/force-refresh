<template>
  <BaseConsole class="troubleshooting-console" :output="output" />
</template>

<script>
import BaseConsole from '@/components/BaseConsole/BaseConsole.vue';

const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default {
  name: 'TroubleshootingConsole',
  components: {
    BaseConsole,
  },
  data() {
    return {
      output: [],
    };
  },
  mounted() {
    this.addMessage(`Beginning troubleshooting (${currentTimezone}).`);
  },
  methods: {
    addMessage(message) {
      this.output.unshift(`${this.getTimestamp()} – ${message}`);
    },
    getTimestamp() {
      return new Date().toLocaleDateString(
        'en',
        {
          day: 'numeric',
          hour: 'numeric',
          hour12: false,
          minute: 'numeric',
          month: 'long',
          second: 'numeric',
        },
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.troubleshooting-console {
  height: 100%;
  overflow: auto;
}
</style>
