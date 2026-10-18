/**
 * Aarkis Collection — Product Catalog & Brand Data
 * 
 * Central data source for all garments, categories, and editorial copy.
 * Easy to update, add new SKUs, or modify pricing.
 */

export const BRAND_DATA = {
  name: "Aarkis Collection",
  tagline: "Style your own way",
  subTagline: "Modern Sophistication & Individual Expression",
  established: "2026",
  logo: "/images/brand/aarkis-logo.jpg",
  announcement: "An expression of your own style.",
  editorialIntro: {
    eyebrow: "Maison Aarkis",
    title: "Designed for the way you express yourself.",
    subtitle: "Discover thoughtfully curated styles that bring modern sophistication and individual expression together.",
    note: "Crafted for women who define elegance on their own terms."
  },
  editorialCampaign: {
    tag: "Editorial Campaign",
    title: "Elegance, in your own language.",
    body: "Explore a collection shaped around confidence, individuality, and the details that make a style your own. We believe true sophistication lies in architectural silhouettes, immaculate cuts, and the quiet freedom to style each piece in harmony with your mood.",
    quote: "A woman's wardrobe is not a uniform — it is her personal canvas."
  },
  brandValues: [
    {
      id: "thoughtful-selection",
      title: "Thoughtful Selection",
      description: "Every silhouette is rigorously considered, harmonizing sculptural tailoring with effortless everyday mobility."
    },
    {
      id: "personal-style",
      title: "A Personal Sense of Style",
      description: "Versatile modular pieces designed to be styled your own way — paired together or reimagined with your existing wardrobe."
    },
    {
      id: "next-favourite",
      title: "Discover Your Next Favourite",
      description: "Timeless contemporary cuts engineered to outlive fleeting micro-trends and become enduring wardrobe signatures."
    }
  ]
};

export const CATEGORIES = [
  {
    id: "western-wear",
    name: "Western Wear",
    subline: "Tailored Waistcoats & Suiting",
    status: "active",
    statusLabel: "Available Now",
    description: "Architectural vests and precision trousers cut for contemporary presence.",
    heroImage: "/images/products/waistcoat-charcoal-grey.jpg",
    itemCount: "2 Shades"
  },
  {
    id: "festive-wear",
    name: "Festive Wear",
    subline: "Celebratory Brocades & Sets",
    status: "preview",
    statusLabel: "Coming Soon",
    description: "Luminous brocades and artisanal details crafted for memorable occasions.",
    heroImage: "/images/products/festive-brocade-coord.jpg",
    itemCount: "Preview Edition"
  },
  {
    id: "casual-wear",
    name: "Casual Wear",
    subline: "Everyday Ease & Coordinates",
    status: "preview",
    statusLabel: "Coming Soon",
    description: "Relaxed silhouettes and delicate prints designed for quiet daily luxury.",
    heroImage: "/images/products/everyday-elegance-coord.jpg",
    itemCount: "Preview Edition"
  }
];

