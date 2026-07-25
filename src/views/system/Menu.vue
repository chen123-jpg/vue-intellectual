<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="菜单名称">
          <el-input v-model="query.menuName" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="菜单类型">
          <el-select v-model="query.menuType" placeholder="全部" clearable>
            <el-option label="目录" value="M" />
            <el-option label="菜单" value="C" />
            <el-option label="按钮" value="F" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.visible" placeholder="全部" clearable>
            <el-option label="显示" value="0" />
            <el-option label="隐藏" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button v-if="hasPerm('system:menu:add')" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="hasPerm('system:menu:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="menuId" label="菜单ID" width="80" />
        <el-table-column prop="menuName" label="菜单名称" width="160" />
        <el-table-column prop="parentId" label="父ID" width="70" />
        <el-table-column prop="orderNum" label="排序" width="60" />
        <el-table-column prop="menuType" label="类型" width="70">
          <template #default="{ row }">
            <el-tag :type="row.menuType === 'M' ? '' : row.menuType === 'C' ? 'success' : 'warning'" size="small">
              {{ typeMap[row.menuType] || row.menuType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="路由地址" width="180" show-overflow-tooltip />
        <el-table-column prop="perms" label="权限标识" width="200" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="80" />
        <el-table-column prop="visible" label="可见" width="70">
          <template #default="{ row }">{{ row.visible === '0' ? '显示' : '隐藏' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('system:menu:edit')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('system:menu:delete')" size="small" type="danger" @click="handleDelete(row.menuId)">删除</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑菜单' : '新增菜单'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单名称" required>
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父菜单ID">
              <el-input-number v-model="form.parentId" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单类型">
              <el-select v-model="form.menuType" style="width:100%">
                <el-option label="目录" value="M" />
                <el-option label="菜单" value="C" />
                <el-option label="按钮" value="F" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.orderNum" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="路由地址">
              <el-input v-model="form.url" placeholder="请输入路由地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="打开方式">
              <el-input v-model="form.target" placeholder="menuItem / menuBlank" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限标识">
              <el-input v-model="form.perms" placeholder="如 system:menu:list" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标">
              <el-input v-model="form.icon" placeholder="Element Plus 图标名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否可见">
              <el-radio-group v-model="form.visible">
                <el-radio value="0">显示</el-radio>
                <el-radio value="1">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否刷新">
              <el-radio-group v-model="form.isRefresh">
                <el-radio value="1">是</el-radio>
                <el-radio value="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, create, update, remove, batchRemove } from '../../api/menu'
import { useUserStore } from '../../stores/user'

const { state, bumpMenuVersion } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const typeMap = { M: '目录', C: '菜单', F: '按钮' }

const tableData = ref([])
const selected = ref([])
const loading = ref(false)
const saving = ref(false)

const query = reactive({ menuName: '', menuType: '', visible: '' })
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const dialog = reactive({ visible: false, isEdit: false })
const form = reactive({
  menuId: null, menuName: '', parentId: 0, orderNum: 0,
  url: '', target: '', menuType: 'C', visible: '0', isRefresh: '1',
  perms: '', icon: '', remark: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize, ...query }
    Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k] })
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
  Object.assign(form, {
    menuId: null, menuName: '', parentId: 0, orderNum: 0,
    url: '', target: '', menuType: 'C', visible: '0', isRefresh: '1',
    perms: '', icon: '', remark: ''
  })
  dialog.isEdit = false
  dialog.visible = true
}

const openEdit = async (row) => {
  try {
    const res = await getById(row.menuId)
    if (res.code === 200) {
      Object.assign(form, res.data)
      dialog.isEdit = true
      dialog.visible = true
    }
  } catch { /* handled */ }
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = dialog.isEdit ? await update({ ...form }) : await create({ ...form })
    if (res.code === 200) {
      ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
      dialog.visible = false
      bumpMenuVersion()
      fetchData()
    }
  } finally { saving.value = false }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该菜单？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); bumpMenuVersion(); fetchData() }
  } catch { /* cancelled */ }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(selected.value.map(r => r.menuId))
    if (res.code === 200) { ElMessage.success('批量删除成功'); bumpMenuVersion(); fetchData() }
  } catch { /* cancelled */ }
}

const onSelectionChange = (sel) => { selected.value = sel }

onMounted(() => fetchData())
</script>

<style scoped>
.page { max-width: 1600px; }
.search-form { margin-bottom: 10px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
