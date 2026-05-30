import { Given, When, Then } from '@wdio/cucumber-framework';
import { expect } from '@wdio/globals';

import CatalogScreen from '../pageobjects/catalog.screen';
import ProductDetailScreen from '../pageobjects/product.screen';
import CartScreen, { normaliseName } from '../pageobjects/cart.screen';

/**
 * Shared state across steps within a scenario.
 * We capture the product's name on the catalog so the cart assertion compares
 * against the REAL value rather than a hardcoded string.
 */
let expectedProductName = '';

Given(/^I am on the products catalog$/, async () => {
  await CatalogScreen.waitForIsShown();
  await expect(await CatalogScreen.productCount()).toBeGreaterThan(0);
});

/**
 * "position N" is 1-based in the Gherkin (human-readable). We convert to the
 * 0-based index WebdriverIO collections use. So position 2 -> index 1 (second).
 */
When(/^I add the product at position (\d+) to the cart$/, async (position: string) => {
  const index = Number(position) - 1;

  // Capture the product name BEFORE navigating away from the catalog.
  expectedProductName = await CatalogScreen.getProductTitle(index);

  await CatalogScreen.openProductByIndex(index);
  await ProductDetailScreen.waitForIsShown();
  await ProductDetailScreen.addToCart();
});

When(/^I open the cart$/, async () => {
  await ProductDetailScreen.openCart();
  await CartScreen.waitForIsShown();
});

Then(/^the cart should contain that product$/, async () => {
  const cartTitle = await CartScreen.getFirstItemTitle();

  // Catalog may include a "(colour)" suffix that the cart omits; normalise both.
  const expectedBase = normaliseName(expectedProductName);
  const actualBase = normaliseName(cartTitle);

  await expect(actualBase).toContain(expectedBase);
});

Then(/^the cart should have exactly (\d+) item$/, async (count: string) => {
  await expect(await CartScreen.itemCount()).toEqual(Number(count));
});
