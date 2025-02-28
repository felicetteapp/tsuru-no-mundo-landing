import { Container, Assets, Sprite } from "pixi.js";
import { calculateEaseBetween, easeInOutExpo } from "./easings";

const EventEmitter = require("events");
class TsuruEventEmitter extends EventEmitter {}

let navigatorTargetY = 0;
let navigatorCurrentY = 0;

export class Navigator extends Container {
  tsurus = [];
  navigatorItems = [];
  itemSize = 100;
  tsuruEventEmitter = new TsuruEventEmitter();
  currentTsuru = null;
  stageWidth = null;
  stageHeight = null;
  constructor(tsurus, itemSize) {
    super();
    this.tsurus = tsurus;
    this.itemSize = itemSize;
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
    const tsuru = this.tsurus.find(
      (tsuru) => tsuru.tsuruData.number === tsuruNumber
    );
    const index = this.tsurus.indexOf(tsuru);
    this.scrollToIndex(index);
  }

  scrollToIndex(index) {
    navigatorTargetY = -1 * (index * this.itemSize);
    //adjust to center item at the screen

    navigatorTargetY = navigatorTargetY - this.itemSize / 2;
    navigatorTargetY = navigatorTargetY + window.innerHeight / 2;

    const animate = () => {
      navigatorCurrentY = this.y;
      const distance = navigatorTargetY - navigatorCurrentY;
      const step = distance * 0.025;
      const newY = navigatorCurrentY + step;
      this.y = newY;

      if (Math.abs(distance) < 1) {
        this.y = navigatorTargetY;
        navigatorCurrentY = navigatorTargetY;
        return;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  addEventListener(eventName, callback) {
    this.tsuruEventEmitter.on(eventName, callback);
  }

  async initItems() {
    for (let i = 0; i < this.tsurus.length; i++) {
      const tsuru = this.tsurus[i];
      const navigatorItem = new NavigatorItem(tsuru, i, this.itemSize);
      this.navigatorItems.push(navigatorItem);
      navigatorItem.position.y = i * this.itemSize;
      this.addChild(navigatorItem);

      navigatorItem.interactive = true;
      navigatorItem.buttonMode = true;
      navigatorItem.cursor = "pointer";
      navigatorItem.on('pointerover', () => {
        navigatorItem.sprite.tint = navigatorItem.tsuru.tsuruData.mainColor;
      }
      );
      navigatorItem.on('pointerout', () => {
        navigatorItem.sprite.tint = 0xffffff;
      }
      );
      navigatorItem.on("pointerup", () => {
        this.tsuruEventEmitter.emit("navigatorItemClick", tsuru);
      });
      await navigatorItem.init();
    }
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
  }

  update() {
    const positionRelativeToViewPort = this.sprite.getGlobalPosition();

    const y = positionRelativeToViewPort.y + this.height / 2;

    const howCloseIsToCenterY =
      Math.abs(y - this.stageHeight / 2) / (this.stageHeight * 0.8);

    const howCloseIsToCenter = Math.max(0, Math.min(1, howCloseIsToCenterY));
    const alpha = 1 - howCloseIsToCenter;

    const actualAlphaWithEasing = calculateEaseBetween(
      0,
      1,
      alpha,
      easeInOutExpo
    );

    this.alpha = actualAlphaWithEasing;
  }
}
