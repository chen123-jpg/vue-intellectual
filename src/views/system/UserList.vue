<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-button v-if="hasPerm('system:user:add')" type="primary" @click="openAdd">新增用户</el-button>
        <el-button v-if="hasPerm('system:user:import')" type="success" @click="openImport">导入用户</el-button>
        <el-button v-if="hasPerm('system:user:remove')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="loginName" label="登录账号" width="140" />
        <el-table-column prop="userName" label="用户名称" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="phoneNumber" label="手机号" width="140" />
        <el-table-column prop="sex" label="性别" width="70">
          <template #default="{ row }">{{ sexMap[row.sex] || '未知' }}</template>
        </el-table-column>
        <el-table-column prop="userType" label="用户类型" width="90">
          <template #default="{ row }">{{ row.userType === '00' ? '系统用户' : '注册用户' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('system:user:edit')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('system:user:remove')" size="small" type="danger" @click="handleDelete(row.userId)">删除</el-button>
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
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑用户' : '新增用户'" width="580px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="登录账号" required>
          <el-input v-model="form.loginName" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="用户名称">
          <el-input v-model="form.userName" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phoneNumber" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" placeholder="不填则默认为123456" show-password />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.sex" style="width:100%">
            <el-option label="男" value="0" />
            <el-option label="女" value="1" />
            <el-option label="未知" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色" style="width:100%">
            <el-option v-for="r in roleList" :key="r.roleId" :label="r.roleName" :value="r.roleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialog.visible" title="导入用户" width="480px" destroy-on-close>
      <el-upload
        ref="uploadRef"
        drag
        :http-request="customUpload"
        accept=".xlsx,.xls"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            模板格式：用户名(必填)、手机号、邮箱、角色<br />
            角色需与系统中已有角色名一致，默认密码123456
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { formatDateTime } from '../../utils/format'
import { getUserList, getById, create, update, remove, importUsers } from '../../api/user'
import { getAll as getAllRoles } from '../../api/role'
import { useUserStore } from '../../stores/user'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const sexMap = { '0': '男', '1': '女', '2': '未知' }

const tableData = ref([])
const selected = ref([])
const loading = ref(false)
const saving = ref(false)
const roleList = ref([])

const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const dialog = reactive({ visible: false, isEdit: false })
const importDialog = reactive({ visible: false })

const emptyForm = {
  userId: null, loginName: '', userName: '', email: '',
  phoneNumber: '', sex: '2', status: '0', password: '', roleIds: [], remark: ''
}
const form = reactive({ ...emptyForm })

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize }
    const res = await getUserList(params)
    if (res.code === 200) {
      if (Array.isArray(res.data)) {
        tableData.value = res.data
        page.total = res.data.length
      } else if (res.data) {
        tableData.value = res.data.records || []
        page.total = res.data.total || 0
      }
    }
  } finally { loading.value = false }
}

const openAdd = async () => {
  await ensureRoles()
  Object.assign(form, { ...emptyForm, roleIds: [] })
  dialog.isEdit = false
  dialog.visible = true
}

const openEdit = async (row) => {
  try {
    await ensureRoles()
    const res = await getById(row.userId)
    if (res.code === 200) {
      const d = res.data
      Object.assign(form, {
        userId: d.userId,
        loginName: d.loginName || '',
        userName: d.userName || '',
        email: d.email || '',
        phoneNumber: d.phoneNumber || '',
        sex: d.sex || '2',
        status: d.status || '0',
        password: '',
        roleIds: d.roleIds || [],
        remark: d.remark || ''
      })
      dialog.isEdit = true
      dialog.visible = true
    }
  } catch { /* handled */ }
}

const handleSave = async () => {
  saving.value = true
  try {
    const payload = { ...form }
    if (!payload.password) delete payload.password
    const res = dialog.isEdit ? await update(payload) : await create(payload)
    if (res.code === 200) {
      ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
      dialog.visible = false
      fetchData()
    }
  } finally { saving.value = false }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该用户？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const ids = selected.value.map(r => r.userId)
    for (const id of ids) { await remove(id) }
    ElMessage.success('批量删除成功')
    fetchData()
  } catch { /* cancelled */ }
}

const openImport = () => {
  importDialog.visible = true
}

const customUpload = async (options) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    const res = await importUsers(formData)
    if (res.code === 200) {
      ElMessage.success(typeof res.data === 'string' ? res.data : '导入完成')
      importDialog.visible = false
      fetchData()
    }
  } catch { /* handled */ }
}

const onSelectionChange = (sel) => { selected.value = sel }

const ensureRoles = async () => {
  if (roleList.value.length === 0) {
    const res = await getAllRoles()
    if (res.code === 200) roleList.value = res.data || []
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
.page { max-width: 1600px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
