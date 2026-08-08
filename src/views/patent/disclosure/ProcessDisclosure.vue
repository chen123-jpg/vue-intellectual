<template>
  <div class="process-page">
    <el-button class="back-btn" @click="$router.push('/patent/disclosure')" text>
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <div class="process-header">
      <div class="process-header__icon">
        <el-icon :size="26"><DocumentChecked /></el-icon>
      </div>
      <div class="process-header__text">
        <h2 class="process-header__title">处理交底：{{ form.disclosureName || '加载中...' }}</h2>
        <p class="process-header__subtitle">
          当前状态：<el-tag :type="statusTag(form.patentStatus)" size="small" effect="dark">{{ form.patentStatus || '-' }}</el-tag>
          <el-button class="edit-basic-btn" type="primary" plain size="small" @click="$router.push(`/patent/disclosure/add?id=${form.id}&returnTo=${encodeURIComponent('/patent/disclosure/process/'+form.id)}`)">
            <el-icon :size="14"><Edit /></el-icon> 编辑基本信息
          </el-button>
        </p>
      </div>
      <el-tag v-if="emailSent" type="success" size="default" style="margin-left:auto">邮件已发送</el-tag>
      <el-tag v-else type="warning" size="default" style="margin-left:auto">请先发送邮件</el-tag>
    </div>

    <el-card class="process-card">
      <el-alert v-if="!emailSent" type="warning" show-icon :closable="false" style="margin-bottom:12px">
        <template #title>请先发送邮件 — 发送成功后，状态变更、申请包、费用、开票功能才会解锁</template>
      </el-alert>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- 1. 发送邮件 -->
        <el-tab-pane label="发送邮件" name="email">
          <template v-if="!showPreview">
            <el-form label-width="110px" class="email-form">
              <el-form-item label="发送模式">
                <el-radio-group v-model="emailMode" @change="onEmailModeChange">
                  <el-radio-button value="normal">普通发送</el-radio-button>
                  <el-radio-button value="template">模板发送</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="emailMode === 'template'" label="选择模板">
                <el-select v-model="emailForm.templateCode" placeholder="选择邮件模板" clearable @change="onEmailTemplateSelect" style="width:100%">
                  <el-option v-for="tpl in enabledTemplates" :key="tpl.templateCode" :label="`${tpl.templateName} (${tpl.templateCode})`" :value="tpl.templateCode" />
                </el-select>
              </el-form-item>
              <template v-if="emailMode === 'template' && emailTemplateVars.length">
                <template v-for="v in emailTemplateVars" :key="v">
                  <el-form-item v-if="isImageVar(v)" :label="templateVarLabel(v)">
                    <template v-if="emailTemplateData[v]">
                      <div class="var-image-filled"><img :src="emailTemplateData[v]" class="var-image-thumb" /><el-button size="small" type="danger" text @click="emailTemplateData[v]=''">清除</el-button></div>
                    </template>
                    <span v-else class="var-image-waiting">上传图片后自动填入</span>
                  </el-form-item>
                  <el-form-item v-else :label="templateVarLabel(v)" required>
                    <el-input v-model="emailTemplateData[v]" :placeholder="`输入${templateVarLabel(v)}`" />
                  </el-form-item>
                </template>
              </template>
              <el-divider />
              <el-form-item label="收件人" required><el-input v-model="emailForm.to" placeholder="多个邮箱用逗号或分号分隔" /></el-form-item>
              <el-form-item label="抄送"><el-input v-model="emailForm.cc" placeholder="多个邮箱用逗号或分号分隔" /></el-form-item>
              <el-form-item v-if="emailMode !== 'template' || !emailSelectedTemplate" label="主题" required>
                <el-input v-model="emailForm.subject" />
              </el-form-item>
              <el-form-item v-else label="主题">
                <el-input v-model="emailForm.subject" />
              </el-form-item>
              <el-form-item v-if="emailMode !== 'template' || !emailSelectedTemplate" label="正文" required>
                <el-input v-model="emailForm.text" type="textarea" :rows="8" />
              </el-form-item>
              <el-form-item v-else label="正文">
                <el-input v-model="emailForm.text" type="textarea" :rows="10" />
              </el-form-item>
              <template v-if="emailMode === 'template' && emailTemplateVars.some(v => isImageVar(v))">
                <el-form-item label="插入图片">
                  <div class="image-upload-area">
                    <el-upload :show-file-list="false" :before-upload="beforeImageUpload" :http-request="uploadImage" accept="image/*" action="#"><el-button :loading="emailImageUploading" size="small">选择图片</el-button></el-upload>
                    <span class="upload-tip">上传后在模板正文中以 cid 或 URL 引用</span>
                  </div>
                  <div v-if="emailImageUrls.length" class="image-preview-list">
                    <div v-for="(url, idx) in emailImageUrls" :key="idx" class="image-preview-item">
                      <img :src="url" class="image-thumb" @click="copyImageUrl(url)" title="点击复制 URL" /><span class="image-url-text">{{ getImageName(url) }}</span>
                      <div class="image-url-actions"><el-button size="small" text @click="copyImageUrl(url)">复制URL</el-button><el-button size="small" type="danger" text @click="emailImageUrls.splice(idx, 1)">删除</el-button></div>
                    </div>
                  </div>
                </el-form-item>
              </template>
              <el-divider />
              <el-form-item label="附件">
                <el-upload :show-file-list="false" :http-request="uploadEmailAtt" action="#"><el-button :loading="emailUploading">添加附件</el-button></el-upload>
                <div v-if="emailAttachments.length" class="attach-items">
                  <div v-for="(a, idx) in emailAttachments" :key="idx" class="attach-row"><span>{{ a.name || a.url }}</span><el-button size="small" type="danger" :icon="Delete" circle @click="emailAttachments.splice(idx, 1)" /></div>
                </div>
              </el-form-item>
              <el-divider />
              <el-form-item>
                <el-button class="preview-btn" @click="goPreview">
                  <el-icon :size="16"><View /></el-icon> 预览邮件
                </el-button>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="sendEmail" :loading="emailSending" size="large" style="width:140px">{{ emailSending ? '发送中...' : '发送邮件' }}</el-button>
              </el-form-item>
            </el-form>
          </template>
          <template v-else>
            <div class="preview-toolbar">
              <el-button @click="showPreview = false"><el-icon :size="14"><Edit /></el-icon> 返回编辑</el-button>
            </div>
            <div class="preview-box">
              <div class="preview-meta">
                <div><strong>收件人：</strong>{{ emailForm.to || '-' }}</div>
                <div><strong>抄送：</strong>{{ emailForm.cc || '-' }}</div>
                <div><strong>主题：</strong>{{ emailMode === 'template' ? renderedSubject : emailForm.subject || '-' }}</div>
                <div v-if="emailAttachments.length"><strong>附件：</strong>{{ emailAttachments.map(a=>a.name||a.url).join('、') }}</div>
              </div>
              <el-divider />
              <div class="content-preview" v-html="emailMode === 'template' ? renderedContent : (emailForm.text || '').replace(/\n/g,'<br>')"></div>
            </div>
            <div style="margin-top:16px;text-align:right">
              <el-button type="primary" @click="sendEmail" :loading="emailSending" size="large" style="width:140px">{{ emailSending ? '发送中...' : '发送邮件' }}</el-button>
            </div>
          </template>
        </el-tab-pane>

        <!-- 2-5 状态变更/申请包/费用/开票 需先发邮件 -->
        <el-tab-pane label="状态变更" name="status">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再进行状态变更操作</span>
          </div>
          <template v-else>
          <el-form label-width="100px">
            <el-form-item label="当前状态"><el-tag :type="statusTag(form.patentStatus)" effect="dark">{{ form.patentStatus || '无' }}</el-tag></el-form-item>
            <el-form-item label="变更为" required>
              <el-select v-model="statusForm.toStatus" placeholder="选择新状态" style="width:220px">
                <el-option label="草稿" value="草稿" /><el-option label="受理" value="受理" /><el-option label="审核中" value="审核中" /><el-option label="定稿" value="定稿" /><el-option label="驳回" value="驳回" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注"><el-input v-model="statusForm.remark" type="textarea" :rows="3" placeholder="变更原因" /></el-form-item>
            <el-form-item><el-button type="primary" @click="changeStatusFn" :loading="statusSaving">确认变更</el-button></el-form-item>
          </el-form>
          <el-divider /><h4 style="margin-bottom:8px">状态变更记录</h4>
          <el-table :data="statusLogs" border stripe size="small">
            <el-table-column prop="fromStatus" label="原状态" width="120" />
            <el-table-column prop="toStatus" label="新状态" width="120" />
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="时间" width="160"><template #default="{ row }">{{ formatDateTime(row.createTime) }}</template></el-table-column>
          </el-table>
          </template>
        </el-tab-pane>

        <el-tab-pane label="申请包" name="packages">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再进行申请包操作</span>
          </div>
          <ApplicationPackageComposer v-else :disclosure="form" />
        </el-tab-pane>

        <el-tab-pane label="费用" name="fees">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再查看费用信息</span>
          </div>
          <template v-else>
          <el-table :data="fees" border stripe>
            <el-table-column prop="feeType" label="费用类型" width="120" />
            <el-table-column prop="feeAmount" label="金额" width="120" />
            <el-table-column prop="paymentStatus" label="缴费状态" width="100"><template #default="{ row }"><el-tag :type="row.paymentStatus==='PAID'?'success':row.paymentStatus==='VOID'?'danger':'warning'" size="small">{{ {PENDING:'待缴',PAID:'已缴',PARTIAL:'部分',VOID:'作废'}[row.paymentStatus]||row.paymentStatus }}</el-tag></template></el-table-column>
            <el-table-column prop="payer" label="付款方" width="140" />
            <el-table-column label="缴费止期" width="110"><template #default="{ row }">{{ formatDate(row.paymentDeadline) }}</template></el-table-column>
            <el-table-column label="实缴日期" width="110"><template #default="{ row }">{{ formatDate(row.paymentDate) }}</template></el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          </el-table>
          </template>
        </el-tab-pane>

        <el-tab-pane label="开票" name="invoices">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再查看开票信息</span>
          </div>
          <template v-else>
          <el-table :data="invoices" border stripe>
            <el-table-column prop="invoiceType" label="发票类型" width="100" />
            <el-table-column prop="invoiceTitle" label="发票抬头" min-width="160" />
            <el-table-column prop="taxNo" label="税号" width="150" />
            <el-table-column prop="invoiceAmount" label="开票金额" width="120" />
            <el-table-column prop="invoiceStatus" label="状态" width="100"><template #default="{ row }"><el-tag :type="row.invoiceStatus==='ISSUED'?'success':row.invoiceStatus==='VOID'?'danger':'warning'" size="small">{{ {PENDING:'待开',ISSUED:'已开',VOID:'作废'}[row.invoiceStatus]||row.invoiceStatus }}</el-tag></template></el-table-column>
            <el-table-column prop="invoiceNo" label="发票号码" width="140" />
            <el-table-column label="开票日期" width="110"><template #default="{ row }">{{ formatDate(row.invoiceDate) }}</template></el-table-column>
          </el-table>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, DocumentChecked, Edit, Delete, Lock, View } from '@element-plus/icons-vue'
