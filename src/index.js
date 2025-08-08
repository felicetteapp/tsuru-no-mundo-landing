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
} from "pixi.js";
import { Tsuru } from "./tsuru";
import { Navigator } from "./navigator";
import { openTsuruModal } from "./modal";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(TextPlugin);

const LOADING_ITEM_TOTAL_DURATION = 3;
const LOADING_ITEM_DISSAPEAR_TIME = 1;

const app = new Application();
const listOfImages = [];
const tsurus = [];
let isDragging = false,
  startY = 0,
  startScrollY = 0,
  currentY = 0,
  targetY = 0,
  isScrolling = false,
  maxScrollY = 0,
  tsuruSize = window.innerHeight * 0.4,
  transformTextNumberTimeout = null,
  layoutOrientation =
    window.innerWidth > window.innerHeight ? "landscape" : "portrait",
  horizontalMargin = 50,
  locationFontSize = 36,
  verticalMargin = 50,
  navigatorItemSize = 100,
  userScrollDirection = "normal",
  fontIsReady = false,
  dataIsReady = false,
  previousLayoutOrientation = layoutOrientation,
  numberScrollDistance = 0,
  numberDragDistance = 0,
  numberDragDistanceOrigin = 0,
  isDraggingFromNumber = false,
  numberDragThreshold = 50,
  numberDragNextNumber = 0;

