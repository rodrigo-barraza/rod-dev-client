import type { Metadata } from "next";
import lodash from "lodash";
import ClientHome from "./ClientHome";
import ArtCollectionsCollection from "@/collections/ArtCollectionsCollection";
import UtilityLibrary from "@/libraries/UtilityLibrary";

export const metadata: Metadata = {
  title: "Rodrigo Barraza: Photographer, Software Engineer, Artist",
  description:
    "Visual portfolio of Rodrigo Barraza, a Vancouver-based photographer, software engineer and generative AI artist. Featuring photography, AI art, film, and animation collections.",
  keywords:
    "rodrigo barraza, photographer, software engineer, artist, vancouver, generative ai art, clip guided diffusion, film photography, medium format photography, ai artist, portfolio, emily carr university",
  openGraph: {
    images: [
      "https://assets.rod.dev/rod-dev-assets/collections/dreamwork/rodrigo-barraza-dreamwork-beach-medium-format-fuji-velvia-100.jpg",
    ],
  },
};

// The gallery is shuffled here, on the server, so it ships in the HTML. It
// used to be shuffled in an effect after hydration, which left the
// prerendered page — what a crawler and the first paint see — with no
// gallery at all. The page is re-dealt at most every five minutes.
export const revalidate = 300;

export default function Page() {
  const tiles = lodash
    .shuffle(ArtCollectionsCollection)
    .map((collection) => UtilityLibrary.collectionTile(collection));
  return <ClientHome tiles={tiles} />;
}
