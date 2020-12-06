<template>
  <ul class="troubleshooting-console">
    <li class="troubleshooting-console__admin">
      <h4 class="console-header">
        Admin
      </h4>
      <Console class="console" :output="outputAdmin" />
    </li>
    <li class="troubleshooting-console__client">
      <h4 class="console-header">
        Client
      </h4>
      <Console class="console" :output="outputClient" />
    </li>
  </ul>
</template>

<script>
import Console from '@/components/Console/Console.vue';

const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default {
  name: 'TroubleshootingConsole',
  components: {
    Console,
  },
  data() {
    return {
      outputAdmin: [],
      outputClient: [],
    };
  },
  mounted() {
    this.addAdminMessage(`Beginning admin troubleshooting (${currentTimezone}).`);
    this.addClientMessage(`Beginning client troubleshooting (${currentTimezone}).`);
  },
  methods: {
    addAdminMessage(message) {
      this.outputAdmin.unshift(`${this.getTimestamp()} – ${message}`);
    },
    addClientMessage(message) {
      this.outputClient.unshift(`${this.getTimestamp()} – ${message}`);
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
@use '@/scss/utilities' as utils;
@use '@/scss/variables' as var;

.console-header {
  @include utils.typeface-code();
}

.troubleshooting-console__admin,
.troubleshooting-console__client {
  width: 100%;
  height: 100%;

  .console {
    height: 300px;
    overflow: scroll;
  }
}

.troubleshooting-console__admin {
  padding-right: var.$space-small;
}

.troubleshooting-console__client {
  padding-left: var.$space-small;
}
</style>
