import { gsap } from "gsap";

export const openTsuruModal = (tsuruData) => {
  const fullSize = tsuruData.fullSize;
  const thumbnail = tsuruData.thumbnail;

  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal__content">
    <img alt="Tsuru" class="modal__image modal__image--thumbnail" />
    <img alt="Tsuru" class="modal__image modal__image--fullsize" />
    </div>
    <button class="modal__close">Close</button>`;
  document.body.appendChild(modal);

  gsap.set(modal, { opacity: 0 });
  const modalImage = modal.querySelector(
    ".modal__image.modal__image--thumbnail"
  );
  const modalFullSizeImage = modal.querySelector(".modal__image--fullsize");

  gsap.set(modalFullSizeImage, { opacity: 0 });
  gsap.set(modalImage, { opacity: 0 });

  const tl = gsap.timeline();

  gsap.set(modal, { backdropFilter: "blur(0rem)" });

  modalImage.onload = () => {
    gsap.set(modalImage, { opacity: 1 });
    tl.to(modal, { opacity: 1, duration: 0.3 });
    tl.to(modal, {
      backdropFilter: "blur(1rem)",
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        modal
          .querySelector(".modal__close")
          .addEventListener("click", closeTsuruModal);

        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            closeTsuruModal();
          }
        });
      },
    });

    modalFullSizeImage.onload = () => {
      gsap.set(modalFullSizeImage, {
        borderRadius: "50%",
        filter: "blur(5rem)",
      });
      tl.to(modalFullSizeImage, {
        opacity: 1,
        borderRadius: 0,
        filter: "blur(0rem)",
      });
      tl.to(modalImage, { opacity: 0, duration: 0.3 });
    };
    modalFullSizeImage.src = fullSize;
  };
  modalImage.src = thumbnail;
};

const closeTsuruModal = () => {
  const modal = document.querySelector(".modal");

  const modalImage = modal.querySelector(
    ".modal__image.modal__image--thumbnail"
  );
  const modalFullSizeImage = modal.querySelector(".modal__image--fullsize");

  const tl = gsap.timeline();

  tl.to(modalImage, { opacity: 0, duration: 0.3, borderRadius: "50%" });
  tl.to(
    modalFullSizeImage,
    { opacity: 0, duration: 0.3, borderRadius: "50%", filter: "blur(5rem)" },
    "<"
  );
  tl.to(modal, {
    opacity: 0,
    duration: 0.5,
    backdropFilter: "blur(0rem)",
    ease: "power2.inOut",
    onComplete: () => {
      modal.remove();
      modal
        .querySelector(".modal__close")
        .removeEventListener("click", closeTsuruModal);
    },
  });
};
