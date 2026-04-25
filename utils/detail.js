const fs = require("fs");
const path = require("path");

const compileDetailTemplate = (handlebars, tsuru) => {
  const detailTemplateRaw = fs.readFileSync(
    path.resolve(__dirname, "..", "public/detail.handlebars"),
    "utf8",
  );

  tsuru.next = {
    ...tsuru.next,
    number: tsuru.next.number.toString().padStart(2, "0"),
  };
  tsuru.previous = {
    ...tsuru.previous,
    number: tsuru.previous.number.toString().padStart(2, "0"),
  };

  return handlebars.compile(detailTemplateRaw)({
    tsuru: {
      ...tsuru,
    },
  });
};

module.exports = { compileDetailTemplate };
