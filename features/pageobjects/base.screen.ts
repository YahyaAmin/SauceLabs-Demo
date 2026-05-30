/**
 * BaseScreen
 * ----------
 * Common helpers shared by every screen object.
 *
 * Locator strategy note (interview talking point):
 *  - On Android, an element's "accessibility id" maps to its `content-desc`
 *    attribute. In WebdriverIO this is selected with the `~` prefix
 *    (e.g. `~Product Image`). It is the most stable / preferred strategy.
 *  - We fall back to `resource-id` (id strategy) only where an element has no
 *    usable content-desc (e.g. the cart row title).
 */
export default class BaseScreen {
  /** The selector that uniquely identifies this screen (used by waitForIsShown). */
  private readonly rootSelector: string;

  constructor(rootSelector: string) {
    this.rootSelector = rootSelector;
  }

  /**
   * Wait until this screen's root element is displayed.
   * Keeps each step resilient instead of relying on fixed sleeps.
   */
  public async waitForIsShown(isShown = true): Promise<void> {
    await $(this.rootSelector).waitForDisplayed({
      timeout: 15000,
      reverse: !isShown,
      timeoutMsg: `Expected screen "${this.rootSelector}" displayed=${isShown}`,
    });
  }

  /**
   * Click an element that may not itself be `clickable=true` (e.g. an ImageView
   * whose tap is handled by a parent container). Tries the element first, then
   * walks up to its parent if needed.
   */
  protected async robustClick(
    element: ChainablePromiseElement,
  ): Promise<void> {
    try {
      await element.waitForDisplayed({ timeout: 10000 });
      await element.click();
    } catch {
      // Fall back to the clickable parent container
      await element.parentElement().click();
    }
  }
}
