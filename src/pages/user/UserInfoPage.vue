<!-- 編輯個人偏好設定，目前還沒開放改性別/自我介紹等 -->
<template>
  <q-page class="q-pa-md">
    <q-btn to="/me/createBoard" :label="t('createBoardReqMgmt')" outline color="primary" />
    <!-- <q-btn to="/me/editBadges" :label="t('editBadges')" outline color="primary" /> -->
  </q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n({ useScope: 'global' })
</script>
