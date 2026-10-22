# Product setup assets and reference

Source: [Event Horizon — Product Setup Framework](https://www.figma.com/design/IoQ0VoqLeUC80wesjwy0k4/?node-id=482-16775), end-to-end section `482:95617`. Inspected on 23 October 2026.

These are original Figma exports and original uploaded images. Hash-named files preserve the filenames returned by Figma design context. They are served locally; no temporary Figma URLs are used at runtime. Do not redraw the illustrations, bank marks or card artwork.

## Screen references

| Flow | Figma nodes | Implemented behavior |
| --- | --- | --- |
| ETB UPI | `482:64661`, `482:64576`, `482:64562` | One-click HDFC setup, short linking state, return to the product hub. The source deliberately displays the PayZapp logo in its HDFC account row. Account ending 0912 is kept consistent in the completion payload. |
| Card verification | `482:65072`, `482:65456`, `482:65560`, `482:64830` | Last-four-digit input, original four-card selection sheet, demo sample digits, bank-records animation. |
| Linked cards | `482:66762`, `482:66805`, `482:66848`, `482:66954`, `482:66966` | Swipe to expose remove; delete confirmation; removed-card list and Undo; original MoneyBack and Woman’s Advantage artwork. |
| Regular UPI addition | `482:65932`, `482:65941`, `482:65975`, `482:65983`, `482:65986`, `482:66700` | Add account, bank search, account selection, linking and success. Selected bank and account persist in the result. |
| Wallet | `482:66532`, `482:65989`, `482:66158`, `482:66345` | Wallet setup animation, three illustrated carousel pages, original prepaid card, online-payments switch, Done. |
| Regular journey boundary | `482:67122`, `482:67254`, `482:67517`, `482:67090` | Verification → linked cards → UPI → wallet. Completion returns to the parent for Screen Lock (`482:67831`). |

## Named exports

| File | Source |
| --- | --- |
| `bank-loader.gif` | Original animated image on `482:64853`. |
| `wallet-loader.gif` | Original animated image on `482:66697`. |
| `upi-success.gif` | Original animated image on `482:66718`; uses the source’s crop and lighten blend mode. |
| `wallet-feature-0.gif` | Original animated image on `482:66029`. |
| `wallet-feature-1.gif` | Original animated image on `482:66030`. |
| `wallet-feature-2.gif` | Original animated image on `482:66032`. |
| `wallet-card.png` | Render of original prepaid-card node `482:66033`. |
| `blue-background.png` | Original full-page background render `482:66533` (360×800). Used because the design-context SVG’s `foreignObject` backdrop blur does not render inside a browser image. This preserves Figma’s actual blurred gradient. |
| `blue-background.jpg` | Earlier cropped background research export, not used by the component. |
| `upi-hero.png`, `reward-coin.png` | Reference exports of `482:64674` and `482:64712`. The implementation uses their original SVG layers instead. |

Full design-context code and asset download manifests are retained locally under ignored `work/psf-research/products/`. Original animation preview PNGs are also retained; reduced-motion mode uses those static source previews. The source preview for a wallet illustration can show an early animation pose, so reduced-motion appearance is not identical to the animated illustration’s settled pose.

## Integration and validation

`src/psf/ProductSetup.jsx` exports `ProductSetup({product,onComplete,onCancel})`. Supported products are `upi`, `cards`, `wallet` and the full `regular` sequence. Mount with a product/session key when starting another setup. The parent owns the entry transition. CSS expects a 360px logical canvas, an available height, and `--psf-height` in pixels; shorter screens scroll with a sticky CTA.

All bank interactions are simulated in memory. Card entry accepts four demo digits, with a sample-fill action. No banking, payment or credential API is contacted. Completion returns the products actually completed and relevant sample details. Cancelling or unmounting clears delayed transitions.

Checked locally: standalone bundle compilation; all 53 referenced asset paths exist and are nonempty; no temporary runtime URLs; UPI callback contains 0912; card verification and card selection; removal and Undo restore two cards; regular journey completes with the selected second account ending 5489 and all three products; wallet toggle returns its selected value; wallet content scrolls at 360×640 while Done remains visible. Browser checks found no broken displayed images. Parent integration and physical S25 Ultra recording remain separate verification steps.
