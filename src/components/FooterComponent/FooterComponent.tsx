import Link from "next/link";
import styles from "./FooterComponent.module.scss";
import ArtCollectionsCollection from "@/collections/ArtCollectionsCollection";
import SocialsCollection from "@/collections/SocialsCollection";
import UtilityLibrary from "@/libraries/UtilityLibrary";

const FooterComponent: React.FC = () => {
  return (
    <footer className={styles.FooterComponent}>
      <div className="spacer"></div>
      <div className="stripe"></div>
      <div className="container">
        <div className="footer-menu">
          <div className="">
            <div>
              <div>
                <div className="BrandComponent">
                  <div className="logo"></div>
                  <h3>RODRIGO BARRAZA</h3>
                </div>
                <p>Vancouver, Canada</p>
              </div>
              <p>© 2023–{new Date().getFullYear()} Rodrigo Barraza</p>
            </div>
          </div>
          <div className="photography">
            <div>
              <h2>Photography</h2>
              <ul>
                {ArtCollectionsCollection.filter(
                  (artCollection) => artCollection.type === "photography",
                ).map((artCollection, artCollectionIndex) => (
                  <li key={artCollectionIndex}>
                    <Link href={`/collections/${artCollection.path}`}>
                      {artCollection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="film">
            <div>
              <h2>Film</h2>
              <ul>
                {ArtCollectionsCollection.filter(
                  (artCollection) => artCollection.type === "film",
                ).map((artCollection, artCollectionIndex) => (
                  <li key={artCollectionIndex}>
                    <Link href={`/collections/${artCollection.path}`}>
                      {artCollection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ai">
              <h2>AI Art</h2>
              <ul>
                {ArtCollectionsCollection.filter(
                  (artCollection) => artCollection.type === "ai",
                ).map((artCollection, artCollectionIndex) => (
                  <li key={artCollectionIndex}>
                    <Link href={`/collections/${artCollection.path}`}>
                      {artCollection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="animation">
              <h2>AI Animation</h2>
              <ul>
                {ArtCollectionsCollection.filter(
                  (artCollection) => artCollection.type === "animation",
                ).map((artCollection, artCollectionIndex) => (
                  <li key={artCollectionIndex}>
                    <Link href={`/collections/${artCollection.path}`}>
                      {artCollection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="installation">
              <h2>Installation</h2>
              <ul>
                {ArtCollectionsCollection.filter(
                  (artCollection) => artCollection.type === "installation",
                ).map((artCollection, artCollectionIndex) => (
                  <li key={artCollectionIndex}>
                    <Link href={`/collections/${artCollection.path}`}>
                      {artCollection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="socials">
            <div>
              <h2>Socials</h2>
              <ul>
                {SocialsCollection.map((social, socialIndex) => (
                  <li className={`social ${social.type}`} key={socialIndex}>
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      href={social.url}
                    >
                      {/* <div className="logo"></div> */}
                      {/* Lazy: an eager <img> is preloaded by React ahead of
                          the gallery above the fold. */}
                      <img
                        className="logo"
                        loading="lazy"
                        src={UtilityLibrary.getIconUrl(social.type)}
                        alt={social.type}
                      ></img>
                      <span>{social.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
