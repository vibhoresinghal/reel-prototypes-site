/* All activity is simulated; never calls PayZapp or another account service. */
(() => {
  const DEMO_PROFILE = Object.freeze({
    userName: 'Vibhore', totalSpends: 112826.9, totalTxns: 184,
    offusMerchantName: 'Amazon', maxMonth: '2025-10-15', platformMonthlyUsers: 1250000,
    streakDays: 28, userTotalCashbackEarned: 653, cashbackSpends: 25,
    rcbpTxns: 18, frqP2pPayee: 'Aarav', frqP2pPayeeTxnCount: 24,
    maxHour: 14, txnCountMaxHourwise: 15
  });
  const numericKeys = ['totalSpends','totalTxns','platformMonthlyUsers','streakDays','userTotalCashbackEarned','cashbackSpends','rcbpTxns','frqP2pPayeeTxnCount','maxHour','txnCountMaxHourwise'];
  const cleanText = value => typeof value === 'string' ? value.replace(/[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,80) : '';
  function normalizeProfile(input = DEMO_PROFILE) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const data = { userName: cleanText(source.userName) || 'Vibhore', offusMerchantName: cleanText(source.offusMerchantName), frqP2pPayee: cleanText(source.frqP2pPayee), maxMonth: /^2025-(0[1-9]|1[0-2])-\d{2}$/.test(source.maxMonth || '') ? source.maxMonth : null };
    for (const key of numericKeys) {
      const number = typeof source[key] === 'number' || typeof source[key] === 'string' && source[key].trim() ? Number(source[key]) : NaN;
      data[key] = Number.isFinite(number) && number >= 0 ? number : 0;
    }
    return data;
  }
  function profileForScene(scene) {
    const sample = {...DEMO_PROFILE};
    if (scene === 'power') Object.assign(sample, {totalSpends:3800000,totalTxns:1350,streakDays:245,userTotalCashbackEarned:2450});
    if (scene === 'inactive') { numericKeys.forEach(key => sample[key] = 0); sample.offusMerchantName=''; sample.frqP2pPayee=''; sample.maxMonth=null; }
    return normalizeProfile(sample);
  }
  window.RECAP_DEMO = Object.freeze({DEMO_PROFILE, normalizeProfile, profileForScene});
})();
