export const buildMenuMap = {
  height: 9,
  infinite: false,
  layers: [
    {
      data: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 1, 2, 2, 2, 2, 3, 0, 0, 0, 0, 0, 0, 4, 5, 5, 5, 5, 6, 0, 0, 0,
        0, 0, 0, 4, 5, 5, 5, 5, 6, 0, 0, 0, 0, 0, 0, 4, 5, 5, 5, 5, 6, 0, 0, 0,
        0, 0, 0, 7, 8, 8, 8, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
      height: 9,
      id: 1,
      name: "background",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: 12,
      x: 0,
      y: 0,
    },
    {
      data: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 11, 12, 0, 0, 0,
        0, 0, 0, 0, 0, 13, 14, 14, 15, 0, 0, 0, 0, 0, 0, 0, 0, 16, 17, 17, 18,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
      height: 9,
      id: 2,
      name: "foreground",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: 12,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 3,
  nextobjectid: 1,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  tileheight: 64,
  tilesets: [
    {
      columns: 3,
      firstgid: 1,
      image: "../UI/Banners/Banner_Vertical.png",
      imageheight: 192,
      imagewidth: 192,
      margin: 0,
      name: "banner",
      spacing: 0,
      tilecount: 9,
      tileheight: 64,
      tilewidth: 64,
    },
    {
      columns: 3,
      firstgid: 10,
      image: "../UI/Banners/Carved_9Slides.png",
      imageheight: 192,
      imagewidth: 192,
      margin: 0,
      name: "carving",
      spacing: 0,
      tilecount: 9,
      tileheight: 64,
      tilewidth: 64,
    },
  ],
  tilewidth: 64,
  type: "map",
  version: "1.10",
  width: 12,
};
