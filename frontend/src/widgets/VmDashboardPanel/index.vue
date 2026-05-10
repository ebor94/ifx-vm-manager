<script setup>
import { computed } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  ArcElement, CategoryScale, LinearScale, BarElement
} from 'chart.js'
import { useVmStore } from '@entities/vm/model/vm.store'
import { useResourceMetrics } from './useResourceMetrics'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement)

const vmStore = useVmStore()
const vms = computed(() => vmStore.vms)

const { total, byStatus, byOs, totals } = useResourceMetrics(vms)

const ramGb = computed(() => Math.round((totals.value.ramMb / 1024) * 10) / 10)

const statusChartData = computed(() => ({
  labels: Object.keys(byStatus.value),
  datasets: [{
    backgroundColor: ['#16a34a', '#9ca3af', '#eab308'], // verde / gris / amarillo
    data: Object.values(byStatus.value)
  }]
}))

const osChartData = computed(() => ({
  labels: Object.keys(byOs.value),
  datasets: [{
    label: 'VMs por OS',
    backgroundColor: '#3b82f6',
    data: Object.values(byOs.value)
  }]
}))

const resourcesChartData = computed(() => ({
  labels: ['Cores', 'RAM (GB)', 'Disco (GB)'],
  datasets: [{
    label: 'Recursos totales',
    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
    data: [totals.value.cores, ramGb.value, totals.value.diskGb]
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } }
}
</script>

<template>
  <section class="space-y-6">
    <!-- KPI cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p class="text-xs uppercase text-gray-500 dark:text-gray-400">Total VMs</p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ total }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p class="text-xs uppercase text-gray-500 dark:text-gray-400">Cores</p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ totals.cores }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p class="text-xs uppercase text-gray-500 dark:text-gray-400">RAM</p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ ramGb }} GB</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p class="text-xs uppercase text-gray-500 dark:text-gray-400">Disco</p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ totals.diskGb }} GB</p>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h3 class="font-semibold mb-3 text-gray-900 dark:text-gray-100">Por estado</h3>
        <div class="h-56"><Doughnut :data="statusChartData" :options="chartOptions" /></div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h3 class="font-semibold mb-3 text-gray-900 dark:text-gray-100">Por sistema operativo</h3>
        <div class="h-56"><Bar :data="osChartData" :options="chartOptions" /></div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h3 class="font-semibold mb-3 text-gray-900 dark:text-gray-100">Recursos totales</h3>
        <div class="h-56"><Bar :data="resourcesChartData" :options="chartOptions" /></div>
      </div>
    </div>
  </section>
</template>
