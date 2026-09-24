import type { Project } from "@/types/types";

const ProjectsCollection: Project[] = [
  {
    title: "Text-to-Image Generator",
    year: "May 2023",
    link: "https://rod.dev/generate",
    github: "https://github.com/rodrigo-barraza/rod.dev",
    description:
      "A deep learning, text-to-image model and user-interface released in 2023. It was created to generated detailed images conditioned on text descriptions, although it can be applied to other tasks such as inpainting, outpainting, and generating image-to-image translations guided by a text prompt.",
    languages: ["TypeScript", "React", "Next.js"],
  },
  {
    title: "Eye of Providence",
    year: "February 2023",
    github: "https://github.com/rodrigo-barraza/eye-of-providence",
    description:
      'Image and file sorting using <a href="https://github.com/spotify/annoy" target="_blank">Spotify&apos;s Annoy</a>: a C++ library with Python bindings to search for points in space that are close to a given query point. It also creates large read-only file-based data structures that are <a href="https://en.wikipedia.org/wiki/Mmap" target="_blank">mmapped</a> into memory so that many processes may share the same data. Sorts images by similarity based on a textual or image query.',
    languages: ["Python"],
  },
  {
    title: "Spatula",
    year: "January 2023",
    github: "https://github.com/rodrigo-barraza/inscriptor",
    description:
      'An image scraper using <a href="https://github.com/apify/crawlee" target="_blank">Apify&apos;s Crawlee</a>: a web scraping and browser automation library for Node.js that helps you build reliable and fast web-crawlers.',
    languages: ["JavaScript"],
  },
  {
    title: "Pristine Diffusion",
    year: "September 2022",
    github: "https://github.com/rodrigo-barraza/pristine-disco-diffusion",
    googleColab:
      "https://colab.research.google.com/github/rodrigo-barraza/pristine-disco-diffusion/blob/master/rodrigos-pristine-disco-diffusion.ipynb",
    description:
      'A modification of a clip-guided diffusion model that can generate amazing images from text prompts. Great at generating abstract art that is vivid in color and sharp in details, written in Python. Inspired by <a href="https://github.com/crowsonkb" target="_blank">Katherine Crowson&apos;s</a> fined tuned diffusion model that was optimized by many other developers and utilizes <a href="https://github.com/openai/CLIP" target="_blank">OpenAI&apos;s CLIP</a> and the open-source alternative <a href="https://github.com/mlfoundations/open_clip" target="_blank">OpenClip</a>.',
    languages: ["Jupyter Notebook"],
  },
  {
    title: "Wakanda",
    year: "2020",
    github: "https://github.com/rodrigo-barraza/wakanda",
    description:
      'This <a href="https://flexepin.com/" target="_blank">Directpay Flexepin</a> project is designed to streamline the acquisition and exchange of diverse cryptocurrencies, digital currencies, and digital assets by leveraging text messaging technology. This innovative approach enables individuals to conveniently employ their mobile phone minutes as a viable currency for conducting transactions. By integrating <a href="https://www.twilio.com/" target="_blank">Twilio&apos;s Communication APIs</a>, Directpay provides customers with access to the Flexepin service, facilitating swift, user-friendly, and secure online payment solutions.',
    languages: ["JavaScript"],
  },
  {
    title: "EXE Cash",
    year: "2019",
    github: "https://github.com/rodrigo-barraza/exe-cash",
    description:
      "EXE Cash, a state-of-the-art ERC20 Smart Contract designed to facilitate the efficient tracking and management of fungible tokens. This groundbreaking solution opens up a world of possibilities for various applications, such as serving as a medium of exchange for digital currencies, providing voting rights, enabling staking, and much more. Einstein Cash leverages the Ethereum blockchain&apos;s capabilities to implement a secure and transparent platform for the issuance and management of digital assets. By adhering to the ERC20 token standard, EXE Cash ensures seamless interoperability with other Ethereum-based decentralized applications (dApps) and services.",
    languages: ["Solidity"],
  },
  {
    title: "AI Fraud Detection Model",
    year: "2018",
    github: "https://github.com/rodrigo-barraza/ai-fraud-detection-model",
    description:
      "A robust and self-contained fraud detection model that harnesses the power of the Intrusion Detection System (IDS) package, specifically tailored for software developers. This sophisticated model can be effortlessly deployed within a containerized environment, seamlessly integrating with your existing MongoDB infrastructure. The primary objective of this project was to develop a minimum viable product (MVP) that demonstrates its core functionality and potential for future enhancements. The fraud detection model has been meticulously engineered to analyze vast amounts of data, identifying patterns and anomalies indicative of fraudulent activities. By leveraging advanced machine learning algorithms, the model continuously adapts and refines its detection capabilities, ensuring an ever-evolving defense against emerging threats. The integration with MongoDB allows for efficient storage, retrieval, and management of the data necessary for the model&apos;s operations, further streamlining the process and enhancing performance. Moreover, the containerized deployment ensures scalability, portability, and ease of maintenance, making it an ideal solution for developers seeking to incorporate cutting-edge fraud detection capabilities into their projects.",
    languages: ["Jupyter Notebook"],
  },
];

export default ProjectsCollection;
