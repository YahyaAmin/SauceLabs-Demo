import BaseScreen from './base.screen';

/**
 * ProductDetailScreen — a single product's page.
 *
 * Verified selectors (Appium Inspector):
 *  - Add to cart button : accessibility id `Tap to add product to cart`
 *                         (resource-id .../cartBt, clickable=true)
 *  - Cart icon (header) : accessibility id `Displays number of items in your cart`
 *                         (resource-id .../cartIV, clickable=false -> tap parent)
 *
 * Defaults observed on the detail screen: a colour is pre-selected and quantity
 * defaults to 1, so no extra steps are needed before adding to cart.
 */
class ProductDetailScreen extends BaseScreen {
  constructor() {
    super('~Tap to add product to cart');
  }

  private get addToCartButton() {
    return $('~Tap to add product to cart');
  }

  private get cartIcon() {
    return $('~Displays number of items in your cart');
  }

  /** Tap "Add to cart" (button is genuinely clickable). */
  public async addToCart(): Promise<void> {
    const btn = await this.addToCartButton;
    await btn.waitForDisplayed({ timeout: 10000 });
    await btn.click();
    // brief settle so the cart badge/state updates before navigation
    await browser.pause(1000);
  }

  /** Open the cart via the header icon (icon image isn't clickable -> robustClick). */
  public async openCart(): Promise<void> {
    await this.robustClick(await this.cartIcon);
  }
}

export default new ProductDetailScreen();
