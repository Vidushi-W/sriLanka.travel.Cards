export const sectionTypes = [
  'hero',
  'nature',
  'story',
  'destinations',
  'media',
  'wellness',
  'footer',
];
export const sectionLabels = {
  hero: 'Hero Section',
  nature: 'Nature Experience Cards',
  story: 'Content Section',
  destinations: 'Destination & Map',
  media: 'Video & Image Gallery',
  wellness: 'Wellness Experiences',
  footer: 'Footer',
};
export function youtubeId(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1)
        : ['youtube.com', 'youtube-nocookie.com'].includes(host)
          ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]
          : '';
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch {
    return null;
  }
}
export const defaultSection = (type) => ({
  id: crypto.randomUUID(),
  type,
  ...structuredClone(sectionDefaults[type]),
  ...(type === 'hero' ? { primaryLink: '/#destinations', secondaryLink: '/#experiences' } : {}),
  ...(type === 'story' ? { link: '/#experiences' } : {}),
});
export const sectionDefaults = {
  hero: {
    eyebrow: 'A LITTLE CLOSER TO NATURE',
    title: 'Bliss nature trails',
    description:
      'Find your natural rhythm. In emerald forests, golden wetlands and mist-covered mountains, discover a different kind of paradise.',
    image: '/images/hero.webp',
    primaryLabel: 'Explore nature trails',
    primaryLink: '#destinations',
    secondaryLabel: 'Plan your escape',
    secondaryLink: '#experiences',
  },
  nature: {
    items: [
      {
        id: 'forest',
        title: 'Forest trails',
        description: 'Take the path less travelled',
        image: '/images/forest.webp',
        link: '#destinations',
        icon: 'trees',
      },
      {
        id: 'stillness',
        title: 'Still waters',
        description: 'A little space to simply be',
        image: '/images/water.webp',
        link: '#story',
        icon: 'waves',
      },
      {
        id: 'wild',
        title: 'Wild encounters',
        description: 'Where wonder comes naturally',
        image: '/images/wildlife.webp',
        link: '#destinations',
        icon: 'leaf',
      },
    ],
  },
  story: {
    eyebrow: 'ROOTED IN NATURE. RICH IN LIFE.',
    title: 'Ancient Roots, Living Sanctuaries',
    paragraphs: [
      'Sri Lanka is a small island with an extraordinary natural soul. From the ancient rainforests of Sinharaja to the sunlit plains of our national parks, every landscape tells a story of life, resilience and a deep connection to the earth.',
      'For centuries, nature and wellbeing have grown together here. Walk beneath the canopy of towering trees, listen to the gentle rhythm of a forest stream, and discover the quiet wisdom of a culture that has always found balance in the natural world.',
      'Responsible wildlife encounters, winding forest trails and moments of unhurried stillness. These are the experiences that stay with you, long after the journey ends.',
    ],
    image: '/images/wellness.webp',
    cardLabel: 'NATURALLY RESTORATIVE',
    quote:
      'To walk these misty highland paths is to partake in the wisdom of traditional healers, where every breath whispers restorative peace.',
    attribution: 'Discover the art of slowing down',
    linkLabel: 'Explore wellness',
    link: '#experiences',
  },
  destinations: {
    title: 'Interactive Trail & Destination Map',
    description:
      'Discover Sri Lanka’s most treasured places. Find a trail, follow your curiosity, and let nature lead the way.',
    items: [
      {
        id: 'sinharaja',
        title: 'Sinharaja',
        description: 'A living rainforest, alive with birdsong and extraordinary biodiversity.',
        category: 'Forest reserves',
        lat: 6.405,
        lng: 80.447,
        image: '/images/forest.webp',
        location: 'Sabaragamuwa & Southern Provinces',
      },
      {
        id: 'ella',
        title: 'Ella',
        description: 'Misty mountains, tea gardens and trails with unforgettable views.',
        category: 'Highland trails',
        lat: 6.8667,
        lng: 81.0466,
        image: '/images/hero.webp',
        location: 'Uva Province',
      },
      {
        id: 'horton',
        title: 'Horton Plains',
        description: 'Follow the grasslands to the breathtaking edge of World’s End.',
        category: 'Highland trails',
        lat: 6.802,
        lng: 80.807,
        image: '/images/hero.webp',
        location: 'Central Province',
      },
      {
        id: 'wilpattu',
        title: 'Wilpattu',
        description: 'Quiet forest tracks, natural lakes and wild encounters.',
        category: 'National parks',
        lat: 8.45,
        lng: 80.05,
        image: '/images/wildlife.webp',
        location: 'North Western Province',
      },
      {
        id: 'minneriya',
        title: 'Minneriya',
        description: 'Discover elephant country around an ancient reservoir.',
        category: 'National parks',
        lat: 8.037,
        lng: 80.903,
        image: '/images/wildlife.webp',
        location: 'North Central Province',
      },
      {
        id: 'knuckles',
        title: 'Knuckles',
        description: 'A spectacular mountain range woven with forest paths.',
        category: 'Highland trails',
        lat: 7.45,
        lng: 80.8,
        image: '/images/forest.webp',
        location: 'Central Province',
      },
      {
        id: 'tangalle',
        title: 'Tangalle',
        description: 'Slow coastal mornings, lagoon life and a gentler rhythm.',
        category: 'Coastal escapes',
        lat: 6.024,
        lng: 80.794,
        image: '/images/water.webp',
        location: 'Southern Province',
      },
    ],
  },
  media: {
    title: 'A taste of island life',
    videoUrl: 'https://www.youtube.com/watch?v=s4xgCFEsTEI',
    videoPoster: '/images/gallery-4.webp',
    items: [
      'Island colours',
      'Ceylon tea rituals',
      'A warm island welcome',
      'Flavours of Sri Lanka',
      'Sweet traditions',
      'Ayurvedic wellbeing',
      'Discover local treasures',
      'Moments of mindfulness',
      'Restore your natural balance',
    ].map((title, i) => ({
      id: `gallery-${i + 1}`,
      title,
      image: `/images/gallery-${i + 1}.webp`,
    })),
  },
  wellness: {
    title: 'Explore Wellness Experiences',
    description: 'Find your perfect path to balance, healing and inner peace.',
    items: [
      {
        id: 'ayurveda',
        title: 'Ayurveda',
        description: 'Ancient wisdom. Renewed wellbeing.',
        image: '/images/wellness.webp',
        link: '/experiences/ayurveda',
      },
      {
        id: 'mindfulness',
        title: 'Mindful moments',
        description: 'Make room for a quieter mind.',
        image: '/images/gallery-8.webp',
        link: '/experiences/mindful-moments',
      },
      {
        id: 'food',
        title: 'Nourish naturally',
        description: 'Fresh flavours, rooted in tradition.',
        image: '/images/gallery-4.webp',
        link: '/experiences/nourish-naturally',
      },
      {
        id: 'retreats',
        title: 'Healing retreats',
        description: 'Let the island restore you.',
        image: '/images/water.webp',
        link: '/experiences/healing-retreats',
      },
      {
        id: 'rituals',
        title: 'Island rituals',
        description: 'Little moments of everyday bliss.',
        image: '/images/gallery-2.webp',
        link: '/experiences/island-rituals',
      },
      {
        id: 'nature',
        title: 'Into the wild',
        description: 'Reconnect with the natural world.',
        image: '/images/wildlife.webp',
        link: '/experiences/into-the-wild',
      },
    ],
  },
  footer: {
    title: 'So Sri Lanka',
    description:
      'An island of extraordinary discoveries. Come for the beauty. Stay for the feeling.',
    address: 'Sri Lanka Tourism Promotion Bureau, 80 Galle Road, Colombo 03, Sri Lanka',
    email: 'info@srilanka.travel',
    phone: '+94 11 242 6900',
    copyright: 'Sri Lanka Tourism. All rights reserved.',
    items: [
      { id: 'f1', title: 'Discover Sri Lanka', description: 'Explore', link: '#story' },
      { id: 'f2', title: 'Nature & wildlife', description: 'Explore', link: '#destinations' },
      { id: 'f3', title: 'Wellness experiences', description: 'Explore', link: '#experiences' },
      {
        id: 'f4',
        title: 'Plan your journey',
        description: 'Travel information',
        link: 'https://www.srilanka.travel/',
      },
      {
        id: 'f5',
        title: 'Tourism information',
        description: 'Travel information',
        link: 'https://www.srilanka.travel/',
      },
      {
        id: 'f6',
        title: 'Contact us',
        description: 'Travel information',
        link: 'mailto:info@srilanka.travel',
      },
      {
        id: 'social1',
        title: 'Instagram',
        description: 'Follow us',
        link: 'https://www.instagram.com/destination_srilanka/',
      },
      {
        id: 'social2',
        title: 'Facebook',
        description: 'Follow us',
        link: 'https://www.facebook.com/srilanka.travel/',
      },
      {
        id: 'social3',
        title: 'YouTube',
        description: 'Follow us',
        link: 'https://www.youtube.com/@SriLankaTourism',
      },
    ],
  },
};
export const seedPage = {
  title: 'Bliss nature trails',
  slug: 'home',
  sections: sectionTypes.map((type) => ({
    id: type,
    type,
    ...structuredClone(sectionDefaults[type]),
  })),
};
export const seedExperiencePages = sectionDefaults.wellness.items.map((item) => ({
  title: item.title,
  slug: item.link.slice(1),
  sections: [
    {
      id: 'hero',
      type: 'hero',
      ...structuredClone(sectionDefaults.hero),
      title: item.title,
      description: item.description,
      image: item.image,
      primaryLabel: 'Discover the island',
      primaryLink: '/#destinations',
      secondaryLabel: 'Back to nature',
      secondaryLink: '/',
    },
    {
      id: 'story',
      type: 'story',
      ...structuredClone(sectionDefaults.story),
      title: item.title,
      image: item.image,
      paragraphs: [
        item.description,
        'Take time to explore Sri Lanka at your own pace. Discover places, people and traditions that bring you closer to the island’s natural rhythm. Contact the tourism information team to help plan your journey.',
      ],
      linkLabel: 'Plan your visit',
      link: 'mailto:info@srilanka.travel',
    },
    { id: 'footer', type: 'footer', ...structuredClone(sectionDefaults.footer) },
  ],
}));
