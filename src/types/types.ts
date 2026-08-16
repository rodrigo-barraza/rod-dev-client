// ============================================================
// rod.dev Client — Shared Type Definitions
// ============================================================

import type { ReactNode } from "react";

// ─── SEO / Meta ─────────────────────────────────────────────

export interface Meta {
  title: string;
  description: string;
  keywords: string;
  type?: string;
  date?: string;
  url?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}

export interface PageProps {
  meta: Meta;
}

// ─── Art Collections ────────────────────────────────────────

export interface ArtWork {
  path?: string;
  imagePath?: string;
  videoPath?: string;
  title: string;
  medium?: string;
  ekphrasis?: string;
  description?: string;
  caption?: string;
  seoDescription?: string;
  filename?: string;
  year?: string | number;
  duration?: number;
  uploadDate?: string;
  poster?: string;
  orientation?: string;
}

export interface ArtCollection {
  documentTitle: string;
  documentKeywords: string;
  documentDescription: string;
  title: string;
  type: string;
  medium: string;
  year: number;
  path: string;
  ekphrasis?: string;
  description?: string;
  orientation?: string;
  thumbnail?: string;
  poster?: string;
  imagePath?: string;
  videoControls?: boolean;
  duration?: number;
  works: ArtWork[];
}

// ─── Exercise / Gym ─────────────────────────────────────────

export interface Exercise {
  name: string;
  style: string[];
  stance: string[];
  equipment: string[];
  position: string[];
  type: string;
  form?: string[];
}

export interface GymSet {
  id?: string;
  date: string;
  exercise: string;
  weight: string;
  reps: string;
  unit: string;
  style?: string;
  stance?: string;
  equipment?: string;
  position?: string;
  form?: string;
}

export interface JournalEntry {
  id?: string;
  exercise: string;
  date: string;
  part: string;
  position?: string;
  stance?: string;
  style?: string;
  form?: string;
  equipment?: string;
  daysSinceLastExercise?: number;
  sets: GymSet[];
}

/** Date-keyed → exercise-keyed → JournalEntry */
export type JournalMap = Record<string, Record<string, JournalEntry>>;

// ─── Render / Generation ────────────────────────────────────

export interface Render {
  id: string;
  image: string;
  thumbnail?: string;
  prompt: string;
  style: string;
  sampler: string;
  config: number;
  count?: number;
  createdAt: string;
  aspectRatio?: string;
  like?: boolean;
  likes?: number;
  favorite?: boolean;
  favorites?: number;
  isCreator?: boolean;
  provider?: string;
  model?: string;
  estimatedCost?: number;
}

// ─── Guest ──────────────────────────────────────────────────

export interface Guest {
  id?: string;
  likes?: number;
  favorites?: number;
  renders?: number;
  ip?: string;
}

// ─── Select / Form Options ──────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

// ─── About / Bio ────────────────────────────────────────────

export interface AboutEntry {
  name: string;
  year: string;
  venue: string;
  location?: string;
  url?: string;
}

export interface AboutSection {
  name: string;
  collections: AboutEntry[];
}

// ─── Clients ────────────────────────────────────────────────

export interface Client {
  name: string;
  url?: string;
  logo?: string;
}

// ─── Socials ────────────────────────────────────────────────

export interface Social {
  name: string;
  url: string;
  type: string;
}

// ─── Projects ───────────────────────────────────────────────

export interface Project {
  title: string;
  year: string;
  description: string;
  languages: string[];
  link?: string;
  github?: string;
  googleColab?: string;
}

// ─── Component Props ────────────────────────────────────────

export interface ButtonComponentProps {
  label?: string;
  type?: "button" | "submit" | "action";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  icon?: string;
  href?: string;
  routeHref?: string;
  logo?: string;
}

export interface InputComponentProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}

export interface SelectComponentProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface SliderComponentProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export interface TextAreaComponentProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export interface PaginationComponentProps {
  postsPerPage: number;
  totalPosts: number;
  paginate: (pageNumber: number) => void;
  currentPage: number;
}

export interface GalleryComponentProps {
  renders: Render[];
  getRenders?: () => void;
  getGuest?: () => void;
  mode: "grid" | "list";
}

export interface FilterComponentProps {
  setSearch: (value: string) => void;
  setFilter: (value: string) => void;
  setSort: (value: string) => void;
  setGalleryMode: (value: string) => void;
  search: string;
  filter: string;
  sort: string;
}

export interface Txt2ImageComponentProps {
  render: Render;
  setGuest: (guest: Guest) => void;
}

export interface LikeComponentProps {
  type: "like" | "favorite";
  render: Render;
  setFunction: (id: string) => void;
  setGuest?: (guest: Guest) => void;
}

export interface ExerciseComponentProps {
  entry: JournalEntry | null;
  ghost?: boolean;
}

export interface GenerateHeaderComponentProps {
  guest: Guest;
  renders: Render[];
}

export interface SeoHeadComponentProps {
  meta: Meta;
}

export interface DialogComponentProps {
  show: boolean | string;
  children: ReactNode;
}

export interface BadgeComponentProps {
  type: "sampler" | "style";
  value: string;
}

// ─── API Response Wrapper ───────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T;
  error?: unknown;
  response?: Response;
}