import { getById, changeStatus, getStatusLogs, getFees, getInvoices, getTemplateList, sendMail, sendMailWithTemplate, uploadFile } from '../../../api/disclosureWorkflow'
import ApplicationPackageComposer from '../../../components/ApplicationPackageComposer.vue'
import { formatDate, formatDateTime } from '../../../utils/format'
import { autoFillTemplateVars, templateVarLabel, renderTemplate } from '../../../utils/templateHelper'
import { useUserStore } from '../../../stores/user'
import { statusTag } from './shared'

const route = useRoute()
const { state: userState } = useUserStore()
const disclosureId = route.params.id
const activeTab = ref('email')
const showPreview = ref(false)
const emailSent = ref(false)
const form = ref({})
const statusForm = reactive({ toStatus: '', remark: '' })
const statusSaving = ref(false)
const statusLogs = ref([])
const fees = ref([])
const invoices = ref([])
const emailMode = ref('normal')
const emailForm = reactive({ to: '', cc: '', subject: '', text: '', templateCode: '' })
const emailTemplateVars = ref([])
const emailTemplateData = ref({})
const emailSelectedTemplate = ref(null)
const emailAttachments = ref([])
const emailImageUrls = ref([])
const emailSending = ref(false)
const emailUploading = ref(false)
const emailImageUploading = ref(false)
const templateList = ref([])
const enabledTemplates = computed(() => templateList.value.filter(t => t.enabled === 1))
const renderedSubject = computed(() => emailSelectedTemplate.value ? renderTemplate(emailSelectedTemplate.value.subject, emailTemplateData.value) : '')
const renderedContent = computed(() => emailSelectedTemplate.value ? renderTemplate(emailSelectedTemplate.value.content, emailTemplateData.value) : '')

