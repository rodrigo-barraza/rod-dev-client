import styles from "./index.module.scss";
import ProjectsCollection from "@/collections/ProjectsCollection";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rodrigo Barraza - Software Engineering Projects",
  description:
    "Software engineering projects, open-source repositories, and AI art tools by Rodrigo Barraza. Including Pristine Diffusion, image captioning, and full-stack web applications.",
  keywords:
    "rodrigo barraza, projects, repository, image captioning, blip2, github, google colab, disco diffusion, pristine diffusion, programming, software engineer, portfolio, open source, ai art tools, full stack developer",
  // We can omit JSON-LD script for now, or you could add it to layout/page
};

export default function Projects() {
  return (
    <main className={styles.AboutView}>
      <div className="container">
        <div className="layout">
          <div className="main">
            {ProjectsCollection.map((project, projectIndex) => (
              <div key={projectIndex} className="about">
                <div className="text">
                  <div className="about-info">
                    <h2 className="title">
                      {project.title} <span>{project.year}</span>
                    </h2>
                    <p className="source">
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Preview
                        </a>
                      )}
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Github
                        </a>
                      )}
                      {project.googleColab && (
                        <a
                          href={project.googleColab}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Google Colab
                        </a>
                      )}
                    </p>
                    <p
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    ></p>
                    <div className="languages">
                      {project.languages.length &&
                        project.languages.map((language, languageIndex) => (
                          <p key={languageIndex}>
                            {language == "Python" && <span>🐍</span>}
                            {language == "Jupyter Notebook" && <span>🔴</span>}
                            {language == "JavaScript" && <span>🟨</span>}
                            {language == "TypeScript" && <span>🟦</span>}
                            {language == "HTML" && <span>🟧</span>}
                            {language == "CSS" && <span>🟩</span>}
                            {language == "Solidity" && <span>🟪</span>}
                            {language == "React" && <span>⚛️</span>}
                            {language == "Next.js" && <span>🔺</span>}
                            <span className="language">{language}</span>
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
