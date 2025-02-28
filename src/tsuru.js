import {
  Container,
  Assets,
  Sprite,
  BlurFilter,
  ColorMatrixFilter,
} from "pixi.js";
import { calculateEaseBetween, easeInOutExpo } from "./easings";

const EventEmitter = require("events");
class TsuruEventEmitter extends EventEmitter {}

export class Tsuru extends Container {
  thumbnailLoaded = false;
  imageLoaded = false;
  fullScale = {
    x: 1,
    y: 1,
  };
  fullSize = {
    width: 100,
    height: 100,
  };
  originalAngle = 0;
  isAnimatingBlurOut = false;
  isLoadingImage = false;
  isInViewport = false;
  tsuruEventEmitter = new TsuruEventEmitter();
  distanceToCenter = 1;
  horizontalMargin = 50;
  constructor(tsuruData, i, {size, horizontalMargin}) {
    super();
    this.tsuruData = tsuruData;
    this.i = i;
    this.size = size;
    this.horizontalMargin = horizontalMargin;
    this.originalAngle = this.getRandomAngle();
  }

  addEventListener(eventName, callback) {
    this.tsuruEventEmitter.on(eventName, callback);
  }

  updateStageSize(stageWidth, stageHeight) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
  }

  updateSize(size) {
    this.size = size;
    this.fullSize.width = size;
    this.fullSize.height = size;
  }

  getRandomAngle() {
    return 0;

    return -30;
    const minAngle = -45;
    const maxAngle = 45;

    return Math.random() * (maxAngle - minAngle) + minAngle;
  }

  async initTsuru() {
    const textureAlias = `thumb-${this.tsuruData.number}`;
    Assets.add({ alias: textureAlias, src: this.tsuruData.thumbnail });
    const loaded = await Assets.load([textureAlias]);
    const texture = loaded[textureAlias];
    this.sprite = new Sprite(texture);

    this.sprite.width = this.size;
    this.sprite.height = this.size;
    this.addChild(this.sprite);
    const verticalMargin = (this.stageHeight - this.size) / 2;
    const x = this.horizontalMargin;
    const y = this.stageHeight / 2;
    const expectedY = y + this.i * (this.sprite.height + verticalMargin);
    const expectedX = x;
    this.sprite.position.set(expectedX, expectedY);
    this.fullScale.x = this.sprite.scale.x;
    this.fullScale.y = this.sprite.scale.y;

    this.sprite.anchor.set(0, 0.5);

    this.thumbnailLoaded = true;

    // add blur filter

    const colorMatrixFilter = new ColorMatrixFilter();
    const blurFilter = new BlurFilter({ strength: 50, repeatEdgePixels: true });

    this.filters = [blurFilter, colorMatrixFilter];

    colorMatrixFilter.saturate(-1);
    this.update({ deltaTime: 0 });
  }

  removeBlurFilterWithAnimation() {
    //this.filters = [new BlurFilter({ strength: 8,repeatEdgePixels:true })];
    this.isAnimatingBlurOut = true;
  }

  async loadImage() {
    if (this.isLoadingImage) {
      return;
    }

    if (!this.thumbnailLoaded) {
      return;
    }

    if (this.imageLoaded) {
      return;
    }
    this.isLoadingImage = true;

    const previousSize = this.size;

    const textureAlias = `img-${this.tsuruData.number}`;
    Assets.add({ alias: textureAlias, src: this.tsuruData.img });
    const loaded = await Assets.load([textureAlias]);
    const texture = loaded[textureAlias];
    this.sprite.texture = texture;
    this.size = previousSize
    this.sprite.width = this.size;
    this.sprite.height = this.size;
    this.fullScale.x = this.sprite.scale.x;
    this.fullScale.y = this.sprite.scale.y;
    this.sprite.anchor.set(0, 0.5);
    // remove blur filter
    this.removeBlurFilterWithAnimation();
    this.imageLoaded = true;

    this.update({ deltaTime: 0 });
  }
  /**
   *
   * @param {Ticker} time
   * @returns
   */
  async update(time) {
    if (!this.thumbnailLoaded) {
      return;
    }
    const positionRelativeToViewPort = this.sprite.getGlobalPosition();

    const boundingBox = this.sprite.getBounds(this.sprite.parent.parent.parent);

    const y = positionRelativeToViewPort.y;

    const isInViewPort =
      y + boundingBox.height > 0 &&
      y - boundingBox.height / 2 < this.stageHeight;

    const isAboveCenter = y < this.stageHeight / 2;

    if (isInViewPort) {
      if (isInViewPort !== this.isInViewport) {
        this.tsuruEventEmitter.emit("enterViewport");
      }
      this.isInViewport = true;
      this.loadImage();
      const howCloseIsToCenterY =
        Math.abs(y - this.stageHeight / 2) / this.stageHeight;

      const howCloseIsToCenter = Math.max(0, Math.min(1, howCloseIsToCenterY));

      this.distanceToCenter = howCloseIsToCenter;


      const alpha = 1 - howCloseIsToCenter;
      const rotation = 1 - howCloseIsToCenter;

      const actualAlphaWithEasing = calculateEaseBetween(
        0,
        1,
        alpha,
        easeInOutExpo
      );

      const actualRotationWithEasing = calculateEaseBetween(
        isAboveCenter ? this.originalAngle : -this.originalAngle,
        0,
        rotation,
        easeInOutExpo
      );

      const actualRotationInRadians =
        (actualRotationWithEasing * Math.PI) / 180;

      if (this.isAnimatingBlurOut) {
        this.filters[0].strength -= time.deltaTime * 1;
        if (this.filters[0].strength <= 0) {
          this.filters[0].strength = 0;
          this.isAnimatingBlurOut = false;
        }
      }

      this.filters[1].saturate(-1 + actualAlphaWithEasing);
      //this.sprite.scale.set(actualScaleWithEasing);
      this.sprite.rotation = actualRotationInRadians;
      this.sprite.alpha = actualAlphaWithEasing;
    } else {
      this.distanceToCenter = 1;
      if (this.isInViewport !== false) {
        this.tsuruEventEmitter.emit("exitViewport");
      }
      this.isInViewport = false;
     // this.sprite.scale.set(0.25);
      this.sprite.rotation =
        (isAboveCenter ? this.originalAngle : -this.originalAngle) *
        (Math.PI / 180);
      this.sprite.alpha = 0;
    }
  }
}
