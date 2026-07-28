# 吉易

纯前端微信小程序，使用微信小程序原生 WXML、WXSS、JavaScript 开发，并通过 `lunar-javascript` 完成历法与四柱计算。

## 目录

- `app.*`：小程序入口与全局配置
- `pages/`：业务页面
- `utils/`：历法、好日子、计划、主题等客户端逻辑
- `data/`：本地灵感与视觉数据
- `assets/`：小程序运行时使用的图片和图标
- `styles/`：全局样式与主题变量
- `docs/product/`：产品需求与历史开发文档
- `design/app-icons/`：应用图标候选稿
- `design/source-materials/`：海报、Banner 等原始视觉素材

`docs/` 和 `design/` 已在 `project.config.json` 中排除，不会增加小程序预览包和上传包体积。

## 开发

在微信开发者工具中导入：

`/Users/bryce/jiyi`

项目保持纯前端架构。生日、出生时间、四柱、偏好和计划均在客户端计算并使用微信本地缓存保存，不包含云函数、云数据库、后端服务或 API 接口。
