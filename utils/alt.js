const path = require("path");
const fs = require("fs");

function getTsurusInfo() {
  const tsurusInfo = fs.readFileSync(
    path.join(__dirname, "../public/data/tsurusData.json"),
    "utf8"
  );

  const tsurusInfoParsed = JSON.parse(tsurusInfo);
  const tsurusImagesInfo = fs.readFileSync(
    path.join(__dirname, "../public/data/listOfImages.json"),
    "utf8"
  );
  const tsurusImagesInfoParsed = JSON.parse(tsurusImagesInfo);

  return tsurusInfoParsed.map((tsuru) => {
    const imageInfo = tsurusImagesInfoParsed.find(
      (img) => img.number === tsuru.number
    );
    return { ...tsuru, ...imageInfo };
  });
}

const generateAltPageContent = () => {
  const tsurusInfo = getTsurusInfo();

  return `
    <table style="width:100%; border-collapse: collapse; border: 2px solid #000; margin:0 auto;">
      <thead>
        <tr>
          <th style="border-bottom: 2px solid #000; padding: 10px; text-align: left;">#</th>
          <th style="border-bottom: 2px solid #000; padding: 10px; padding-left:0; padding-right:0; text-align: left;">picture</th>
          <th style="border-bottom: 2px solid #000; padding: 10px; text-align: left;">location</th>
          <th style="border-bottom: 2px solid #000; padding: 10px; text-align: left;"></th>
        </tr>
      </thead>
      <tbody>
        ${tsurusInfo.map(generateTsuruRow).join("")}
      </tbody>
    </table>`;
};

module.exports = { generateAltPageContent };

function generateTsuruRow(tsuru) {
  const [initialPart, country] = tsuru.location.split(".");

  const [firstPart, secondPart] = initialPart.split(" - ");
  return `<tr>
            <td  style="border-bottom: 2px solid #000;padding:10px; vertical-align: top;">
              <h2 style="line-height: 1; margin:0;">${tsuru.number}</h2>
            </td>
            <td style="border-bottom: 2px solid #000; white-space: nowrap; vertical-align: top;padding:10px; padding-left:0; padding-right:0;">
                <img
                  src="${tsuru.thumbnail}"
                  width="100"
                  height="100"
                  loading="lazy"
                  alt="${tsuru.number} - ${tsuru.location}"
                />
            </td>
            <td style="border-bottom: 2px solid #000;padding:10px; vertical-align: top;">
              <h3 style="line-height: 1; margin:0;">${
                secondPart ? firstPart : ""
              }</h3>
              <h4 style="line-height: 1; margin:0; font-size:16px;">${
                secondPart || firstPart
              }</h4>
              <h5 style="line-height: 1; margin:0;"><span aria-hidden="true">&lt;</span>${country.trim()}<span aria-hidden="true">&gt;</span></h5>
            </td>
            <td style="border-bottom: 2px solid #000;padding:10px; vertical-align: bottom;">
              <a
                href="${tsuru.fullSize}"
                target="_blank"
                rel="noopener noreferrer"
              >view</a>
            </td>
          </tr>`;
}