export const PRODUCTS = [
  {
    id: "aarkis-tailored-waistcoat-set",
    name: "Aarkis Women's Tailored Lapel Neck Sleeveless Waistcoat",
    shortName: "Tailored Lapel Waistcoat Set",
    category: "Western Wear",
    categoryId: "western-wear",
    subCategory: "Suits & Blazers > Waistcoats & Suit Vests",
    isInitialCategory: true,
    price: 3490,
    priceDisplay: "₹3,490",
    priceNote: "Configurable catalog pricing",
    badge: "Signature Collection",
    description: "An impeccably tailored vest and trouser co-ord set celebrating masculine tailoring softened by feminine architectural proportions. Features a clean notch lapel, single-breasted horn-finish buttons, and high-rise relaxed straight trousers cut for fluid movement.",
    details: [
      "Notch lapel collar with clean angled front hem",
      "Single-breasted 3-button front fastening",
      "Sleeveless cut tailored for comfortable layering or solo wear",
      "Matching high-rise straight-cut trousers with trouser crease",
      "Functional side slash pockets",
      "Structured premium suiting fabric with soft drape"
    ],
    fabric: "Tailored Suiting Twill Blend",
    care: "Dry clean recommended or gentle hand wash in cold water",
    sizes: ["S", "M", "L", "XL"],
    defaultColor: "charcoal-grey",
    variants: [
      {
        id: "charcoal-grey",
        name: "Charcoal Grey",
        colorHex: "#484B4E",
        bgClass: "bg-[#484B4E]",
        image: "/images/products/waistcoat-charcoal-grey.jpg",
        caption: "Front, Profile & Back View in Charcoal Grey"
      },
      {
        id: "dusty-blue",
        name: "Dusty Blue",
        colorHex: "#7B92A8",
        bgClass: "bg-[#7B92A8]",
        image: "/images/products/waistcoat-dusty-blue.jpg",
        caption: "Front, Profile & Back View in Dusty Blue"
      }
    ]
  },
  {
    id: "aarkis-festive-brocade-coord-set",
    name: "Aarkis Women's Tailored Festive Jacquard/Brocade Co-ord Set",
    shortName: "Festive Jacquard Co-ord Set",
    category: "Festive Wear",
    categoryId: "festive-wear",
    subCategory: "Festive Wear > Co-ord Sets",
    isInitialCategory: false,
    price: 4890,
    priceDisplay: "₹4,890",
    priceNote: "Configurable catalog pricing",
    badge: "Festive Preview",
    description: "An ode to celebratory grace. An asymmetrical angrakha-inspired wrap vest cut from luminous sunset coral brocade jacquard, accented with subtle golden zari borders and artisanal hand-tied side tassels. Paired with wide-leg celebration trousers.",
    details: [
      "Asymmetric diagonal crossover wrap neckline",
      "Delicate antique gold threadwork edge border",
      "Handcrafted side tie closure with clustered silk tassels",
      "Voluminous palazzo trousers with coordinating gold border hem",
      "Full luxury inner lining for all-day comfort"
    ],
    fabric: "Artisanal Woven Jacquard Brocade",
    care: "Dry clean only to preserve metallic threadwork",
    sizes: ["S", "M", "L", "XL"],
    defaultColor: "sunset-coral",
    variants: [
      {
        id: "sunset-coral",
        name: "Sunset Coral Brocade",
        colorHex: "#DF8D78",
        bgClass: "bg-[#DF8D78]",
        image: "/images/products/festive-brocade-coord.jpg",
        caption: "Festive Coral Jacquard with Metallic Border"
      }
    ]
  },
  {
    id: "aarkis-everyday-elegance-coord-set",
    name: "Aarkis Women's Everyday Elegance Co-ord Set",
    shortName: "Everyday Elegance Co-ord Set",
    category: "Casual Wear",
    categoryId: "casual-wear",
    subCategory: "Casual Wear > Daywear Coordinates",
    isInitialCategory: false,
    price: 2990,
    priceDisplay: "₹2,990",
    priceNote: "Configurable catalog pricing",
    badge: "Casual Preview",
    description: "Effortless daytime sophistication. A relaxed tunic kurta featuring a split mandarin neckline and three-quarter gathered puff sleeves, paired with easy wide-leg pants in a soft sage-grey hue adorned with micro polka accents.",
    details: [
      "Mandarin V-slit neckline for an elongated neck",
      "Three-quarter sleeves with delicate cuff gathering",
      "Curved hem tunic top offering flattering coverage",
      "High-rise relaxed fit cropped wide-leg trousers",
      "Soft, breathable fabric ideal for warm afternoons"
    ],
    fabric: "Breathable Cotton-Linen Slub",
    care: "Machine wash cold on gentle cycle, line dry in shade",
    sizes: ["S", "M", "L", "XL"],
    defaultColor: "sage-mist",
    variants: [
      {
        id: "sage-mist",
        name: "Sage Mist Polka",
        colorHex: "#B4C2BA",
        bgClass: "bg-[#B4C2BA]",
        image: "/images/products/everyday-elegance-coord.jpg",
        caption: "Subtle Sage Polka Tunic & Relaxed Trouser"
      }
    ]
  }
];
