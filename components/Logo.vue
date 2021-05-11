<template>
  <img :src="src" class="logo" width="120px" />
</template>

<script>
export default {
  computed: {
    src() {
      return require(`static/icon.svg`)
    },
  },
}
</script>

<style>
.logo {
  animation: 1s appear;
  margin: auto;
}

@keyframes appear {
  0% {
    opacity: 0;
  }
}
</style>
