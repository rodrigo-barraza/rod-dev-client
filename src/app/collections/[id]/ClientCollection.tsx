"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./[id].module.scss";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import LazyVideoComponent from "@/components/LazyVideoComponent/LazyVideoComponent";
import type { ArtCollection, ArtWork, CollectionTile } from "@/types/types";

interface ClientCollectionProps {
  currentCollectionWorks: ArtWork[];
  currentCollection: ArtCollection;
  moreCollections: CollectionTile[];
}

export default function ClientCollection({
  currentCollectionWorks,
  currentCollection,
  moreCollections,
}: ClientCollectionProps) {
  return (
    <main className={styles.CollectionView}>
      <div className="collection">
        <div className="collection-details">
          <div className="container">
            <div>
              <h1>{currentCollection?.title}</h1>
              <span>{currentCollection?.year}</span>
            </div>
            <p>{currentCollection?.medium}</p>
            <p className="duration">
              {UtilityLibrary.humanDuration(currentCollection?.duration)}
            </p>

            {currentCollection?.ekphrasis && (
              <p className="ekphrasis">{currentCollection.ekphrasis}</p>
            )}
            {currentCollection?.description && (
              <p
                className="description"
                dangerouslySetInnerHTML={{
                  __html: currentCollection.description,
                }}
              ></p>
            )}
          </div>
        </div>

        {currentCollection &&
          currentCollectionWorks &&
          currentCollectionWorks.map((work: ArtWork, workIndex: number) => (
            <div
              className={`work ${work?.orientation || currentCollection?.orientation || ""}`}
              key={workIndex}
            >
              <div className="container">
                {work.imagePath && (
                  <picture>
                    <img
                      loading={workIndex === 0 ? "eager" : "lazy"}
                      decoding="async"
                      onClick={(event) =>
                        UtilityLibrary.imageFullScreen(
                          event,
                          currentCollection.path,
                          work.imagePath,
                        )
                      }
                      src={UtilityLibrary.renderAssetPath(
                        work?.imagePath,
                        currentCollection?.path,
                      )}
                      alt={work.caption || work.title}
                    ></img>
                  </picture>
                )}

                {work.videoPath && (
                  <LazyVideoComponent
                    src={UtilityLibrary.renderAssetPath(
                      work.videoPath,
                      currentCollection.path,
                    )}
                    poster={
                      work.poster
                        ? UtilityLibrary.optimizedImageUrl(
                            UtilityLibrary.renderAssetPath(
                              work.poster,
                              currentCollection.path,
                            ),
                            720,
                          )
                        : undefined
                    }
                    controls={currentCollection.videoControls}
                  />
                )}

                {currentCollectionWorks.length >= 2 && (
                  <div className="card">
                    <div>
                      <h2>{work.title}</h2>
                      <span className="year">{work.year}</span>
                    </div>
                    <p>{work.medium}</p>
                    {work?.duration && (
                      <p>{UtilityLibrary.humanDuration(work.duration)}</p>
                    )}
                    {work?.ekphrasis && (
                      <p className="ekphrasis">{work.ekphrasis}</p>
                    )}
                    {work?.description && (
                      <p
                        className="info"
                        dangerouslySetInnerHTML={{ __html: work?.description }}
                      ></p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="container more-collections">
        <div className="section-title">More collections</div>
        <div className="collections">
          {moreCollections.map((collection) => (
            <div className="collection" key={collection.path}>
              <Link
                href={`/collections/${collection.path}`}
                onMouseOver={(event) =>
                  UtilityLibrary.playVideoOnMouseOver(event)
                }
                onMouseLeave={(event) =>
                  UtilityLibrary.stopVideoOnMouseOver(event)
                }
              >
                <div className="image">
                  {!collection.video && collection.image && (
                    <Image
                      src={collection.image}
                      alt={collection.alt}
                      fill={true}
                      sizes="(max-width: 960px) 100vw, 33vw"
                    ></Image>
                  )}
                  {collection.video && (
                    <video
                      muted
                      loop
                      playsInline
                      preload="none"
                      poster={collection.poster}
                    >
                      <source src={collection.video} type="video/mp4"></source>
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <div className="overlay">
                    <div className="titl">{collection.title}</div>
                    <div className="yea">{collection.year}</div>
                  </div>
                </div>
                <div className="description">
                  <div>
                    <h2 className="title">{collection.title}</h2>
                    <span className="year">{collection.year}</span>
                  </div>
                  <div>
                    <span className="medium">{collection.medium}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
