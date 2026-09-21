import { z } from 'zod';
import { youtubeId } from '../shared/content.js';
const text = z.string().trim().max(10000);
const short = z.string().trim().min(1).max(200);
export const safeLink = z
  .string()
  .max(2000)
  .refine(
    (v) => /^(\/(?!\/)|#[\w-]+$|https?:\/\/|mailto:|tel:)/i.test(v) && !/[\u0000-\u0020\\]/.test(v),
    'Use a local path, anchor, https URL, mailto or tel link.',
  );
export const imagePath = z
  .string()
  .regex(
    /^\/(images|uploads)\/[a-zA-Z0-9_.-]+\.(webp|png|jpe?g)$/i,
    'Select an image from the media library.',
  );
const id = z.string().min(1).max(100);
const card = z.object({
  id,
  title: short,
  description: text,
  image: imagePath,
  link: safeLink,
  icon: z.string().optional(),
});
const gallery = z.object({ id, title: short, image: imagePath });
const destination = z.object({
  id,
  title: short,
  description: text,
  category: short,
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  image: imagePath,
  location: short,
});
const base = { id };
export const sectionSchema = z.discriminatedUnion('type', [
  z.object({
    ...base,
    type: z.literal('hero'),
    eyebrow: text,
    title: short,
    description: text,
    image: imagePath,
    primaryLabel: short,
    primaryLink: safeLink,
    secondaryLabel: short,
    secondaryLink: safeLink,
  }),
  z.object({ ...base, type: z.literal('nature'), items: z.array(card).max(50) }),
  z.object({
    ...base,
    type: z.literal('story'),
    eyebrow: text,
    title: short,
    paragraphs: z.array(text).min(1).max(20),
    image: imagePath,
    cardLabel: text,
    quote: text,
    attribution: text,
    linkLabel: short,
    link: safeLink,
  }),
  z.object({
    ...base,
    type: z.literal('destinations'),
    title: short,
    description: text,
    items: z.array(destination).max(200),
  }),
  z.object({
    ...base,
    type: z.literal('media'),
    title: short,
    videoUrl: z.string().refine((v) => !!youtubeId(v), 'Enter a valid YouTube video URL.'),
    videoPoster: imagePath,
    items: z.array(gallery).max(100),
  }),
  z.object({
    ...base,
    type: z.literal('wellness'),
    title: short,
    description: text,
    items: z.array(card).max(50),
  }),
  z.object({
    ...base,
    type: z.literal('footer'),
    title: short,
    description: text,
    address: text,
    email: z.email(),
    phone: text,
    copyright: text,
    items: z.array(z.object({ id, title: short, description: short, link: safeLink })).max(50),
  }),
]);
export const pageSchema = z
  .object({
    title: short,
    slug: z
      .string()
      .min(1)
      .max(180)
      .regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/)
      .refine((v) => !/^(admin|api|uploads|images|preview)(\/|$)/.test(v), 'This URL is reserved.'),
    sections: z.array(sectionSchema).min(1).max(30),
  })
  .superRefine((page, ctx) => {
    if (new Set(page.sections.map((s) => s.id)).size !== page.sections.length)
      ctx.addIssue({ code: 'custom', message: 'Section IDs must be unique.' });
    for (const s of page.sections)
      if (s.items && new Set(s.items.map((i) => i.id)).size !== s.items.length)
        ctx.addIssue({ code: 'custom', message: 'Item IDs must be unique.' });
  });