const updateLayout = () => {
  layoutOrientation =
    window.innerWidth < window.innerHeight ? "portrait" : "landscape";
  horizontalMargin = 50;
  tsuruSize = window.innerHeight * 0.6;

  if (layoutOrientation === "landscape") {
    tsuruSize = Math.min(
      (window.innerWidth - horizontalMargin * 3 - navigatorItemSize) / 2,
      tsuruSize
    );
  }

  if (layoutOrientation === "portrait") {
    tsuruSize = window.innerWidth * 0.8;
    horizontalMargin = (window.innerWidth - tsuruSize) / 2;
  }
  for (let i = 0; i < listOfImages.length; i++) {
    const tsuru = tsurus[i];
    tsuru.updateSize(tsuruSize);
  }
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

function detectScrollDirection() {
  return new Promise((resolve) => {
    const testElement = document.createElement("div");
    testElement.style.width = "100px";
    testElement.style.height = "100px";
    testElement.style.overflow = "scroll";
    testElement.style.position = "absolute";
    testElement.style.top = "-9999px";

    const innerElement = document.createElement("div");
    innerElement.style.width = "100px";
    innerElement.style.height = "200px";

    testElement.appendChild(innerElement);
    document.body.appendChild(testElement);

    testElement.addEventListener("scroll", function onScroll(event) {
      testElement.removeEventListener("scroll", onScroll);
      document.body.removeChild(testElement);

      const scrollDirection = event.deltaY > 0 ? "normal" : "reverse";
      resolve(scrollDirection);
    });

    testElement.scrollTop = 10;
  });
}

const pixiAppInit = async () => {
  userScrollDirection = await detectScrollDirection();
  // Create a new application
  // pixiAppInitialize the application
  await app.init({ background: "black", resizeTo: window.document.body });
  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const wrapperToggleBtnEl = document.getElementById("wrapper-toggle-button");

  wrapperToggleBtnEl.addEventListener("click", () => {
    document.documentElement.classList.toggle("wrapper--open");

    const labelEl = wrapperToggleBtnEl.querySelector(
      ".wrapper__toggle__button__label"
    );

    if (document.documentElement.classList.contains("wrapper--open")) {
      labelEl.innerHTML = "Less";
    } else {
      labelEl.innerHTML = "More";
    }
  });
  return app;
};

// Function to dynamically load fonts
function loadFont(name, url) {
  const font = new FontFace(name, `url(${url})`);
  font
    .load()
    .then((loadedFont) => {
      document.fonts.add(loadedFont);
    })
    .catch((error) => {
      console.error(`Failed to load font: ${name}`, error);
    });
}

// Load the fonts
loadFont("Danfo-Regular", "./fonts/Danfo-Regular.ttf");
loadFont("Montserrat-Black", "./fonts/Montserrat-Black.ttf");

document.fonts.ready.then(() => {
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

  while (!fontIsReady || !dataIsReady) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await pixiAppInit();

  // add a fullscreen background

  const onDragStart = (event) => {
    isDragging = true;
    startY = event.data.global.y;
    startScrollY = tsurusGroup.y;
    currentY = tsurusGroup.y;
    targetY = tsurusGroup.y;
    dragHitAreaDebug.cursor = "grabbing";
    currentTsuruWhenStartDragging = currentTsuru;
  };

  const onDragEnd = (event) => {
    if (!isDragging) {
      return false;
    }

    isDragging = false;
    dragHitAreaDebug.cursor = "grab";

    const swipeThreshold = tsuruSize / 5;

    const wasSwipedUp = startY - event.data.global.y > swipeThreshold;
    const wasSwipedDown = event.data.global.y - startY > swipeThreshold;

    const itsTheSameThatWasDragged =
      currentTsuru.tsuruData.number ===
      currentTsuruWhenStartDragging.tsuruData.number;

    const samePlaceThreshold = 10;
    const hasReleasedInTheSamePlace =
      Math.abs(startY - event.data.global.y) < samePlaceThreshold;

    const hasReleasedInsideTheTsuruHorizontally =
      event.data.global.x > horizontalMargin &&
      event.data.global.x < horizontalMargin + tsuruSize;

    const minY = (window.innerHeight - tsuruSize) / 2;
    const maxY = window.innerHeight - (window.innerHeight - tsuruSize) / 2;

    const hasReleasedInsideTheTsuruVertically =
      event.data.global.y > minY && event.data.global.y < maxY;

    if (wasSwipedDown && itsTheSameThatWasDragged) {
      scrollToNext();
    } else if (wasSwipedUp && itsTheSameThatWasDragged) {
      scrollToPrevious();
    } else if (
      hasReleasedInTheSamePlace &&
      itsTheSameThatWasDragged &&
      hasReleasedInsideTheTsuruHorizontally &&
      hasReleasedInsideTheTsuruVertically
    ) {
      openTsuruModal(currentTsuru.tsuruData);
    } else {
      scrollToTsuruNumber(currentTsuru.tsuruData.number);
    }
  };

  const onDragMove = (event) => {
    if (isDragging) {
      const deltaY = event.data.global.y - startY;
      currentY = startScrollY + deltaY;
      currentY = Math.max(Math.min(0, currentY), -maxScrollY);
      targetY = currentY;
      tsurusGroup.y = currentY;
    }
  };

  const dragHitAreaDebug = new Sprite(Texture.WHITE);
  dragHitAreaDebug.width = horizontalMargin + tsuruSize;
  dragHitAreaDebug.height = app.screen.height;

  dragHitAreaDebug.alpha = 0;
  dragHitAreaDebug.interactive = true;
  dragHitAreaDebug.x = 0;
  dragHitAreaDebug.y = 0;
  dragHitAreaDebug.eventMode = "static";

  let scrollEndTimeout = null;
  const onScroll = (event) => {
    const deltaY = event.deltaY * (userScrollDirection === "normal" ? 1 : -1);

    currentY = currentY + deltaY;
    currentY = Math.max(Math.min(0, currentY), -maxScrollY);
    targetY = currentY;
    tsurusGroup.y = currentY;

    if (scrollEndTimeout) {
      clearTimeout(scrollEndTimeout);
    }

    scrollEndTimeout = setTimeout(() => {
      scrollToTsuruNumber(currentTsuru.tsuruData.number);
    }, 250);
  };

  dragHitAreaDebug
    .on("pointerdown", onDragStart)
    .on("pointerup", onDragEnd)
    .on("pointerupoutside", onDragEnd)
    .on("pointermove", onDragMove)
    .on("wheel", onScroll);

  document.querySelector(".wrapper").addEventListener("wheel", (e) => {
    if (layoutOrientation === "portrait") {
      e.stopPropagation();
    }
  });
  const backgroundsGroups = new Container();
  const background = new Sprite(Texture.WHITE);

  background.width = app.screen.width;
  background.height = app.screen.height;
  background.tint = 0x000000;

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

  locationRichText.style.fontSize = locationFontSize;
  locationRichText.style.lineHeight = locationFontSize;
  locationRichText.anchor.set(0, 0);
  locationRichText.style.wordWrapWidth = tsuruSize - locationExpectedX;
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

  const loadingEl = document.getElementById("loading");
  const loadingTextEl = loadingEl.querySelector(".loading__label");

  const handleTsuruThumbnailLoaded = (tsuru) => {
    const thisTsuruDataEl = document.createElement("div");
    thisTsuruDataEl.classList.add("loading__label__item");

    const numberWithLeadingZeros = tsuru.tsuruData.number
      .toString()
      .padStart(2, "0");

    loadingTextEl.appendChild(thisTsuruDataEl);

    gsap.set(thisTsuruDataEl, {
      yPercent: 0,
    });
    const tl = gsap.timeline();

    const targetText = `#${numberWithLeadingZeros} - ${tsuru.tsuruData.location}`;

    const targetDuration = Math.min(
      targetText.length * 0.025,
      LOADING_ITEM_TOTAL_DURATION - LOADING_ITEM_DISSAPEAR_TIME
    );

    const expectedDelay = LOADING_ITEM_TOTAL_DURATION - targetDuration;

    gsap.set(thisTsuruDataEl, {
      text: `#${numberWithLeadingZeros} - `,
      color: tsuru.tsuruData.mainColor,
      opacity: 1,
    });

    tl.to(thisTsuruDataEl, {
      text: {
        value: targetText,
        delimiter: "",
      },
      color: tsuru.tsuruData.mainColorContrast,
      duration: targetDuration,
    });

    tl.to(
      thisTsuruDataEl,
      {
        duration: LOADING_ITEM_DISSAPEAR_TIME,
        text: {
          value: `#${numberWithLeadingZeros} - `,
          delimiter: "",
        },
        opacity: 0,
        color: tsuru.tsuruData.mainColor,
      },
      `+=${expectedDelay}`
    );

    tl.eventCallback("onComplete", () => {
      thisTsuruDataEl.remove();
    });
  };

  for (let i = 0; i < tsurus.length; i++) {
    const tsuru = tsurus[i];
    tsuru.updateStageSize(
      app.screen.width,
      app.screen.height,
      horizontalMargin
    );
    tsuru.addEventListener("thumbnailLoaded", handleTsuruThumbnailLoaded);
    await tsuru.initTsuru();
  }

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, LOADING_ITEM_DISSAPEAR_TIME + LOADING_ITEM_TOTAL_DURATION * 1000);
  });

  const navigator = new Navigator(tsurus, navigatorItemSize, horizontalMargin);
  navigator.updateStageSize(
    app.screen.width,
    app.screen.height,
    horizontalMargin
  );
  await navigator.initItems(app);

  navigator.addEventListener("navigatorItemClick", (tsuru) => {
    scrollToTsuruNumber(tsuru.tsuruData.number);
  });

  app.stage.addChild(navigator);
  navigator.position.set(tsuruSize + horizontalMargin, 0);

  app.stage.interactive = true;
  app.stage.addChild(dragHitAreaDebug);
  dragHitAreaDebug.cursor = "grab";

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

  let currentTsuru = tsurus[0];
  let currentTsuruWhenStartDragging = tsurus[0];
  const tsuruNumberRichText = new Text({
    text: "#" + currentTsuru.tsuruData.number,
    style: tsuruNumberRichTextStyle,
  });

  tsuruNumberRichText.zIndex = 4;

  tsuruNumberRichText.interactive = true;

  tsuruNumberRichText
    .on("pointerdown", (e) => {
      isDraggingFromNumber = true;

      numberDragDistance = 0;
      numberDragDistanceOrigin = e.global.y;
    })
    .on("pointerup", (e) => {
      isDraggingFromNumber = false;
      numberDragDistance = 0;
    })
    .on("pointerupoutside", (e) => {
      isDraggingFromNumber = false;

      scrollToTsuruNumber(numberDragNextNumber);

      numberDragDistance = 0;
    });

  const nextNumberThumbnail = new Sprite(Texture.WHITE);
  nextNumberThumbnail.anchor.set(0.5, 0.5);
  nextNumberThumbnail.width = navigatorItemSize;
  nextNumberThumbnail.height = navigatorItemSize;
  nextNumberThumbnail.x =
    horizontalMargin + horizontalMargin + navigatorItemSize;
  nextNumberThumbnail.y = app.screen.height / 2 - navigatorItemSize / 2;
  nextNumberThumbnail.zIndex = 2;

  const nextNumberThumbnailOverlay = new Sprite(Texture.WHITE);
  nextNumberThumbnailOverlay.anchor.set(0, 0);
  nextNumberThumbnailOverlay.width = app.stage.width;
  nextNumberThumbnailOverlay.height = app.stage.height;
  nextNumberThumbnailOverlay.x = 0;
  nextNumberThumbnailOverlay.y = 0;
  nextNumberThumbnailOverlay.tint = 0x000000;
  app.stage.addChild(nextNumberThumbnailOverlay);
  app.stage.addChild(nextNumberThumbnail);
  const calculateNextTsuruNumberBasedOnDrag = () => {
    nextNumberThumbnail.alpha = 0;
    nextNumberThumbnail.zIndex = -1;
    nextNumberThumbnailOverlay.alpha = 0;
    nextNumberThumbnailOverlay.zIndex = numberDragNextNumber > 0 ? 1 : -1;

    if (!isDraggingFromNumber) {
      numberDragNextNumber = 0;
      tsuruNumberRichText.cursor = "grab";
      app.stage.cursor = "";
      return;
    } else {
      tsuruNumberRichText.cursor = "grabbing";
      app.stage.cursor = "ns-resize";
    }

    if (numberDragNextNumber > 0) {
      const nextTsuru = tsurus.find(
        (tsuru) => tsuru.tsuruData.number === numberDragNextNumber
      );
      if (nextTsuru) {
        tsuruNumberRichText.text = `#${nextTsuru.tsuruData.number}`;

        titleRichText.style.fill.color = nextTsuru.tsuruData.mainColor;
        tsuruNumberRichText.style.stroke.color =
          nextTsuru.tsuruData.mainColorContrast;
        tsuruNumberRichText.style.dropShadow.color =
          nextTsuru.tsuruData.mainColorContrast;
        tsuruNumberRichText.style.fill.color = nextTsuru.tsuruData.mainColor;

        nextNumberThumbnail.alpha = 1;
        nextNumberThumbnailOverlay.alpha = 0.5;
        nextNumberThumbnail.texture =
          nextTsuru.imageTexture || nextTsuru.thumbnailTexture;
        nextNumberThumbnail.zIndex = 2;
        nextNumberThumbnail.position.set(
          currentTsuru.sprite.x + tsuruSize / 2,
          currentTsuru.sprite.y + tsurusGroup.y
        );
        nextNumberThumbnail.width = navigatorItemSize;
        nextNumberThumbnail.height = navigatorItemSize;
      }
    } else {
      tsuruNumberRichText.text = `#${currentTsuru.tsuruData.number}`;

      titleRichText.style.fill.color = currentTsuru.tsuruData.mainColor;

      tsuruNumberRichText.style.stroke.color =
        currentTsuru.tsuruData.mainColorContrast;

      tsuruNumberRichText.style.dropShadow.color =
        currentTsuru.tsuruData.mainColorContrast;

      tsuruNumberRichText.style.fill.color = currentTsuru.tsuruData.mainColor;
    }

    if (!currentTsuru) {
      numberDragNextNumber = 0;
      return;
    }

    const currentNumber = currentTsuru.tsuruData.number;
    const dragDistance = numberDragDistance;
    const dragDirection = dragDistance > 0 ? -1 : 1;

    const mousePositionRelativeToScreen = numberDragDistanceOrigin;
    const distanceToTop = mousePositionRelativeToScreen;
    const distanceToBottom =
      app.screen.height - verticalMargin - mousePositionRelativeToScreen;

    const previousTsurus = tsurus.filter(
      (tsuru) => tsuru.tsuruData.number < currentTsuru.tsuruData.number
    );

    const nextTsurus = tsurus.filter(
      (tsuru) => tsuru.tsuruData.number > currentTsuru.tsuruData.number
    );

    numberDragThreshold =
      dragDirection > 0
        ? distanceToTop / nextTsurus.length - 1
        : distanceToBottom / previousTsurus.length - 1;

    const dragThreshold = numberDragThreshold;
    const dragDistanceAbs = Math.abs(dragDistance);
    const howManyNumbers =
      dragDirection * Math.floor(dragDistanceAbs / dragThreshold);

    if (dragDistanceAbs > dragThreshold) {
      const targetNextNumber = Math.min(
        tsurus.length,
        Math.max(1, currentNumber + howManyNumbers)
      );

      numberDragNextNumber = targetNextNumber;
    } else {
      numberDragNextNumber = 0;
    }
  };

  app.stage.on("pointermove", (e) => {
    if (isDraggingFromNumber) {
      numberDragDistance = e.global.y - numberDragDistanceOrigin;
    }
  });
  tsuruNumberRichText.on("wheel", (e) => {
    numberScrollDistance +=
      e.deltaY * (userScrollDirection === "normal" ? 1 : -1);
    if (numberScrollDistance > 100) {
      scrollToNext();
      numberScrollDistance = 0;
    } else if (numberScrollDistance < -100) {
      scrollToPrevious();
      numberScrollDistance = 0;
    }
  });
  tsuruNumberRichText.anchor.set(0, 1);
  tsuruNumberRichText.x = horizontalMargin + 36 - 10;

  tsuruNumberRichText.y = (app.screen.height - tsuruSize) / 2 + 100;
  tsuruNumberRichText.rotation = (-90 * Math.PI) / 180;

  app.stage.addChild(tsuruNumberRichText);

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

  let lastScrolledTsuru = currentTsuru.tsuruData.number;

  window.addEventListener("resize", () => {
    updateLayout();
    background.width = app.screen.width;
    background.height = app.screen.height;

    if (layoutOrientation === "portrait") {
      navigator.position.set(app.stage.width);
    } else {
      navigator.position.set(tsuruSize + horizontalMargin, 0);

      if (previousLayoutOrientation === "portrait") {
        navigator.initItems(app).then(() => {
          navigator.updateStageSize(
            app.screen.width,
            app.screen.height,
            horizontalMargin
          );
        });
      }
    }
    for (let i = 0; i < tsurus.length; i++) {
      tsurus[i].updateStageSize(
        app.screen.width,
        app.screen.height,
        horizontalMargin
      );
      tsurus[i].updateSize(tsuruSize);
    }

    locationRichText.style.fontSize = locationFontSize;
    locationRichText.style.lineHeight = locationFontSize;
    locationRichText.style.wordWrapWidth = tsuruSize - locationExpectedX;
    locationRichText.x = locationExpectedX;
    locationRichText.y =
      app.screen.height / 2 + tsuruSize / 2 + locationFontSize;

    tsuruNumberRichText.x = horizontalMargin + 36 - 10;

    tsuruNumberRichText.y = (app.screen.height - tsuruSize) / 2 + 100;
    dragHitAreaDebug.width = horizontalMargin + tsuruSize;
    dragHitAreaDebug.height = app.screen.height;

    updateTsuruNumber();
    updateTsuruLocation();
    updateTextColors();

    previousLayoutOrientation = layoutOrientation;
  });
  app.ticker.add((time) => {
    for (let i = 0; i < tsurus.length; i++) {
      tsurus[i].update(time);
    }

    navigator.update(time);
    blendInViewportTsurusImages();
    updateTsuruNumber();
    updateTextColors();
    updateTsuruLocation();
    calculateNextTsuruNumberBasedOnDrag();
    maxScrollY = tsurusGroup.height - tsuruSize / 1;
    if (layoutOrientation === "portrait") {
      maxScrollY = tsurusGroup.height - tsuruSize / 1;
    }

    if (
      currentTsuru.tsuruData.number > -1 &&
      currentTsuru.tsuruData.number !== lastScrolledTsuru
    ) {
      navigator.scrollToItem(currentTsuru.tsuruData.number);
      lastScrolledTsuru = currentTsuru.tsuruData.number;
    }
  });

  loadingEl
    .animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 250,
      easing: "ease-in-out",
      fill: "forwards",
    })
    .finished.then((anim) => {
      loadingEl.style.display = "none";
      anim.cancel();
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
