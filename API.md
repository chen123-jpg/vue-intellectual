以下是完整更新后的 **知识产权管理系统 API 文档** Markdown 源码，已包含新增的邮件模板接口（第八章）及对应权限更新。您可直接复制使用。

---

```markdown
# 知识产权管理系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:5050`
- **认证方式**: JWT Bearer Token（登录后获取，除公开接口外均需在 Header 中携带）
- **Token 有效期**: 24 小时

### 请求头

```
Authorization: Bearer <token>
Content-Type: application/json
```

### 统一响应格式 `Result<T>`

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码，200 成功，401 未登录，403 权限不足，500 服务端错误，600 参数错误，901 登录超时 |
| message | string | 提示信息 |
| data | any | 响应数据，可能为 null、对象、数组或字符串 |

---

## 一、账户接口 `/api/acount`

### 1.1 获取验证码

```
GET /api/acount/checkCode
```

> **公开接口**，无需认证

**请求参数** (Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldCheckCodeKey | string | 否 | 旧的验证码 Key，传入后会先清除旧验证码 |

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "checkCode": "data:image/png;base64,...",
    "checkCodeKey": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

| 字段 | 说明 |
|------|------|
| checkCode | Base64 格式的算术验证码图片，前端直接放入 `<img src="">` |
| checkCodeKey | 验证码唯一标识，登录/注册时需回传 |

---

### 1.2 用户注册

```
POST /api/acount/register
```

> **公开接口**

**请求体** (JSON)

```json
{
  "loginName": "zhangsan",
  "email": "zhangsan@example.com",
  "phoneNumber": "13800138000",
  "password": "123456",
  "checkCodeKey": "uuid-from-checkCode",
  "checkCode": "8"
}
```

| 字段 | 类型 | 必填 | 校验 |
|------|------|------|------|
| loginName | string | 是 | 3~30 位 |
| email | string | 是 | 合法邮箱格式 |
| phoneNumber | string | 是 | `1[3-9]` 开头 11 位 |
| password | string | 是 | 6~20 位 |
| checkCodeKey | string | 否 | 验证码 Key |
| checkCode | string | 是 | 用户输入的验证码结果 |

**响应** — 成功

```json
{ "code": 200, "message": "success", "data": "注册成功" }
```

**响应** — 失败

```json
{ "code": 500, "message": "账号已存在", "data": null }
```

> 可能失败原因：账号已存在、邮箱已被注册、验证码错误或过期

---

### 1.3 用户登录

```
POST /api/acount/login
```

> **公开接口**

**请求体** (JSON)

```json
{
  "loginName": "zhangsan",
  "password": "123456",
  "checkCodeKey": "uuid-from-checkCode",
  "checkCode": "8"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| loginName | string | 否 | 登录账号（与 phoneNumber 二选一） |
| phoneNumber | string | 否 | 手机号（与 loginName 二选一） |
| password | string | 是 | 密码 |
| checkCodeKey | string | 否 | 验证码 Key |
| checkCode | string | 是 | 验证码结果 |

**响应** — 成功

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": 1,
    "loginName": "zhangsan",
    "userName": "张三",
    "roles": ["admin"],
    "permissions": ["system:user:list", "patent:disclosure:list"],
    "email": "zhangsan@example.com"
  }
}
```

> 前端需将 `token` 存入 localStorage 并在后续请求 Header 中携带

---

### 1.4 退出登录

```
POST /api/acount/logout
```

> **需认证**

**请求体** — 无

**响应**

```json
{ "code": 200, "message": "退出成功", "data": null }
```

---

### 1.5 获取当前用户信息

```
GET /api/acount/me
```

> **需认证**

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "loginName": "zhangsan",
    "roles": ["admin"],
    "email": "123456@qq.com",
    "permissions": ["system:user:list", "patent:disclosure:list"]
  }
}
```

> 未登录返回 `code: 401, message: "未登录"`

---

### 1.6 保存邮箱授权码

```
POST /api/acount/authCode
```

> **需认证**

**请求参数** (Form / Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | long | 是 | 用户 ID |
| email | string | 是 | 邮箱地址 |
| authCode | string | 是 | 邮箱 SMTP 授权码 |

**响应**

```json
{ "code": 200, "message": "success", "data": null }
```

---

### 1.7 修改密码

```
POST /api/acount/password
```

> **需认证**

**请求参数** (Form / Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | long | 是 | 用户 ID |
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码 |

**响应**

```json
{ "code": 200, "message": "success", "data": null }
```

---

## 二、用户接口 `/api/user`

### 2.1 用户列表

```
GET /api/user/list
```

> 需权限：`system:user:list`

**响应**

```json
{
  "code": 200,
  "data": [
    {
      "userId": 1,
      "deptId": null,
      "loginName": "zhangsan",
      "userName": "张三",
      "userType": "01",
      "email": "zhangsan@example.com",
      "phoneNumber": "13800138000",
      "sex": "0",
      "avatar": null,
      "status": "0",
      "delFlag": "0",
      "loginIp": null,
      "loginDate": null,
      "createTime": "2026-07-21T10:00:00",
      "updateTime": "2026-07-21T10:00:00"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | long | 主键 |
| loginName | string | 登录账号 |
| userName | string | 用户昵称 |
| userType | string | 00 系统用户，01 注册用户 |
| email | string | 邮箱 |
| phoneNumber | string | 手机号 |
| sex | string | 0 男，1 女，2 未知 |
| status | string | 0 正常，1 停用 |
| delFlag | string | 0 正常，2 已删除 |

---

## 三、用户角色接口 `/sys-user-role`

### 3.1 用户角色列表

```
GET /sys-user-role/list
```

> 需权限：`system:userRole:list`
> 目前为占位接口，返回 `data: null`

---

## 四、文件接口

### 4.1 上传文件

```
POST /upload
```

> **需认证**
> Content-Type: `multipart/form-data`

**请求参数** (FormData)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 文件 |

**响应**

```json
{
  "code": 200,
  "data": "/files/a1b2c3d4.pdf?name=原始文件名.pdf"
}
```

> 返回值为可直接访问的文件 URL

---

### 4.2 查看/下载文件

```
GET /files/{fileId}
```

> **需认证**

**路径参数**

| 参数 | 说明 |
|------|------|
| fileId | 上传后返回的文件 ID（含扩展名，如 `a1b2c3d4.pdf`） |

**请求参数** (Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 原始文件名，用于设置下载响应头 |

**响应** — 文件二进制流，浏览器根据 Content-Type 决定预览或下载

---

## 五、邮件接口 `/api/mail`

### 5.1 发送邮件

```
POST /api/mail/sendMaill
```

> **需认证**
> Content-Type: `multipart/form-data`

**请求参数** (FormData)

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| to | string | 是 | — | 收件人邮箱 |
| subject | string | 是 | — | 邮件主题 |
| content | string | 是 | — | 邮件正文 |
| cc | string | 否 | — | 抄送邮箱 |
| isHtml | boolean | 否 | false | 正文是否为 HTML |
| files | file | 否 | — | 附件 |

**响应**

```json
{ "code": 200, "message": "success", "data": null }
```

---

### 5.2 模板邮件发送

```
POST /api/mail/sendMailWithTemplate
```

> **需认证**

**请求体** (JSON)

```json
{
  "to": "user@example.com",
  "cc": "cc@example.com",
  "subject": "邮件主题",
  "text": "正文（不使用模板时）",
  "templateCode": "WELCOME",
  "templateData": {
    "userName": "张三",
    "projectName": "某某专利"
  },
  "attachmentUrls": [
    "/files/a1b2c3d4.pdf?name=附件1.pdf"
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| to | string | 是 | 收件人，逗号/分号分隔多人 |
| cc | string | 否 | 抄送，逗号/分号分隔多人 |
| subject | string | 否 | 主题（模板优先时可为空） |
| text | string | 否 | 正文（模板优先时可为空） |
| templateCode | string | 否 | 模板编码，选用模板时传入 |
| templateData | map | 否 | 模板变量，用于 Thymeleaf 渲染 |
| attachmentUrls | string[] | 否 | 附件 URL 列表，来自上传接口返回的路径 |

---

## 六、T表 — 专利交底 `/api/ttable`

> 对应数据表：`patent_disclosure`

### 6.1 分页列表

```
GET /api/ttable/list
```

> 需权限：`patent:disclosure:list`

**请求参数** (Query)

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| disclosureName | string | 否 | — | 交底名称（模糊匹配） |
| patentType | string | 否 | — | 专利类型（精确匹配） |
| patentStatus | string | 否 | — | 专利状态（精确匹配） |
| internalNo | string | 否 | — | 内部编号（精确匹配） |
| applicant | string | 否 | — | 申请人（模糊匹配） |

**响应**

```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": 1,
        "tempNo": "T250101",
        "internalNo": "P2025101",
        "patentStatus": "受理",
        "requirement": "一周内提交",
        "disclosureName": "一种新型散热装置",
        "applicant": "某某公司",
        "inventor": "张三、李四",
        "patentType": "发明",
        "invitedToGroup": 1,
        "contactPerson": "张三",
        "manager": "王五",
        "agent": "某某代理所",
        "sponsor": "赵六",
        "sponsorUserId": 5,
        "disclosureDate": "2026-07-01",
        "disclosureDays": 30,
        "remark": "备注内容",
        "contactInfo": "QQ:123456",
        "contactEmail": "zhangsan@example.com",
        "contactPhone": "13800138000",
        "entryUserId": 1,
        "entryUserName": "admin",
        "copyFromId": null,
        "noGenerateMode": "AUTO",
        "finalizedAt": null,
        "pendingReportAt": null,
        "syncedToPatent": 0,
        "patentApplicationId": null,
        "createTime": "2026-07-23T16:00:00",
        "updateTime": "2026-07-23T16:00:00"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

### 6.2 全部列表（不分页）

```
GET /api/ttable/all
```

> 需权限：`patent:disclosure:list`

**响应** — `data` 为 `PatentDisclosure[]` 数组

### 6.3 详情

```
GET /api/ttable/{id}
```

> 需权限：`patent:disclosure:query`

**响应** — `data` 为 `PatentDisclosure` 对象；不存在返回 `code: 500, message: "交底记录不存在"`

### 6.4 新增

```
POST /api/ttable
```

> 需权限：`patent:disclosure:add`

**请求体** (JSON) — `PatentDisclosure` 对象

### 6.5 修改

```
PUT /api/ttable
```

> 需权限：`patent:disclosure:edit`

**请求体** (JSON) — `PatentDisclosure` 对象，`id` 字段必填，否则返回 `"ID不能为空"`

### 6.6 删除

```
DELETE /api/ttable/{id}
```

> 需权限：`patent:disclosure:delete`

### 6.7 批量删除

```
DELETE /api/ttable/batch
```

> 需权限：`patent:disclosure:delete`

**请求体** (JSON)

```json
[1, 2, 3]
```

---

## 七、P表 — 专利业务 `/api/ptable`

> P表包含 5 个子模块，每个模块结构与 T表完全一致：`list` / `all` / `{id}` / POST / PUT / `DELETE {id}` / `DELETE batch`
> 为简明起见，以下只列出各模块的 URL 前缀、权限前缀、实体字段及 list 筛选参数。"新增/修改" 请求体均为各实体对象的 JSON。

---

### 7.1 新申请 `patent_new_application`

| 项目 | 值 |
|------|-----|
| URL 前缀 | `/api/ptable/new-application` |
| 权限前缀 | `patent:newApplication` |

**分页筛选参数** (list)

| 参数 | 类型 | 匹配方式 |
|------|------|----------|
| patentName | string | 模糊 |
| applicationNo | string | 精确 |
| patentType | string | 精确 |
| applicant | string | 模糊 |

**实体字段** — `PatentNewApplication`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 主键 |
| internalNo | string | 内部编号 |
| patentName | string | 发明创造名称 |
| applicationNo | string | 申请号/专利号 |
| applicant | string | 申请人 |
| inventor | string | 发明人 |
| sponsor | string | 主办人 |
| agent | string | 委托书代理人 |
| applicationDate | date | 申请日 |
| notification | string | 通知书 |
| issueDate | date | 发文日 |
| preExamMark | string | 非正标-预审标 |
| paymentDeadline | date | 缴费止期 |
| feeAmount | decimal | 费用金额 |
| paymentDate | string | 缴费时间 |
| seqNo | int | 序号 |
| patentType | string | 类型（发明/实用新型/外观） |
| dasCode | string | DAS码 |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

### 7.2 补漏 `patent_supplementary`

| 项目 | 值 |
|------|-----|
| URL 前缀 | `/api/ptable/supplementary` |
| 权限前缀 | `patent:supplementary` |

**分页筛选参数** (list)

| 参数 | 类型 | 匹配方式 |
|------|------|----------|
| patentName | string | 模糊 |
| applicationNo | string | 精确 |
| applicant | string | 模糊 |

**实体字段** — `PatentSupplementary`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 主键 |
| seqNo | int | 序号 |
| applicationNo | string | 申请号/专利号 |
| patentName | string | 发明创造名称 |
| applicant | string | 申请人 |
| inventor | string | 发明人 |
| sponsor | string | 主办人 |
| agent | string | 委托书代理人 |
| applicationDate | date | 申请日 |
| notification | string | 通知书 |
| issueDate | date | 发文日 |
| feeReduction | string | 费减 |
| remark | string | 备注 |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

### 7.3 PCT `patent_pct`

| 项目 | 值 |
|------|-----|
| URL 前缀 | `/api/ptable/pct` |
| 权限前缀 | `patent:pct` |

**分页筛选参数** (list)

| 参数 | 类型 | 匹配方式 |
|------|------|----------|
| applicationName | string | 模糊 |
| applicationNo | string | 精确 |
| status | string | 精确 |
| applicant | string | 模糊 |

**实体字段** — `PatentPct`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 主键 |
| seqNo | int | 序号 |
| pctInternalNo | string | PCT 内部编号 |
| status | string | 状态 |
| issueDate | date | 发文日 |
| priorInternalNo | string | 在先内部编号 |
| priorApplicationNo | string | 在先申请号 |
| priorApplicationDate | date | 在先申请日 |
| pctApplicationDate | date | PCT 申请日 |
| applicationName | string | 申请名称 |
| applicationNo | string | 申请号（PCT 号） |
| applicant | string | 申请人 |
| inventor | string | 发明人 |
| sponsor | string | 主办人 |
| agent | string | 委托书代理人 |
| preliminaryConclusion | string | 初检结论 |
| remark | string | 备注 |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

### 7.4 中间著变 `patent_intermediate_change`

| 项目 | 值 |
|------|-----|
| URL 前缀 | `/api/ptable/intermediate-change` |
| 权限前缀 | `patent:intermediateChange` |

**分页筛选参数** (list)

| 参数 | 类型 | 匹配方式 |
|------|------|----------|
| patentName | string | 模糊 |
| applicationNo | string | 精确 |
| businessType | string | 精确 |
| status | string | 精确 |
| applicant | string | 模糊 |

**实体字段** — `PatentIntermediateChange`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 主键 |
| seqNo | int | 序号 |
| internalNo | string | 内部编号 |
| businessType | string | 业务类型（转让/转我所/著录变更） |
| applicationNo | string | 申请号 |
| patentName | string | 发明创造名称 |
| applicant | string | 申请人 |
| inventor | string | 发明人 |
| sponsor | string | 主办人 |
| agent | string | 委托书代理人 |
| applicationDate | date | 申请日 |
| status | string | 状态 |
| issueDate | date | 发文日 |
| feeReductionInfo | string | 非正标-费减情况 |
| submitDate | date | 提交日期 |
| paymentDeadline | date | 缴费止期 |
| feeAmount | decimal | 费用金额 |
| paymentStatus | string | 缴费状态 |
| remark1 | string | 备注1 |
| remark2 | string | 备注2 |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

### 7.5 复审无效 `patent_reexamination`

| 项目 | 值 |
|------|-----|
| URL 前缀 | `/api/ptable/reexamination` |
| 权限前缀 | `patent:reexamination` |

**分页筛选参数** (list)

| 参数 | 类型 | 匹配方式 |
|------|------|----------|
| patentName | string | 模糊 |
| applicationNo | string | 精确 |
| patentType | string | 精确 |
| category | string | 精确 |
| status | string | 精确 |

**实体字段** — `PatentReexamination`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 主键 |
| seqNo | int | 序号 |
| patentType | string | 类型（发明/实用新型/外观） |
| category | string | 分类（复审/无效） |
| caseNo | string | 案件编号 |
| internalNo | string | 内部编号 |
| applicationNo | string | 申请号 |
| patentName | string | 专利名称 |
| applicant | string | 申请人 |
| sponsor | string | 主办人 |
| agent | string | 委托书代理人 |
| notification | string | 通知书 |
| issueDate | date | 发文日 |
| submitDate | date | 提交日期 |
| queryInfo | string | 25.6.12 查询 |
| officialFee | decimal | 规费 |
| paymentDate | string | 缴费时间 |
| note1 | string | 附注1 |
| createTime | datetime | 创建时间 |
| updateTime | datetime | 更新时间 |

---

## 八、邮件模板接口 `/api/mail-template`

### 8.1 查询所有邮件模板

```
GET /api/mail-template
```

> **需认证**  
> 权限建议：`system:mailTemplate:list`（见附录 A）

**请求参数** — 无

**响应** — `Result<List<MailTemplate>>`

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "templateCode": "WELCOME",
      "templateName": "欢迎邮件",
      "subject": "欢迎加入 {userName}",
      "content": "<p>您好，{userName}，感谢注册...</p>",
      "defaultAttachTypes": "DISCLOSURE_DOC",
      "enabled": 1,
      "createTime": "2026-07-23T19:09:00",
      "updateTime": "2026-07-23T19:09:00"
    }
  ]
}
```

**实体字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| templateCode | String | 模板编码（唯一） |
| templateName | String | 模板名称 |
| subject | String | 主题模板（支持占位符，如 `{userName}`） |
| content | String | 正文模板（支持占位符） |
| defaultAttachTypes | String | 默认附带附件类型，逗号分隔（如 `DISCLOSURE_DOC`） |
| enabled | Integer | 是否启用：0-否，1-是 |
| createTime | DateTime | 创建时间 |
| updateTime | DateTime | 更新时间 |

> **与邮件发送接口联动**：`POST /api/mail/sendMailWithTemplate` 中的 `templateCode` 即对应本表中的编码，发送时自动加载模板并渲染 `templateData`。

---

## 附录 A：权限标识汇总

### 系统管理
```
system:user:list          — 用户列表
system:userRole:list      — 用户角色列表
system:mailTemplate:list  — 邮件模板列表      <-- 新增
```

### T表（专利交底）
```
patent:disclosure:list    — 列表
patent:disclosure:query   — 详情
patent:disclosure:add     — 新增
patent:disclosure:edit    — 修改
patent:disclosure:delete  — 删除
```

### P表（专利业务）
```
patent:newApplication:list|query|add|edit|delete      — 新申请
patent:supplementary:list|query|add|edit|delete        — 补漏
patent:pct:list|query|add|edit|delete                  — PCT
patent:intermediateChange:list|query|add|edit|delete   — 中间著变
patent:reexamination:list|query|add|edit|delete        — 复审无效
```

---

## 附录 B：通用响应码

| code | 含义 |
|------|------|
| 200 | 请求成功 |
| 401 | 未登录 |
| 403 | 权限不足 |
| 404 | 请求地址不存在 |
| 500 | 服务器错误 |
| 600 | 请求参数错误 |
| 601 | 信息已存在 |
| 901 | 登录超时 |
```