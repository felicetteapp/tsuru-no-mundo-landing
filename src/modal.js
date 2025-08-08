import { gsap } from "gsap";

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

  gsap.set(modal, { opacity: 0 });

  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
    ease: "power2.inOut",
    onComplete: () => {
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
    },
  });
};

const closeTsuruModal = () => {
  const modal = document.querySelector(".modal");

  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    ease: "power2.inOut",
    onComplete: () => {
      modal.remove();
      modal
        .querySelector(".modal__close")
        .removeEventListener("click", closeTsuruModal);
    },
  });
};
