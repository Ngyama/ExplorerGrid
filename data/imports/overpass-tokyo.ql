[out:json][timeout:55];
(
  node["tourism"~"museum|attraction|gallery|aquarium|zoo|viewpoint"](35.62,139.68,35.75,139.85);
  way["tourism"~"museum|attraction|gallery|aquarium|zoo|viewpoint"](35.62,139.68,35.75,139.85);
  node["historic"~"castle|memorial|monument|shrine|temple"](35.62,139.68,35.75,139.85);
  way["historic"~"castle|memorial|monument|shrine|temple"](35.62,139.68,35.75,139.85);
  node["leisure"="park"]["name"](35.62,139.68,35.75,139.85);
  way["leisure"="park"]["name"](35.62,139.68,35.75,139.85);
  node["amenity"="place_of_worship"]["religion"~"shinto|buddhist"](35.62,139.68,35.75,139.85);
  way["amenity"="place_of_worship"]["religion"~"shinto|buddhist"](35.62,139.68,35.75,139.85);
);
out center 200;
