# Mobile App UI Automation — Quality Engineer Assessment

![Android E2E](https://github.com/YahyaAmin/SauceLabs-Demo/actions/workflows/android-e2e.yml/badge.svg)

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

### Allure report (local)
```bash
npx allure generate -o allure-report allure-results
npx allure open allure-report
```

> **Windows PowerShell note:** if `npx` is blocked by the execution policy
> (`running scripts is disabled on this system`), use `npx.cmd` instead — e.g.
> `npx.cmd allure generate -o allure-report allure-results` — or run the command
> from Command Prompt.

---

## Continuous Integration

A GitHub Actions workflow (`.github/workflows/android-e2e.yml`) runs the suite on
a **real Android emulator** on every push to `main`, and can be triggered manually
from the Actions tab (`workflow_dispatch`).

What the pipeline does:

1. Checks out the repo and sets up Node + JDK 17.
2. Installs dependencies and the Appium UiAutomator2 driver.
3. Enables **KVM** hardware acceleration for the emulator.
4. Boots a **Pixel 6, API 34** emulator via `reactivecircus/android-emulator-runner`.
5. Installs the APK, dismisses the lock screen, and runs the working-journey suite.
6. Uploads the Allure **results** as a downloadable build artifact.

### Why CI runs only the working journey

CI gates on the **`@smoke` working journey only**. The intentionally-failing
defect scenario is **excluded from the gate** so a known, documented bug does not
permanently break the build. It is tracked as a known issue (see *Defect* below)
and would be re-enabled in CI once the app crash is fixed — this mirrors standard
practice of quarantining known failures rather than letting them block the pipeline.

### CI emulator stability

GitHub-hosted emulators are cold-booted and software-rendered, so they are less
deterministic than a local device. The workflow includes the standard mitigations:
dismissing the keyguard, keeping the screen awake, headless emulator options, and a
scenario `retry` so a flaky first attempt re-runs on a fresh app launch.

### Viewing the CI Allure report

CI publishes the raw Allure **results** (not a pre-built HTML report) as a build
artifact, following the convention of publishing results and generating the report
on demand:

1. Open the workflow run: **GitHub → Actions → (select the run)** → scroll to the
   **Artifacts** section → download **`allure-results`**.
2. Unzip it (e.g. to `Downloads/allure-results`).
3. From the project folder, generate and open the report, pointing at the unzipped
   folder:
   ```bash
   npx allure generate -o allure-report-ci "C:\Users\yahya\Downloads\allure-results"
   npx allure open allure-report-ci
   ```
   > On Windows PowerShell, use `npx.cmd` in place of `npx` if the execution
   > policy blocks the script (or run from Command Prompt).

> The CI report contains only the single passing working journey (the defect
> scenario is excluded from CI by design). The richer **local** Allure report
> shows both scenarios, including the failing defect scenario with its screenshot.

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
- **Dynamic verification** — the product's full title is captured from the
  catalog *before* navigating, then asserted against the cart's title. Nothing
  is hardcoded. Because both the catalog and cart expose the **full title
  including the colour suffix** (e.g. `Sauce Labs Backpack (orange)`) via the
  same `titleTV` element, a direct equality check also confirms the **correct
  colour variant** — not just the right product family.
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

### Note — colour variant is verified, not just the product

The catalog and cart both display the **full** product title including the
colour suffix (e.g. `Sauce Labs Backpack (orange)`) in the same `titleTV`
element. The verification therefore compares the captured catalog title against
the cart title directly, which confirms the exact **colour variant** reached the
cart — a green vs orange mix-up would fail the assertion, not pass it.

---

## Cross-platform (stretch goal)

The design is iOS-ready: locators are accessibility-id based (which map to iOS
`accessibilityIdentifier`), and platform-specific values would live behind a
small per-platform locator map plus an `ios` capability set. iOS execution was
not run locally because it requires macOS/Xcode; it would otherwise reuse the
same step definitions and feature file unchanged.

---

## Project structure

```
.
├── .github/
│   └── workflows/
│       └── android-e2e.yml      # CI: emulator-based E2E on every push
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
├── .gitignore
├── wdio.conf.ts
├── package.json
└── README.md
```
