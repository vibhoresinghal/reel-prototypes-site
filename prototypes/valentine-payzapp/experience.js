let envelopeAnimation;
import {DEMO_PROFILE,normalizeProfile} from './profile.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Register GSAP CustomEase
        gsap.registerPlugin(CustomEase);
        CustomEase.create("letterEase", "0.32, 0.94, 0.6, 1");

        // A deterministic preview of the app-provided profile. No native banking calls.
        async function fetchRemoteData(){return normalizeProfile(DEMO_PROFILE);}
        function showDebugModal(){}
        function openDeepLink(){
            const dialog=document.getElementById('product-dialog');
            const title=PRODUCTS[normalizeProfile({product:getSafeParams().get('product')}).product].cta;
            document.getElementById('product-title').textContent=title;
            document.getElementById('product-description').textContent='This is where PayZapp opens the product journey. This prototype stops at the personalized letter; no application or payment is submitted.';
            dialog.showModal();
        }
        function goBack(){parent.postMessage({type:'valentine:home'},location.origin);}

        // ===== Product Switching Logic =====
        const PRODUCTS = {
            pixel: {
                image: 'assets/pixel.png',
                cta: 'Meet Pixel',
                ctaLink: 'payzapp://reactFullPage?component=ONBOARDING&name=CustomerCard&pixelEntryType=external'
            },
            smartbuy: {
                image: 'assets/smartbuy.png',
                cta: 'Meet SmartBuy',
                ctaLink: 'payzapp://reactFullPage?component=RN_HOMEPAGE&name=Shop'
            },
            semi: {
                image: 'assets/semi.png',
                cta: 'Convert to Smart EMI',
                ctaLink: 'https://applyonline.hdfcbank.com/loan-against-assets/smartemi/smartemi.html?utm_source=payzapp_Spotlight&utm_medium=mobileapp&utm_campaign=SMARTEMI_2DECILE&utm_content=MKTG&utm_creative=Generic&utm_term=SEMIpayzapp'
            },
            le: {
                image: 'assets/limit.png',
                cta: 'Upgrade Credit Limit',
                ctaLink: 'https://applyonline.hdfcbank.com/credit-cards/credit-card-limit-enhancement-form.html?utm_medium=mobileapp&utm_source=payzapp_Sporlight&utm_campaign=le-payzapp&utm_content=payzapp&utm_creative=Generic_le_payzapp'
            }
        };

        function triggerHaptic(duration = 10) {
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(duration);
            }
        }

        function showErrorScreen(errorMessage = "") {
            const errorScreen = document.getElementById('error-screen');
            const loader = document.getElementById('loader-overlay');

            if (errorScreen) {
                errorScreen.style.display = 'flex';

                // Initial state for animation
                gsap.set(['#error-screen .back-button', '.error-icon-container', '.error-title', '.error-desc', '.error-button'], {
                    opacity: 0,
                    y: 20,
                    filter: 'blur(10px)'
                });

                // Staggered entry animation
                gsap.to(['#error-screen .back-button', '.error-icon-container', '.error-title', '.error-desc', '.error-button'], {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                    delay: 0.3
                });
            }
            if (loader) loader.style.display = 'none';
        }

        function formatRupee(num) {
            if (num >= 100000) {
                return (num / 100000).toFixed(2).replace(/\.00$/, '') + 'L';
            }
            return Math.floor(num).toLocaleString('en-IN');
        }

        // Helper to extract params from Search OR Hash (fixes iOS issues)
        function getSafeParams() {
            const params = new URLSearchParams(window.location.search);
            try {
                // Decode hash to handle cases where ? is encoded as %3F
                const hash = decodeURIComponent(window.location.hash);
                // If hash contains ?, treat everything after ? as query params
                if (hash.includes('?')) {
                    const hashQuery = hash.split('?')[1];
                    new URLSearchParams(hashQuery).forEach((val, key) => {
                        if (!params.has(key)) params.set(key, val);
                    });
                }
            } catch (e) { console.error("Hash param parse error", e); }
            return params;
        }

        async function initPayZappData() {
            const params = getSafeParams();
            if (params.get('error')) {
                showErrorScreen("Triggered by URL param ?error=true");
                return;
            }

            let data;
            try {
                data = await fetchRemoteData();
            } catch (e) {
                console.error("Failed to fetch data", e);
                showErrorScreen(e.message);
                return;
            }

            if (!data) {
                // If even fallback failed or data is null for some reason
                showErrorScreen("Data is null after fetch/fallback.");
                return;
            }

            // Priority: URL Param > PayZapp Data > Default
            const productId = normalizeProfile({product:params.get('product') || data.product}).product;

            // Extract Name: Prioritize URL > data.userName > data.name
            let rawName = data.userName;



            // Convert to Title Case (e.g., "PRASHANT SINGH" -> "Prashant")
            // We only take the first name for a friendlier greeting
            const firstName = rawName.split(' ')[0];
            const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

            const config = PRODUCTS[productId] || PRODUCTS['smartbuy'];

            // Update Name in UI
            document.querySelectorAll('.user-name').forEach(el => el.textContent = userName);

            // Handle Fallback Text Changes
            if (data.isFallback) {
                // 1. "Hi <Name>" -> "Hello there!" (Scene 1 greeting)
                const scene1H1 = document.querySelector('.scene-1 h1');
                if (scene1H1) {
                    scene1H1.innerHTML = 'Hello<br>there!';
                }

                // 2. "Dear <Name>" -> "Hello Dear" (Letter greeting)
                // "Dear" is in .my-dear, Name is in .user-name (which we set to "Dear" via userName above)
                document.querySelectorAll('.my-dear').forEach(el => el.textContent = 'Hello');
            }

            // Show matching message-body, hide others
            document.querySelectorAll('.message-body[data-product]').forEach(el => {
                el.style.display = el.dataset.product === productId ? '' : 'none';
            });

            // Update product image
            const productImg = document.querySelector('.pixel-logo-reveal');
            if (productImg) productImg.src = config.image;

            // Update CTA button
            const ctaBtn = document.getElementById('cta-button');
            if (ctaBtn) {
                ctaBtn.textContent = config.cta;
                const finalLink = (config.ctaLink && config.ctaLink !== '#') ? config.ctaLink : data.ctaLink;
                ctaBtn.onclick = (e) => {
                    e.stopPropagation();
                    triggerHaptic(40);
                    if (finalLink) openDeepLink(finalLink);
                };
            }

            // Update Total Cashback (Pixel specific)
            const totalCashback = parseFloat(data.userTotalCashbackEarned) || 0;
            const pixelIntro = document.getElementById('pixel-intro-text');

            if (pixelIntro) {
                if (totalCashback > 0) {
                    pixelIntro.innerHTML = `You’ve already earned <span class="highlight">₹${formatRupee(totalCashback)}</span> cashback on PayZapp! With a Pixel Credit Card, you can earn even more.`;
                } else {
                    pixelIntro.innerHTML = `Start your journey of savings with <span class="highlight">Pixel Credit Card!</span>`;
                }
            }

            // Update SmartBuy messaging based on totalSpends
            const totalSpends = parseFloat(data.totalSpends) || 0;
            const smartBuyBody = document.querySelector('.message-body[data-product="smartbuy"]');
            if (smartBuyBody) {
                const ps = smartBuyBody.querySelectorAll('p');
                if (ps.length >= 2) {
                    if (totalSpends > 0) {
                        ps[0].innerHTML = `You spent <span class="highlight">₹${formatRupee(totalSpends)}</span> on PayZapp last year!`;
                        ps[1].innerHTML = `But did you know SmartBuy gives you up to <span class="highlight">10X Rewards</span> and <span class="highlight">10% Cashback</span> on top of that? Unlock these savings on Amazon, Myntra, MakeMyTrip and more.`;
                    } else {
                        ps[0].innerHTML = `Make 2026 your most rewarding year yet.`;
                        ps[1].innerHTML = `Turn your travel and shopping into big savings on SmartBuy. Get <span class="highlight">up to 10% Cashback</span> and <span class="highlight">10X Rewards</span> on flights, hotels, and brand vouchers instantly.`;
                    }
                }
            }

            // Update Merchant Name (Semi specific)
            let merchant = data.offusMerchantName;
            const semiDesc = document.querySelector('.message-body[data-product="semi"] p:first-child');
            if (semiDesc) {
                if (!merchant || merchant.trim() === "") {
                    semiDesc.innerHTML = `Your big spends do not have to strain your budget.`;
                } else {
                    // Convert to Title Case (e.g., "AMAZON PAY" -> "Amazon Pay")
                    merchant = merchant.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    semiDesc.replaceChildren(document.createTextNode('Your spends at '));const merchantEl=document.createElement('span');merchantEl.className='highlight';merchantEl.textContent=merchant;semiDesc.append(merchantEl,document.createTextNode(' do not have to strain your budget.'));
                }
            }

            // Wire Back Button
            const backBtn = document.getElementById('back-button');
            if (backBtn) {
                backBtn.onclick = (e) => {
                    e.stopPropagation();
                    goBack();
                };
            }

            // Start animations after data is populated, waiting for Lottie
            await document.fonts.ready;
            await initAnimations();

            // Signal that data and animation setup is ready
            state.dataReady = true;
            tryStartExperience();
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', initPayZappData);

        gsap.registerPlugin();
        gsap.config({ force3D: true });

        // Split text into characters, handling nested spans recursively
        function splitText(el) {
            const nodes = [...el.childNodes];
            el.innerHTML = '';
            nodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent.trim().length > 0) {
                        [...node.textContent].forEach(ch => {
                            const span = document.createElement('span');
                            span.className = 'char';
                            span.textContent = ch === ' ' ? '\u00a0' : ch;
                            el.appendChild(span);
                        });
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'BR') {
                        el.appendChild(node);
                    } else {
                        // Recursively split children (like the user-name span)
                        // Clone the node to avoid modifying the original immediately
                        const wrapper = node.cloneNode(false); // shallow clone (tag + attributes)
                        splitText(node); // split the original node's content
                        // Move split children to the wrapper
                        while (node.firstChild) {
                            wrapper.appendChild(node.firstChild);
                        }
                        el.appendChild(wrapper);
                    }
                }
            });
        }

        let masterTL; // Global reference

        // Initialize Lottie and return a Promise that resolves when it's ready
        function loadAudio(elementId) {
            return new Promise((resolve) => {
                const audio = document.getElementById(elementId);
                if (!audio) return resolve();
                if (audio.readyState >= 3) return resolve(); // Already has enough data
                audio.addEventListener('canplaythrough', resolve, { once: true });
                // Fallback for audio
                setTimeout(resolve, 2000);
            });
        }

        function initAnimations() {
            // Split text (now that name is populated)
            splitText(document.querySelector('.scene-1 h1'));
            splitText(document.querySelector('.scene-2 h1'));

            // Re-select chars including the newly split name chars
            const scene1Chars = document.querySelectorAll('.scene-1 h1 .char');
            const scene2Chars = document.querySelectorAll('.scene-2 h1 .char');

            // Initial state
            gsap.set(['.s1-g1', '.s1-g2', '.s1-g3'], { opacity: 0, scale: 0, z: -1500, filter: 'blur(20px)' });
            gsap.set('.scene-1 h1', { opacity: 1, scale: 1, z: 0, filter: 'none' });
            gsap.set(scene1Chars, { opacity: 0, y: 50, filter: 'blur(6px)' });
            gsap.set(['.s2-g4', '.s2-g5', '.s2-g6', '.s2-g7'], { opacity: 0, scale: 0, z: -1500, filter: 'blur(20px)' });
            gsap.set('.scene-2 h1', { opacity: 1, scale: 1, z: 0, filter: 'none' });
            gsap.set(scene2Chars, { opacity: 0, y: 50, filter: 'blur(6px)' });
            gsap.set('.scene-3 .anim-group', { opacity: 0, scale: 0.5, z: -3000, filter: 'blur(0px)' });
            gsap.set('.lottie-envelope', { scale: 0.3 });

            // Master Timeline
            masterTL = gsap.timeline({ paused: true });

            // SCENE 1
            const scene1TL = gsap.timeline();
            scene1TL
                .set(['.s1-g1', '.s1-g2', '.s1-g3'], { opacity: 0, z: -2000, scale: 0.3, filter: 'blur(40px)' })
                .set(['.c1', '.c2'], { opacity: 0, z: 0, scale: 1, filter: 'blur(15px)' })
                .set(scene1Chars, { opacity: 0, y: 50, filter: 'blur(6px)' })
                // Assets fly-through
                .to(['.s1-g1', '.s1-g2', '.s1-g3'], { z: 1200, scale: 2, duration: 4.5, ease: 'none', stagger: 0.15 }, 0)
                .to(['.c1', '.c2'], { opacity: 0.9, filter: 'blur(0px)', duration: 1.2, stagger: 0.2 }, 0.5)
                .to(['.s1-g1', '.s1-g2', '.s1-g3'], { opacity: 1, filter: 'blur(0px)', duration: 2.0, ease: 'power2.inOut', stagger: 0.15 }, 0)
                // Letters stagger in - NOW INCLUDES NAME
                .to(scene1Chars, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 0.4)
                // Letters stagger out - NOW INCLUDES NAME
                .to(scene1Chars, { opacity: 0, y: -30, filter: 'blur(6px)', duration: 0.5, stagger: 0.04, ease: 'power2.in' }, 2.8)
                // Clouds & assets exit
                .to(['.c1', '.c2'], { z: 1000, scale: 5, opacity: 0, filter: 'blur(0px)', duration: 1.8, ease: 'power1.in' }, '-=1.8')
                .to(['.s1-g1', '.s1-g2', '.s1-g3'], { opacity: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power1.in', stagger: 0.15 }, '-=1.8')
                .set(['.c1', '.c2', '.s1-g1', '.s1-g2', '.s1-g3', '.scene-1 h1'], { display: 'none' });

            // SCENE 2
            const scene2TL = gsap.timeline();
            scene2TL
                .set(['.s2-g4', '.s2-g5', '.s2-g6', '.s2-g7'], { opacity: 0, z: -2000, scale: 0.3, filter: 'blur(20px)' })
                .set(scene2Chars, { opacity: 0, y: 50, filter: 'blur(6px)' })
                // Assets fly-through
                .to(['.s2-g4', '.s2-g5', '.s2-g6', '.s2-g7'], { z: 1200, scale: 2, duration: 4.5, ease: 'none', stagger: 0.15 }, 0)
                .to(['.s2-g4', '.s2-g5', '.s2-g6', '.s2-g7'], { opacity: 1, filter: 'blur(0px)', duration: 2.0, ease: 'power2.inOut', stagger: 0.15 }, 0)
                // Letters stagger in
                .to(scene2Chars, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.03, ease: 'power3.out' }, 0.3)
                // Letters stagger out
                .to(scene2Chars, { opacity: 0, y: -30, filter: 'blur(6px)', duration: 0.5, stagger: 0.02, ease: 'power2.in' }, 2.8)
                // Assets exit
                .to(['.s2-g4', '.s2-g5', '.s2-g6', '.s2-g7'], { opacity: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power1.in', stagger: 0.15 }, '-=1.8')
                .set(['.s2-g4', '.s2-g5', '.s2-g6', '.s2-g7', '.scene-2 h1'], { display: 'none' });

            // SCENE 3
            const scene3TL = gsap.timeline();
            scene3TL.set(['.lottie-envelope', '.scene-3'], { pointerEvents: 'auto' })
                .to('.scene-3 .anim-group', { opacity: 1, z: 0, scale: 1, filter: 'blur(0px)', duration: 3.5, ease: 'expo.out' })
                .to('.lottie-envelope', { scale: 1.0, duration: 3.0, ease: 'expo.out' }, 0)
                .to('.tap-word', { opacity: 1, filter: 'blur(0px)', duration: 1.5, stagger: 0.3, ease: 'power2.out' }, '-=2.0')
                .add(() => {
                    gsap.to('.lottie-envelope', { y: "-=20px", duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut", id: "lottieFloat" });
                });

            // Add all scenes to master timeline
            scene3TL.call(()=>{const envelope=document.querySelector('.scene-3');envelope.tabIndex=0;envelope.setAttribute('aria-disabled','false');},[],0);
            masterTL.add(scene1TL).add(scene2TL, '-=1.5').add(scene3TL, '-=1.2');

            // Initialize assets (Lottie and Audio)
            const assetsPromises = [
                new Promise((resolve) => {
                    envelopeAnimation = lottie.loadAnimation({
                        container: document.getElementById('lottie-envelope'),
                        renderer: 'svg',
                        loop: true,
                        autoplay: false,
                        path: 'assets/letter.json',
                        rendererSettings: {
                            preserveAspectRatio: 'xMidYMid slice',
                            progressiveLoad: false
                        }
                    });

                    const forceRender = () => {
                        if(reduced)envelopeAnimation.goToAndStop(0,true);else envelopeAnimation.playSegments([0, 10], true);
                    };

                    envelopeAnimation.addEventListener('data_ready', forceRender);
                    envelopeAnimation.addEventListener('DOMLoaded', () => {
                        forceRender();
                        resolve();
                    });
                    setTimeout(resolve, 3000); // Lottie fallback
                }),
                loadAudio('swoosh-sound'),
                loadAudio('open-sound')
            ];

            return Promise.all(assetsPromises).then(() => {
                // Wire interactions
                document.querySelector('.scene-3').addEventListener('click', () => {
                    if(document.querySelector('.scene-3').getAttribute('aria-disabled')==='true')return;
                    if(reduced){showLetterImmediately();return;}
                    triggerHaptic(20);
                    document.querySelector('.scene-3').style.pointerEvents = 'none';document.querySelector('.scene-3').tabIndex=-1;document.querySelector('.scene-3').setAttribute('aria-disabled','true');
                    gsap.killTweensOf('.lottie-envelope', 'y');
                    gsap.killTweensOf('.tap-word');

                    // Snappy scale feedback
                    gsap.timeline()
                        .to('.lottie-envelope', { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 }); // Original was .to('.lottie-envelope', { scale: 0.92, duration: 0.1, ease: 'power2.out' }) .to('.lottie-envelope', { scale: 1, duration: 0.4, ease: 'back.out(3)' });

                    // Play open sound instantly
                    const openSound = document.getElementById('open-sound');
                    if (openSound) {
                        openSound.currentTime = 0;
                        openSound.volume = 0.7;
                        openSound.play().catch(e => console.log("Audio play blocked", e));
                    }

                    // Stop loop and play full animation instantly
                    envelopeAnimation.stop();
                    envelopeAnimation.loop = false;
                    envelopeAnimation.resetSegments(true);
                    envelopeAnimation.play();
                    gsap.to('.tap-word', { opacity: 0, filter: 'blur(20px)', duration: 0.8, ease: 'power2.inOut' });

                    // Play swoosh sound after a delay
                    setTimeout(() => {
                        const swoosh = document.getElementById('swoosh-sound');
                        if (swoosh && !document.hidden) {
                            swoosh.currentTime = 0;
                            swoosh.volume = 0.7;
                            swoosh.play().catch(e => console.log("Audio play blocked", e));
                        }
                    }, 1200);
                });

                envelopeAnimation.addEventListener('complete', () => {
                    document.getElementById('cta-button').disabled=false;
                    gsap.to('.lottie-envelope', {
                        opacity: 0,
                        duration: 0.5,
                        ease: 'power2.out',
                        onComplete: () => {
                            const el = document.querySelector('.lottie-envelope');
                            if (el) el.remove();
                            envelopeAnimation.destroy();envelopeAnimation=null;
                        }
                    });
                    gsap.to('#letter-message', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, delay: 0.07, ease: 'letterEase' });
                    gsap.to('#letter-paper', { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.8, delay: 0.15, ease: 'letterEase' });
                    gsap.to('#product-reveal', {
                        opacity: 1,
                        duration: 0.8,
                        delay: 0.5,
                        ease: 'power1.out'
                    });
                    gsap.to(['#cta-button', '#button-fade-overlay'], {
                        opacity: 1,
                        pointerEvents: (i, el) => el.id === 'cta-button' ? 'auto' : 'none',
                        duration: 0.3,
                        delay: 0.7,
                        ease: 'power1.out'
                    });
                });
            });
        }





        // Initialize Heart Product Animation - REMOVED (Replaced with SVG)

        // Heart Flurry Logic
        function createHeart(x, y) {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            const size = Math.random() * 15 + 15;
            const colors = ['#F8BBD0', '#E1BEE7', '#FCE4EC', '#F3E5F5', '#FFCDD2'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            heart.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>`;
            document.body.appendChild(heart);
            gsap.set(heart, { x: x - size / 2, y: y - size / 2, scale: 0, opacity: 0, rotation: Math.random() * 40 - 20, filter: 'blur(10px)' });
            const tl = gsap.timeline({ onComplete: () => heart.remove() });
            tl.to(heart, { opacity: 0.8, scale: Math.random() * 0.8 + 1.2, filter: 'blur(0px)', duration: 0.4, ease: "back.out(1.7)" })
                .to(heart, { y: y - 200 - Math.random() * 150, x: x + (Math.random() - 0.5) * 200, rotation: Math.random() * 180 - 90, duration: 2 + Math.random(), ease: "power1.out" }, 0)
                .to(heart, { opacity: 0, scale: 0, duration: 1.2, ease: "power2.in" }, "-=1.2");
        }

        function initializeButtonInteractions() {
            const ctaBtn = document.getElementById('cta-button');
            if (!ctaBtn) return;
            ctaBtn.addEventListener('click', (e) => {
                const rect = ctaBtn.getBoundingClientRect();
                const leftX = rect.left + 15;
                const rightX = rect.right - 15;
                const centerY = rect.top + rect.height / 2;
                for (let i = 0; i < (reduced?0:25); i++) {
                    setTimeout(() => { createHeart(leftX, centerY); createHeart(rightX, centerY); }, i * 35 + Math.random() * 40);
                }
                gsap.to(ctaBtn, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
            });
        }
        initializeButtonInteractions();

        // Synchronization State
        let state = {
            loaderReady: false,
            dataReady: false,
            started: false
        };

        function tryStartExperience() {
            if (state.loaderReady && state.dataReady && !state.started) {
                state.started = true;
                const loader = document.getElementById('loader-overlay');

                if (loader) {
                    // Fade out loader
                    loader.style.opacity = '0';
                    loader.style.pointerEvents = 'none';

                    // Show back button
                    gsap.to('#back-button', { opacity: 1, duration: 0.8, delay: 0.5 });

                    // Start the experience
                    if (masterTL) { const start=getSafeParams().get('start'); if(start==='letter'){showLetterImmediately();}else if(start==='envelope'||reduced){masterTL.progress(1);if(reduced){gsap.killTweensOf('.lottie-envelope');envelopeAnimation.goToAndStop(0,true);}}else masterTL.play(); }

                    // Remove from DOM after fade
                    setTimeout(() => {
                        loader.style.display = 'none';
                    }, 800);
                }
            }
        }

        // Loader Logic
        window.addEventListener('load', () => {
            const minTime = getSafeParams().get('start')||reduced ? 0 : 2500; // 2.5 seconds minimum display
            setTimeout(() => {
                state.loaderReady = true;
                tryStartExperience();
            }, minTime);
        });

        // Initialize Data & Animation (runs via DOMContentLoaded -> initPayZappData)
        // We need to update initPayZappData to set state.dataReady = true and call tryStartExperience()
        // I will piggyback on this change to also update initAnimations call site.

        function closeDebugModal() {
            const modal = document.getElementById('debug-modal');
            if (modal) modal.style.display = 'none';
        }

function showLetterImmediately(){
 document.getElementById('cta-button').disabled=false;
 masterTL?.pause();gsap.killTweensOf('.lottie-envelope');
 if(envelopeAnimation){envelopeAnimation.pause();}
 gsap.set('.scene',{opacity:0,pointerEvents:'none'});
 gsap.set(['#letter-message','#letter-paper'],{opacity:1,y:0,scale:1,filter:'none'});
 gsap.set('#product-reveal',{opacity:1});gsap.set('#cta-button',{opacity:1,pointerEvents:'auto'});gsap.set('#button-fade-overlay',{opacity:1});
 document.querySelector('.scene-3').tabIndex=-1;document.querySelector('.scene-3').setAttribute('aria-disabled','true');
}
document.querySelector('.scene-3').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.click();}});
document.getElementById('close-product').onclick=()=>document.getElementById('product-dialog').close();
document.getElementById('product-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
document.querySelector('[data-back]').onclick=goBack;
document.getElementById('error-retry').onclick=()=>{const u=new URL(location.href);u.searchParams.delete('error');location.replace(u);};
let resumeEnvelope=false;
document.addEventListener('visibilitychange',()=>{if(document.hidden){resumeEnvelope=!!envelopeAnimation&&!envelopeAnimation.isPaused;gsap.globalTimeline.pause();envelopeAnimation?.pause();document.querySelectorAll('audio').forEach(a=>a.pause());}else{gsap.globalTimeline.resume();if(resumeEnvelope)envelopeAnimation?.play();}});
