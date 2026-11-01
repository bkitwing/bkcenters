/** Designed Open Graph images — one card per campus page. */
export const SP_OG_IMAGES = {
  home: 'https://media.brahmakumaris.com/assets/Sonipat_Retreat_Center_Home_Page_27f3060857.jpg',
  about:
    'https://media.brahmakumaris.com/assets/Sonipat_Retreat_Center_About_Us_Page_0a4cff2739.jpg',
  galleries:
    'https://media.brahmakumaris.com/assets/Gallery_Sonipat_Retreat_Center_4634a6587b.jpg',
  news: 'https://media.brahmakumaris.com/assets/News_Us_Brahma_Kumaris_591000326c.jpg',
  contact:
    'https://media.brahmakumaris.com/assets/Contact_Us_Brahma_Kumaris_a580910ba0.jpg',
} as const;

export type SpOgPage = keyof typeof SP_OG_IMAGES;

export function spOg(page: SpOgPage) {
  return SP_OG_IMAGES[page];
}
