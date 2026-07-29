<template>
  <div class="page">
    <el-card>
      <SearchBar
        v-model="ad.query"
        :fields="ad.searchFields"
        :loading="ad.loading"
        :collapsed-threshold="4"
        @search="adFetchData"
        @reset="adResetQuery"
      />

      <div class="toolbar">
        <el-button v-if="hasPerm('patent:disclosure:add')" type="primary" @click="adOpenAdd">
          新增交底
        </el-button>
        <el-button
          v-if="hasPerm('patent:disclosure:delete')"
          type="danger"
          :disabled="!ad.selected.length"
          @click="adBatchDelete"
        >
          批量删除
        </el-button>
      </div>

      <el-table
        :data="ad.tableData"
        v-loading="ad.loading"
        border
        stripe
        @selection-change="(sel) => (ad.selected = sel)"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="tempNo" label="临时编号" width="120" />
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column prop="disclosureName" label="交底名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="专利状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.patentStatus)" size="small">{{ row.patentStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="130" />
        <el-table-column prop="inventor" label="发明人" width="120" />
        <el-table-column prop="sponsor" label="主办人" width="100" />
        <el-table-column prop="agent" label="代理人" width="130" />
        <el-table-column label="同步" width="70">
          <template #default="{ row }">
            <el-tag :type="row.syncedToPatent===1?'success':'info'" size="small">{{ row.syncedToPatent===1?'已同步':'未' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="交底书" min-width="180">
          <template #default="{ row }">
            <DisclosureAttachmentLinks
              :attachments="row.attachments"
              biz-type="DISCLOSURE_DOC"
              @preview="adOpenPreview"
            />
          </template>
        </el-table-column>
        <el-table-column label="其他文件" min-width="200">
          <template #default="{ row }">
            <DisclosureAttachmentLinks
              :attachments="row.attachments"
              biz-type="DISCLOSURE_OTHER"
              @preview="adOpenPreview"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="hasPerm('patent:disclosure:edit')"
              size="small"
              type="primary"
              @click="adOpenEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPerm('patent:disclosure:delete')"
              size="small"
              type="danger"
              @click="adDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="ad.page.pageNum"
        v-model:page-size="ad.page.pageSize"
        :total="ad.page.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="adFetchData"
        @current-change="adFetchData"
        class="pagination"
      />
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="ad.dialog.visible"
      :title="ad.dialog.isEdit ? '编辑专利交底' : '新增专利交底'"
      width="700px"
      destroy-on-close
    >
      <el-form ref="adFormRef" :model="ad.form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="交底名称" required>
              <el-input v-model="ad.form.disclosureName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利类型" required>
              <el-select v-model="ad.form.patentType" style="width:100%">
                <el-option label="发明" value="发明" />
                <el-option label="实用新型" value="实用新型" />
                <el-option label="外观" value="外观" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内部编号">
              <el-input v-model="ad.form.internalNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利状态">
              <el-input v-model="ad.form.patentStatus" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人">
              <ApplicantAgentSelect v-model="ad.form.applicant" type="applicant" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发明人">
              <el-input v-model="ad.form.inventor" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="ad.form.contactPerson" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主办人">
              <el-input v-model="ad.form.sponsor" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代理人">
              <ApplicantAgentSelect v-model="ad.form.agent" type="agent" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交底日期">
              <el-date-picker
                v-model="ad.form.disclosureDate"
                type="date"
                style="width:100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="要求">
              <el-input v-model="ad.form.requirement" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱">
              <el-input v-model="ad.form.contactEmail" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="ad.form.contactPhone" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="ad.form.remark" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">附件管理</el-divider>
        <DisclosureAttachmentEditor
          :disclosure-id="ad.dialog.isEdit ? ad.form.id : null"
          v-model:document-file="ad.disclosureDocument"
          v-model:other-files="ad.otherAttachments"
          @changed="adFetchData"
        />
      </el-form>
      <template #footer>
        <el-button @click="ad.dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="adSave" :loading="ad.saving">保存</el-button>
      </template>
    </el-dialog>

    <FilePreviewDialog v-model="ad.preview.visible" :attachment="ad.preview.attachment" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, create, update, remove, batchRemove } from '../../../api/disclosureWorkflow'
import ApplicantAgentSelect from '../../../components/ApplicantAgentSelect.vue'
import SearchBar from '../../../components/SearchBar.vue'
import DisclosureAttachmentEditor from '../../../components/DisclosureAttachmentEditor.vue'
import DisclosureAttachmentLinks from '../../../components/DisclosureAttachmentLinks.vue'
import FilePreviewDialog from '../../../components/FilePreviewDialog.vue'
import { formatDate } from '../../../utils/format'
import { statusTag, emptyForm, hasPerm, mergeDisclosureAttachments } from './shared'

const ad = reactive({
  searchFields: [
    { key: 'disclosureName', label: '名称', type: 'input', matchType: 'fuzzy', width: 200 },
    { key: 'internalNo', label: '内部编号', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'applicant', label: '申请人', type: 'input', matchType: 'fuzzy', width: 180 },
    { key: 'inventor', label: '发明人', type: 'input', matchType: 'fuzzy', width: 180 },
    { key: 'sponsor', label: '主办人', type: 'input', matchType: 'fuzzy', width: 160 }
  ],
  query: {
    disclosureName: '',
    internalNo: '',
    applicant: '',
    inventor: '',
    sponsor: ''
  },
  page: { pageNum: 1, pageSize: 10, total: 0 },
  tableData: [],
  selected: [],
  loading: false,
  dialog: { visible: false, isEdit: false },
  preview: { visible: false, attachment: null },
  form: emptyForm(),
  disclosureDocument: null,
  otherAttachments: [],
  saving: false
})

const adFetchData = async () => {
  ad.loading = true
  try {
    const params = { pageNum: ad.page.pageNum, pageSize: ad.page.pageSize }
    const keyword = ad.query.internalNo
    Object.keys(ad.query).forEach(k => {
      if (ad.query[k] && k !== 'internalNo') params[k] = ad.query[k]
    })
    const res = await getList(params)
    if (res.code === 200) {
      let records = res.data.records || []
      if (keyword) records = records.filter(r => r.internalNo && r.internalNo.includes(keyword))
      ad.tableData = records
      ad.page.total = res.data.total || 0
    }
  } finally {
    ad.loading = false
  }
}

const adResetQuery = () => {
  Object.keys(ad.query).forEach(k => (ad.query[k] = ''))
  ad.page.pageNum = 1
  adFetchData()
}

const adOpenAdd = () => {
  Object.assign(ad.form, emptyForm())
  ad.disclosureDocument = null
  ad.otherAttachments = []
  ad.dialog.isEdit = false
  ad.dialog.visible = true
}

const adOpenPreview = (attachment) => {
  ad.preview.attachment = attachment
  ad.preview.visible = true
}

const adOpenEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(ad.form, res.data)
      ad.disclosureDocument = null
      ad.otherAttachments = []
      ad.dialog.isEdit = true
      ad.dialog.visible = true
    }
  } catch {
    /* handled */
  }
}

