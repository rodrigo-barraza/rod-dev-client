import { notFound } from "next/navigation";
import type { Metadata } from "next";
import lodash from "lodash";
import ArtCollectionsCollection from "@/collections/ArtCollectionsCollection";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import ClientCollection from "./ClientCollection";

type Props = {
  params: Promise<{ id: string }>;
};

// Every collection is known at build time, so each page is prerendered; the
// "More collections" row is re-dealt at most every five minutes.
export const revalidate = 300;

export function generateStaticParams() {
  return ArtCollectionsCollection.map((collection) => ({
    id: collection.path,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const currentCollectionPath = resolvedParams.id;
  const currentCollection = ArtCollectionsCollection.find(
    (collection) => collection.path === currentCollectionPath,
  );

  if (!currentCollection) {
    return {};
  }

  let image: string | undefined = undefined;
  if (currentCollection.thumbnail) {
    image = UtilityLibrary.renderAssetPath(
      currentCollection.thumbnail,
      currentCollection.path,
    );
  } else if (currentCollection.works[0]?.imagePath) {
    image = UtilityLibrary.renderAssetPath(
      currentCollection.works[0].imagePath,
      currentCollection.path,
    );
  } else if (currentCollection.poster) {
    image = UtilityLibrary.renderAssetPath(
      currentCollection.poster,
      currentCollection.path,
    );
  }

  return {
    title: currentCollection.documentTitle,
    description: currentCollection.documentDescription,
    keywords: currentCollection.documentKeywords,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const currentCollectionPath = resolvedParams.id;
  const currentCollection = ArtCollectionsCollection.find(
    (collection) => collection.path === currentCollectionPath,
  );

  if (!currentCollection) {
    notFound();
  }

  const moreCollections = lodash
    .shuffle(
      ArtCollectionsCollection.filter(
        (collection) => collection.path !== currentCollection.path,
      ),
    )
    .slice(0, 3)
    .map((collection) => UtilityLibrary.collectionTile(collection));

  return (
    <ClientCollection
      currentCollectionWorks={currentCollection.works}
      currentCollection={currentCollection}
      moreCollections={moreCollections}
    />
  );
}
