const path = require("path");
const fs = require("fs");

const tsurusInfo = fs.readFileSync(
  path.join(__dirname, "../public/data/tsurusData.json"),
  "utf8",
);

const tsurusInfoParsed = JSON.parse(tsurusInfo);
const tsurusImagesInfo = fs.readFileSync(
  path.join(__dirname, "../public/data/listOfImages.json"),
  "utf8",
);
const tsurusImagesInfoParsed = JSON.parse(tsurusImagesInfo);

const processLoop = async () => {
  for (let i = tsuruFrom; i <= tsuruTo; i++) {
    const tsuruData = tsurusInfoParsed.find((tsuru) => tsuru.number === i);
    const imageDataIndex = tsurusImagesInfoParsed.findIndex(
      (img) => img.number === i,
    );
    if (tsuruData && imageDataIndex !== -1) {
      tsurusImagesInfoParsed[imageDataIndex].location = tsuruData.location;
    }
  }

  const outputPath = path.join(__dirname, "../public/data/listOfImages.json");
  const jsonContent = JSON.stringify(tsurusImagesInfoParsed, null, 2);
  fs.writeFileSync(outputPath, jsonContent, "utf8");
};
