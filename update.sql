-- ============================================================
-- 知识产权管理系统 - 菜单路径补全 & 角色权限分配 UPDATE SQL
-- 生成时间: 2026-07-25
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 一、更新菜单图标 (icon 字段)
-- 前端使用 Element Plus 图标组件名称
-- ============================================================
UPDATE sys_menu SET icon = 'Setting'        WHERE menu_id = 1;
UPDATE sys_menu SET icon = 'Document'       WHERE menu_id = 2;
UPDATE sys_menu SET icon = 'FolderOpened'   WHERE menu_id = 3;
UPDATE sys_menu SET icon = 'User'           WHERE menu_id = 11;
UPDATE sys_menu SET icon = 'Avatar'         WHERE menu_id = 12;
UPDATE sys_menu SET icon = 'DocumentChecked' WHERE menu_id = 21;
UPDATE sys_menu SET icon = 'DocumentAdd'    WHERE menu_id = 31;
UPDATE sys_menu SET icon = 'CirclePlus'     WHERE menu_id = 32;
UPDATE sys_menu SET icon = 'Link'           WHERE menu_id = 33;
UPDATE sys_menu SET icon = 'Edit'           WHERE menu_id = 34;
UPDATE sys_menu SET icon = 'Warning'        WHERE menu_id = 35;
-- 按钮类型(F)保持 '#' 即可，不在菜单中显示

-- ============================================================
-- 二、补全菜单路径 (url 字段) — 大部分已正确，此处确保一致性
-- ============================================================
UPDATE sys_menu SET url = '#'                         WHERE menu_id IN (1, 2, 3);
UPDATE sys_menu SET url = '/system/user'              WHERE menu_id = 11;
UPDATE sys_menu SET url = '/system/user-role'         WHERE menu_id = 12;
UPDATE sys_menu SET url = '/patent/disclosure'        WHERE menu_id = 21;
UPDATE sys_menu SET url = '/patent/new-application'   WHERE menu_id = 31;
UPDATE sys_menu SET url = '/patent/supplementary'     WHERE menu_id = 32;
UPDATE sys_menu SET url = '/patent/pct'               WHERE menu_id = 33;
UPDATE sys_menu SET url = '/patent/intermediate-change' WHERE menu_id = 34;
UPDATE sys_menu SET url = '/patent/reexamination'     WHERE menu_id = 35;
-- 按钮(F) url 保持 '#'

-- ============================================================
-- 三、清空并重建角色-菜单关联
-- ============================================================
DELETE FROM sys_role_menu;

-- ----------------------------------------------------------
-- 角色1: 超级管理员 (admin) — 全部菜单 + 全部按钮权限
-- ----------------------------------------------------------
-- 目录: 系统管理、专利交底管理、专利业务管理
INSERT INTO sys_role_menu VALUES (1, 1), (1, 2), (1, 3);
-- 系统管理 > 用户管理、用户角色管理
INSERT INTO sys_role_menu VALUES (1, 11), (1, 12);
-- 专利交底管理 > 专利交底 + 全部CRUD按钮
INSERT INTO sys_role_menu VALUES (1, 21);
INSERT INTO sys_role_menu VALUES (1, 211), (1, 212), (1, 213), (1, 214);
-- 专利业务管理 > 新申请 + 全部CRUD按钮
INSERT INTO sys_role_menu VALUES (1, 31);
INSERT INTO sys_role_menu VALUES (1, 311), (1, 312), (1, 313), (1, 314);
-- 专利业务管理 > 补漏 + 全部CRUD按钮
INSERT INTO sys_role_menu VALUES (1, 32);
INSERT INTO sys_role_menu VALUES (1, 321), (1, 322), (1, 323), (1, 324);
-- 专利业务管理 > PCT + 全部CRUD按钮
INSERT INTO sys_role_menu VALUES (1, 33);
INSERT INTO sys_role_menu VALUES (1, 331), (1, 332), (1, 333), (1, 334);
-- 专利业务管理 > 中间著变 + 全部CRUD按钮
INSERT INTO sys_role_menu VALUES (1, 34);
INSERT INTO sys_role_menu VALUES (1, 341), (1, 342), (1, 343), (1, 344);
-- 专利业务管理 > 复审无效 + 全部CRUD按钮
INSERT INTO sys_role_menu VALUES (1, 35);
INSERT INTO sys_role_menu VALUES (1, 351), (1, 352), (1, 353), (1, 354);

