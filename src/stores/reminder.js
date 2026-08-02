import { defineStore } from 'pinia'
import * as reminderApi from '@/api/reminder'

export const useReminderStore = defineStore('reminder', {
    state: () => ({
        offsetRules: [],
        percentRules: [],
    }),
    actions: {
        async fetchRules() {
            const res = await reminderApi.getRules()
            const data = res.data || {}
            this.offsetRules = data.offsetRules || []
            this.percentRules = data.percentRules || []
        },
        async addOrUpdate(rule) {
            const saved = await reminderApi.saveRule(rule)
            await this.fetchRules()
            return saved
        },
        async remove(id) {
            await reminderApi.deleteRule(id)
            await this.fetchRules()
        },
        async batchPercent(payload) {
            await reminderApi.batchSavePercent(payload)
            await this.fetchRules()
        },
    },
})
