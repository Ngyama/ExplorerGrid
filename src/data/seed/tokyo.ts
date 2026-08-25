import type { PlaceCategory } from "@/types/place";

export type SeedPlace = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  image: string;
  regionId: string | null;
  importance: number;
  minZoom: number;
};

export type SeedLayer = {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  regionId: string | null;
};

export const EXPLORE_LAYERS: SeedLayer[] = [
  {
    id: "classic-japan",
    name: "经典日本",
    description: "从北到南，串起日本列岛上的名所与地标。",
    coverImage:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    regionId: "japan",
  },
  {
    id: "classic-tokyo",
    name: "经典东京",
    description: "第一次来东京必访的地标与名所，点亮城市的骨架。",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "museum-tokyo",
    name: "博物馆东京",
    description: "从国立博物馆到设计与科技展馆，雨天也能探索的文化地图。",
    coverImage:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "literary-tokyo",
    name: "文学东京",
    description: "夏目漱石、森鸥外与神保町——文字留下的城市足迹。",
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "pref-13",
  },
];

export const TOKYO_PLACES: SeedPlace[] = [
  {
    id: "sensoji",
    name: "浅草寺",
    description: "东京最古老的寺庙，雷门与仲见世通是经典东京的入口。",
    latitude: 35.7148,
    longitude: 139.7967,
    category: "shrine",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    regionId: "ward-13106",
    importance: 1,
    minZoom: 8,
  },
  {
    id: "tokyo-tower",
    name: "东京塔",
    description: "橙色铁塔俯瞰港区，战后东京天际线的象征。",
    latitude: 35.6586,
    longitude: 139.7454,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    regionId: "ward-13103",
    importance: 1,
    minZoom: 8,
  },
  {
    id: "meiji-jingu",
    name: "明治神宫",
    description: "原宿旁的森林神社，参道两侧高大的树木隔开城市喧嚣。",
    latitude: 35.6764,
    longitude: 139.6993,
    category: "shrine",
    image:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
    regionId: "ward-13113",
    importance: 1,
    minZoom: 9,
  },
  {
    id: "ueno-park",
    name: "上野公园",
    description: "博物馆与樱花的聚集地，从江户到现代的文化绿洲。",
    latitude: 35.7146,
    longitude: 139.7715,
    category: "park",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    regionId: "ward-13106",
    importance: 2,
    minZoom: 10,
  },
  {
    id: "imperial-palace",
    name: "皇居",
    description: "旧江户城遗址，护城河与二重桥构成东京中心的静谧。",
    latitude: 35.6852,
    longitude: 139.7528,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    regionId: "ward-13101",
    importance: 1,
    minZoom: 9,
  },
  {
    id: "shinjuku-gyoen",
    name: "新宿御苑",
    description: "都市中心的大庭园，法国式、英国式与日本庭园并置。",
    latitude: 35.6852,
    longitude: 139.7101,
    category: "park",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
    regionId: "ward-13104",
    importance: 2,
    minZoom: 10,
  },
  {
    id: "shibuya-crossing",
    name: "涩谷十字路口",
    description: "世界最繁忙的行人过街口之一，东京节奏的象征画面。",
    latitude: 35.6595,
    longitude: 139.7004,
    category: "street",
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80",
    regionId: "ward-13113",
    importance: 1,
    minZoom: 9,
  },
  {
    id: "teamlab-planets",
    name: "teamLab Planets",
    description: "丰洲的沉浸式数字艺术空间，光与水构成的当代体验。",
    latitude: 35.649,
    longitude: 139.7868,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80",
    regionId: "ward-13108",
    importance: 2,
    minZoom: 11,
  },
  {
    id: "tokyo-national-museum",
    name: "东京国立博物馆",
    description: "日本最大的博物馆，收藏从绳文到近代的国宝与重要文化财。",
    latitude: 35.7188,
    longitude: 139.7765,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    regionId: "ward-13106",
    importance: 1,
    minZoom: 9,
  },
  {
    id: "mori-art-museum",
    name: "森美术馆",
    description: "六本木新城顶层的当代艺术馆，俯瞰港区天际线。",
    latitude: 35.6605,
    longitude: 139.7292,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    regionId: "ward-13103",
    importance: 2,
    minZoom: 11,
  },
  {
    id: "edo-tokyo-museum",
    name: "江户东京博物馆",
    description: "两国共立的巨大建筑，复原江户街景与近代东京记忆。",
    latitude: 35.6963,
    longitude: 139.7966,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
    regionId: "ward-13107",
    importance: 2,
    minZoom: 11,
  },
  {
    id: "miraikan",
    name: "日本科学未来馆",
    description: "台场的科技馆，地球仪与机器人展讲述未来想象。",
    latitude: 35.619,
    longitude: 139.7768,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    regionId: "ward-13108",
    importance: 2,
    minZoom: 11,
  },
  {
    id: "nezu-museum",
    name: "根津美术馆",
    description: "青山里的私人收藏馆，庭园与茶室同样值得停留。",
    latitude: 35.6623,
    longitude: 139.7171,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    regionId: "ward-13103",
    importance: 3,
    minZoom: 12,
  },
  {
    id: "ghibli-museum",
    name: "三鹰之森吉卜力美术馆",
    description: "吉卜力动画的实体世界，建筑本身就是一部童话。",
    latitude: 35.6962,
    longitude: 139.5704,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    regionId: "pref-13",
    importance: 1,
    minZoom: 9,
  },
  {
    id: "soseki-museum",
    name: "漱石山房纪念馆",
    description: "夏目漱石晚年居住地，文学东京的一处安静节点。",
    latitude: 35.7095,
    longitude: 139.7045,
    category: "memorial",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "ward-13104",
    importance: 3,
    minZoom: 12,
  },
  {
    id: "mori-ogai-memorial",
    name: "森鸥外纪念馆",
    description: "文京区的森鸥外故居遗迹，近代文学史的现场。",
    latitude: 35.7178,
    longitude: 139.752,
    category: "memorial",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "ward-13105",
    importance: 3,
    minZoom: 12,
  },
  {
    id: "jimbocho",
    name: "神保町古书店街",
    description: "世界最大的古书街区之一，纸页与咖啡香交织。",
    latitude: 35.6955,
    longitude: 139.7577,
    category: "bookstore",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "ward-13101",
    importance: 2,
    minZoom: 11,
  },
  {
    id: "literary-cafe-honyasan",
    name: "书与咖啡",
    description: "神保町一带的书香咖啡馆，适合慢慢翻一本书。",
    latitude: 35.6959,
    longitude: 139.7585,
    category: "cafe",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    regionId: "ward-13101",
    importance: 3,
    minZoom: 13,
  },
  {
    id: "waseda-theatre-museum",
    name: "早稻田大学坪内博士纪念演剧博物馆",
    description: "戏剧史资料馆，文学与舞台记忆的交汇处。",
    latitude: 35.709,
    longitude: 139.7193,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    regionId: "ward-13104",
    importance: 3,
    minZoom: 12,
  },
  {
    id: "yanaka-ginza",
    name: "谷中银座",
    description: "下町商店街，猫与人情构成东京另一侧面。",
    latitude: 35.7272,
    longitude: 139.7699,
    category: "street",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
    regionId: "ward-13106",
    importance: 2,
    minZoom: 11,
  },
  {
    id: "tokyo-skytree",
    name: "东京晴空塔",
    description: "墨田区的当代地标，俯瞰下町与东京湾。",
    latitude: 35.7101,
    longitude: 139.8107,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    regionId: "ward-13107",
    importance: 1,
    minZoom: 8,
  },
  {
    id: "koishikawa-korakuen",
    name: "小石川后乐园",
    description: "江户初期的大名庭园，借景与回游式庭园的典范。",
    latitude: 35.7056,
    longitude: 139.7495,
    category: "park",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
    regionId: "ward-13105",
    importance: 2,
    minZoom: 11,
  },
];

