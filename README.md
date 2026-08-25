# Explorer Grid

将现实城市 RPG 化的地点探索与个人图鉴原型。

核心循环：打开地图 → 选择 Explore Layer → 发现地点 → 标记去过 → 地图点亮 → 图鉴记录。

## 技术栈

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- MapLibre GL JS + OpenFreeMap
- SQLite + Drizzle ORM

## 快速开始

```bash
npm install
npm run db:seed
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

地图是主工作空间：自由缩放日本、识别当前地区、在地图上用 Quick Panel 记录地点。图鉴页用于回顾收藏。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run db:seed` | 同步地点与 Explore View |
| `npm run db:reset` | 清空用户访问状态后保留地点数据 |
| `npm run build` | 生产构建 |

## 体验路径

1. 首页地图默认显示「经典东京」
2. 底部切换「博物馆东京」「文学东京」
3. 点击 marker 进入地点详情
4. 点击「想去」或「去过」
5. 返回地图查看 marker 状态变化
6. 打开「图鉴」查看 ○ / ● 记录

## 项目结构

```text
src/
  app/           # 页面与 API routes
  components/    # 通用 UI
  features/      # map / places / explore / grid
  data/          # schema、seed、SQLite
  lib/           # repositories
  types/         # 共享类型
```

SQLite 文件位于 `data/explorer-grid.db`（本地生成，不入库）。

## MVP 范围

已实现：日本范围地图工作空间、Region 自动识别、Region Summary、Place Quick Panel、Explore View、访问/评分/感想、图鉴页。

未实现：登录、社交、推荐、GPS 打卡、完整日本 POI 导入、PostGIS、管理后台。
