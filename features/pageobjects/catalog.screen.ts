import BaseScreen from './base.screen';

/**
 * CatalogScreen — the product list ("Products").
 *
 * Verified selectors (captured via Appium Inspector):
 *  - Product tile image : accessibility id `Product Image`  (clickable=true)
 *  - Product title      : accessibility id `Product Title`  (text holds name)
 *
 * Neither content-desc is unique (every tile shares them), so we locate the
 * collection by accessibility id and select a specific product by INDEX in
 * code. `$$` returns the matches in on-screen order (top→bottom, left→right),
 * and WebdriverIO arrays are 0-based, so index 1 == the second product.
 */
class CatalogScreen extends BaseScreen {
  constructor() {
    // Catalog title text is a reliable root marker for this screen
    super('~Product Image');
  }

  private get productImages() {
    return $$('~Product Image');
  }

  private get productTitles() {
    return $$('~Product Title');
  }

  /** Number of products currently rendered. */
  public async productCount(): Promise<number> {
    return (await this.productImages).length;
  }

  /**
   * Read the title text of the product at the given 0-based index.
   * Used to capture the product name BEFORE navigating, so the cart
   * verification compares against the real value rather than a hardcoded one.
   */
  public async getProductTitle(index: number): Promise<string> {
    return (await this.productTitles[index].getText()).trim();
  }

  /**
   * Open the product at the given 0-based index by tapping its tile image.
   * index 1 => second product (per the assessment requirement).
   */
  public async openProductByIndex(index: number): Promise<void> {
    const count = await this.productCount();
    if (index >= count) {
      throw new Error(
        `Requested product index ${index} but only ${count} products are present.`,
      );
    }
    await this.robustClick(this.productImages[index]);
  }
}

export default new CatalogScreen();
