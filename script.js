/* Easing math functions from easings.net */
function easeInOutExpo(x) {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? Math.pow(2, 20 * x - 10) / 2
    : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

function easeInOutBack(x) {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;

  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

function easeInOutCirc(x) {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

const calculateEaseBetween = (from, to, progress, easeFn) => {
  const ease = easeFn(Math.min(1, Math.max(0, progress)));
  return from + (to - from) * ease;
};

const tsuruFrom = 1;
const tsuruTo = 55;

const listOfImages = [];
for (let i = tsuruFrom; i <= tsuruTo; i++) {
  listOfImages.push(`./img/tsurus/${i}.jpeg`);
}

listOfImages.reverse();

document.addEventListener("DOMContentLoaded", () => {
  const wrapperBgEl = document.querySelector(".bg");
  const listContainerEl = document.getElementById("list-container");
  const listEl = document.getElementById("list");

  listOfImages.forEach((imgSrc) => {
    const liEl = document.createElement("li");
    liEl.setAttribute("data-src", imgSrc);
    liEl.style.backgroundImage = `url(${imgSrc})`;
    listEl.appendChild(liEl);
    const divEl = document.createElement("div");
    divEl.style.backgroundImage = `url(${imgSrc})`;
    divEl.setAttribute("data-src", imgSrc);
    wrapperBgEl.appendChild(divEl);
  });

  const listItemsEls = document.querySelectorAll("#list li");

  let currentFrameRenderingTimer = null;

  listItemsEls.forEach((item) => {
    const thisEl = item;

    const randomInitialDegree = Math.floor(Math.random() * 91) - 45;
    const randomFinalDegree = Math.floor(Math.random() * 91) - 45;

    thisEl.setAttribute("data-initial-degree", randomInitialDegree.toString());
    thisEl.setAttribute("data-final-degree", randomFinalDegree.toString());
  });

  const renderFrame = () => {
    const listContainerElRect = listContainerEl.getBoundingClientRect();
    const listContainerElTop = listContainerElRect.top;
    const listContainerElBottom = listContainerElRect.bottom;
    const listContainerElHeight = listContainerElRect.height;
    const listContainerElCenter =
      listContainerElTop + listContainerElHeight / 2;

    listItemsEls.forEach((item) => {
      const thisEl = item;
      const thisElDataSrc = thisEl.getAttribute("data-src");
      const bgEl = wrapperBgEl.querySelector(
        `div[data-src="${thisElDataSrc}"]`
      );

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
      bgEl.style.opacity = opacity;
    });
  };

  listContainerEl.addEventListener("scroll", () => {
    if (currentFrameRenderingTimer) {
      window.cancelAnimationFrame(currentFrameRenderingTimer);
    }
    currentFrameRenderingTimer = window.requestAnimationFrame(renderFrame);
  });

  window.addEventListener("resize", () => {
    if (currentFrameRenderingTimer) {
      window.cancelAnimationFrame(currentFrameRenderingTimer);
    }
    currentFrameRenderingTimer = window.requestAnimationFrame(renderFrame);
  });

  window.addEventListener("orientationchange", () => {
    if (currentFrameRenderingTimer) {
      window.cancelAnimationFrame(currentFrameRenderingTimer);
    }
    currentFrameRenderingTimer = window.requestAnimationFrame(renderFrame);
  });

  renderFrame();

  setInterval(() => {
    if (currentFrameRenderingTimer) {
      window.cancelAnimationFrame(currentFrameRenderingTimer);
    }
    currentFrameRenderingTimer = window.requestAnimationFrame(renderFrame);
  }, 100);
});
