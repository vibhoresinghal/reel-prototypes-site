// A simulated app profile for this standalone design prototype.
export const DEMO_PROFILE = Object.freeze({
  userName: 'Vibhore',
  totalSpends: 112826.9,
  userTotalCashbackEarned: 653,
  offusMerchantName: 'Amazon',
  product: 'smartbuy',
});

const PRODUCTS = new Set(['smartbuy', 'pixel', 'semi', 'le']);

function cleanText(value, limit) {
  if (typeof value !== 'string') return '';
  const text = value
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(text).slice(0, limit).join('').trim();
}

function nonnegativeNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return 0;
  if (typeof value === 'string' && !value.trim()) return 0;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

// Returned text is plain text: callers must insert it with textContent, not HTML.
// Missing optional metrics stay empty/zero rather than borrowing demo activity.
export function normalizeProfile(input = DEMO_PROFILE) {
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const userName = cleanText(data.userName, 80) || cleanText(data.name, 80) || DEMO_PROFILE.userName;
  const product = typeof data.product === 'string' ? data.product.trim().toLowerCase() : '';
  return {
    userName,
    firstName: userName.split(' ')[0],
    totalSpends: nonnegativeNumber(data.totalSpends),
    userTotalCashbackEarned: nonnegativeNumber(data.userTotalCashbackEarned),
    offusMerchantName: cleanText(data.offusMerchantName, 80),
    product: PRODUCTS.has(product) ? product : 'smartbuy',
  };
}
