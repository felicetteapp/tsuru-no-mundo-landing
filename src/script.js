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
let listItemsEls = [];

document.addEventListener("DOMContentLoaded", () => {
  const wrapperBgEl = document.querySelector(".bg");
  const listContainerEl = document.getElementById("list-container");
  const listEl = document.getElementById("list");
  const loadingEl = document.querySelector(".loading");
  const loadingDescriptionEl = document.querySelector(".loading__description");
  const modalEl = document.querySelector(".modal");
  const modalImgEl = document.querySelector(".modal__content__image");
  const modalImgLoadingEl = document.querySelector(
    ".modal__content__image__loading"
  );
  const modalHeaderCloseButtonEl = document.querySelector(
    ".modal__header__close"
  );
  const modalContentEl = document.querySelector(".modal__content");

  const openModal = (imgSrc) => {
    modalImgEl.src = imgSrc;

    const imgEl = document.createElement("img");
    imgEl.src = imgSrc;

    modalContentEl.classList.add("modal__content--loading");

    imgEl.onload = () => {
      modalContentEl.classList.remove("modal__content--loading");
    };

    imgEl.onerror = () => {
      modalContentEl.classList.remove("modal__content--loading");
    };

    modalEl.classList.remove("modal--close");
    modalEl.classList.add("modal--open");
  };

  const closeModal = () => {
    modalEl.classList.remove("modal--open");
    modalEl.classList.add("modal--close");
  };

  modalHeaderCloseButtonEl.addEventListener("click", () => {
    closeModal();
  });

  let currentFrameRenderingTimer = null;

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
      const itemItsInScreen = distanceToCenterPercent < 1;

      if (!itemItsInScreen) {
        thisEl.style.transform = "";
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
      bgEl.style.opacity = opacity;
    });
  };

  const renderNextFrame = () => {
    if (currentFrameRenderingTimer) {
      window.cancelAnimationFrame(currentFrameRenderingTimer);
    }
    currentFrameRenderingTimer = window.requestAnimationFrame(renderFrame);
  };

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
        liEl.style.backgroundImage = `url(${imgSrc})`;
        listEl.appendChild(liEl);
        const divEl = document.createElement("div");
        divEl.style.backgroundImage = `url(${thumbnail})`;
        divEl.setAttribute("data-src", imgSrc);
        wrapperBgEl.appendChild(divEl);

        liEl.addEventListener("click", () => {
          openModal(fullSize);
        });

        const updateLoadingDescription = () => {
          loadingDescriptionEl.textContent = `${imagesLoaded} / ${
            listOfImages.length * 2
          }`;
        };

        const imgEl = document.createElement("img");
        imgEl.src = imgSrc;

        const imgThumbnailEl = document.createElement("img");
        imgThumbnailEl.src = thumbnail;

        const handleImageLoad = () => {
          updateLoadingDescription();
          imagesLoaded += 1;
          if (imagesLoaded === listOfImages.length * 2) {
            loadingEl.style.display = "none";
            renderNextFrame();
          }
        };

        const handleImageError = () => {
          handleImageLoad();
          wrapperBgEl.removeChild(divEl);
          listEl.removeChild(liEl);
        };

        imgThumbnailEl.onload = () => {
          handleImageLoad();
        };

        imgThumbnailEl.onerror = () => {
          handleImageError();
        };

        imgEl.onload = () => {
          handleImageLoad();
        };

        imgEl.onerror = () => {
          handleImageError();
        };
      });

      listItemsEls = document.querySelectorAll("#list li");

      listItemsEls.forEach((item) => {
        const thisEl = item;

        const randomInitialDegree = Math.floor(Math.random() * 91) - 45;
        const randomFinalDegree = Math.floor(Math.random() * 91) - 45;

        thisEl.setAttribute(
          "data-initial-degree",
          randomInitialDegree.toString()
        );
        thisEl.setAttribute("data-final-degree", randomFinalDegree.toString());
      });

      listContainerEl.addEventListener(
        "scroll",
        () => {
          renderNextFrame();
        },
        { passive: true }
      );

      window.addEventListener("resize", () => {
        renderNextFrame();
      });

      window.addEventListener("orientationchange", () => {
        renderNextFrame();
      });

      setInterval(() => {
        //   renderNextFrame();
      }, 1000 / 60);

      renderNextFrame();
    });
  });
});
