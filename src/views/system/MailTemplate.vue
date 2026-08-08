<template>
  <div class="page">
    <el-card>
      <SearchBar
        v-model="query"
        :fields="searchFields"
        :loading="loading"
        boxed
        @search="fetchData"
        @reset="resetQuery"
      />

      <div class="table-section">
        <div class="table-section__bar">
          <span class="table-section__count">共 <strong>{{ page.total }}</strong> 条</span>
          <el-button v-if="hasPerm('system:mailTemplate:add')" type="primary" size="small" @click="openAdd">新增</el-button>
          <el-button v-if="hasPerm('system:mailTemplate:delete')" type="danger" size="small" :disabled="!selected.length" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>

        <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="templateCode" label="模板编码" width="160" />
          <el-table-column prop="templateName" label="模板名称" min-width="160" />
          <el-table-column prop="subject" label="主题模板" min-width="200" show-overflow-tooltip />
          <el-table-column prop="enabled" label="启用" width="70">
            <template #default="{ row }">
              <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
                {{ row.enabled === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="success" link @click="openPreview(row)">预览</el-button>
              <el-button v-if="hasPerm('system:mailTemplate:edit')" size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="hasPerm('system:mailTemplate:delete')" size="small" type="danger" link @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="page.pageNum"
          v-model:page-size="page.pageSize"
          :total="page.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchData"
          @current-change="fetchData"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑邮件模板' : '新增邮件模板'"
      width="700px"
      destroy-on-close
      :before-close="handleDialogBeforeClose"
    >
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板编码" required>
              <el-input v-model="form.templateCode" placeholder="如 WELCOME" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板名称" required>
              <el-input v-model="form.templateName" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="主题模板">
          <el-input v-model="form.subject" placeholder="支持占位符，如：您好${userName}" />
        </el-form-item>
        <el-form-item label="正文模板">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="支持 Thymeleaf 模板语法" />
        </el-form-item>
        <el-form-item label="默认附件类型">
          <el-input v-model="form.defaultAttachTypes" placeholder="逗号分隔" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog
      v-model="previewVisible"
      title="模板预览"
      width="800px"
      destroy-on-close
    >
      <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
        <el-descriptions-item label="模板编码">{{ previewData.templateCode }}</el-descriptions-item>
        <el-descriptions-item label="模板名称">{{ previewData.templateName }}</el-descriptions-item>
        <el-descriptions-item label="主题预览" :span="2">
          <div style="font-weight:600;color:#303133">{{ renderedSubject || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:#606266">正文预览</div>
      <div
        class="preview-content"
        v-html="renderedContent || '<span style=color:#909399>暂无正文</span>'"
      />
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, create, update, remove, batchRemove } from '../../api/mailTemplate'
import { useDialogAddDraft } from '../../composables/useFormDraft'
import { useUserStore } from '../../stores/user'
import SearchBar from '../../components/SearchBar.vue'
import { renderTemplate } from '../../utils/templateHelper'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const searchFields = [
  { key: 'templateCode', label: '模板编码', type: 'input', matchType: 'fuzzy', width: 200 },
  { key: 'templateName', label: '模板名称', type: 'input', matchType: 'fuzzy', width: 200 },
  { key: 'enabled', label: '启用状态', type: 'select', options: [{ label: '禁用', value: 0 }, { label: '启用', value: 1 }], width: 120 }
]

const tableData = ref([])
const selected = ref([])
const loading = ref(false)
const saving = ref(false)

const query = reactive({ templateCode: '', templateName: '', enabled: '' })
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const dialog = reactive({ visible: false, isEdit: false })
const previewVisible = ref(false)
const previewData = reactive({ templateCode: '', templateName: '', subject: '', content: '' })

const emptyForm = () => ({
  id: null, templateCode: '', templateName: '', subject: '',
  content: '', defaultAttachTypes: '', enabled: 1
})
const form = reactive(emptyForm())
const addDraft = useDialogAddDraft('system-mail-template-add', {
  getEmptyData: emptyForm,
  getCurrentData: () => ({ ...form }),
  reset: () => Object.assign(form, emptyForm()),
  applyData: (data) => Object.assign(form, { ...emptyForm(), ...data })
})

const renderedSubject = computed(() => {
  if (!previewData.subject) return ''
  return renderTemplate(previewData.subject, {})
})

const renderedContent = computed(() => {
  if (!previewData.content) return ''
  return renderTemplate(previewData.content, {})
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize }
    Object.keys(query).forEach(k => { if (query[k] !== '' && query[k] !== null && query[k] !== undefined) params[k] = query[k] })
    const res = await getList(params)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    }
  } finally { loading.value = false }
}

const resetQuery = () => {
  Object.keys(query).forEach(k => query[k] = '')
  page.pageNum = 1
  fetchData()
}

const openAdd = () => {
  dialog.isEdit = false
  addDraft.open(() => { dialog.visible = true })
}

const openEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(form, res.data)
      dialog.isEdit = true
      dialog.visible = true
    }
  } catch { /* handled */ }
}

const openPreview = (row) => {
  Object.assign(previewData, {
    templateCode: row.templateCode || '',
    templateName: row.templateName || '',
    subject: row.subject || '',
    content: row.content || ''
  })
  previewVisible.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = dialog.isEdit ? await update({ ...form }) : await create({ ...form })
    if (res.code === 200) {
      if (!dialog.isEdit) addDraft.clear()
      ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
      dialog.visible = false
      fetchData()
    }
  } finally { saving.value = false }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该模板？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(selected.value.map(r => r.id))
    if (res.code === 200) { ElMessage.success('批量删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const handleDialogCancel = async () => {
  if (dialog.isEdit) {
    dialog.visible = false
    return
  }
  await addDraft.cancel(() => { dialog.visible = false })
}

const handleDialogBeforeClose = async (done) => {
  if (dialog.isEdit) {
    done()
    return
  }
  await addDraft.cancel(done)
}

const onSelectionChange = (sel) => { selected.value = sel }

onMounted(() => fetchData())
</script>

<style scoped>
.page { max-width: 1600px; }
.table-section { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.table-section__bar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #fafbfc; border-bottom: 1px solid #e8ecf1; }
.table-section__count { flex: 1; font-size: 13px; color: #5f6b7a; }
.table-section__count strong { color: #1e88e5; font-weight: 700; }
.pagination { margin-top: 16px; justify-content: flex-end; display: flex; }
.preview-content {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  background: #fafbfc;
  line-height: 1.7;
}
.preview-content :deep(table) { border-collapse: collapse; width: 100%; }
.preview-content :deep(td), .preview-content :deep(th) { border: 1px solid #d4dde8; padding: 6px 10px; }
</style>
