/**
 * Web stub for react-native-purchases (RevenueCat).
 * react-native-purchases is a native module — it cannot run in a web browser.
 * This stub satisfies import resolution so the web bundle compiles, while all
 * methods return safe no-op / empty values.
 */

const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const emptyCustomerInfo = {
  entitlements: { active: {}, all: {} },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  latestExpirationDate: null,
  firstSeen: null,
  originalAppUserId: '',
  requestDate: '',
  allExpirationDates: {},
  allPurchaseDates: {},
  originalApplicationVersion: null,
  managementURL: null,
  nonSubscriptionTransactions: [],
};

const emptyOfferings = {
  all: {},
  current: null,
};

const Purchases = {
  configure: () => {},
  setLogLevel: () => {},
  logIn: async () => ({ customerInfo: emptyCustomerInfo, created: false }),
  logOut: async () => emptyCustomerInfo,
  getCustomerInfo: async () => emptyCustomerInfo,
  getOfferings: async () => emptyOfferings,
  purchasePackage: async () => ({ customerInfo: emptyCustomerInfo, productIdentifier: '' }),
  restorePurchases: async () => emptyCustomerInfo,
  addCustomerInfoUpdateListener: () => () => {},
  removeCustomerInfoUpdateListener: () => {},
};

module.exports = Purchases;
module.exports.default = Purchases;
module.exports.LOG_LEVEL = LOG_LEVEL;

// Type stubs — these are only used by TypeScript and never called at runtime,
// but exporting empty objects prevents any accidental runtime errors.
module.exports.PurchasesPackage = {};
module.exports.PurchasesOfferings = {};
module.exports.CustomerInfo = {};
