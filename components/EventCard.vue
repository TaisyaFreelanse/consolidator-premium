
<script setup lang="ts">
import type { EventItem } from '~/types'
import { useFavoritesStore } from '~/stores/favorites'
const props = defineProps<{ item: EventItem }>()
const fav = useFavoritesStore()
const isFav = computed(() => fav.ids.has(props.item.id))
</script>

<template>
  <div class="card p-4 hover:shadow-xl transition">
    <div class="flex gap-6">
      <img :src="item.image || '/mock/placeholder.jpg'" alt="" class="w-48 h-32 object-cover rounded-xl">
      <div class="flex-1">
        <div class="flex items-start justify-between gap-4">
          <h3 class="text-xl font-semibold leading-tight">{{ item.title }}</h3>
          <button class="btn-ghost" @click="fav.toggle(item.id)">
            <span v-if="isFav">★ В избранном</span>
            <span v-else>☆ В избранное</span>
          </button>
        </div>
        <div class="mt-1 subtle">{{ item.author }} · {{ item.location }}</div>
        <div class="mt-2 text-sm">Старт: {{ new Date(item.startAt).toLocaleString() }}</div>
        <div class="mt-2 text-sm">Цель: <b>{{ (item.priceTotal/100).toLocaleString('ru-RU') }} ₽</b>
          <span v-if="item.seatLimit" class="pill ml-2">Мест до: {{ item.seatLimit }}</span>
        </div>
        <div class="mt-3 flex gap-2">
          <NuxtLink class="btn-primary" :to="`/monitoring?event=${item.id}`">Мониторинг</NuxtLink>
          <button class="btn" @click="$emit('share', item.id)">Поделиться</button>
        </div>
      </div>
    </div>
  </div>
</template>
