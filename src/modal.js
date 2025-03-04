export const openTsuruModal = (tsuruData) => {
  const preview = tsuruData.img;
  const fullSize = tsuruData.fullSize;

  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal__content">
        <img src="${preview}" alt="Tsuru" class="modal__image" />
    </div>
    <button class="modal__close">Close</button>`;
  document.body.appendChild(modal);

  modal
    .animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 500,
      easing: "ease-in-out",
      fill: "forwards",
    })
    .finished.then((anim) => {
      anim.commitStyles();
      anim.cancel();

      modal
        .querySelector(".modal__close")
        .addEventListener("click", closeTsuruModal);

      const fullSizeImg = new Image();
      fullSizeImg.src = fullSize;
      fullSizeImg.onload = () => {
        modal.querySelector(".modal__image").src = fullSize;
      };

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeTsuruModal();
        }
      });
    });
};

const closeTsuruModal = () => {
  const modal = document.querySelector(".modal");

  modal
    .animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 500,
      easing: "ease-in-out",
      fill: "forwards",
    })
    .finished.then((anim) => {
      anim.commitStyles();
      anim.cancel();
      modal.remove();
      modal
        .querySelector(".modal__close")
        .removeEventListener("click", closeTsuruModal);
    });
};
