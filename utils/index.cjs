// a simple script to generate the list of images for the tsuru gallery

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const ColorThief = require("colorthief");
const chroma = require("chroma-js");

const tsuruFrom = 1;
const tsuruTo = 55;
const tsurusInfo = getTsurusInfo();
const listOfImages = [];

const processLoop = async () => {
  for (let i = tsuruFrom; i <= tsuruTo; i++) {
    const bigFileRelativePath = `img/tsurus/${i}.webp`;
    const imageRelativePath = `img/tsurus/full/${i}.webp`;
    const thumbnailRelativePath = `img/tsurus/thumbnails/${i}.webp`;

    const thisImageFullSizePath = path.join(
      __dirname,
      `../data/imgs/${i}.jpeg`
    );
    const thisBigFilePath = path.join(
      __dirname,
      `../dist/${imageRelativePath}`
    );
    const thisImagePath = path.join(
      __dirname,
      `../dist/${bigFileRelativePath}`
    );
    const thubnailImagePath = path.join(
      __dirname,
      `../dist/${thumbnailRelativePath}`
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

    const [r, g, b] = await ColorThief.getColor(thisImageFullSizePath);
    const mainColorChroma = chroma.rgb(r, g, b);

    //generate a ligth version of the main color
    const mainColorLight = mainColorChroma.luminance(0.8).hex();
    //generate a dark version of the main color
    const mainColorDark = mainColorChroma.luminance(0.2).hex();

    const thisTsuruData = tsurusInfo.find((tsuru) => tsuru.number === i);



    const thisImageInfo = {
      number: i,
      img: bigFileRelativePath,
      fullSize: imageRelativePath,
      thumbnail: thumbnailRelativePath,
      mainColor: mainColorLight,
      mainColorContrast: mainColorDark,
      location: thisTsuruData?.location || "-",
    };
    listOfImages.push(thisImageInfo);
  }

  listOfImages.reverse();

  const jsonContent = JSON.stringify(listOfImages, null, 2);
  const outputPath = path.join(__dirname, "../dist/data/listOfImages.json");
  fs.writeFileSync(outputPath, jsonContent, "utf8");
};


function getTsurusInfo(){
  //read the file
  const tsurusInfo = fs.readFileSync(path.join(__dirname, "../dist/data/tsurusData.json"), "utf8");

  //parse the file
  const tsurusInfoParsed = JSON.parse(tsurusInfo);
  return tsurusInfoParsed;
}

processLoop();
