import {
  Application,
  Container,
  Sprite,
  Texture,
  Assets,
  BlurFilter,
  ColorMatrixFilter,
  Text,
  TextStyle,
  Rectangle,
} from "pixi.js";
import { Tsuru } from "./tsuru";
import { Navigator } from "./navigator";

const app = new Application();
const listOfImages = [];
let isDragging = false;
let startY = 0;
let startScrollY = 0;
let currentY = 0;
let targetY = 0;
let isScrolling = false;
let maxScrollY = 0;
let tsuruSize = window.innerHeight * 0.4;
let transformTextNumberTimeout = null;
let layoutOrientation =
  window.innerWidth > window.innerHeight ? "landscape" : "portrait";
let horizontalMargin = 50;
let locationFontSize = 36;
let verticalMargin = 50;
let navigatorItemSize = 100;

const updateLayout = () => {
  layoutOrientation =
    window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  tsuruSize = window.innerHeight * 0.6;
  if (layoutOrientation === "portrait") {
    tsuruSize = window.innerWidth * 0.8;
  }
  for (let i = 0; i < listOfImages.length; i++) {
    const tsuru = tsurus[i];
    tsuru.updateSize(tsuruSize);
  }
  horizontalMargin = Math.min((window.innerWidth - tsuruSize) / 2, 50);
  locationFontSize = layoutOrientation === "portrait" ? 18 : 24;

  document.documentElement.style.setProperty("--tsuru-size", `${tsuruSize}px`);
  document.documentElement.style.setProperty(
    "--tsuru-horizontal-margin",
    `${horizontalMargin}px`
  );

  document.documentElement.style.setProperty(
    "--tsuru-vertical-margin",
    `${verticalMargin}px`
  );

  document.documentElement.style.setProperty(
    "--navigator-item-size",
    `${navigatorItemSize}px`
  );

  document.documentElement.classList.add(layoutOrientation);
  document.documentElement.classList.remove(
    layoutOrientation === "portrait" ? "landscape" : "portrait"
  );
};

updateLayout();

const tsurusGroup = new Container();

const onScroll = (event) => {
  const deltaY = event.deltaY;
  targetY -= deltaY;

  targetY = Math.max(Math.min(0, targetY), -maxScrollY);
  if (!isScrolling) {
    isScrolling = true;
    smoothScroll();
  }
};

const smoothScroll = () => {
  if (isScrolling) {
    const distance = targetY - currentY;
    const step = distance * 0.1;
    currentY += step;

    if (Math.abs(distance) < 1) {
      currentY = targetY;
      isScrolling = false;
    } else {
      requestAnimationFrame(smoothScroll);
    }

    tsurusGroup.y = currentY;
  }
};

let velocity = 0;
let lastScrollTime = 0;

const onDragStart = (event) => {
  isDragging = true;
  startY = event.data.global.y;
  startScrollY = tsurusGroup.y;
  currentY = tsurusGroup.y;
  targetY = tsurusGroup.y;
};

let momentoFrame;
const applyMomentum = () => {
  cancelAnimationFrame(momentoFrame);
  if (Math.abs(velocity) > 0.1) {
    targetY += velocity * 5;
    targetY = Math.max(Math.min(0, targetY), -maxScrollY);
    currentY = targetY;
    tsurusGroup.y = targetY;
    velocity *= 0.9;
    momentoFrame = requestAnimationFrame(applyMomentum);
  }
};

const onDragEnd = () => {
  isDragging = false;
  lastScrollTime = Date.now();
  applyMomentum();
};

const onDragMove = (event) => {
  if (isDragging) {
    const deltaY = event.data.global.y - startY;
    currentY = startScrollY + deltaY;
    currentY = Math.max(Math.min(0, currentY), -maxScrollY);
    targetY = currentY;
    tsurusGroup.y = currentY;

    const now = Date.now();
    const deltaTime = now - lastScrollTime;
    lastScrollTime = now;

    velocity = deltaY / deltaTime;
  }
};

const pixiAppInit = async () => {
  // Create a new application
  // pixiAppInitialize the application
  await app.init({ background: "black", resizeTo: window });
  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);
  return app;
};

let fontIsReady = false;
let dataIsReady = false;