export const JAPAN_PLACES: SeedPlace[] = [
  {
    id: "sapporo-odori",
    name: "札幌大通公园",
    description: "北海道的城市轴线，雪祭与绿荫季节轮替。",
    latitude: 43.0596,
    longitude: 141.3535,
    category: "park",
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80",
    regionId: "pref-01",
    importance: 1,
    minZoom: 5,
  },
  {
    id: "fushimi-inari",
    name: "伏见稻荷大社",
    description: "千本鸟居通向山脊，京都最可辨认的信仰风景。",
    latitude: 34.9671,
    longitude: 135.7727,
    category: "shrine",
    image:
      "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800&q=80",
    regionId: "pref-26",
    importance: 1,
    minZoom: 5,
  },
  {
    id: "kinkakuji",
    name: "金阁寺",
    description: "镜湖池倒映的金阁，室町时代的京都意象。",
    latitude: 35.0394,
    longitude: 135.7292,
    category: "shrine",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    regionId: "pref-26",
    importance: 1,
    minZoom: 5,
  },
  {
    id: "osaka-castle",
    name: "大阪城",
    description: "丰臣秀吉的城郭，大阪平原上的权力符号。",
    latitude: 34.6873,
    longitude: 135.5262,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80",
    regionId: "pref-27",
    importance: 1,
    minZoom: 5,
  },
  {
    id: "todaiji",
    name: "东大寺",
    description: "奈良大佛与南大门，古代都城的信仰中心。",
    latitude: 34.689,
    longitude: 135.8398,
    category: "shrine",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
    regionId: "pref-29",
    importance: 1,
    minZoom: 5,
  },
  {
    id: "itsukushima",
    name: "严岛神社",
    description: "海上大鸟居，广岛海湾中的世界遗产。",
    latitude: 34.2956,
    longitude: 132.3198,
    category: "shrine",
    image:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
    regionId: "pref-34",
    importance: 1,
    minZoom: 5,
  },
  {
    id: "fukuoka-tower",
    name: "福冈塔",
    description: "九州北端的海岸地标，俯瞰博多湾。",
    latitude: 33.5933,
    longitude: 130.3515,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    regionId: "pref-40",
    importance: 2,
    minZoom: 6,
  },
  {
    id: "shuri-castle",
    name: "首里城",
    description: "琉球王国都城遗迹，冲绳历史的核心节点。",
    latitude: 26.217,
    longitude: 127.7192,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    regionId: "pref-47",
    importance: 1,
    minZoom: 5,
  },
];

