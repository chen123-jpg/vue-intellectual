import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'

const cloneData = (value) => JSON.parse(JSON.stringify(value ?? null))
const serializeData = (value) => JSON.stringify(value ?? null)

export function useDialogAddDraft(namespace, options) {
  const { state } = useUserStore()

  const storageKey = computed(() => `form-draft:${namespace}:${state.userId || 'guest'}`)

  const readDraft = () => {
    const raw = localStorage.getItem(storageKey.value)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed?.data ? parsed : null
    } catch {
      localStorage.removeItem(storageKey.value)
      return null
    }
  }

  const clear = () => {
    localStorage.removeItem(storageKey.value)
  }

  const getEmptyData = () => cloneData(options.getEmptyData())
  const getCurrentData = () => cloneData(options.getCurrentData())

  const save = ({ message = '已暂存，下次可继续填写' } = {}) => {
    localStorage.setItem(storageKey.value, JSON.stringify({
      updatedAt: Date.now(),
      data: getCurrentData()
    }))
    ElMessage.success(message)
  }

  const isDirty = () => serializeData(getCurrentData()) !== serializeData(getEmptyData())

  const open = async (show) => {
    options.reset()
    const draft = readDraft()
    if (draft?.data) {
      try {
        await ElMessageBox.confirm(
          options.restoreMessage || '检测到上次未提交内容，是否恢复？',
          options.restoreTitle || '恢复暂存',
          {
            type: 'warning',
            confirmButtonText: '恢复',
            cancelButtonText: '暂不恢复',
            distinguishCancelAndClose: true
          }
        )
        options.applyData(cloneData(draft.data))
        options.onRestored?.(cloneData(draft.data))
      } catch (action) {
        if (action !== 'cancel') return
      }
    }
    show()
  }

  const cancel = async (close) => {
    if (!isDirty()) {
      close()
      return
    }

    try {
      await ElMessageBox.confirm(
        options.closeMessage || '当前内容尚未提交，是否暂存后关闭？',
        options.closeTitle || '提示',
        {
          type: 'warning',
          confirmButtonText: '暂存并关闭',
          cancelButtonText: '直接关闭',
          distinguishCancelAndClose: true
        }
      )
      save({ message: options.closeSavedMessage || '已暂存，下次可继续填写' })
      close()
    } catch (action) {
      if (action === 'cancel') {
        clear()
        close()
      }
    }
  }

  return {
    storageKey,
    readDraft,
    save,
    clear,
    isDirty,
    open,
    cancel
  }
}
