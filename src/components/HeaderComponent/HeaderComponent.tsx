"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import ActiveLinkComponent from "@/components/ActiveLinkComponent";
import styles from "./HeaderComponent.module.scss";
import SocialsCollection from "@/collections/SocialsCollection";
import PagesCollection from "@/collections/PagesCollection";
import UtilityLibrary from "@/libraries/UtilityLibrary";
import ButtonComponent from "@/components/ButtonComponent/ButtonComponent";

const HeaderComponent: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [stripeClass, setStripeClass] = useState({});
  const [routeName, setRouteName] = useState("");
  const pathname = usePathname() || "";
  const params = useParams();
  const queryId = params?.id;
  let path = "";

  if (queryId !== undefined && typeof queryId === "string") {
    path = pathname.replaceAll("/", "").replace(queryId, "");
  } else {
    path = pathname.replaceAll("/", "");
  }

  useEffect(() => {
    // A boolean, so the header re-renders when it crosses the line rather
    // than on every scrolled pixel.
    function onScroll() {
      setIsScrolled(window.scrollY > 35);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const setStripeStyles = function () {
      const style: object = {};
      const stripe: HTMLElement | null = document.querySelector(".stripe");
      const floaty: HTMLElement | null = document.querySelector("header");
      const collectionDetails: HTMLElement | null =
        document.querySelector(".collection-details") ||
        document.querySelector(".details");
      if (path === "collections" && !collectionDetails) {
      } else if (
        stripe &&
        collectionDetails &&
        floaty &&
        (path === "collections" || path === "renders" || path === "likes")
      ) {
        const collectionDetailsHeight = collectionDetails.offsetHeight;
        const floatyHeight = floaty.offsetHeight;
        stripe.setAttribute(
          "style",
          `height:${collectionDetailsHeight + floatyHeight + 80}px`,
        );
      } else if (stripe && path === "about") {
        stripe.setAttribute("style", "height:300px");
      } else if (stripe && path === "projects") {
        stripe.setAttribute("style", "height:200px");
      } else if (stripe) {
        stripe.removeAttribute("style");
      }
      setStripeClass(path);
      return [path, style];
    };

    setRouteName(path);
    const timeoutTimer = setTimeout(function () {
      setStripeStyles();
      clearTimeout(timeoutTimer);
    }, 100);
  }, [path]);

  return (
    <header className={`${styles.HeaderComponent} ${routeName}`}>
      <div className={`stripe ${stripeClass}`}></div>
      <div className="fixed"></div>
      <div className={`floaty ${isScrolled ? "tiny" : ""}`}>
        <div className="container">
          <div className="name BrandComponent">
            <Link href="/">
              <div className="logo"></div>
              <div className="text">RODRIGO BARRAZA</div>
            </Link>
          </div>
          <nav className="full">
            <ul>
              {PagesCollection.map((page, pageIndex) => (
                <li key={pageIndex}>
                  <ActiveLinkComponent
                    activeClassName="active"
                    href={page.path}
                  >
                    {page.icon && (
                      <span className={styles.icon}>{page.icon}</span>
                    )}
                    {/* {page.emoji && <span className="emoji">{page.emoji}</span>} */}
                    <span className={styles.label}>
                      {UtilityLibrary.capitalize(page.name)}
                    </span>
                  </ActiveLinkComponent>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hamburger">
            <button
              type="button"
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
              aria-controls="mobile-menu"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? "✖" : "☰"}
            </button>
          </div>
        </div>
      </div>
      {mobileMenu && (
        <div className="overlay" id="mobile-menu">
          <nav className="shrink">
            <ul>
              {PagesCollection.map((page, pageIndex) => (
                <li key={pageIndex}>
                  <ActiveLinkComponent
                    activeClassName="active"
                    href={page.path}
                    onClick={() => setMobileMenu(false)}
                  >
                    {UtilityLibrary.capitalize(page.name)}
                  </ActiveLinkComponent>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="socials">
            {SocialsCollection.map((social, socialIndex) => (
              <li key={socialIndex} className={`social ${social.type}`}>
                <ButtonComponent
                  key={socialIndex}
                  href={social.url}
                  // label="1"
                  className="mini"
                  logo={social.type}
                ></ButtonComponent>
                {/* <a target="_blank" href={social.url}><div className="logo"></div></a> */}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default HeaderComponent;
