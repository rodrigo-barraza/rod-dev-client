interface Page {
  path: string;
  name: string;
  icon?: string;
}

const PagesCollection: Page[] = [
  // {
  //     path: '/gym',
  //     name: 'Gym',
  //     icon: 'Exercise'
  //     // name: '✨Generate'
  // },
  // Hidden from the nav. /generate still resolves directly and via
  // UtilityLibrary.shareLink — this only drops the header entry.
  // {
  //     path: '/generate',
  //     name: 'Text to Image',
  //     icon: 'add_photo_alternate'
  // },
  {
    path: "/",
    name: "collections",
  },
  {
    path: "/projects",
    name: "projects",
  },
  {
    path: "/rodrigo-barraza",
    name: "about",
  },
];

export default PagesCollection;