-- ----------------------------------------------------------
-- 角色2: 普通角色 (common) — 专利交底+业务菜单，仅查询按钮
-- ----------------------------------------------------------
INSERT INTO sys_role_menu VALUES (2, 2), (2, 3);
INSERT INTO sys_role_menu VALUES (2, 21);
INSERT INTO sys_role_menu VALUES (2, 211);                      -- 只-查询
INSERT INTO sys_role_menu VALUES (2, 31), (2, 32), (2, 33), (2, 34), (2, 35);
INSERT INTO sys_role_menu VALUES (2, 311), (2, 321), (2, 331), (2, 341), (2, 351); -- 只-查询

-- ----------------------------------------------------------
-- 角色3: 主办人 (organizer) — 专利交底+业务菜单，全部CRUD按钮（无系统管理）
-- ----------------------------------------------------------
INSERT INTO sys_role_menu VALUES (3, 2), (3, 3);
INSERT INTO sys_role_menu VALUES (3, 21);
INSERT INTO sys_role_menu VALUES (3, 211), (3, 212), (3, 213), (3, 214);
INSERT INTO sys_role_menu VALUES (3, 31), (3, 32), (3, 33), (3, 34), (3, 35);
INSERT INTO sys_role_menu VALUES (3, 311), (3, 312), (3, 313), (3, 314);
INSERT INTO sys_role_menu VALUES (3, 321), (3, 322), (3, 323), (3, 324);
INSERT INTO sys_role_menu VALUES (3, 331), (3, 332), (3, 333), (3, 334);
INSERT INTO sys_role_menu VALUES (3, 341), (3, 342), (3, 343), (3, 344);
INSERT INTO sys_role_menu VALUES (3, 351), (3, 352), (3, 353), (3, 354);

-- ----------------------------------------------------------
-- 角色4: 代理人 (agent) — 同主办人，专利交底+业务全CRUD，无系统管理
-- ----------------------------------------------------------
INSERT INTO sys_role_menu VALUES (4, 2), (4, 3);
INSERT INTO sys_role_menu VALUES (4, 21);
INSERT INTO sys_role_menu VALUES (4, 211), (4, 212), (4, 213), (4, 214);
INSERT INTO sys_role_menu VALUES (4, 31), (4, 32), (4, 33), (4, 34), (4, 35);
INSERT INTO sys_role_menu VALUES (4, 311), (4, 312), (4, 313), (4, 314);
INSERT INTO sys_role_menu VALUES (4, 321), (4, 322), (4, 323), (4, 324);
INSERT INTO sys_role_menu VALUES (4, 331), (4, 332), (4, 333), (4, 334);
INSERT INTO sys_role_menu VALUES (4, 341), (4, 342), (4, 343), (4, 344);
INSERT INTO sys_role_menu VALUES (4, 351), (4, 352), (4, 353), (4, 354);

-- ----------------------------------------------------------
-- 角色5: 申请人 (application) — 同普通角色，仅查询，无系统管理
-- ----------------------------------------------------------
INSERT INTO sys_role_menu VALUES (5, 2), (5, 3);
INSERT INTO sys_role_menu VALUES (5, 21);
INSERT INTO sys_role_menu VALUES (5, 211);
INSERT INTO sys_role_menu VALUES (5, 31), (5, 32), (5, 33), (5, 34), (5, 35);
INSERT INTO sys_role_menu VALUES (5, 311), (5, 321), (5, 331), (5, 341), (5, 351);

