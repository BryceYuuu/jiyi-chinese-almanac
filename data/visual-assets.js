const HOME_BANNERS = [
  "/assets/materials/banner-mist.jpg",
  "/assets/materials/banner-ink-circle.jpg"
];

const MOTIFS = [
  "/assets/materials/motif-sun-river.jpg",
  "/assets/materials/motif-sun-mountain.jpg",
  "/assets/materials/motif-bridge.jpg",
  "/assets/materials/motif-river.jpg",
  "/assets/materials/motif-scroll-landscape.jpg",
  "/assets/materials/motif-scroll-book.jpg"
];

const POSTER_BACKGROUNDS = {
  sun: [
    "/assets/materials/poster-golden-willow.jpg",
    "/assets/materials/poster-sun-mist.jpg",
    "/assets/materials/poster-coral-flow.jpg"
  ],
  mountain: [
    "/assets/materials/poster-ink-mountain.jpg",
    "/assets/materials/poster-bamboo-mountain.jpg",
    "/assets/materials/poster-jade-mist.jpg"
  ],
  paper: [
    "/assets/materials/poster-bamboo-scroll.jpg",
    "/assets/materials/poster-coral-paper.jpg"
  ]
};

function hashSeed(value) {
  const text = `${value || "jiyi"}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickAsset(list, seed, salt) {
  if (!list.length) return "";
  const index = hashSeed(`${seed}|${salt}`) % list.length;
  return list[index];
}

function getHomeBanner(seed) {
  return pickAsset(HOME_BANNERS, seed, "home-banner");
}

function getPosterVisual(seed, style, sequence) {
  const backgrounds = POSTER_BACKGROUNDS[style] || POSTER_BACKGROUNDS.sun;
  const styleIndex = ["sun", "mountain", "paper"].indexOf(style);
  const normalizedStyleIndex = styleIndex < 0 ? 0 : styleIndex;
  const baseHash = hashSeed(seed);
  const generationOffset = Number(sequence) || 0;
  return {
    key: `${style}-${baseHash}-${generationOffset}`,
    backgroundPath: backgrounds[(baseHash + generationOffset + normalizedStyleIndex) % backgrounds.length],
    motifPath: MOTIFS[(baseHash + generationOffset + normalizedStyleIndex * 2) % MOTIFS.length],
    overlayAlpha: style === "mountain" ? 0.18 : style === "paper" ? 0.22 : 0.16
  };
}

module.exports = {
  getHomeBanner,
  getPosterVisual
};
