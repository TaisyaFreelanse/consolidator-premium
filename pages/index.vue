<script setup lang="ts">
const router = useRouter()
onMounted(() => router.replace('/catalog'))
</script>

<template>
  <div class="p-10 text-center text-slate-500">
    Перенаправление в Каталог…
  </div>
</template>
