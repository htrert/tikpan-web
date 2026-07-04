import { getWallet, walletLedger } from "../store.mjs";

export const billingRepository = {
  getWallet(userId = "demo_user") {
    return getWallet(userId);
  },

  appendLedger(entry) {
    walletLedger.push(entry);
    return entry;
  },

  listLedger(userId) {
    return walletLedger.filter((item) => !userId || item.userId === userId);
  },
};
