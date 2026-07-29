<template>
  <div class="page">
    <el-card>
      <SearchBar
        v-model="po.query"
        :fields="po.searchFields"
        :loading="po.loading"
        :collapsed-threshold="4"
        @search="poFetchData"
        @reset="poResetQuery"
      />

      <div class="toolbar">
        <span class="view-hint">待审核交底列表（状态：定稿 / 定稿待报，共 {{ po.page.total }} 条）</span>
      </div>

      <el-table :data="po.tableData" v-loading="po.loading" border stripe>
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column prop="disclosureName" label="交底名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="专利状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.patentStatus)" size="small" effect="dark">{{ row.patentStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="130" />
        <el-table-column prop="sponsor" label="主办人" width="100" />
        <el-table-column label="同步" width="70">
          <template #default="{ row }">
            <el-tag :type="row.syncedToPatent===1?'success':'info'" size="small">{{ row.syncedToPatent===1?'已同步':'未' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="poOpenReview(row)">审核</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="po.page.pageNum"
        v-model:page-size="po.page.pageSize"
        :total="po.page.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="poFetchData"
        @current-change="poFetchData"
        class="pagination"
      />
    </el-card>

    <!-- 审核弹窗 -->
    <el-dialog
      v-model="po.dialog.visible"
      :title="'审核交底：' + po.form.disclosureName"
      width="900px"
      destroy-on-close
      top="5vh"
    >
      <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
        <el-descriptions-item label="内部编号">{{ po.form.internalNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="专利类型">{{ po.form.patentType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ po.form.applicant || '-' }}</el-descriptions-item>
        <el-descriptions-item label="主办人">{{ po.form.sponsor || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="statusTag(po.form.patentStatus)" effect="dark" size="small">{{ po.form.patentStatus || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ po.form.contactPerson || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">申请包文件</el-divider>
      <div v-if="po.packages.length === 0" class="empty-hint" style="margin-bottom:16px">暂无申请包</div>
      <template v-else>
        <div style="margin-bottom:10px;display:flex;align-items:center;gap:12px">
          <span style="font-size:13px;color:#606266">申请包状态：</span>
          <el-tag :type="po.batchStatus==='APPROVED'?'success':po.batchStatus==='REVIEWING'?'primary':po.batchStatus==='PENDING_RECEIVE'?'warning':'info'" size="small">
            {{ po.batchStatus || '未知' }}
          </el-tag>
          <el-button
            v-if="po.batchStatus === 'REVIEWING'"
            size="small"
            type="success"
            @click="poConfirmPkg"
          >
            审核通过
          </el-button>
        </div>
        <el-table :data="po.packages" border stripe size="small" style="margin-bottom:16px">
          <el-table-column label="文件类型" width="140">
            <template #default="{ row }">
              <el-tag size="small">{{ row.documentLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
          <el-table-column prop="versionNo" label="版本" width="70" />
          <el-table-column prop="uploadUserName" label="上传人" width="100" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="poDownloadFile(row.fileToken)">下载查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <el-divider content-position="left">状态操作</el-divider>
      <el-form inline>
        <el-form-item label="当前状态">
          <el-tag :type="statusTag(po.form.patentStatus)" effect="dark">{{ po.form.patentStatus || '无' }}</el-tag>
        </el-form-item>
        <el-form-item v-if="po.form.patentStatus === '定稿'" label="操作">
          <el-button type="primary" @click="poSetStatus('定稿待报')" :loading="po.statusSaving">
            设为定稿待报（提交国知局）
          </el-button>
        </el-form-item>
        <el-form-item v-else-if="po.form.patentStatus === '定稿待报'" label="">
          <el-tag type="success">已提交至国知局系统</el-tag>
        </el-form-item>
        <el-form-item v-else label="提示">
          <span class="upload-hint">当前状态为"{{ po.form.patentStatus }}"，需主办人先设为"定稿"状态</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="po.dialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, changeStatus, getPackages, confirmPackage } from '../../../api/disclosureWorkflow'
import { createDownloadTicket } from '../../../api/applicationPackage'
import SearchBar from '../../../components/SearchBar.vue'
import { statusTag } from './shared'

const po = reactive({
  searchFields: [
    { key: 'disclosureName', label: '名称', type: 'input', matchType: 'fuzzy', width: 200 },
    { key: 'internalNo', label: '内部编号', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'applicant', label: '申请人', type: 'input', matchType: 'fuzzy', width: 180 },
    { key: 'inventor', label: '发明人', type: 'input', matchType: 'fuzzy', width: 180 },
    { key: 'sponsor', label: '主办人', type: 'input', matchType: 'fuzzy', width: 160 }
  ],
  query: { disclosureName: '', internalNo: '', applicant: '', inventor: '', sponsor: '' },
  page: { pageNum: 1, pageSize: 10, total: 0 },
  tableData: [],
  loading: false,
  dialog: { visible: false },
  form: {},
  packages: [],
  batchToken: null,
  batchStatus: null,
  statusSaving: false
})

const poFetchData = async () => {
  po.loading = true
  try {
    const params = { pageNum: po.page.pageNum, pageSize: po.page.pageSize, patentStatus: '定稿' }
    const keyword = po.query.internalNo
    Object.keys(po.query).forEach(k => {
      const v = po.query[k]
      if (v !== '' && v !== null && v !== undefined && k !== 'internalNo') params[k] = v
    })
    const res = await getList(params)
    if (res.code === 200) {
      let records = res.data.records || []
      if (keyword) records = records.filter(r => r.internalNo && r.internalNo.includes(keyword))
      po.tableData = records
      po.page.total = res.data.total || 0
    }
  } finally {
    po.loading = false
  }
}

const poResetQuery = () => {
  Object.keys(po.query).forEach(k => (po.query[k] = ''))
  po.page.pageNum = 1
  poFetchData()
}

const poOpenReview = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(po.form, res.data)
      po.dialog.visible = true
      po.packages = []
      poFetchPkg()
    }
  } catch {
    /* handled */
  }
}

const poFetchPkg = async () => {
  try {
    const res = await getPackages(po.form.id)
    if (res.code === 200) {
      const batch = res.data
      po.batchToken = batch.packageToken
      po.batchStatus = batch.status
      const labelMap = { XML: 'XML申请包', REQUEST: '请求书', DESCRIPTION: '说明书', CLAIMS: '权利要求书', ABSTRACT: '摘要', ABSTRACT_DRAWING: '摘要附图' }
      po.packages = (batch.currentFiles || []).map(f => ({
        fileToken: f.fileToken,
        documentCode: f.documentCode,
        documentLabel: labelMap[f.documentCode] || f.documentCode,
        fileName: f.fileName,
        versionNo: f.versionNo,
        uploadUserName: f.uploadUserName || '-',
        fileSize: f.fileSize
      }))
    }
  } catch {
    po.packages = []
  }
}

const poConfirmPkg = async () => {
  try {
    await ElMessageBox.confirm('确认审核通过该申请包？通过后将锁定文件并可提交至国知局。', '确认', { type: 'warning' })
    const res = await confirmPackage(po.batchToken)
    if (res.code === 200) {
      ElMessage.success('审核通过')
      po.batchStatus = 'APPROVED'
      poFetchPkg()
    }
  } catch {
    /* cancelled */
  }
}

const poDownloadFile = async (fileToken) => {
  try {
    const res = await createDownloadTicket(fileToken)
    if (res.code === 200) {
      window.open(`/api/application-package/download/${res.data}`, '_blank')
    }
  } catch {
    ElMessage.error('文件下载失败')
  }
}

const poSetStatus = async (toStatus) => {
  po.statusSaving = true
  try {
    const res = await changeStatus(po.form.id, {
      toStatus,
      remark: '流程人员确认，提交至国知局系统'
    })
    if (res.code === 200) {
      ElMessage.success('已设为定稿待报，同步至专利申请表')
      po.form.patentStatus = toStatus
      poFetchData()
    }
  } finally {
    po.statusSaving = false
  }
}

onMounted(() => poFetchData())
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
.view-hint {
  color: #909399;
  font-size: 13px;
}
.empty-hint {
  color: #909399;
  font-size: 13px;
  padding: 12px 0;
}
.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}
</style>
