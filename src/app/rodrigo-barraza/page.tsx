import Image from "next/image";
import Link from "next/link";
import SocialsCollection from "@/collections/SocialsCollection";
import AboutCollection from "@/collections/AboutCollection";
import ClientsCollection from "@/collections/ClientsCollection";
import styles from "./index.module.scss";
import ButtonComponent from "@/components/ButtonComponent/ButtonComponent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Software Engineer, Photographer, Artist: Rodrigo Barraza",
  description:
    "About Rodrigo Barraza, a Vancouver-based software engineer, photographer, generative AI artist and filmmaker. BFA in Photography from Emily Carr University. Over 20 years of programming experience.",
  keywords:
    "rodrigo barraza, vancouver software engineer, photographer, artist, ai artist, generative art, clip guided diffusion, full stack developer, emily carr university, film photography, medium format photography, pristine diffusion, einstein exchange",
};

const PORTRAIT_URL =
  "https://assets.rod.dev/rod-dev-assets/images/rodrigo-barraza-black-and-white-portrait.jpg";

// schema.org Person for search engines: ties the name to the portrait, the
// school and every social profile listed on this page.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rodrigo Barraza",
  url: "https://rod.dev",
  image: PORTRAIT_URL,
  jobTitle: ["Software Engineer", "Photographer", "Artist"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vancouver",
    addressRegion: "British Columbia",
    addressCountry: "CA",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Emily Carr University of Art + Design",
    url: "https://www.ecuad.ca/",
  },
  sameAs: SocialsCollection.map((social) => social.url),
};

