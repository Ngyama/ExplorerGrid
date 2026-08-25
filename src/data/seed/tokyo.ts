import type { PlaceCategory } from "@/types/place";

export const TOKYO_LAYERS = [
  {
    id: "classic-tokyo",
    name: "经典东京",
    description: "第一次来东京必访的地标与名所，点亮城市的骨架。",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  },
  {
    id: "museum-tokyo",
    name: "博物馆东京",
    description: "从国立博物馆到设计与科技展馆，雨天也能探索的文化地图。",
    coverImage:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
  },
  {
    id: "literary-tokyo",
    name: "文学东京",
    description: "夏目漱石、森鸥外与神保町——文字留下的城市足迹。",
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  },
] as const;

export const TOKYO_PLACES: Array<{
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  image: string;
}> = [
  {
    id: "sensoji",
    name: "浅草寺",
    description: "东京最古老的寺庙，雷门与仲见世通是经典东京的入口。",
    latitude: 35.7148,
    longitude: 139.7967,
    category: "shrine",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
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
  },
  {
    id: "imperial-palace",
    name: "皇居",
    description: "旧江户城遗址，护城河与二重桥构成东京中心的静谧。",
    latitude: 35.6852,
    longitude: 139.7528,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1551641506-ee5bf4cb45f1?w=800&q=80",
  },
  {
    id: "shinjuku-gyoen",
    name: "新宿御苑",
    description: "日式、法式与英式庭园并存的都市绿肺。",
    latitude: 35.6852,
    longitude: 139.7101,
    category: "park",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
  },
  {
    id: "shibuya-crossing",
    name: "涩谷十字路口",
    description: "世界最繁忙的人行交叉口之一，东京速度的视觉符号。",
    latitude: 35.6595,
    longitude: 139.7004,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80",
  },
  {
    id: "teamlab-planets",
    name: "teamLab Planets",
    description: "丰洲的沉浸式数字艺术馆，光与水构成可走入的展览。",
    latitude: 35.649,
    longitude: 139.7895,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    id: "tokyo-national-museum",
    name: "东京国立博物馆",
    description: "日本最大的博物馆，收藏从绳文到近世的文物与美术。",
    latitude: 35.7188,
    longitude: 139.7765,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
  },
  {
    id: "mori-art-museum",
    name: "森美术馆",
    description: "六本木之丘53层的当代艺术馆，可同时眺望城市全景。",
    latitude: 35.6605,
    longitude: 139.7292,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
  },
  {
    id: "edo-tokyo-museum",
    name: "江户东京博物馆",
    description: "以模型与场景重现江户到昭和的都市变迁。",
    latitude: 35.6963,
    longitude: 139.7948,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
  },
  {
    id: "miraikan",
    name: "日本科学未来馆",
    description: "台场的科技馆，从宇宙到机器人展示当代科学。",
    latitude: 35.6193,
    longitude: 139.7765,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  },
  {
    id: "nezu-museum",
    name: "根津美术馆",
    description: "表参道旁的私人美术馆，庭园与东亚古美术并重。",
    latitude: 35.6623,
    longitude: 139.7171,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80",
  },
  {
    id: "ghibli-museum",
    name: "三鹰之森吉卜力美术馆",
    description: "宫崎骏世界的实体化，预约制的动画圣地。",
    latitude: 35.6962,
    longitude: 139.5704,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
  },
  {
    id: "soseki-museum",
    name: "漱石山房纪念馆",
    description: "夏目漱石晚年居所旧址，文学东京的重要节点。",
    latitude: 35.7125,
    longitude: 139.6358,
    category: "memorial",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  },
  {
    id: "mori-ogai-memorial",
    name: "森鸥外纪念馆",
    description: "文京区的森鸥外故居纪念馆，近代文学的据点。",
    latitude: 35.7178,
    longitude: 139.7512,
    category: "memorial",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
  },
  {
    id: "jimbocho",
    name: "神保町古书街",
    description: "世界最大的旧书街区之一，书店与咖啡馆交织的文学街。",
    latitude: 35.6955,
    longitude: 139.7575,
    category: "street",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
  },
  {
    id: "literary-cafe-honyasan",
    name: "书肆咖啡（神保町）",
    description: "古书街中的文学咖啡馆，适合读完一本旧书再继续探索。",
    latitude: 35.6959,
    longitude: 139.7582,
    category: "cafe",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
  },
  {
    id: "waseda-theatre-museum",
    name: "早稻田大学坪内博士纪念演剧博物馆",
    description: "以戏剧文学与演出史见长的小型博物馆。",
    latitude: 35.709,
    longitude: 139.7191,
    category: "museum",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  },
  {
    id: "yanaka-ginza",
    name: "谷中银座",
    description: "下町风情的商店街，接近上野与日暮里的慢节奏东京。",
    latitude: 35.7256,
    longitude: 139.7671,
    category: "street",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
  },
  {
    id: "tokyo-skytree",
    name: "东京晴空塔",
    description: "墨田区的超高电视塔，现代东京的新地标。",
    latitude: 35.7101,
    longitude: 139.8107,
    category: "landmark",
    image:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
  },
  {
    id: "koishikawa-korakuen",
    name: "小石川后乐园",
    description: "江户大名庭园，文学散步路线上的安静节点。",
    latitude: 35.7056,
    longitude: 139.7495,
    category: "park",
    image:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
  },
];

/** layerId -> placeIds (order matters) */
export const LAYER_PLACE_LINKS: Record<string, string[]> = {
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