const loadData = async () => {
  try { const r = await getById(disclosureId); if (r.code===200) { form.value=r.data; const e=userState.userInfo?.email||''; emailForm.to=r.data.contactEmail||''; emailForm.cc=e; emailForm.subject=`关于专利交底"${r.data.disclosureName}"的通知` } } catch { ElMessage.error('加载失败') }
}
const loadTemplates = async () => { try { const r = await getTemplateList(); if (r.code===200) templateList.value=r.data||[] } catch { templateList.value=[] } }
const onTabChange = tab => { if (tab==='status'&&emailSent.value) fetchStatusLogs(); else if (tab==='fees'&&emailSent.value) fetchFees(); else if (tab==='invoices'&&emailSent.value) fetchInvoices() }
const fetchStatusLogs = async () => { try { const r=await getStatusLogs(form.value.id); if(r.code===200) statusLogs.value=r.data||[] } catch { statusLogs.value=[] } }
const fetchFees = async () => { try { const r=await getFees(form.value.id); if(r.code===200) fees.value=r.data||[] } catch { fees.value=[] } }
const fetchInvoices = async () => { try { const r=await getInvoices(form.value.id); if(r.code===200) invoices.value=r.data||[] } catch { invoices.value=[] } }
const changeStatusFn = async () => { if(!statusForm.toStatus){ElMessage.warning('请选择新状态');return};statusSaving.value=true;try{const r=await changeStatus(form.value.id,{toStatus:statusForm.toStatus,remark:statusForm.remark});if(r.code===200){ElMessage.success('状态变更成功');form.value.patentStatus=statusForm.toStatus;statusForm.toStatus='';statusForm.remark='';fetchStatusLogs()}}finally{statusSaving.value=false} }

