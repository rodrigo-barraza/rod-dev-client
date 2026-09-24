// ============================================================
// rod.dev Client — Shared Type Definitions
// ============================================================

import type { CSSProperties, ReactNode } from "react";

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

/** What a gallery tile needs from a collection, with asset URLs resolved. */
export interface CollectionTile {
  path: string;
  title: string;
  year: number;
  medium: string;
  alt: string;
  image?: string;
  video?: string;
  poster?: string;
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

// ─── WebGPU ─────────────────────────────────────────────────

/**
 * Lifecycle of a WebGPU session. `lost` is distinct from `error`: a lost
 * device is recoverable (the browser dropped it — driver reset, tab
 * backgrounded on a laptop switching GPUs) and the hook re-initialises,
 * while `error` and `unsupported` are terminal until something changes.
 */
export type WebGpuStatus =
  "idle" | "initializing" | "ready" | "lost" | "unsupported" | "error";

/**
 * Why initialisation stopped. Kept separate from the message so the UI can
 * branch on the cause without matching on prose: "unsupported" wants a
 * browser-upgrade nudge, "no-adapter" wants a "no GPU we can drive" note.
 */
export type WebGpuFailureKind =
  | "unsupported"
  | "no-adapter"
  | "no-device"
  | "no-context"
  | "device-lost"
  | "error";

export interface WebGpuFailure {
  kind: WebGpuFailureKind;
  message: string;
  cause?: unknown;
}

/**
 * A flattened, render-safe description of the adapter. `GPUAdapter` itself
 * exposes features as a set-like and limits as a live object; both are
 * awkward in React state and in tests, so they are copied into plain data
 * once at initialisation.
 */
export interface WebGpuAdapterReport {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
  isFallbackAdapter: boolean;
  features: string[];
  limits: Record<string, number>;
  preferredFormat: GPUTextureFormat;
}

/** Everything a renderer needs, handed over as one object. */
export interface WebGpuSession {
  /** Bumped on every successful (re)initialisation, including recovery from
   * a lost device. Consumers key their GPU resources on it — buffers and
   * pipelines from generation N are invalid on generation N + 1. */
  generation: number;
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  canvas: HTMLCanvasElement;
  format: GPUTextureFormat;
  alphaMode: GPUCanvasAlphaMode;
  report: WebGpuAdapterReport;
}

export interface WebGpuInitOptions {
  canvas: HTMLCanvasElement;
  powerPreference?: GPUPowerPreference;
  /** Features the caller cannot run without. A missing one fails the init
   * rather than silently handing back a device that cannot do the job. */
  requiredFeatures?: GPUFeatureName[];
  /** Features taken if the adapter has them. Filtered before the device
   * request, because `requestDevice` rejects outright on an unsupported
   * feature name. */
  optionalFeatures?: GPUFeatureName[];
  /** Limits are negotiated the same way: a value above what the adapter
   * reports rejects the request, so each one is clamped first. */
  requiredLimits?: Record<string, number>;
  alphaMode?: GPUCanvasAlphaMode;
  /** Extra usage flags for the swap-chain texture. `RENDER_ATTACHMENT` is
   * always included — without it the canvas texture cannot be drawn to. */
  usage?: GPUTextureUsageFlags;
  toneMapping?: GPUCanvasToneMapping;
  label?: string;
  onDeviceLost?: (info: GPUDeviceLostInfo) => void;
  onUncapturedError?: (error: GPUError) => void;
}

export interface WebGpuSizeOptions {
  /** Upper bound on `devicePixelRatio`. A 3× phone panel at full ratio
   * costs 9× the fragments of a 1× one for pixels nobody can resolve. */
  maxPixelRatio?: number;
  /** Hard clamp, defaulted from `device.limits.maxTextureDimension2D`. A
   * canvas sized past it configures the context into an error state. */
  maxDimension?: number;
}

export interface WebGpuFrame {
  session: WebGpuSession;
  /** Milliseconds since the loop started. */
  time: number;
  /** Milliseconds since the previous frame, clamped so a backgrounded tab
   * does not hand a simulation a multi-second step on its first frame back. */
  deltaTime: number;
  frame: number;
  width: number;
  height: number;
}

export interface WebGpuCanvasComponentProps {
  className?: string;
  style?: CSSProperties;
  alphaMode?: GPUCanvasAlphaMode;
  powerPreference?: GPUPowerPreference;
  requiredFeatures?: GPUFeatureName[];
  optionalFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
  maxPixelRatio?: number;
  label?: string;
  /** Called once per successful initialisation, and again after recovery
   * from a lost device — build pipelines and buffers here. */
  onSessionReady?: (session: WebGpuSession) => void;
  /** Called before a session's device goes away: release anything the
   * consumer allocated against it. */
  onSessionEnd?: (session: WebGpuSession) => void;
  onFailure?: (failure: WebGpuFailure) => void;
  /** Supplying this starts the frame loop. Without it the canvas stays
   * blank and no work is submitted at all. */
  onFrame?: (frame: WebGpuFrame) => void;
  onResize?: (session: WebGpuSession, width: number, height: number) => void;
  /** Shown in place of the canvas when WebGPU is unavailable. */
  fallback?: ReactNode;
  /** Overlaid on the canvas (HUD, controls, status). */
  children?: ReactNode;
}
