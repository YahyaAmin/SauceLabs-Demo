# Mobile App UI Automation — Quality Engineer Assessment

Automated UI tests for the **Sauce Labs My Demo App** (Android) covering the
required user journey:

> *As a customer, I want to purchase the second product in the list, add it to
> my cart, and verify that the cart contains the correct item.* (Stops before
> payment / checkout.)

Built with **WebdriverIO + Appium (UiAutomator2) + Cucumber + TypeScript**, using
the **Page Object Model**.

---

## Tech stack & key decisions

| Choice | Reason |
| --- | --- |
| **Appium + WebdriverIO** (not Detox) | The assessment supplies a **prebuilt APK**. Detox requires the app to be built from source with Detox instrumentation baked in, so it cannot drive a prebuilt binary. Appium is black-box and works against the shipped APK. The task explicitly allows "any mobile UI automation framework you are comfortable with". |
| **Android only** (no iOS) | iOS Simulator + Appium XCUITest require macOS/Xcode, which was not available. iOS support is described under *Cross-platform* below. |
| **Cucumber (BDD)** | The journey maps cleanly to a Given/When/Then scenario that mirrors the assessment's user story. |
| **Accessibility ID locators** | On Android the accessibility id maps to `content-desc` — the most stable, localisation-proof strategy. `resource-id` is used only where no content-desc exists (the cart row title). |

---

## Prerequisites

- **Node.js** LTS
- **Java JDK 17** (`JAVA_HOME` set)
- **Android SDK** (`ANDROID_HOME` set; `platform-tools` + `emulator` on `PATH`)
- **Appium 2** with the UiAutomator2 driver:
  ```bash
  npm i -g appium
  appium driver install uiautomator2
  ```
- An **Android emulator** running (this project assumes a Pixel 6, **API 34**,
  device id `emulator-5554`).

Verify the toolchain:
```bash
appium driver doctor uiautomator2
adb devices            # expect: emulator-5554   device
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Put the app binary in place (already included under ./app)
#    Download if missing:
#    https://github.com/saucelabs/my-demo-app-android/releases/download/2.2.0/mda-2.2.0-25.apk

# 3. Boot the emulator, then install the app once:
adb install "app/mda-2.2.0-25.apk"
```

> The Appium **server is started automatically** by the WDIO `appium` service —
> you do **not** need to run `appium` in a separate terminal for the tests.

---

## Running the tests

```bash
# Run everything
npm run wdio

# Run ONLY the passing working-product journey
npx wdio run wdio.conf.ts --cucumberOpts.tagExpression='@smoke'

# Run ONLY the required second-product journey (currently fails - see Defect)
npx wdio run wdio.conf.ts --cucumberOpts.tagExpression='@secondProduct'
```

### Allure report
```bash
npx allure generate -o allure-report allure-results
npx allure open allure-report
```

---

## Approach

- **Page Object Model** — one screen object per screen
  (`base`, `catalog`, `product`, `cart`) under `features/pageobjects/`. Steps
  contain no selectors; all element access lives in the page objects.
- **"Second product" by index, not by name** — the requirement is *positional*.
  Product tiles share a non-unique accessibility id (`Product Image`), so the
  collection is located by accessibility id and the specific product is chosen
  by index in code (`$$('~Product Image')[index]`). Gherkin uses human-friendly
  1-based "position N"; the step converts it to WDIO's 0-based index.
- **Dynamic verification** — the product's name is captured from the catalog
  *before* navigating, then asserted in the cart. Nothing is hardcoded.
- **Resilient waits** — `waitForDisplayed` on each screen's root marker rather
  than fixed sleeps.

## Assumptions

- Target platform is **Android** (justified above).
- The app is **pre-installed** on the emulator; capabilities launch it by
  package/activity. (A commented `appium:app` line enables fresh-install-per-run
  if preferred.)
- `noReset: false` clears app data between sessions, so each run starts with an
  **empty cart** — deterministic and repeatable.
- Quantity defaults to 1 and a colour is pre-selected on the detail screen, so
  no extra interaction is needed before "Add to cart".

---

## Findings while testing

### 🐞 Defect — app crash on the 2nd catalog product

Tapping the **second product** in the catalog crashes the app:

```
FATAL EXCEPTION: main
java.lang.NullPointerException: Attempt to invoke virtual method
'int java.lang.Integer.intValue()' on a null object reference
  at com.saucelabs.mydemoapp.android.view.fragments
       .ProductCatalogFragment.lambda$setAdapter$0(ProductCatalogFragment.java:156)
  at com.saucelabs.mydemoapp.android.view.adapters
       .ProductsAdapter$1.onClick(ProductsAdapter.java:57)
```

- **Root cause (from stack trace):** the catalog click handler dereferences a
  `null` product id for the second list item.
- **Reproducibility:** 100% — confirmed on a **clean uninstall + reinstall** and
  a cold-booted emulator. **Other products are unaffected.**
- **Environment:** `mda-2.2.0-25.apk`, Pixel 6 emulator, Android API 34.

**Impact on deliverable:** the literal "second product" journey cannot complete
through the UI. This is handled honestly with two scenarios:

| Scenario | Tag | Product | Outcome |
| --- | --- | --- | --- |
| Required journey | `@secondProduct @defect` | 2nd (index 1) | **Fails by design** — proves the test detects the crash. |
| Working journey | `@smoke @workingProduct` | 3rd / orange (index 2) | **Passes** — full working journey as required. |

A test that *catches* a real defect is doing its job; the working scenario
satisfies the "working automated test that covers the user journey" requirement.

### Minor — product name inconsistency (catalog vs cart)

The catalog shows colour-variant names like `Sauce Labs Backpack (orange)`, but
the cart shows the base name `Sauce Labs Backpack` (colour is a separate field).
Rather than asserting brittle equality, the verification **normalises the
`(colour)` suffix** and asserts the cart title contains the base product name.

---

## Cross-platform

The design is iOS-ready: locators are accessibility-id based (which map to iOS
`accessibilityIdentifier`), and platform-specific values would live behind a
small per-platform locator map plus an `ios` capability set. iOS execution was
not run locally because it requires macOS/Xcode; it would otherwise reuse the
same step definitions and feature file unchanged.

---

## Project structure

```
.
├── app/
│   └── mda-2.2.0-25.apk
├── features/
│   ├── cart.feature
│   ├── pageobjects/
│   │   ├── base.screen.ts
│   │   ├── catalog.screen.ts
│   │   ├── product.screen.ts
│   │   └── cart.screen.ts
│   └── step-definitions/
│       └── cart.steps.ts
├── wdio.conf.ts
├── package.json
└── README.md
```