export default function AboutView() {
  return (
    <main className={styles.AboutView}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="container">
        <div className="layout">
          <div className="sidebar">
            <Image
              src={PORTRAIT_URL}
              alt="A black and white photograph of Rodrigo Barraza"
              width={250}
              height={250}
            ></Image>
            <div className="socials">
              {SocialsCollection.map((social, socialIndex) => (
                <ButtonComponent
                  key={socialIndex}
                  href={social.url}
                  label={social.name}
                  className="mini"
                  logo={social.type}
                ></ButtonComponent>
              ))}
            </div>
          </div>
          <div className="main" itemScope itemType="http://schema.org/Person">
            <div className="about">
              <div className="text">
                <div className="about-info">
                  <h1>
                    <span className="full-name" itemProp="name">
                      Rodrigo Barraza
                    </span>
                  </h1>

                  <h2>Software Engineer, Photographer &amp; Artist</h2>

                  <p>
                    <span className="full-name">Rodrigo Barraza</span> is a{" "}
                    <span itemProp="jobTitle">software engineer</span>,{" "}
                    <span itemProp="jobTitle">artist</span> and{" "}
                    <span itemProp="jobTitle">photographer</span> based out of{" "}
                    <span
                      itemProp="address"
                      itemScope
                      itemType="http://schema.org/PostalAddress"
                    >
                      <span itemProp="addressLocality">Vancouver</span>,{" "}
                      <span itemProp="addressRegion">British Columbia</span>,{" "}
                      <span itemProp="addressCountry">Canada</span>
                    </span>
                    . He emerged as an internet artist who works in a variety of
                    media and focuses on photography, AI art, film, animation,
                    visual design and illustration.
                  </p>

                  <h3>Photography &amp; Film</h3>

                  <p>
                    Rodrigo grew up with an interest in visual media and started
                    out as a young animator and illustrator in 2001. He soon
                    started experimenting with film photography, videography,
                    game development and graphic design. His photographic
                    practice spans both analog and digital mediums, with a
                    particular focus on medium format film photography using
                    cameras like the Hasselblad 500 series, shooting on reversal
                    film stocks including Fujifilm Velvia 100, Fujifilm Provia
                    100F, Ilford Delta 400, and Kodak TMAX P3200. His work
                    explores multiple exposure techniques, long exposure
                    photography, portraiture, boudoir, street photography and
                    urban landscapes, predominantly shot on location in
                    Vancouver, Canada.
                  </p>

                  <p>
                    Rodrigo&apos;s photography has been exhibited
                    internationally, including at the{" "}
                    <em>Museo de Arte de Lima</em> in Peru (2019),{" "}
                    <em>The Waldorf Hotel</em> in Vancouver (2011), and the{" "}
                    <em>Emily Carr University of Art &amp; Design</em>{" "}
                    graduation exhibition (2011). He has also directed the 16mm
                    short film <em>Spotless</em> (2012) in collaboration with
                    Ewa Chruscicka, and contributed cinematography and
                    videography to music videos for Vancouver-based new wave
                    synth pop band Petroleum By-Product.
                  </p>

                  <h3>Generative AI Art</h3>

                  <p>
                    Combining his passion for software development with the rise
                    of artificial intelligence media since 2017, Rodrigo Barraza
                    has pivoted his artistic practice to algorithmic and
                    generative art, and generative artificial media through the
                    use of CLIP-driven image synthesis. His AI art collections —
                    including{" "}
                    <Link href="/collections/tardigrades">Tardigrades</Link>,{" "}
                    <Link href="/collections/mollusca">Generated Mollusca</Link>
                    ,{" "}
                    <Link href="/collections/crystal-landscapes">
                      Crystal Landscapes
                    </Link>
                    , and the animated{" "}
                    <Link href="/collections/ainimations">Ainimations</Link>{" "}
                    series — explore crystalline environments and organic forms
                    through CLIP-guided diffusion processes. He has also
                    published{" "}
                    <a
                      href="https://colab.research.google.com/github/rodrigo-barraza/pristine-disco-diffusion/blob/master/rodrigos-pristine-disco-diffusion.ipynb"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pristine Diffusion
                    </a>
                    , an open-source Google Colab notebook for CLIP-guided
                    diffusion art generation, inspired by Katherine
                    Crowson&apos;s fine-tuned diffusion models and utilizing
                    both OpenAI&apos;s CLIP and open-source alternatives like
                    OpenCLIP.
                  </p>

                  <h3>Software Engineering</h3>

                  <p>
                    When it comes to software development, Rodrigo Barraza began
                    programming in 2004, specializing in front-end web
                    development and Flash web applications. With over 20 years
                    of programming experience, his expertise spans the full
                    stack — from front-end frameworks like React, Next.js, and
                    Vue.js to back-end technologies including Node.js, Express,
                    Python, and MongoDB. After graduating from University and
                    working with many startups and corporations over the years,
                    he eventually came to lead large teams in various companies
                    as a technical lead and engineering manager.
                  </p>

                  <p>
                    In 2017, Rodrigo co-founded{" "}
                    <strong>Einstein Exchange</strong>, a cryptocurrency
                    exchange start-up that focused on providing worldwide
                    clients with a safe, secure and simple way to buy, trade and
                    invest in virtual currencies. Since 2019, Rodrigo has been a
                    software consultant and contractor for various startups,
                    building full-stack web applications, AI-powered tools, and
                    micro-service architectures.
                  </p>

                  <h3>Education</h3>

                  <p>
                    Rodrigo holds a{" "}
                    <strong>Bachelor of Fine Arts in Photography</strong> from
                    the{" "}
                    <a
                      href="https://www.ecuad.ca/"
                      target="_blank"
                      rel="noopener noreferrer"
                      itemProp="alumniOf"
                    >
                      Emily Carr University of Art + Design
                    </a>{" "}
                    in Vancouver, Canada (Class of 2011). His academic training
                    in the photographic arts informs both his traditional and
                    computational creative work.
                  </p>
                </div>
              </div>
            </div>
            <div className="clients-box">
              <h2 className="title">Clients</h2>
              <ul className="clients">
                {ClientsCollection.map((client, clientIndex) => {
                  const tile = client.logo ? (
                    <Image
                      className="logo"
                      src={client.logo}
                      alt={`The ${client.name} logo`}
                      width={160}
                      height={60}
                    />
                  ) : (
                    <span className="wordmark">{client.name}</span>
                  );
                  return (
                    <li key={clientIndex}>
                      {client.url ? (
                        <a
                          href={client.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {tile}
                        </a>
                      ) : (
                        tile
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="bottom">
              <div className="extra-info">
                {AboutCollection.map((about, aboutIndex) => (
                  <div className="collection" key={aboutIndex}>
                    <h2 className="title">{about.name}</h2>
                    {about.collections.map((object, objectIndex) => (
                      <div className="object" key={objectIndex}>
                        {object.url ? (
                          <p>
                            <a
                              className="object-title"
                              href={object.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {object.name}
                            </a>
                            <span>{object.year}</span>
                          </p>
                        ) : (
                          <p>
                            <span className="object-title">{object.name}</span>
                            <span>{object.year}</span>
                          </p>
                        )}
                        <p>
                          {object.venue && <span>{object.venue}</span>}
                          {object.location && <span>{object.location}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
