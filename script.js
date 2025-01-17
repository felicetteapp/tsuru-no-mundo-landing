console.log("teste");

const tsuruFrom = 1;
const tsuruTo = 50;

const listOfImages = [];
for (let i = tsuruFrom; i <= tsuruTo; i++) {
  listOfImages.push(`./img/${i}.jpeg`);
}

listOfImages.reverse();

document.addEventListener("DOMContentLoaded", () => {
  const wrapperEl = document.querySelector(".wrapper");
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

    const thisDegreeItsPositive = Math.random() > 0.5;
    const randomInitialDegree = Math.floor(Math.random() * 181) - 90;
    const randomFinalDegree = thisDegreeItsPositive
      ? randomInitialDegree
      : randomInitialDegree * -1;

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

    listItemsEls.forEach((item, index) => {
      const thisEl = listItemsEls[index];
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
      const scale = 1 - distanceToCenterPercent;
      const opacity = 1 - distanceToCenterPercent;

      const borderSize = 0.5 - 1 * distanceToCenterPercent;

      const itsPreviousToCenter = distanceToBottom > distanceToTop;
      const rotateZ =
        distanceToCenterPercent *
        (itsPreviousToCenter ? initialDegree : finalDegree);
      thisEl.style.transform = `scale(${scale}) rotateZ(${rotateZ}deg)`;
      thisEl.style.borderWidth = `${borderSize}rem`;
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
});
