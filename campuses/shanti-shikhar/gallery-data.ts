import { SHK_CONTENT, type ShkImage } from './content';

/**
 * Gallery albums follow the media groups in content/.
 * `src` stays empty until Strapi replaces the placeholders.
 */

export type ShkGalleryImage = {
  id: string;
  src: string;
  thumbSrc: string;
  alt: string;
  width?: number;
  height?: number;
};

export type ShkGalleryAlbum = {
  id: string;
  title: string;
  items: ShkGalleryImage[];
};

export type ShkGalleryGroup = {
  id: string;
  heading: string;
  subheading: string;
  albums: ShkGalleryAlbum[];
};

export type ShkGalleriesPageData = {
  sectionTitle: string;
  groups: ShkGalleryGroup[];
  totalImages: number;
  heroImage: string | null;
};

function toImage(image: ShkImage): ShkGalleryImage {
  return {
    id: image.id,
    src: image.src ?? '',
    thumbSrc: image.src ?? '',
    alt: image.alt,
  };
}

export function getShkGalleries(): ShkGalleriesPageData {
  const albums: ShkGalleryAlbum[] = [
    {
      id: 'campus',
      title: 'Campus',
      items: [
        SHK_CONTENT.hero.media,
        SHK_CONTENT.about.media,
        SHK_CONTENT.inauguration.slides[5],
        SHK_CONTENT.inauguration.slides[6],
      ].map(toImage),
    },
    {
      id: 'inauguration',
      title: 'Inauguration',
      items: SHK_CONTENT.inauguration.slides.slice(0, 5).map(toImage),
    },
    {
      id: 'facilities',
      title: 'Facilities',
      items: SHK_CONTENT.facilities.items.map((item) => toImage(item.media)),
    },
  ];

  const groups: ShkGalleryGroup[] = [
    {
      id: 'campus-life',
      heading: 'Campus in pictures',
      subheading:
        'Shanti Shikhar, Nava Raipur — the campus, the inauguration and the facilities. Photographs will appear here when they are ready.',
      albums,
    },
  ];

  return {
    sectionTitle: 'Gallery',
    groups,
    totalImages: albums.reduce((sum, album) => sum + album.items.length, 0),
    heroImage: null,
  };
}
