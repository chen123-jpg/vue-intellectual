<template>
  <EntryClerk v-if="isEntryClerk" />
  <Organizer v-else-if="isOrganizer" />
  <ProcessOp v-else-if="isProcessOp" />
  <Admin v-else />
</template>

<script setup>
import EntryClerk from './disclosure/EntryClerk.vue'
import Organizer from './disclosure/Organizer.vue'
import ProcessOp from './disclosure/ProcessOp.vue'
import Admin from './disclosure/Admin.vue'
import { isEntryClerk, isOrganizer, isProcessOp } from './disclosure/shared'
</script>
