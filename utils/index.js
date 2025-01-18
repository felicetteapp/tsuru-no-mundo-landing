const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const tsuruFrom = 1;
const tsuruTo = 55;

const listOfImages = [];
for (let i = tsuruFrom; i <= tsuruTo; i++) {
  const thisImageFullSizePath = path.join(__dirname, `../data/imgs/${i}.jpeg`);
  const thisBigFilePath = path.join(
    __dirname,
    `../src/img/tsurus/full/${i}.webp`
  );
  const thisImagePath = path.join(__dirname, `../src/img/tsurus/${i}.webp`);
  const thubnailImagePath = path.join(
    __dirname,
    `../src/img/tsurus/thumbnails/${i}.webp`
  );

  sharp(thisImageFullSizePath)
    .webp()
    .toFile(thisBigFilePath, (err, info) => {
      if (err) {
        console.error(err);
      }
      console.log({ info });
    });

  sharp(thisImageFullSizePath)
    .resize(1080, 1080)
    .webp()
    .toFile(thisImagePath, (err, info) => {
      if (err) {
        console.error(err);
      }
      console.log({ info });
    });

  sharp(thisImageFullSizePath)
    .resize(100, 100)
    .webp()
    .toFile(thubnailImagePath, (err, info) => {
      if (err) {
        console.error(err);
      }
      console.log({ info });
    });

  const thisImageInfo = {
    number: i,
    img: `img/tsurus/${i}.webp`,
    fullSize: `img/tsurus/full/${i}.webp`,
    thumbnail: `img/tsurus/thumbnails/${i}.webp`,
  };
  listOfImages.push(thisImageInfo);
}

listOfImages.reverse();

const jsonContent = JSON.stringify(listOfImages, null, 2);
const outputPath = path.join(__dirname, "../src/data/listOfImages.json");
fs.writeFileSync(outputPath, jsonContent, "utf8");
