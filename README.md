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
| `npm run db:seed` | 同步基础策展地点与 Explore View |
| `npm run places:import` | 导入 curated 目录（可重复；`--live`/`--region tokyo` 可拉 OSM） |
| `npm run db:reset` | 清空用户访问状态后保留地点数据 |
| `npm run build` | 生产构建 |

## 体验路径

1. 首页地图：低 zoom 看全国级地点，放大东京看更多内容
2. 底部切换 Explore View（经典东京 / 博物馆东京 / 文学东京…）或 My Collections
3. 搜索地点；外部结果可「加入 ExplorerGrid」
4. 右键地图创建 Custom Place
5. Quick Panel：想去 / 去过 / 评分 / 感想 / 加入 Collection
6. 打开「图鉴」按地区筛选回顾

## 项目结构

```text
src/
  app/           # 页面与 API routes
  components/    # 通用 UI
  features/      # map / places / explore / grid
  data/          # schema、seed、SQLite
  lib/           # repositories / providers / places
  types/         # 共享类型
scripts/
  import-places.ts
data/imports/
  curated-catalog.json
```

SQLite 文件位于 `data/explorer-grid.db`（本地生成，不入库）。

底图默认使用国土地理院 pale **栅格**（`/geo/raster-basemap.json`），放大到街道级仍可见。OpenFreeMap / MapTiler 可通过 `.env.local` 的 `NEXT_PUBLIC_MAP_STYLE_URL` 切换。对照页：`/map-debug`。

## MVP 范围

已实现：日本范围地图工作空间、Region、Explore View、Collection、地点搜索、Custom Place、OSM 导入管线、importance/zoom 过滤、Marker clustering、访问/评分/感想、图鉴 Region 筛选。

未实现：登录、社交、推荐、GPS 打卡、全日本 POI、PostGIS、管理后台。
