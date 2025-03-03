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
  constructor(tsurus, itemSize, horizontalMargin) {
    super();
    this.tsurus = tsurus;
    this.itemSize = itemSize;
    this.horizontalMargin = horizontalMargin;
  }

  updateCurrentTsuru(tsuru) {
    this.currentTsuru = tsuru;
  }

  updateStageSize(stageWidth, stageHeight) {
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.navigatorItems.forEach((navigatorItem) => {
      navigatorItem.updateStageSize(stageWidth, stageHeight);
    });
  }

  scrollToItem(tsuruNumber) {
    const thisTsuru = this.scrollBox.list.children.find(
      (item) => item.tsuru.tsuruData.number === tsuruNumber
    );

    const howManyItemsAreVisible = Math.floor(this.stageHeight / this.itemSize);

    const tsuruIndex = this.scrollBox.list.children.findIndex(
      (item) => item.tsuru.tsuruData.number === tsuruNumber
    );

    const targetIndex = Math.max(
      tsuruIndex + Math.floor(howManyItemsAreVisible / 2) ,
      howManyItemsAreVisible - 1
    )

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

    //generate vertical gradient mask to hide the start and end of the container

    const blurStrength = 50;

    const rectangle = new Graphics();
    rectangle.fill(0xffffff);
    rectangle.rect(
      0,
      blurStrength * 1.5,
      app.stage.width,
      this.stageHeight - blurStrength * 1.5 - blurStrength * 1.5
    );
    rectangle.fill();

    rectangle.filters = [
      new BlurFilter({
        strength: blurStrength,
      }),
    ];

    const bounds = new Rectangle(0, 0, app.stage.width, this.stageHeight);

    const texture = app.renderer.generateTexture({
      target: rectangle,
      resolution: 1,
      frame: bounds,
    });

    const mask = new Sprite(texture);
    mask.alpha = 0.5;
    app.stage.addChild(mask);
    this.mask = mask;
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
    }).on(
      "tap",
      () => {
        this.tsuruEventEmitter.emit("navigatorItemClick", this.tsuru);
      }
    )
  }

  update() {}
}