export const ALL_PLACES: SeedPlace[] = [...TOKYO_PLACES, ...JAPAN_PLACES];

export const LAYER_PLACE_LINKS: Record<string, string[]> = {
  "classic-japan": [
    "sapporo-odori",
    "sensoji",
    "tokyo-tower",
    "imperial-palace",
    "fushimi-inari",
    "kinkakuji",
    "osaka-castle",
    "todaiji",
    "itsukushima",
    "fukuoka-tower",
    "shuri-castle",
  ],
  "classic-tokyo": [
    "sensoji",
    "tokyo-tower",
    "meiji-jingu",
    "ueno-park",
    "imperial-palace",
    "shinjuku-gyoen",
    "shibuya-crossing",
    "tokyo-skytree",
    "tokyo-national-museum",
    "yanaka-ginza",
  ],
  "museum-tokyo": [
    "tokyo-national-museum",
    "mori-art-museum",
    "edo-tokyo-museum",
    "miraikan",
    "nezu-museum",
    "ghibli-museum",
    "teamlab-planets",
    "waseda-theatre-museum",
  ],
  "literary-tokyo": [
    "soseki-museum",
    "mori-ogai-memorial",
    "jimbocho",
    "literary-cafe-honyasan",
    "waseda-theatre-museum",
    "koishikawa-korakuen",
    "ueno-park",
    "yanaka-ginza",
  ],
};
