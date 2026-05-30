import type { Options } from '@wdio/types';
import path from 'node:path';

export const config: Options.Testrunner = {
  //
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',

  //
  // ==================
  // Specs
  // ==================
  specs: ['./features/**/*.feature'],
  exclude: [],

  //
  // ============
  // Capabilities
  // ============
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'emulator-5554',
      'appium:appPackage': 'com.saucelabs.mydemoapp.android',
      'appium:appActivity': 'com.saucelabs.mydemoapp.android.view.activities.SplashActivity',
      // Wait for the main activity after the splash screen
      'appium:appWaitActivity': 'com.saucelabs.mydemoapp.android.view.activities.MainActivity',
      // App is pre-installed via `adb install`; we just launch it.
      // To force a fresh install each run instead, set:
      //   'appium:app': path.join(process.cwd(), 'app', 'mda-2.2.0-25.apk'),
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240,
      'appium:fullReset': false,
      'appium:noReset': false, // clears app data between sessions => empty cart each run
    },
  ],

  //
  // ===================
  // Test Configurations
  // ===================
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // The Appium server is started/stopped automatically by this service.
  services: [
    [
      'appium',
      {
        args: { address: '127.0.0.1', port: 4723 },
        logPath: './logs',
      },
    ],
  ],
  port: 4723,

  framework: 'cucumber',

  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
  ],

  cucumberOpts: {
    require: ['./features/step-definitions/**/*.ts'],
    backtrace: false,
    requireModule: [],
    dryRun: false,
    failFast: false,
    snippets: true,
    source: true,
    strict: false,
    tagExpression: '', // e.g. run only the passing journey:  --cucumberOpts.tagExpression='@smoke'
    timeout: 60000,
    ignoreUndefinedDefinitions: false,
  },

  //
  // =====
  // Hooks
  // =====
  // Capture a screenshot on any failed step (attached to the Allure report).
  // Relaunch the app fresh before every scenario so a crash in one scenario
  // (e.g. the known 2nd-product defect) cannot poison the next scenario.
  beforeScenario: async function () {
    const appId = 'com.saucelabs.mydemoapp.android';
    try {
      await driver.execute('mobile: terminateApp', { appId });
    } catch {
      // app may already be dead (crashed) — ignore
    }
    await driver.execute('mobile: activateApp', { appId });
    await browser.pause(1500); // let the splash screen clear
  },

  afterStep: async function (step, scenario, result) {
    if (!result.passed) {
      await browser.takeScreenshot();
    }
  },
};
