import SamplerCollection from "@/collections/SamplerCollection";
import StyleCollection from "@/collections/StyleCollection";
import type { GymSet, JournalMap } from "@/types/types";
import type { IncomingMessage } from "http";

// Use native Temporal if available, otherwise polyfill (Safari)
import { Temporal as TemporalPolyfill } from "@js-temporal/polyfill";
const Temporal: typeof TemporalPolyfill =
  ((globalThis as Record<string, unknown>)
    .Temporal as typeof TemporalPolyfill) ?? TemporalPolyfill;

const ASSETS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_ASSETS_PUBLIC_URL || "https://assets.rod.dev";
const ASSETS_BUCKET =
  process.env.NEXT_PUBLIC_ROD_DEV_ASSETS_MINIO_BUCKET_NAME || "rod-dev-assets";
const GENERATIONS_BUCKET =
  process.env.NEXT_PUBLIC_ROD_DEV_MINIO_BUCKET_NAME || "rod-dev-generations";

const ASSETS_BASE_URL = `${ASSETS_PUBLIC_URL}/${ASSETS_BUCKET}`;
const GENERATIONS_BASE_URL = `${ASSETS_PUBLIC_URL}/${GENERATIONS_BUCKET}`;

const UtilityLibrary = {
  // ─── Date Utilities (Temporal API) ──────────────────────────

  /**
   * Formats a date string to a human-readable date.
   * Uses Temporal.Instant → ZonedDateTime for locale-aware formatting.
   */
  toHumanDateAndTime(date: string) {
    if (date) {
      const instant = Temporal.Instant.from(new Date(date).toISOString());
      const zdt = instant.toZonedDateTimeISO(Temporal.Now.timeZoneId());
      return zdt.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  },

  /**
   * Formats a date string to a human-readable time.
   */
  toTime(date: string) {
    if (date) {
      const instant = Temporal.Instant.from(new Date(date).toISOString());
      const zdt = instant.toZonedDateTimeISO(Temporal.Now.timeZoneId());
      return zdt.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  },

  /**
   * Checks if the given date is today using Temporal.PlainDate comparison.
   */
  isToday(date: string) {
    if (date) {
      const parsedDate = Temporal.PlainDate.from(this.toISODateString(date));
      const today = Temporal.Now.plainDateISO();
      return Temporal.PlainDate.compare(parsedDate, today) === 0;
    }
  },

  /**
   * Checks if two dates fall on the same calendar day.
   */
  isSameDay(date1: string, date2: string) {
    if (date1 && date2) {
      const d1 = Temporal.PlainDate.from(this.toISODateString(date1));
      const d2 = Temporal.PlainDate.from(this.toISODateString(date2));
      return Temporal.PlainDate.compare(d1, d2) === 0;
    }
  },

  /**
   * Formats a Date or ISO string to 'YYYY-MM-DD' using Temporal.PlainDate.
   */
  toISODateString(date: string | Date): string {
    // Parse through native Date to handle any date string format,
    // then extract as PlainDate
    const parsedDate = new Date(date);
    const plain = Temporal.PlainDate.from({
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth() + 1,
      day: parsedDate.getDate(),
    });
    return plain.toString(); // 'YYYY-MM-DD'
  },

  /**
   * Returns today's date as 'YYYY-MM-DD' using Temporal.Now.
   */
  todayISOString(): string {
    return Temporal.Now.plainDateISO().toString();
  },

  /**
   * Returns the number of full days between now and the given date.
   * Uses Temporal.PlainDate.until() for precise calendar arithmetic.
   */
  daysSince(date: string | Date): number {
    const target = Temporal.PlainDate.from(this.toISODateString(date));
    const today = Temporal.Now.plainDateISO();
    const duration = target.until(today, { largestUnit: "day" });
    return duration.days;
  },

  // ─── Number Utilities ───────────────────────────────────────

  decimalSeparator(number: number) {
    if (number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  },

  // ─── Exercise Utilities ─────────────────────────────────────

  calculateSetVolume(weight: string, volume: string) {
    return Number(weight) * Number(volume);
  },

  calculateTotalVolume(sets: GymSet[]) {
    if (sets && sets.length) {
      let totalVolume = 0;
      sets.forEach((set) => {
        totalVolume += this.calculateSetVolume(set.weight, set.reps);
      });
      return totalVolume;
    }
    return 0;
  },

  calculateTotalDayVolume(journal: JournalMap, date: string) {
    let totalVolume = 0;
    if (journal[date]) {
      Object.values(journal[date]).forEach((exercise) => {
        totalVolume += this.calculateTotalVolume(exercise.sets);
      });
    }
    return totalVolume;
  },

  calculateAverageWeight(sets: GymSet[]) {
    if (sets && sets.length) {
      let totalWeight = 0;
      sets.forEach((set) => {
        totalWeight += Number(set.weight);
      });
      return (totalWeight / sets.length).toFixed(1);
    }
  },

  calculateAverageReps(sets: GymSet[]) {
    if (sets && sets.length) {
      let totalReps = 0;
      sets.forEach((set) => {
        totalReps += Number(set.reps);
      });
      return (totalReps / sets.length).toFixed(1);
    }
  },

  calculateTotalReps(sets: GymSet[]) {
    if (sets && sets.length) {
      let totalReps = 0;
      sets.forEach((set) => {
        totalReps += Number(set.reps);
      });
      return totalReps;
    }
  },

  calculateSetVolumeRatio(set: GymSet, sets: GymSet[]) {
    const totalVolume = this.calculateTotalVolume(sets);
    const setVolume = this.calculateSetVolume(set.weight, set.reps);
    return ((setVolume / totalVolume) * 100).toFixed(0);
  },

  buildExerciseSubtitle(
    entry: {
      form?: string | string[];
      style?: string | string[];
      stance?: string | string[];
      position?: string | string[];
      equipment?: string | string[];
    } | null,
  ): string {
    if (!entry) return "";
    const parts: string[] = [];
    if (entry.form)
      parts.push(Array.isArray(entry.form) ? entry.form[0] : entry.form);
    if (entry.style)
      parts.push(Array.isArray(entry.style) ? entry.style[0] : entry.style);
    if (entry.stance)
      parts.push(Array.isArray(entry.stance) ? entry.stance[0] : entry.stance);
    if (entry.position)
      parts.push(
        Array.isArray(entry.position) ? entry.position[0] : entry.position,
      );
    if (entry.equipment)
      parts.push(
        Array.isArray(entry.equipment) ? entry.equipment[0] : entry.equipment,
      );
    return parts.join(", ");
  },

  // ─── Render / Style Utilities ───────────────────────────────

  findSamplerLabel(sampler: string) {
    if (sampler) {
      const foundSampler = SamplerCollection.find(
        (samplerOption) => samplerOption.value === sampler,
      );
      if (foundSampler && foundSampler.label) {
        return `🖌️ ${foundSampler.label}`;
      }
    }
  },

  findStyleLabel(style: string) {
    if (style) {
      const foundStyle = StyleCollection.find(
        (styleOption) => styleOption.value === style,
      );
      if (foundStyle && foundStyle.label != "None") {
        return `🎨 ${foundStyle.label}`;
      }
    }
  },

  findStyle(style: string) {
    if (style) {
      const foundStyle = StyleCollection.find(
        (styleOption) => styleOption.value === style,
      );
      return foundStyle;
    }
    return undefined;
  },

  // ─── Media Utilities ────────────────────────────────────────

  downloadImage(imagePath: string, imageId: string) {
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = imagePath;
    downloadAnchor.download = `rod.dev ${imageId}.png`;
    downloadAnchor.target = "_blank";
    downloadAnchor.click();
  },

  /**
   * Copy a shareable link to the clipboard for a given generation ID.
   */
  shareLink(id: string, basePath = "/generate"): string {
    const shareLink = `${window.location.origin}${basePath}?id=${id}`;
    navigator.clipboard.writeText(shareLink);
    return shareLink;
  },

  renderAssetPath(
    assetPath: string,
    collectionPath: string | undefined,
  ): string {
    let path = `/`;
    if (assetPath && !collectionPath) {
      path = `/${assetPath}`;
    } else if (!assetPath && collectionPath) {
      path = `/collections/${collectionPath}`;
    } else if (assetPath && collectionPath) {
      path = `/collections/${collectionPath}/${assetPath}`;
    }
    return `${ASSETS_BASE_URL}${path}`;
  },

  /**
   * Construct the CDN icon URL for a given icon name.
   * Used by ButtonComponent and FooterComponent.
   */
  getIconUrl(icon: string): string {
    return `${ASSETS_BASE_URL}/icons/${icon}.png`;
  },

  /**
   * Construct the CDN URL for a generation image.
   */
  getGenerationUrl(id: string, extension = "jpg"): string {
    return `${GENERATIONS_BASE_URL}/${id}.${extension}`;
  },

  imageFullScreen(
    event: React.MouseEvent<HTMLElement>,
    collectionPath: string,
    workImagePath: string | undefined,
  ) {
    (event.target as HTMLElement).requestFullscreen();
  },

  // ─── String Utilities ───────────────────────────────────────

  capitalize(string: string) {
    if (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  },

  uppercase(string: string) {
    if (string) {
      return string.toUpperCase();
    }
  },

  // ─── Duration Utilities ─────────────────────────────────────

  humanDuration(durationInSeconds: number | undefined): string {
    if (!durationInSeconds) return "";
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    let humanDurationString = "";
    if (seconds && !minutes) {
      humanDurationString = `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
    } else if (minutes && !seconds) {
      humanDurationString = `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
    } else if (minutes && seconds) {
      humanDurationString = `${minutes} ${minutes === 1 ? "minute" : "minutes"} ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
    }
    return humanDurationString;
  },

  // ─── Video Utilities ────────────────────────────────────────

  playVideoOnMouseOver(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    const target = event.target as HTMLElement;
    const video = target.querySelector("video");
    if (video) {
      video.play();
    }
  },

  stopVideoOnMouseOver(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    const target = event.target as HTMLElement;
    const video = target.querySelector("video");
    if (video) {
      video.load();
    }
  },

  // ─── Navigation Utilities ───────────────────────────────────

  navigateToGeneration(router: { push: (url: string) => void }, id?: string) {
    if (id) {
      router.push(`/generate?id=${id}`);
    } else {
      router.push(`/generate`);
    }
  },

  // ─── SSR Utilities ──────────────────────────────────────────

  buildPageMeta(
    resolvedUrl: string,
    overrides: {
      title: string;
      description: string;
      keywords: string;
      image?: string;
      type?: string;
      date?: string;
      jsonLd?: Record<string, unknown>;
    },
  ) {
    return {
      url: `https://rod.dev${resolvedUrl}`,
      type: "website",
      ...overrides,
    };
  },

  /**
   * Convenience wrapper for simple pages that only need meta props from getServerSideProps.
   */
  buildServerSideMetaProps(
    context: { resolvedUrl: string; req?: IncomingMessage },
    overrides: {
      title: string;
      description: string;
      keywords: string;
      image?: string;
      jsonLd?: Record<string, unknown>;
    },
  ) {
    return {
      props: {
        meta: this.buildPageMeta(context.resolvedUrl, overrides),
      },
    };
  },

  getClientIp(req: IncomingMessage) {
    const forwarded = req.headers["x-forwarded-for"];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedValue
      ? forwardedValue.split(/, /)[0]
      : (req.socket?.remoteAddress ?? "");
  },
};

export default UtilityLibrary;
