/**
 * List of images to be displayed.
 * @type {Array<{
 * img: string,
 * thumbnail: string,
 * fullSize: string}>}
 */
const listOfImages = [];

/**
 * List of list item elements.
 * @type {Array}
 */
let listItemsEls = [];

/**
 * Frames per second for rendering.
 * @type {number}
 */
const framesPerSecond = 60;

let wrapperBgEl,
  listContainerEl,
  listEl,
  loadingEl,
  loadingDescriptionEl,
  modalEl,
  modalImgEl,
  modalHeaderCloseButtonEl,
  modalContentEl,
  listContainerElRect,
  listContainerElTop,
  listContainerElBottom,
  listContainerElHeight,
  listContainerElCenter;

// Easing functons from easing.net

/**
 * Easing function for easeInOutExpo.
 * @param {number} x - The input value.
 * @returns {number} - The eased value.
 */
function easeInOutExpo(x) {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? Math.pow(2, 20 * x - 10) / 2
    : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

/**
 * Easing function for easeInOutBack.
 * @param {number} x - The input value.
 * @returns {number} - The eased value.
 */
function easeInOutBack(x) {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;

  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

/**
 * Easing function for easeInOutCirc.
 * @param {number} x - The input value.
 * @returns {number} - The eased value.
 */
function easeInOutCirc(x) {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

/**
 * Calculates the eased value between two numbers.
 * @param {number} from - The starting value.
 * @param {number} to - The ending value.
 * @param {number} progress - The progress between 0 and 1.
 * @param {function} easeFn - The easing function to use.
 * @returns {number} - The eased value.
 */
const calculateEaseBetween = (from, to, progress, easeFn) => {
  const ease = easeFn(Math.min(1, Math.max(0, progress)));
  return from + (to - from) * ease;
};

/**
 * Loads an image and triggers callbacks on load or error.
 * @param {string} src - The source URL of the image.
 * @param {Object} callbacks - The callbacks for load and error events.
 * @param {function} callbacks.onLoad - The callback for the load event.
 * @param {function} callbacks.onError - The callback for the error event.
 */
const loadImage = (src, { onLoad, onError }) => {
  const img = new Image();
  img.src = src;
  img.onload = onLoad;
  img.onerror = onError;
};

/**
 * Calculates the size and position of the list container element.
 */
const calculateListContainerSize = () => {
  listContainerElRect = listContainerEl.getBoundingClientRect();
  listContainerElTop = listContainerElRect.top;
  listContainerElBottom = listContainerElRect.bottom;
  listContainerElHeight = listContainerElRect.height;
  listContainerElCenter = listContainerElTop + listContainerElHeight / 2;
};

/**
 * Generates a random degree value.
 * @returns {number} - The random degree value.
 */
const generateRandomDegree = () => {
  const maxAbsValue = 180;
  return Math.floor(Math.random() * (maxAbsValue + 1)) - maxAbsValue / 2;
};

/**
 * Opens the modal with the specified image.
 * @param {string} imgSrc - The source URL of the full-size image.
 * @param {string} thumbnail - The source URL of the thumbnail image.
 */
const openModal = (imgSrc, thumbnail) => {
  history.pushState({ modalOpen: imgSrc }, document.title);
  modalImgEl.src = thumbnail;

  modalContentEl.classList.add("modal__content--loading");

  loadImage(imgSrc, {
    onLoad: () => {
      modalContentEl.classList.remove("modal__content--loading");
      modalImgEl.src = imgSrc;
    },
    onError: () => {
      modalContentEl.classList.remove("modal__content--loading");
    },
  });

  modalEl.classList.remove("modal--close");
  modalEl.classList.add("modal--open");
};

/**
 * Closes the modal.
 */
const closeModal = () => {
  modalEl.classList.remove("modal--open");
  modalEl.classList.add("modal--close");
};

/**
 * Renders a frame for the animation.
 */
const renderFrame = () => {
  const initalTime = performance.now();
  listItemsEls.forEach((item) => {
    const thisEl = item;
    const thisElDataSrc = thisEl.getAttribute("data-src");
    const bgEl = wrapperBgEl.querySelector(`div[data-src="${thisElDataSrc}"]`);

    const initialDegree = Number(thisEl.getAttribute("data-initial-degree"));
    const finalDegree = Number(thisEl.getAttribute("data-final-degree"));

    const thisElRect = thisEl.getBoundingClientRect();
    const thisElTop = thisElRect.top;
    const thisElBottom = thisElRect.bottom;
    const thisElHeight = thisElRect.height;
    const thisElCenter = thisElTop + thisElHeight / 2;
    const distanceToCenter = Math.abs(thisElCenter - listContainerElCenter);
    const distanceToTop = Math.abs(thisElTop - listContainerElTop);
    const distanceToBottom = Math.abs(thisElBottom - listContainerElBottom);
    const distanceToCenterPercent = distanceToCenter / listContainerElHeight;
    const itemItsInScreen = distanceToCenterPercent < 1;

    if (!itemItsInScreen) {
      thisEl.style.transform = "scale(0.01) rotateZ(0deg)";
      bgEl.style.opacity = 0;
      return;
    }

    const scale = calculateEaseBetween(
      0.125,
      1,
      1 - distanceToCenterPercent,
      easeInOutCirc
    );
    const opacity = calculateEaseBetween(
      0,
      1,
      1 - distanceToCenterPercent,
      easeInOutCirc
    );

    const itsPreviousToCenter = distanceToBottom > distanceToTop;

    const rotateZ = itsPreviousToCenter
      ? calculateEaseBetween(
          initialDegree,
          0,
          1 - distanceToCenterPercent,
          easeInOutExpo
        )
      : calculateEaseBetween(
          finalDegree,
          0,
          1 - distanceToCenterPercent,
          easeInOutExpo
        );

    thisEl.style.transform = `scale(${scale}) rotateZ(${rotateZ}deg)`;

    bgEl.style.opacity = opacity.toFixed(2);
  });

  const finalTime = performance.now();
  const timeToRender = finalTime - initalTime;
  const timeToNextFrame = 1000 / framesPerSecond - timeToRender;

  setTimeout(() => {
    renderNextFrame();
  }, Math.max(timeToNextFrame, 0));
};

/**
 * Triggers the rendering of the next frame.
 */
const renderNextFrame = () => {
  renderFrame();
};

window.addEventListener("popstate", (event) => {
  closeModal();
});

window.addEventListener("resize", () => {
  calculateListContainerSize();
});

window.addEventListener("orientationchange", () => {
  calculateListContainerSize();
});

document.addEventListener("DOMContentLoaded", () => {
  wrapperBgEl = document.querySelector(".wrapper__background");
  listContainerEl = document.getElementById("list-container");
  listEl = document.getElementById("list");
  loadingEl = document.querySelector(".loading");
  loadingDescriptionEl = document.querySelector(".loading__description");
  modalEl = document.querySelector(".modal");
  modalHeaderCloseButtonEl = document.querySelector(".modal__header__close");
  modalContentEl = document.querySelector(".modal__content");
  modalImgEl = document.querySelector(".modal__content__image");

  calculateListContainerSize();

  modalHeaderCloseButtonEl.addEventListener("click", () => {
    history.back();
  });

  fetch("./data/listOfImages.json").then((response) => {
    response.json().then((data) => {
      data.forEach((img) => {
        listOfImages.push({
          img: img.img,
          thumbnail: img.thumbnail,
          fullSize: img.fullSize,
        });
      });

      let imagesLoaded = 0;

      listOfImages.forEach(({ img: imgSrc, thumbnail, fullSize }) => {
        const liEl = document.createElement("li");
        liEl.setAttribute("data-src", imgSrc);
        liEl.setAttribute("data-thumbnail", thumbnail);
        liEl.style.backgroundImage = `url(${thumbnail})`;
        listEl.appendChild(liEl);
        const divEl = document.createElement("div");
        divEl.style.backgroundImage = `url(${thumbnail})`;
        divEl.setAttribute("data-src", imgSrc);
        wrapperBgEl.appendChild(divEl);

        liEl.addEventListener("click", () => {
          openModal(fullSize, thumbnail);
        });

        /**
         * Updates the loading description.
         */
        const updateLoadingDescription = () => {
          loadingDescriptionEl.textContent = `${imagesLoaded} / ${listOfImages.length}`;
        };

        /**
         *
         * @param {boolean} isThumbnal
         * @returns
         */
        const handleImageLoad = (isThumbnal) => {
          updateLoadingDescription();

          if (!isThumbnal) {
            return;
          }
          imagesLoaded += 1;
          if (imagesLoaded === listOfImages.length) {
            loadingEl.style.display = "none";
            renderNextFrame();
          }
        };

        /**
         * @param {boolean} isThumbnal
         * @returns
         */
        const handleImageError = (isThumbnal) => {
          handleImageLoad(isThumbnal);
          wrapperBgEl.removeChild(divEl);
          listEl.removeChild(liEl);
        };

        loadImage(thumbnail, {
          onLoad: () => handleImageLoad(true),
          onError: () => handleImageError(true),
        });

        loadImage(imgSrc, {
          onLoad: () => {
            handleImageLoad(false);
            liEl.style.backgroundImage = `url(${imgSrc})`;
          },
          onError: () => handleImageError(false),
        });
      });

      listItemsEls = document.querySelectorAll("#list li");

      listItemsEls.forEach((item) => {
        const thisEl = item;

        const randomInitialDegree = generateRandomDegree();
        const randomFinalDegree = generateRandomDegree();

        thisEl.setAttribute(
          "data-initial-degree",
          randomInitialDegree.toString()
        );
        thisEl.setAttribute("data-final-degree", randomFinalDegree.toString());
      });

      calculateListContainerSize();

      renderNextFrame();
    });
  });
});
