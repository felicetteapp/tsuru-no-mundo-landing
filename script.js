console.log("teste");

document.addEventListener("DOMContentLoaded", () => {
  console.log("teste load");
  const wrapperEl = document.querySelector(".wrapper");
  const listContainerEl = document.getElementById("list-container");
  const listEl = document.getElementById("list");

  const listItemsEls = document.querySelectorAll("#list li");
  console.log({ listItemsEls, wrapperEl, listContainerEl, listEl });

  let currentFrameRenderingTimer = null;

  listItemsEls.forEach((item) => {
    const thisEl = item;

    thisEl.setAttribute(
      "data-initial-degree",
      Math.floor(Math.random() * 361) - 180
    );
  });

  const renderFrame = () => {
    console.log("renderFrameCalled");
    const listContainerElRect = listContainerEl.getBoundingClientRect();
    const listContainerElTop = listContainerElRect.top;
    const listContainerElBottom = listContainerElRect.bottom;
    const listContainerElHeight = listContainerElRect.height;
    const listContainerElCenter =
      listContainerElTop + listContainerElHeight / 2;

    listItemsEls.forEach((item, index) => {
      const thisEl = listItemsEls[index];

      const initialDegree = Number(thisEl.getAttribute("data-initial-degree"));

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

      const itsPreviousToCenter = distanceToBottom > distanceToTop;
      const rotateZ =
        distanceToCenterPercent *
        initialDegree *
        (itsPreviousToCenter ? 1 : -1);
      thisEl.innerHTML = `center: ${distanceToCenterPercent} - ${
        itsPreviousToCenter ? "antes" : "depois"
      }`;
      thisEl.style.transform = `scale(${scale}) rotateZ(${rotateZ}deg)`;
    });
  };

  listContainerEl.addEventListener("scroll", () => {
    console.log("scroll");
    if (currentFrameRenderingTimer) {
      window.cancelAnimationFrame(currentFrameRenderingTimer);
    }
    currentFrameRenderingTimer = window.requestAnimationFrame(renderFrame);
  });

  renderFrame();
});