// Function to dynamically load fonts
function loadFont(name, url) {
  const font = new FontFace(name, `url(${url})`);
  font
    .load()
    .then((loadedFont) => {
      document.fonts.add(loadedFont);
      console.log(`Font loaded: ${name}`, loadedFont);
    })
    .catch((error) => {
      console.error(`Failed to load font: ${name}`, error);
    });
}

// Load the fonts
loadFont("Danfo-Regular", "./fonts/Danfo-Regular.ttf");
loadFont("Montserrat-Black", "./fonts/Montserrat-Black.ttf");

document.fonts.ready.then((teste) => {
  console.log({ teste });
  console.log("All fonts loaded");
  fontIsReady = true;
});

fetch("./data/listOfImages.json").then(async (response) => {
  const data = await response.json();
  data.forEach((img) => {
    listOfImages.push({
      number: img.number,
      img: img.img,
      thumbnail: img.thumbnail,
      fullSize: img.fullSize,
      mainColor: img.mainColor,
      mainColorContrast: img.mainColorContrast,
      location: img.location,
    });
  });

  dataIsReady = true;

  console.log("Data loaded");

  while (!fontIsReady || !dataIsReady) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await pixiAppInit();

  // add a fullscreen background

  app.stage.interactive = true;
  app.stage.on("pointerdown", onDragStart);
  app.stage.on("pointerup", onDragEnd);
  app.stage.on("pointerupoutside", onDragEnd);
  app.stage.on("pointermove", onDragMove);
  app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

  window.addEventListener("wheel", onScroll);

  document.querySelector(".wrapper").addEventListener("wheel", (e) => {
    e.stopPropagation();
  });

  const tsurus = [];
  //  const tsurusGroup = new Container();

  const backgroundsGroups = new Container();
  backgroundsGroups.interactive = true;
  const background = new Sprite(Texture.WHITE);
  background.interactive = true;
  background.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

  background.width = app.screen.width;
  background.height = app.screen.height;
  background.tint = 0xffffff;

  app.stage.addChild(backgroundsGroups);
  backgroundsGroups.addChild(background);

  let locationExpectedX = horizontalMargin * 3;

  if (layoutOrientation === "portrait") {
    locationExpectedX = horizontalMargin * 2;
  }

  const locationRichTextStyle = new TextStyle({
    fontFamily: "Montserrat-Black",
    fontSize: locationFontSize,
    fill: { color: "#ffffff" },
    lineHeight: locationFontSize,
    align: "left",
    wordWrap: true,
    fontWeight: 900,
    wordWrapWidth: tsuruSize - locationExpectedX,
  });

  const locationRichText = new Text({
    text: "-",
    style: locationRichTextStyle,
  });
  locationRichText.anchor.set(0, 0);
  locationRichText.x = locationExpectedX;
  locationRichText.y = app.screen.height / 2 + tsuruSize / 2 + locationFontSize;

  app.stage.addChild(locationRichText);
  app.stage.addChild(tsurusGroup);

  const tsurusInViewport = [];

  for (let i = 0; i < listOfImages.length; i++) {
    const thisTsuru = new Tsuru(listOfImages[i], i, {
      size: tsuruSize,
      horizontalMargin,
    });
    thisTsuru.addEventListener("enterViewport", () => {
      tsurusInViewport.push(thisTsuru);
    });

    thisTsuru.addEventListener("exitViewport", () => {
      const index = tsurusInViewport.indexOf(thisTsuru);
      tsurusInViewport.splice(index, 1);
    });
    tsurusGroup.addChild(thisTsuru);
    tsurus.push(thisTsuru);
  }

  for (let i = 0; i < tsurus.length; i++) {
    const tsuru = tsurus[i];
    tsuru.updateStageSize(app.screen.width, app.screen.height);
    await tsuru.initTsuru();
  }

  const navigator = new Navigator(tsurus, navigatorItemSize);
  await navigator.initItems();

  navigator.updateStageSize(app.screen.width, app.screen.height);

  navigator.addEventListener("navigatorItemClick", (tsuru) => {
    scrollToTsuruNumber(tsuru.tsuruData.number);
  });

  app.stage.addChild(navigator);
  navigator.position.set(tsuruSize + horizontalMargin + horizontalMargin, 0);

  const blendInViewportTsurusImages = () => {
    const thisLoaders = [];

    for (let i = 0; i < tsurusInViewport.length; i++) {
      const tsuru = tsurusInViewport[i];
      const thisAssetName = `thumb-${tsuru.tsuruData.number}`;
      const alreadyLoaded = Assets.get(thisAssetName);
      if (!alreadyLoaded) {
        Assets.add({
          alias: thisAssetName,
          src: tsuru.tsuruData.thumbnail,
        });
      }
      thisLoaders.push({ alias: thisAssetName, tsuru });
    }

    Assets.load(thisLoaders.map(({ alias }) => alias)).then((textures) => {
      backgroundsGroups.removeChildren();
      thisLoaders
        .sort((a, b) => {
          return b.tsuru.tsuruData.number - a.tsuru.tsuruData.number;
        })
        .forEach(({ alias: thisAssetName }, i) => {
          const texture = textures[thisAssetName];
          const newSprite = Sprite.from(texture);

          const tsuru = thisLoaders.find(
            ({ alias }) => alias === thisAssetName
          ).tsuru;

          const blurFilter = new BlurFilter({
            quality: 10,
            strength: 50,
          });

          const colorMatrixFilter = new ColorMatrixFilter();
          newSprite.filters = [blurFilter, colorMatrixFilter];

          colorMatrixFilter.saturate(-0.5);
          colorMatrixFilter.brightness(0.5);

          backgroundsGroups.addChild(newSprite);

          // calculate size maintaining aspect ratio

          const aspectRatio = texture.width / texture.height;

          // fill the screen mantaining aspect ratio

          if (app.screen.width / app.screen.height > aspectRatio) {
            newSprite.width = app.screen.width;
            newSprite.height = app.screen.width / aspectRatio;
          } else {
            newSprite.height = app.screen.height;
            newSprite.width = app.screen.height * aspectRatio;
          }

          newSprite.alpha = tsuru.sprite.alpha;
          newSprite.blendMode = thisLoaders.length > 1 ? "overlay" : "normal";

          // center the image
          newSprite.anchor.set(0.5, 0.5);

          newSprite.x = app.screen.width / 2;
          newSprite.y = app.screen.height / 2;
        });
    });
  };

  const shadowAngle = 45;

  // Create a text style with the Google Font
  const pageTitleStyle = new TextStyle({
    fontFamily: "Danfo-Regular",
    fontSize: 36,
    fill: { color: "#ffffff" },
    stroke: { color: "#000", width: 5 },
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 0,
    dropShadowAngle: (shadowAngle * Math.PI) / 180,
    dropShadowDistance: 6,
    lineHeight: 36,
    zIndex: 4,
  });

  // Create a text object with the style
  const titleRichText = new Text({
    text: "Tsuru No Mundo",
    style: pageTitleStyle,
  });

  // Position the text object
  titleRichText.x = horizontalMargin - 3;
  titleRichText.y = verticalMargin;
  titleRichText.anchor.set(0, 0);

  // Add the text object to the PixiJS application
  app.stage.addChild(titleRichText);

  const tsuruNumberRichTextStyle = new TextStyle({
    fontFamily: "Danfo-Regular",
    fontSize: 36,
    fill: { color: "#ffffff" },
    stroke: { color: "#000", width: 5 },
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 0,
    dropShadowAngle: ((shadowAngle + 90) * Math.PI) / 180,
    dropShadowDistance: 6,
    lineHeight: 36,
  });

  const tsuruNumberRichText = new Text({
    text: "#",
    style: tsuruNumberRichTextStyle,
  });
  tsuruNumberRichText.anchor.set(0, 1);
  tsuruNumberRichText.x = horizontalMargin + 36 - 10;

  tsuruNumberRichText.y = (app.screen.height - tsuruSize) / 2 + 100;
  tsuruNumberRichText.rotation = (-90 * Math.PI) / 180;

  app.stage.addChild(tsuruNumberRichText);

  let currentTsuru;

  const updateTsuruNumber = () => {
    const tsuruClosestToCenter = tsurusInViewport.sort(
      (a, b) => a.distanceToCenter - b.distanceToCenter
    )[0];

    if (
      !currentTsuru ||
      (currentTsuru &&
        currentTsuru.tsuruData.number !== tsuruClosestToCenter.tsuruData.number)
    ) {
      currentTsuru = tsuruClosestToCenter;
      transformText(
        tsuruNumberRichText.text,
        `#${tsuruClosestToCenter.tsuruData.number}`,
        (newText) => {
          tsuruNumberRichText.text = newText;
        },
        transformTextNumberTimeout
      );
    }
  };

  const updateTsuruLocation = () => {
    if (currentTsuru) {
      locationRichText.text = currentTsuru.tsuruData.location;
    }
  };

  const updateTextColors = () => {
    if (currentTsuru) {
      titleRichText.style.stroke.color =
        currentTsuru.tsuruData.mainColorContrast;

      titleRichText.style.dropShadow.color =
        currentTsuru.tsuruData.mainColorContrast;

      titleRichText.style.fill.color = currentTsuru.tsuruData.mainColor;

      tsuruNumberRichText.style.stroke.color =
        currentTsuru.tsuruData.mainColorContrast;

      tsuruNumberRichText.style.dropShadow.color =
        currentTsuru.tsuruData.mainColorContrast;

      tsuruNumberRichText.style.fill.color = currentTsuru.tsuruData.mainColor;

      document.documentElement.style.setProperty(
        "--tsuru-main-color",
        currentTsuru.tsuruData.mainColor
      );
      document.documentElement.style.setProperty(
        "--tsuru-main-color-contrast",
        currentTsuru.tsuruData.mainColorContrast
      );
    }
  };

  const scrollToTsuruNumber = (number) => {
    const tsuru = tsurus.find((tsuru) => tsuru.tsuruData.number === number);
    if (tsuru) {
      const thisTsuruPosition = tsuru.sprite;
      const thisTsuruY = thisTsuruPosition.y;
      targetY = -thisTsuruY + app.screen.height / 2;
      isScrolling = true;
      smoothScroll();
    }
  };

  const scrollToNext = () => {
    const tsuru = tsurus.find(
      (tsuru) => tsuru.tsuruData.number === currentTsuru.tsuruData.number + 1
    );
    if (tsuru) {
      scrollToTsuruNumber(tsuru.tsuruData.number);
    }
  };

  const scrollToPrevious = () => {
    const tsuru = tsurus.find(
      (tsuru) => tsuru.tsuruData.number === currentTsuru.tsuruData.number - 1
    );
    if (tsuru) {
      scrollToTsuruNumber(tsuru.tsuruData.number);
    }
  };

  window.scrollToTsuruNumber = scrollToTsuruNumber;
  window.scrollToNext = scrollToNext;
  window.scrollToPrevious = scrollToPrevious;

  app.ticker.add((time) => {
    for (let i = 0; i < tsurus.length; i++) {
      tsurus[i].update(time);
    }

    navigator.update(time);
    blendInViewportTsurusImages();
    updateTsuruNumber();
    updateTextColors();
    updateTsuruLocation();
    maxScrollY = tsurusGroup.height - tsuruSize / 1;
    if (layoutOrientation === "portrait") {
      maxScrollY = tsurusGroup.height - tsuruSize / 1;
    }

    navigator.scrollToItem(currentTsuru.tsuruData.number);
  });
});

const transformText = (
  originalText,
  newText,
  callback,
  sharedInterval,
  delay = 100,
  removeDelay = 100
) => {
  if (sharedInterval) {
    clearInterval(sharedInterval);
  }
  let currentText = originalText;

  const samePrefix = originalText
    .split("")
    .reduce((acc, char, i) => (char === newText[i] ? acc + char : acc), "");

  const removeCharacter = () => {
    if (currentText.length > samePrefix.length) {
      currentText = currentText.slice(0, -1);
      callback(currentText);
      sharedInterval = setTimeout(removeCharacter, removeDelay); // Adjust the timeout as needed
    } else {
      addCharacter();
    }
  };

  const addCharacter = () => {
    if (currentText.length < newText.length) {
      currentText += newText[currentText.length];
      callback(currentText);
      sharedInterval = setTimeout(addCharacter, delay); // Adjust the timeout as needed
    } else {
      callback(newText);
    }
  };

  removeCharacter();
};