const adSave = async () => {
  if (!ad.form.disclosureName) {
    ElMessage.warning('请输入交底名称')
    return
  }
  if (!ad.form.patentType) {
    ElMessage.warning('请选择专利类型')
    return
  }
  if (!ad.dialog.isEdit && !ad.disclosureDocument) {
    ElMessage.warning('请选择一份 Word 格式的交底书')
    return
  }
  ad.saving = true
  try {
    const res = ad.dialog.isEdit
      ? await update({ ...ad.form })
      : await create({ ...ad.form }, ad.disclosureDocument, ad.otherAttachments)
    if (res.code === 200) {
      ElMessage.success(ad.dialog.isEdit ? '修改成功' : '新增成功')
      ad.dialog.visible = false
      adFetchData()
    }
  } finally {
    ad.saving = false
  }
}

const adDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该记录？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      adFetchData()
    }
  } catch {
    /* cancelled */
  }
}

const adBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ad.selected.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(ad.selected.map(r => r.id))
    if (res.code === 200) {
      ElMessage.success('批量删除成功')
      adFetchData()
    }
  } catch {
    /* cancelled */
  }
}

onMounted(() => adFetchData())
</script>

<style scoped>
.page {
  max-width: 1600px;
}
.search-form {
  margin-bottom: 10px;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
  display: flex;
}
</style>
