Feature: Cart - add a product and verify cart contents
  As a customer
  I want to purchase a product from the list, add it to my cart,
  and verify that the cart contains the correct item
  (stopping before payment / checkout confirmation)

  # ---------------------------------------------------------------------------
  # Scenario A — the journey EXACTLY as specified: the SECOND product (index 1).
  #
  # KNOWN DEFECT: on this build (mda-2.2.0-25) tapping the 2nd catalog product
  # crashes the app with a NullPointerException
  # (ProductCatalogFragment.java:156 - null product id). See README "Defect".
  # This scenario is tagged @defect and is expected to FAIL until the app is
  # fixed; it demonstrates that the automated test correctly detects the crash.
  # ---------------------------------------------------------------------------
  @defect @secondProduct
  Scenario: Purchase the second product in the list (required journey)
    Given I am on the products catalog
    When I add the product at position 2 to the cart
    And I open the cart
    Then the cart should contain that product
    And the cart should have exactly 1 item

  # ---------------------------------------------------------------------------
  # Scenario B — the same journey against a working product (orange backpack,
  # position 3 / index 2). Verification normalises the "(colour)" suffix that
  # the catalog shows but the cart does not. This is the passing demonstration
  # of a complete, working user journey.
  # ---------------------------------------------------------------------------
  @smoke @workingProduct
  Scenario: Purchase a product and verify it appears in the cart
    Given I am on the products catalog
    When I add the product at position 3 to the cart
    And I open the cart
    Then the cart should contain that product
    And the cart should have exactly 1 item
