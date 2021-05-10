<template>
  <img :src="src" />
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
.NuxtLogo {
  animation: 1s appear;
  margin: auto;
}

@keyframes appear {
  0% {
    opacity: 0;
  }
}
</style>
