"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./index.module.scss";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import type { CollectionTile } from "@/types/types";

export default function ClientHome({ tiles }: { tiles: CollectionTile[] }) {
  return (
    <main className={styles.home}>
      <div
        className="container"
        itemProp="creator"
        itemScope
        itemType="http://schema.org/Person"
      >
        <h1>
          <span className="full-name">
            <span itemProp="givenName">Rodrigo</span>{" "}
            <span itemProp="familyName">Barraza</span>
          </span>
          : <span itemProp="jobTitle">photographer</span>,{" "}
          <span itemProp="jobTitle">software engineer</span>,{" "}
          <span itemProp="jobTitle">artist</span>.
        </h1>
      </div>
      <div className="gallery">
        {tiles.map((tile, tileIndex) => (
          <div className="image-container" key={tile.path}>
            <Link
              className="image"
              href={`/collections/${tile.path}`}
              onMouseOver={(event) =>
                UtilityLibrary.playVideoOnMouseOver(event)
              }
              onMouseLeave={(event) =>
                UtilityLibrary.stopVideoOnMouseOver(event)
              }
            >
              <div className="the-image">
                {!tile.video && tile.image && (
                  <Image
                    src={tile.image}
                    alt={tile.alt}
                    fill={true}
                    sizes="(max-width: 640px) 50vw, 33vw"
                    preload={tileIndex < 3}
                  />
                )}
                {tile.video && (
                  <video
                    muted
                    loop
                    playsInline
                    preload="none"
                    itemProp="video"
                    poster={tile.poster}
                  >
                    <source src={tile.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                <div className="inside-description">
                  <div className="name" itemProp="name">
                    {tile.title}
                  </div>
                  <div className="year" itemProp="dateCreated">
                    {tile.year}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