const parseVars = t => [...new Set((t.match(/\$\{(\w+)\}/g)||[]).map(m=>m.slice(2,-1)))]
const onEmailTemplateSelect = code => { Object.keys(emailTemplateData.value).forEach(k=>delete emailTemplateData.value[k]); emailForm.text=''; if(!code){emailSelectedTemplate.value=null;emailTemplateVars.value=[];return};const tpl=templateList.value.find(t=>t.templateCode===code);if(tpl){emailSelectedTemplate.value=tpl;const v=[...new Set([...parseVars(tpl.subject||''),...parseVars(tpl.content||'')])];emailTemplateVars.value=v;Object.assign(emailTemplateData.value,autoFillTemplateVars(v,{disclosure:form.value,user:userState.userInfo||{}}));emailForm.subject=stripHtml(renderTemplate(tpl.subject,emailTemplateData.value));emailForm.text=stripHtml(renderTemplate(tpl.content,emailTemplateData.value))} }
const onEmailModeChange = () => { emailForm.subject='';emailForm.text='';emailForm.templateCode='';Object.keys(emailTemplateData.value).forEach(k=>delete emailTemplateData.value[k]);emailSelectedTemplate.value=null;emailTemplateVars.value=[] }
const isImageVar = n => /image|logo|pic|img|photo|banner|icon|avatar|qr/i.test(n)
const getImageName = u => { const m=(u||'').match(/[?&]name=([^&]+)/); return m?decodeURIComponent(m[1]):(u||'').split('/').pop()||'image' }
const copyImageUrl = async u => { try{await navigator.clipboard.writeText(u);ElMessage.success('已复制')}catch{ElMessage.warning('复制失败')} }
const uploadEmailAtt = async o => { const{f,onSuccess,onError}=o;emailUploading.value=true;try{const r=await uploadFile(f);if(r.code===200){emailAttachments.value.push({name:f.name,url:r.data});ElMessage.success('上传成功');onSuccess(r)}else onError(new Error(r.message))}catch(e){onError(e)}finally{emailUploading.value=false} }
const beforeImageUpload = f => { if(!f.type.startsWith('image/')){ElMessage.warning('仅支持图片');return false};if(f.size>5*1024*1024){ElMessage.warning('≤5MB');return false};return true }
const uploadImage = async o => { const{f,onSuccess,onError}=o;emailImageUploading.value=true;try{const r=await uploadFile(f);if(r.code===200){emailImageUrls.value.push(r.data);ElMessage.success('上传成功');const v=emailTemplateVars.value.find(v=>isImageVar(v));if(v)emailTemplateData.value[v]=r.data;onSuccess(r)}else onError(new Error(r.message||'失败'))}catch(e){onError(e)}finally{emailImageUploading.value=false} }