-- ----------------------------------------------------------
-- 角色6: 录入人员 (businessEntryClerk) — 专利交底+业务全CRUD，无系统管理
-- ----------------------------------------------------------
INSERT INTO sys_role_menu VALUES (6, 2), (6, 3);
INSERT INTO sys_role_menu VALUES (6, 21);
INSERT INTO sys_role_menu VALUES (6, 211), (6, 212), (6, 213), (6, 214);
INSERT INTO sys_role_menu VALUES (6, 31), (6, 32), (6, 33), (6, 34), (6, 35);
INSERT INTO sys_role_menu VALUES (6, 311), (6, 312), (6, 313), (6, 314);
INSERT INTO sys_role_menu VALUES (6, 321), (6, 322), (6, 323), (6, 324);
INSERT INTO sys_role_menu VALUES (6, 331), (6, 332), (6, 333), (6, 334);
INSERT INTO sys_role_menu VALUES (6, 341), (6, 342), (6, 343), (6, 344);
INSERT INTO sys_role_menu VALUES (6, 351), (6, 352), (6, 353), (6, 354);

-- ----------------------------------------------------------
-- 角色7: 流程人员 (processOperator) — 专利交底+业务菜单，仅查询+修改（无新增、无删除）
-- ----------------------------------------------------------
INSERT INTO sys_role_menu VALUES (7, 2), (7, 3);
INSERT INTO sys_role_menu VALUES (7, 21);
INSERT INTO sys_role_menu VALUES (7, 211), (7, 213);              -- 查询 + 修改
INSERT INTO sys_role_menu VALUES (7, 31), (7, 32), (7, 33), (7, 34), (7, 35);
INSERT INTO sys_role_menu VALUES (7, 311), (7, 313);              -- 查询 + 修改
INSERT INTO sys_role_menu VALUES (7, 321), (7, 323);              -- 查询 + 修改
INSERT INTO sys_role_menu VALUES (7, 331), (7, 333);              -- 查询 + 修改
INSERT INTO sys_role_menu VALUES (7, 341), (7, 343);              -- 查询 + 修改
INSERT INTO sys_role_menu VALUES (7, 351), (7, 353);              -- 查询 + 修改

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 权限对照表 (角色 → 菜单访问范围)
-- ============================================================
/*
角色                    | 系统管理 | 专利交底 | 专利业务 | 新增 | 修改 | 删除 | 查询
------------------------|---------|---------|---------|-----|-----|-----|-----
超级管理员 admin         |   ✓     |   ✓     |   ✓     |  ✓  |  ✓  |  ✓  |  ✓
普通角色 common          |   ✗     |   ✓     |   ✓     |  ✗  |  ✗  |  ✗  |  ✓
主办人 organizer         |   ✗     |   ✓     |   ✓     |  ✓  |  ✓  |  ✓  |  ✓
代理人 agent             |   ✗     |   ✓     |   ✓     |  ✓  |  ✓  |  ✓  |  ✓
申请人 application       |   ✗     |   ✓     |   ✓     |  ✗  |  ✗  |  ✗  |  ✓
录入人员 businessEntryClerk | ✗   |   ✓     |   ✓     |  ✓  |  ✓  |  ✓  |  ✓
流程人员 processOperator  |   ✗     |   ✓     |   ✓     |  ✗  |  ✓  |  ✗  |  ✓

菜单路径映射:
  系统管理 > 用户管理      → /system/user
  系统管理 > 用户角色管理  → /system/user-role
  专利交底管理 > 专利交底 → /patent/disclosure
  专利业务管理 > 新申请    → /patent/new-application
  专利业务管理 > 补漏      → /patent/supplementary
  专利业务管理 > PCT       → /patent/pct
  专利业务管理 > 中间著变  → /patent/intermediate-change
  专利业务管理 > 复审无效  → /patent/reexamination
*/
