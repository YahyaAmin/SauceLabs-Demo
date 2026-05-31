import BaseScreen from './base.screen';

/**
 * CartScreen — "My Cart".
 *
 * Verified selectors (Appium Inspector):
 *  - Cart row title : resource-id .../titleTV  (NO content-desc here, unlike the
 *                     catalog, so we use the `id` strategy)
 *
 * Data-consistency note (documented in README):
 *  The catalog shows colour-variant names like "Sauce Labs Backpack (orange)",
 *  but the cart shows the BASE name "Sauce Labs Backpack" (colour is a separate
 *  field). We therefore normalise by stripping a trailing "(colour)" suffix and
 *  assert the cart title CONTAINS the base name, rather than brittle equality.
 */
class CartScreen extends BaseScreen {
  constructor() {
    // The cart title element is a dependable marker that the cart rendered
    super('android=new UiSelector().resourceId("com.saucelabs.mydemoapp.android:id/titleTV")');
  }

  private get itemTitles() {
    return $$('android=new UiSelector().resourceId("com.saucelabs.mydemoapp.android:id/titleTV")');
  }

  /** Number of line items currently in the cart. */
  public async itemCount(): Promise<number> {
    return (await this.itemTitles).length;
  }

  /** Title text of the first cart line item. */
  public async getFirstItemTitle(): Promise<string> {
    return (await this.itemTitles[0].getText()).trim();
  }
}

export default new CartScreen();