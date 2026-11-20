/**
 * Apex Cinema - Curated Automotive Wallpapers Registry Data
 * Strictly: Luxury Cars, Sports Cars, Classic Cars, Off-Road & SUVs
 * 
 * Future additions: Call addWallpaper({...}) or add to this array!
 */

const INITIAL_WALLPAPERS = [
  // ==========================================
  // 1. LUXURY CARS
  // ==========================================
  {
    id: 'builtin-lux-1',
    name: 'Mercedes-Maybach S 680',
    category: 'Luxury Cars',
    src: 'assets/wallpapers/luxury/mercedes-maybach-s680.png',
    mixSrc: 'assets/wallpapers/mixup/mercedes-maybach-s680.png',
    meta: '6.0L Biturbo V12 • 621 HP • Executive First-Class Suite',
    camera: 'LEICA SL2 // 50MM F/1.4',
    isBuiltin: true
  },
  {
    id: 'builtin-lux-2',
    name: 'Mercedes-Maybach S 680 Interior',
    category: 'Luxury Cars',
    src: 'assets/wallpapers/luxury/mercedes-maybach-s680-interior.png',
    mixSrc: 'assets/wallpapers/mixup/mercedes-maybach-s680-interior.png',
    meta: 'Exclusive Nappa Leather Lounge • Burmester High-End 4D Sound',
    camera: 'HASSELBLAD H6D // 28MM F/4.0',
    isBuiltin: true
  },
  {
    id: 'builtin-lux-3',
    name: 'Mercedes-Maybach S 580 4MATIC',
    category: 'Luxury Cars',
    src: 'assets/wallpapers/luxury/mercedes_maybach_s_580_4matic.jpg',
    mixSrc: 'assets/wallpapers/mixup/mercedes_maybach_s_580_4matic.jpg',
    meta: '4.0L Biturbo V8 Mild Hybrid • 496 HP • Intelligent AWD',
    camera: 'SONY A7R V // 85MM F/1.4 GM',
    isBuiltin: true
  },
  {
    id: 'builtin-lux-4',
    name: 'Mercedes-Maybach SL 680 Monogram',
    category: 'Luxury Cars',
    src: 'assets/wallpapers/luxury/mercedes-maybach-sl.jpg',
    mixSrc: 'assets/wallpapers/mixup/mercedes-maybach-sl.jpg',
    meta: '4.0L Biturbo V8 • 577 HP • Open-Air Grand Touring Roadster',
    camera: 'SONY A1 // 70-200MM F/2.8 GM II',
    isBuiltin: true
  },
  {
    id: 'builtin-lux-5',
    name: 'Maserati GranTurismo Trofeo',
    category: 'Luxury Cars',
    src: 'assets/wallpapers/luxury/maserati-granturismo.jpg',
    mixSrc: 'assets/wallpapers/mixup/maserati-granturismo.jpg',
    meta: '3.0L Twin-Turbo Nettuno V6 • 542 HP • Italian Grand Tourer',
    camera: 'CANON R5 // 50MM F/1.2L',
    isBuiltin: true
  },

  // ==========================================
  // 2. SPORTS CARS
  // ==========================================
  {
    id: 'builtin-sport-1',
    name: 'Porsche 911 Turbo S',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/porsche_911_turbo_s.jpg',
    mixSrc: 'assets/wallpapers/mixup/porsche_911_turbo_s.jpg',
    meta: '3.8L Twin-Turbo Flat-6 • 640 HP • 0-60 in 2.6s',
    camera: 'CANON R5 // 24-70MM F/2.8L',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-2',
    name: 'Porsche 911 Carrera GTS',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/porsche_911_carrera_gts.jpg',
    mixSrc: 'assets/wallpapers/mixup/porsche_911_carrera_gts.jpg',
    meta: '3.6L T-Hybrid Boxer-6 • 532 HP • Sport Chrono Package',
    camera: 'LEICA M11 // 35MM APO-SUMMICRON',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-3',
    name: 'Porsche 911 Carrera T',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/porsche_911_carrera_t.jpg',
    mixSrc: 'assets/wallpapers/mixup/porsche_911_carrera_t.jpg',
    meta: '3.0L Twin-Turbo Flat-6 • 388 HP • Lightweight 6-Speed Manual',
    camera: 'FUJIFILM GFX 100S // 45MM F/2.8',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-4',
    name: 'Ferrari F8 Tributo Rear View',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/ferrari_back_view.jpg',
    mixSrc: 'assets/wallpapers/mixup/ferrari_back_view.jpg',
    meta: '3.9L Twin-Turbo V8 • 710 HP • Quad Titanium Exhaust',
    camera: 'SONY A7R V // 85MM F/1.4 GM',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-5',
    name: 'Ferrari Portofino M',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/ferrari-portofino.jpg',
    mixSrc: 'assets/wallpapers/mixup/ferrari-portofino.jpg',
    meta: '3.9L Twin-Turbo V8 • 612 HP • 8-Speed Dual Clutch Spider',
    camera: 'HASSELBLAD X2D // 55MM F/2.5',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-6',
    name: 'BMW M4 Competition Coupé',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/bmw_m4.jpg',
    mixSrc: 'assets/wallpapers/mixup/bmw_m4.jpg',
    meta: '3.0L M TwinPower Turbo Inline-6 • 503 HP • M xDrive',
    camera: 'NIKON Z9 // 35MM F/1.8 S',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-7',
    name: 'Audi R8 V10 Performance',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/audi_r8_v10_red.jpg',
    mixSrc: 'assets/wallpapers/mixup/audi_r8_v10_red.jpg',
    meta: '5.2L Naturally Aspirated V10 • 602 HP • Quattro AWD',
    camera: 'SONY A1 // 70-200MM F/2.8 GM II',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-8',
    name: 'BMW M4 Competition G82 Green',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/bmw_m4_g82_green.jpg',
    mixSrc: 'assets/wallpapers/mixup/bmw_m4_g82_green.jpg',
    meta: '3.0L M TwinPower Turbo S58 • 503 HP • Isle of Man Green',
    camera: 'CANON R5 // 24-70MM F/2.8L',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-9',
    name: 'Mercedes-Benz SLS AMG Gullwing',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/mercedes_benz_sls_amg.jpg',
    mixSrc: 'assets/wallpapers/mixup/mercedes_benz_sls_amg.jpg',
    meta: '6.2L Naturally Aspirated V8 • 563 HP • Iconic Gullwing Doors',
    camera: 'LEICA M11 // 50MM NOCTILUX',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-10',
    name: 'Porsche 911 GT3 Alpine Snow',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/porsche_911_gt3_snow.jpg',
    mixSrc: 'assets/wallpapers/mixup/porsche_911_gt3_snow.jpg',
    meta: '4.0L High-Revving Boxer-6 • 500 HP • Alpine Mountain Pass',
    camera: 'FUJIFILM GFX 100 II // 45MM F/2.8',
    isBuiltin: true
  },
  {
    id: 'builtin-sport-11',
    name: 'Ferrari SF90 Stradale',
    category: 'Sports Cars',
    src: 'assets/wallpapers/sports/ferrari_sf90_stradale.jpg',
    mixSrc: 'assets/wallpapers/mixup/ferrari_sf90_stradale.jpg',
    meta: '4.0L Twin-Turbo V8 PHEV • 986 HP • Rosso Corsa Forest Run',
    camera: 'HASSELBLAD X2D 100C // 55MM F/2.5',
    isBuiltin: true
  },

  // ==========================================
  // 3. OFF-ROAD & SUVS
  // ==========================================
  {
    id: 'builtin-offroad-1',
    name: 'Mercedes-AMG G 63 G-Wagon',
    category: 'Off-Road & SUVs',
    src: 'assets/wallpapers/offroad/moving_g_wagon.jpg',
    mixSrc: 'assets/wallpapers/mixup/moving_g_wagon.jpg',
    meta: '4.0L Handcrafted Biturbo V8 • 577 HP • Triple Differential Locks',
    camera: 'SONY A7S III // 24-70MM F/2.8 GM',
    isBuiltin: true
  },
  {
    id: 'builtin-offroad-2',
    name: 'Mercedes-Maybach GLS 600 SUV',
    category: 'Off-Road & SUVs',
    src: 'assets/wallpapers/offroad/mercedes-maybach-gls-600.jpg',
    mixSrc: 'assets/wallpapers/mixup/mercedes-maybach-gls-600.jpg',
    meta: '4.0L Biturbo V8 • 550 HP • E-Active Body Control',
    camera: 'LEICA SL2 // 35MM F/2.0 APO',
    isBuiltin: true
  },
  {
    id: 'builtin-offroad-3',
    name: 'Land Rover Defender 110 X',
    category: 'Off-Road & SUVs',
    src: 'assets/wallpapers/offroad/land-rover-defender.jpg',
    mixSrc: 'assets/wallpapers/mixup/land-rover-defender.jpg',
    meta: '3.0L Turbocharged i6 MHEV • 395 HP • Terrain Response 2',
    camera: 'CANON R5 // 70-200MM F/2.8L',
    isBuiltin: true
  },

  // ==========================================
  // 4. CLASSIC CARS
  // ==========================================
  {
    id: 'builtin-classic-1',
    name: '1967 Shelby Mustang GT500',
    category: 'Classic Cars',
    src: 'assets/wallpapers/classic/shelby_gt500_1967.jpg',
    mixSrc: 'assets/wallpapers/mixup/shelby_gt500_1967.jpg',
    meta: '428 Police Interceptor V8 • 355 HP • 4-Speed Toploader',
    camera: 'HASSELBLAD 500C // 80MM PLANAR',
    isBuiltin: true
  },
  {
    id: 'builtin-classic-gt350',
    name: '1965 Shelby Mustang GT350',
    category: 'Classic Cars',
    src: 'assets/wallpapers/classic/shelby_gt350_classic.jpg',
    mixSrc: 'assets/wallpapers/mixup/shelby_gt350_classic.jpg',
    meta: '289 CID K-Code HiPo V8 • 306 HP • Wimbledon White & Guardsman Blue',
    camera: 'HASSELBLAD 500C/M // 80MM F/2.8',
    isBuiltin: true
  },

  // ==========================================
  // 5. CINEMATIC VIDEOS
  // ==========================================
  {
    id: 'builtin-vid-1',
    name: 'Ferrari 812 Superfast',
    category: 'Videos',
    src: 'assets/videos/ferrari_812_superfast.mp4',
    thumb: 'assets/videos/ferrari_812_superfast_thumb.jpg',
    isVideo: true,
    meta: '6.5L Naturally Aspirated V12 • 789 HP • Cinematic Motion',
    camera: 'RED V-RAPTOR 8K // 35MM CINEMA PRIME',
    isBuiltin: true
  },
  {
    id: 'builtin-vid-2',
    name: 'Mercedes-Maybach S 680 Luxury Motion',
    category: 'Videos',
    src: 'assets/videos/mercedes_maybach_s680.mp4',
    thumb: 'assets/videos/mercedes_maybach_s680_thumb.jpg',
    isVideo: true,
    meta: '6.0L Biturbo V12 • 621 HP • Ultra-Luxury Motion',
    camera: 'ARRI ALEXA MINI LF // 50MM ANAMORPHIC',
    isBuiltin: true
  },
  {
    id: 'builtin-vid-3',
    name: 'Ford Mustang GT Drift',
    category: 'Videos',
    src: 'assets/videos/ford_mustang_gt.mp4',
    thumb: 'assets/videos/ford_mustang_gt_thumb.jpg',
    isVideo: true,
    meta: '5.0L Coyote V8 • 480 HP • High-Speed Tire Smoke',
    camera: 'RED MONSTRO 8K // 24-70MM T2.9',
    isBuiltin: true
  },
  {
    id: 'builtin-vid-4',
    name: 'Rolls-Royce Heritage Classic & Modern',
    category: 'Videos',
    src: 'assets/videos/rolls_royce_heritage.mp4',
    thumb: 'assets/videos/rolls_royce_heritage_thumb.jpg',
    isVideo: true,
    meta: '6.75L Twin-Turbo V12 & Classic Phantom • Stately Elegance',
    camera: 'SONY VENICE 2 // 50MM T1.5 CINE',
    isBuiltin: true
  }
];

// Seed into the central WallpaperService registry
if (typeof window !== 'undefined' && window.wallpaperService) {
  window.wallpaperService.addWallpapersBatch(INITIAL_WALLPAPERS);
}

// Backward compatibility references
const BUILTIN_CATEGORIES = [
  'Luxury Cars',
  'Sports Cars',
  'Classic Cars',
  'Off-Road & SUVs',
  'Videos'
];

if (typeof window !== 'undefined') {
  window.BUILTIN_CATEGORIES = BUILTIN_CATEGORIES;
  window.INITIAL_WALLPAPERS = INITIAL_WALLPAPERS;
  
  // Maintain dynamic getter for BUILTIN_WALLPAPERS
  try {
    Object.defineProperty(window, 'BUILTIN_WALLPAPERS', {
      get: function () {
        return window.wallpaperService ? window.wallpaperService.getAllWallpapers() : INITIAL_WALLPAPERS;
      },
      configurable: true
    });
  } catch (e) {
    window.BUILTIN_WALLPAPERS = INITIAL_WALLPAPERS;
  }
}
