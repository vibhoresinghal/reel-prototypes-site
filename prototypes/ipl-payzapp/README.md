# IPL on PayZapp

Imported with the user's stated permission from Ishant Periwal's caseStudies repository, gh-pages commit 163aab846602ffda84e4d4c37990d8f11fedcd77, IPL Themification directory. Original work by Ishant Periwal in collaboration with Vibhore Singhal.

Source: https://github.com/ishantperiwal/caseStudies/tree/gh-pages/IPL%20Themification
Case study: https://ishantperiwal.github.io/caseStudies/IPL%20Themification/ipl-themification-case-study.html?sticky=false

The source embeds eight demonstrations in a single case-study HTML file rather than separate prototype routes. This import exposes10 starting points: app opening, promo, leaderboard, scanner, referral, IPL success, three spotlights, and campaign invitation. Older removed scene URLs retain redirects. All 33 original asset files, including seasonal reference examples, are preserved byte-for-byte; source-assets.json records SHA-256 hashes. The Lottie player is vendored at the original version 5.12.2 with its MIT license.

The composition and motion settings are adapted from the case-study code. Original Lottie geometry, raster illustrations, promo video and five banners are untouched. Referral uses the source frame-15 hold, 3500ms rest, 450ms entrance and 650ms exit. Success reveals the runs after 4000ms and hides them after 10000ms; spotlight crossfades use 800ms every 4000ms. Demo loops were replaced with intentional replay where appropriate. Leaderboard is a manually scrollable original image, not a live ranking service; campaign invitation screens are image-based. Alternate assets not used by the case study are labeled alternate. No banking actions or invitations occur. The scanner asks for Enable camera on first use, then reconnects automatically after a successful enable or an existing browser grant; tap its surface to continue with a sample QR payment recording; no QR is decoded or real payment executed.

Mobile and external embeds hide the desktop sidebar. Hosted library mode preserves the fullscreen parent; desktop return sends the existing origin-checked flows:home message. Refresh/replay resets the scene. Six concurrent asset loads gate startup; errors offer retry. Hidden documents pause active animation/video and the scene clock. Reduced motion uses still Lottie frames and disables banner cycling. Video is loaded on demand, rather than downloading it for every scene. A 30-second asset timeout avoids indefinite startup.

All direct scene URLs retain the stable prototypes/ipl-payzapp/index.html?scene= identifier. Existing library sharing, QR and embed tools apply automatically. The scanner also connects to reused payment amount/processing screens and returns to the original IPL success; these are recording mocks. The raster UI has the source's resolution limits. Physical S25 Ultra verification and public publication remain pending.


Camera update: `camera.js` derives the exact cubic-Bezier aperture from `Scanner Window Outlines 2` in the original Lottie, including its transforms and xMidYMin slice scaling. The camera occupies only this cutout, below the unchanged animation and PNG overlay. Rear camera is preferred; audio is never requested. Enable/retry states stay inside the cutout and disappear during live playback. Hidden documents, navigation and page exit stop all tracks; the IPL scanner resumes automatically while visible if previously enabled. Pending permission responses after exit are immediately released. HTTPS is required on phones (desktop localhost is also trusted); plain HTTP LAN addresses cannot access the camera. Hosted and generated embed frames permit camera for supported scanner flows. Camera data is neither uploaded nor recorded. QR decoding, flashlight and photo-library actions are not implemented by this preview.

## Scanner payment recording — 7 November 2026

Tap the stadium/camera surface after enabling it to open amount entry. Enable/retry/Back are excluded from the scan tap. Enter/Space also triggers the sample scan. Default ₹99 can be edited with keyboard or input; Pay goes directly through1800ms processing to IPL success, carrying the entered amount into the receipt. Original cricket-ball Lottie and4-second six-runs cue preserved. Back and replay reset the journey; camera streams and pending scene timers are released on navigation. No bank or QR decoding service is connected.

payment.js/payment.css adapt the existing Milestone amount and processing layouts. assets/payment contains exact copies of original Figma icons and processing GIF/still; payment-assets.json maps every copy back to its source. These additions do not change the original33 IPL source files. Tests cover amount boundaries/precision, copy parity and camera lifecycle; browser checks include live/mock stream disposal, late permissions, double submission/navigation cancellation and small/tall/desktop layouts.

## Remembered camera and zoom — 7 November 2026

scanner.js reconnects automatically after a successful camera session or already-granted browser permission. It retains the original camera.js stream/aperture helpers; the shared festive scanner is unchanged. camera-preferences.js persists enablement and1x/2x/3x zoom with a memory fallback. Denial clears enablement; tracks still stop when hidden or leaving the scanner.

Zoom controls use camera capabilities where exposed, with a labeled Preview zoom crop otherwise. Saved zoom is applied before showing the next live preview. No additional PTZ prompt or guarantee of a dedicated optical lens. Zoom controls do not trigger the sample payment. Browser one-time grants cannot be overridden: use Chrome Android's Allow while visiting the site for recording.
