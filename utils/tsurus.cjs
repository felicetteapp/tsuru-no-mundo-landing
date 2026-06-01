const path = require("path");
const fs = require("fs");

function parseLocation(location) {
  let country, city, region, detailedLocation;

  const dotParts = location.split(".");
  country = dotParts.pop().trim();

  const nonCountryPart = dotParts.join(".").trim();
  const dashParts = nonCountryPart.split(" - ");

  let cityWithRegion;

  if (dashParts.length === 2) {
    detailedLocation = dashParts[0].trim();
    cityWithRegion = dashParts[1].trim();
  } else {
    cityWithRegion = nonCountryPart;
  }

  const cityRegionParts = cityWithRegion.split(",");
  if (cityRegionParts.length === 2) {
    city = cityRegionParts[0].trim();
    region = cityRegionParts[1].trim();
  } else {
    city = cityWithRegion.trim();
  }

  return {
    country,
    city,
    region,
    detailedLocation,
    raw: location,
  };
}
function getTsurusInfo() {
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

  return tsurusInfoParsed.map((tsuru) => {
    const imageInfo = tsurusImagesInfoParsed.find(
      (img) => img.number === tsuru.number,
    );

    tsuru.paddedNumber = tsuru.number.toString().padStart(2, "0");
    return { ...tsuru, ...imageInfo, location: parseLocation(tsuru.location) };
  });
}

const compileHomePageTemplate = (handlebars, tsurus) => {
  const homePageTemplateRaw = fs.readFileSync(
    path.resolve(__dirname, "..", "public/home.handlebars"),
    "utf8",
  );

  return handlebars.compile(homePageTemplateRaw)({ tsurus });
};

const compileGridPageTemplate = (handlebars, tsurus) => {
  const gridPageTemplateRaw = fs.readFileSync(
    path.resolve(__dirname, "..", "public/grid.handlebars"),
    "utf8",
  );

  return handlebars.compile(gridPageTemplateRaw)({ tsurus });
};

module.exports = {
  getTsurusInfo,
  compileHomePageTemplate,
  compileGridPageTemplate,
};
