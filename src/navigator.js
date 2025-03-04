import {
  Container,
  Assets,
  Sprite,
  Graphics,
  Rectangle,
  BlurFilter,
} from "pixi.js";
import { ScrollBox } from "@pixi/ui";

const EventEmitter = require("events");
class TsuruEventEmitter extends EventEmitter {}

export class Navigator extends Container {
  tsurus = [];
  navigatorItems = [];
  itemSize = 100;
  tsuruEventEmitter = new TsuruEventEmitter();
  currentTsuru = null;
  stageWidth = null;
  stageHeight = null;
  scrollBox = null;
  horizontalMargin = 0;
  maskBlurStrength = 50;
  maskSprite = null;
  maskRectangle = null;
  maskBounds = null;
  maskTexture = null;
  constructor(tsurus, itemSize, horizontalMargin) {
    super();
    this.tsurus = tsurus;
    this.itemSize = itemSize;
    this.horizontalMargin = horizontalMargin;
  }

  updateCurrentTsuru(tsuru) {
    this.currentTsuru = tsuru;
  }

  updateStageSize(stageWidth, stageHeight, horizontalMargin) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.navigatorItems.forEach((navigatorItem) => {
      navigatorItem.updateStageSize(stageWidth, stageHeight);
    });
    this.horizontalMargin = horizontalMargin;
    if (this.scrollBox) {
      this.scrollBox.horPadding = this.horizontalMargin;
      this.scrollBox.width = this.itemSize + this.horizontalMargin * 2;
      this.scrollBox.height = this.stageHeight;
      this.scrollBox.resize();
    }

    if (this.mask) {
      this.mask.width = this.stageWidth;
      this.mask.height = this.stageHeight;
      this.maskSprite.width = this.stageWidth;
      this.maskSprite.height = this.stageHeight;
    }
  }

  scrollToItem(tsuruNumber) {
    const howManyItemsAreVisible = Math.floor(this.stageHeight / this.itemSize);

    const tsuruIndex = this.scrollBox.list.children.findIndex(
      (item) => item.tsuru.tsuruData.number === tsuruNumber
    );

    const targetIndex = Math.max(
      tsuruIndex + Math.floor(howManyItemsAreVisible / 2),
      howManyItemsAreVisible - 1
    );

    this.scrollToIndex(targetIndex);
  }

  scrollToIndex(index) {
    const safeIndex = Math.max(
      0,
      Math.min(index, this.scrollBox.list.children.length - 1)
    );

    this.scrollBox.scrollTo(safeIndex);
  }

  addEventListener(eventName, callback) {
    this.tsuruEventEmitter.on(eventName, callback);
  }

  async initItems(app) {
    if (this.scrollBox) {
      this.scrollBox.destroy();
      this.removeChild(this.scrollBox);
    }

    this.scrollBox = new ScrollBox({
      width: this.itemSize + this.horizontalMargin * 2,
      height: this.stageHeight,
      elementsMargin: 10,
      globalScroll: false,
      horPadding: this.horizontalMargin,
      vertPadding: 100,
    });

    for (let i = 0; i < this.tsurus.length; i++) {
      const tsuru = this.tsurus[i];
      const navigatorItem = new NavigatorItem(tsuru, i, this.itemSize);

      navigatorItem.addEventListener("navigatorItemClick", (tsuru) => {
        this.tsuruEventEmitter.emit("navigatorItemClick", tsuru);
      });

      await navigatorItem.init();
      this.scrollBox.addItem(navigatorItem);
    }

    this.addChild(this.scrollBox);

    this.scrollBox.scrollTop();

    this.maskRectangle = new Graphics();
    this.maskRectangle.fill(0xffffff);
    this.maskRectangle.rect(
      0,
      this.maskBlurStrength * 1.5,
      app.stage.width,
      this.stageHeight -
        this.maskBlurStrength * 1.5 -
        this.maskBlurStrength * 1.5
    );
    this.maskRectangle.fill();

    this.maskRectangle.filters = [
      new BlurFilter({
        strength: this.maskBlurStrength,
      }),
    ];

    this.maskBounds = new Rectangle(0, 0, app.stage.width, this.stageHeight);

    this.maskTexture = app.renderer.generateTexture({
      target: this.maskRectangle,
      resolution: 1,
      frame: this.maskBounds,
    });

    this.maskSprite = new Sprite(this.maskTexture);
    this.maskSprite.alpha = 0.5;
    app.stage.addChild(this.maskSprite);
    this.mask = this.maskSprite;
  }

  update() {
    this.navigatorItems.forEach((tsuru) => {
      tsuru.update();
    });
  }
}

class NavigatorItem extends Container {
  tsuru = null;
  size = 100;
  tsuruEventEmitter = new TsuruEventEmitter();
  stageWidth = null;
  stageHeight = null;
  constructor(tsuru, i, size) {
    super();
    this.tsuru = tsuru;
    this.size = size;
  }

  addEventListener(eventName, callback) {
    this.tsuruEventEmitter.on(eventName, callback);
  }

  updateStageSize(stageWidth, stageHeight) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
  }

  async init() {
    const textureAlias = `thumb-${this.tsuru.tsuruData.number}`;
    const loaded = await Assets.load([textureAlias]);
    const texture = loaded[textureAlias];
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0, 0);
    this.sprite.width = this.size;
    this.sprite.height = this.size;
    this.addChild(this.sprite);

    this.interactive = true;
    this.buttonMode = true;
    this.cursor = "pointer";
    this.on("pointerover", () => {
      this.sprite.tint = this.tsuru.tsuruData.mainColor;
    });
    this.on("pointerout", () => {
      this.sprite.tint = 0xffffff;
    });
    this.on("click", () => {
      this.tsuruEventEmitter.emit("navigatorItemClick", this.tsuru);
    }).on("tap", () => {
      this.tsuruEventEmitter.emit("navigatorItemClick", this.tsuru);
    });
  }

  update() {}
}