const goPreview = () => { showPreview.value = true }
const sendEmail = async () => {
  if(!emailForm.to.trim()){ElMessage.warning('请输入收件人');return}
  if(emailMode.value==='normal'){if(!emailForm.subject.trim()||!emailForm.text.trim()){ElMessage.warning('主题和正文不能为空');return}}
  else{if(!emailForm.templateCode){ElMessage.warning('请选择邮件模板');return};const ev=emailTemplateVars.value.find(v=>!emailTemplateData.value[v]?.trim());if(ev){ElMessage.warning(`请填写：${ev}`);return}}
  emailSending.value=true;try{const a=[...emailAttachments.value.map(x=>x.url),...emailImageUrls.value];let r;if(emailMode.value==='normal'){r=await sendMail({disclosureId:form.value.id,to:emailForm.to.trim(),subject:emailForm.subject.trim(),text:emailForm.text.trim(),cc:emailForm.cc.trim()||undefined,attachmentUrls:a})}else{r=await sendMailWithTemplate({disclosureId:form.value.id,to:emailForm.to.trim(),cc:emailForm.cc.trim()||undefined,subject:emailForm.subject||renderedSubject.value,templateCode:emailForm.templateCode,templateData:{...emailTemplateData.value},attachmentUrls:a})}
  if(r.code===200){ElMessage.success('发送成功');emailSent.value=true;activeTab.value='status';fetchStatusLogs()}}finally{emailSending.value=false}
}

const stripHtml = (h) => { const d=document.createElement('div'); d.innerHTML=h; return d.textContent||d.innerText||'' }

watch(emailTemplateData, () => {
  if (emailSelectedTemplate.value && emailMode.value === 'template') {
    emailForm.subject = stripHtml(renderTemplate(emailSelectedTemplate.value.subject, emailTemplateData.value))
    emailForm.text = stripHtml(renderTemplate(emailSelectedTemplate.value.content, emailTemplateData.value))
  }
}, { deep: true })

onMounted(() => { loadData(); loadTemplates() })
</script>

<style scoped>
.process-page{max-width:1200px}
.back-btn{margin-bottom:10px;color:#5f6b7a;padding-left:0;font-weight:500}
.back-btn:hover{color:#1e88e5}
.process-header{display:flex;align-items:center;gap:14px;padding:14px 20px;margin-bottom:16px;background:linear-gradient(135deg,#e8f0fe,#eef5ff 50%,#f5f7fa);border-radius:10px;border:1px solid #d6e4ff}
.process-header__icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1565c0,#1e88e5);border-radius:10px;color:#fff;box-shadow:0 3px 10px rgba(22,119,255,.3);flex-shrink:0}
.process-header__title{margin:0;font-size:18px;font-weight:700;color:#1a1a2e}
.process-header__subtitle{margin:2px 0 0;font-size:13px;color:#5f6b7a;display:flex;align-items:center;gap:8px}
.edit-basic-btn{margin-left:16px;font-weight:600}
.preview-btn{border:2px dashed #bbdefb;color:#1e88e5;font-weight:600;padding:8px 20px}
.preview-btn:hover{border-color:#1e88e5;background:#e8f0fe}
:deep(.el-radio-button__inner:hover){color:#1e88e5}
:deep(.el-radio-button.is-active .el-radio-button__inner){background:#1e88e5!important;border-color:#1e88e5!important;box-shadow:-1px 0 0 0 #1e88e5!important}
.locked-hint{display:flex;align-items:center;gap:10px;padding:32px 20px;color:#e65100;font-size:14px;font-weight:600}
.process-card{margin-bottom:20px}
.content-preview{background:#f5f7fa;padding:16px;border-radius:6px;min-height:150px;max-height:360px;overflow-y:auto;font-size:14px;line-height:1.8;border:1px solid #e4e7ed}
.attach-items{margin-top:8px}
.attach-row{display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid #f0f0f0}
.attach-row:last-child{border-bottom:none}
.image-upload-area{display:flex;align-items:center;gap:12px}
.image-preview-list{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.image-preview-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px;border:1px solid #e4e7ed;border-radius:4px;background:#fafafa}
.image-thumb{width:100px;height:80px;object-fit:cover;border-radius:2px;cursor:pointer}
.image-thumb:hover{opacity:.8}
.image-url-text{font-size:12px;color:#606266;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.image-url-actions{display:flex;gap:4px}
.var-image-filled{display:flex;align-items:center;gap:10px}
.var-image-thumb{width:60px;height:60px;object-fit:cover;border:1px solid #e4e7ed;border-radius:4px}
.var-image-waiting{color:#909399;font-size:13px}
.upload-tip{font-size:12px;color:#909399}
:deep(.email-form .el-form-item__label){white-space:nowrap}
.preview-toolbar{margin-bottom:12px}
.preview-box{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:24px}
.preview-meta{display:flex;flex-direction:column;gap:8px;font-size:14px;color:#37474f}
</style>
