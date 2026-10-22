const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const requestedScene = new URLSearchParams(window.location.search).get('scene');
const recapScene = ['intro', 'quiz', 'power', 'inactive', 'summary'].includes(requestedScene) ? requestedScene : 'intro';
if (reducedMotion) gsap.globalTimeline.timeScale(20);

// Emoji sprite sheet mapping
// Order: 🎯, 😎, 🌟, ✅, 🚀, 😅, 🙊, 🤏, ❌, 😬, 🎉
const EMOJI_SPRITE = {
    // Correct emojis (indices 0-4)
    CORRECT: {
        '🎯': 0, // Spot on!
        '😎': 1, // Nailed it!
        '🌟': 2, // You got it!
        '✅': 3, // Correct!
        '🚀': 4  // Awesome!
    },
    // Wrong emojis (indices 5-9)
    WRONG: {
        '😅': 5, // Not quite!
        '🙊': 6, // Oops!
        '🤏': 7, // Close one!
        '❌': 8, // Missed it!
        '😬': 9  // Almost!
    },
    // Outro emoji (index 10)
    OUTRO: {
        '🎉': 10
    }
};

// Helper function to get sprite position for an emoji
function getEmojiSpriteIndex(emoji) {
    // Check correct emojis
    if (EMOJI_SPRITE.CORRECT[emoji] !== undefined) {
        return EMOJI_SPRITE.CORRECT[emoji];
    }
    // Check wrong emojis
    if (EMOJI_SPRITE.WRONG[emoji] !== undefined) {
        return EMOJI_SPRITE.WRONG[emoji];
    }
    // Check outro emoji
    if (EMOJI_SPRITE.OUTRO[emoji] !== undefined) {
        return EMOJI_SPRITE.OUTRO[emoji];
    }
    return 0; // Default to first emoji
}

// Helper function to create emoji sprite element
// Note: The sprite image is 2x resolution (152px per emoji), displayed at 76px
function createEmojiSprite(emoji, size = '76px') {
    const spriteIndex = getEmojiSpriteIndex(emoji);
    // Parse the size to get numeric value
    const sizeValue = parseInt(size);
    // Background position is based on display size (after scaling)
    // Each emoji takes up 'sizeValue' pixels after the sprite is scaled
    const backgroundPosition = -(spriteIndex * sizeValue);

    const spriteEl = document.createElement('div');
    spriteEl.className = 'emoji-sprite';
    spriteEl.style.width = size;
    spriteEl.style.height = size;
    spriteEl.style.backgroundImage = 'url(assets/validation-emojis.png)';
    spriteEl.style.backgroundRepeat = 'no-repeat';
    spriteEl.style.backgroundPosition = `${backgroundPosition}px 0`;
    // Scale the 2x sprite to display size (auto height maintains aspect ratio)
    spriteEl.style.backgroundSize = `auto ${size}`;
    spriteEl.style.display = 'inline-block';

    return spriteEl;
}

// Audio elements for answer sounds
const correctSound = new Audio('assets/answer-correct.mp3');
const wrongSound = new Audio('assets/answer-wrong.mp3');

// Preload sounds
correctSound.load();
wrongSound.load();

// Play answer sound
function playAnswerSound(isCorrect) {
    if (document.hidden) return;
    try {
        const sound = isCorrect ? correctSound : wrongSound;
        sound.currentTime = 0; // Reset to start
        sound.play().catch(err => {
            // console.log('Could not play sound:', err);
        });
    } catch (e) {
        // console.log('Audio playback error:', e);
    }
}

// Debug toast function for testing API responses
// Set to true to show debug toasts, false to hide them
const SHOW_DEBUG_TOAST = false;

function showDebugToast(message, isSuccess = true) {
    if (!SHOW_DEBUG_TOAST) return;

    const toast = document.getElementById('debug-toast');

    if (toast) {
        toast.textContent = message;
        toast.style.backgroundColor = isSuccess ? '#16a34a' : '#dc2626';
        toast.style.color = 'white';

        // Show toast
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        // Hide after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(1rem)';
        }, 3000);
    }
}

// Data - will be populated from API
let questions = [];

// Helper function to format currency
function formatCurrency(amount) {
    // Floor the amount to ignore any original decimal values
    const flooredAmount = Math.floor(amount);

    if (flooredAmount >= 10000000) {
        // Crores - show decimals only if division results in non-integer
        const crores = flooredAmount / 10000000;
        if (crores % 1 === 0) {
            // Whole number - no decimals
            return '₹' + crores.toLocaleString('en-IN') + ' Cr';
        } else {
            // Has decimals - show up to 2 decimal places, remove trailing zeros
            return '₹' + parseFloat(crores.toFixed(2)).toLocaleString('en-IN') + ' Cr';
        }
    } else if (flooredAmount >= 100000) {
        // Lakhs - show decimals only if division results in non-integer
        const lakhs = flooredAmount / 100000;
        if (lakhs % 1 === 0) {
            // Whole number - no decimals
            return '₹' + lakhs.toLocaleString('en-IN') + ' L';
        } else {
            // Has decimals - show up to 2 decimal places, remove trailing zeros
            return '₹' + parseFloat(lakhs.toFixed(2)).toLocaleString('en-IN') + ' L';
        }
    } else if (flooredAmount >= 1000) {
        return '₹' + flooredAmount.toLocaleString('en-IN');
    }
    return '₹' + flooredAmount;
}

// Helper function to get month name from date string
function getMonthName(dateString) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date(dateString);
    return months[date.getMonth()];
}

// Helper function to get first name (returns in Title Case)
function getFirstName(fullName) {
    const first = fullName.split(' ')[0];
    // Convert to title case (e.g., "ANOOP" -> "Anoop")
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// Helper function to convert string to Title Case
function toTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

// Helper function to generate wrong option for numbers
function generateWrongOption(correctValue, isHigher = true) {
    const multiplier = isHigher ? (1.5 + Math.random()) : (0.3 + Math.random() * 0.4);
    return Math.round(correctValue * multiplier);
}

// Helper function to generate wrong month
function generateWrongMonth(correctMonth) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const correctIndex = months.indexOf(correctMonth);
    let wrongIndex;
    do {
        wrongIndex = Math.floor(Math.random() * 12);
    } while (wrongIndex === correctIndex);
    return months[wrongIndex];
}

// ========== USER SEGMENT LOGIC ==========

// Determine user segment based on total transaction value
function getUserSegment(totalSpends) {
    if (totalSpends < 1) return 'inactive';
    if (totalSpends <= 200000) return 'engaged';
    return 'power';
}

// Product names for Engaged segment (Card 1 trivia)
function getProductName(totalSpends) {
    if (totalSpends <= 20000) return 'a Marshall Emberton II Speaker';
    if (totalSpends <= 40000) return 'an Apple Watch SE';
    if (totalSpends <= 80000) return 'a PlayStation 5 Slim';
    if (totalSpends <= 150000) return 'an iPhone 16';
    return 'a Samsung S25 Ultra';
}

// Vehicle names for Power segment (Card 1 trivia)
function getVehicleName(totalSpends) {
    if (totalSpends <= 350000) return 'a Royal Enfield Super Meteor 650';
    if (totalSpends <= 500000) return 'an Aprilia RS 457';
    if (totalSpends <= 800000) return 'a Tata Tiago EV';
    if (totalSpends <= 1500000) return 'the new Mahindra Thar Roxx';
    if (totalSpends <= 2500000) return 'a Jeep Compass';
    if (totalSpends <= 4500000) return 'a BYD Seal EV';
    if (totalSpends <= 7500000) return 'a Toyota Fortuner Legender';
    if (totalSpends <= 12500000) return 'a Mercedes-Benz E-Class LWB';
    return 'a Land Rover Defender 110';
}

// Product image mapping for Engaged segment (Card 1 animation)
function getProductImage(totalSpends) {
    if (totalSpends <= 20000) return 'assets/product-speaker.png';
    if (totalSpends <= 40000) return 'assets/product-watch.png';
    if (totalSpends <= 80000) return 'assets/product-ps5.png';
    if (totalSpends <= 150000) return 'assets/product-iphone.png';
    return 'assets/product-samsung.png';
}

// Vehicle image mapping for Power segment (Card 1 animation)
function getVehicleImage(totalSpends) {
    if (totalSpends <= 350000) return 'assets/vehicle-enfield.png';
    if (totalSpends <= 500000) return 'assets/vehicle-aprilia.png';
    if (totalSpends <= 800000) return 'assets/vehicle-tiago.png';
    if (totalSpends <= 1500000) return 'assets/vehicle-thar.png';
    if (totalSpends <= 2500000) return 'assets/vehicle-compass.png';
    if (totalSpends <= 4500000) return 'assets/vehicle-byd.png';
    if (totalSpends <= 7500000) return 'assets/vehicle-fortuner.png';
    if (totalSpends <= 12500000) return 'assets/vehicle-mercedes.png';
    return 'assets/vehicle-defender.png';
}

// Get reveal image for Card 1 based on segment
function getCard1RevealImage(totalSpends, segment) {
    if (segment === 'inactive') return null; // No reveal for inactive users
    if (segment === 'engaged') return getProductImage(totalSpends);
    return getVehicleImage(totalSpends); // power segment
}

// Platform stats for inactive segment
const PLATFORM_STATS = {
    totalTransactions: 267784056,
    totalTransactionValue: 681155932796,
    highestStreak: 334,
    totalMerchantPayments: 10041105,
    totalCashback: 247113021,
    totalP2pPayments: 60889670,
    totalP2pValue: 226615436963,
    maxPotentialCashback: 2892 // Max yearly cashback potential
};

// ========== PAYMENT PERSONALITY LOGIC ==========

// Personality templates
const PERSONALITY_TEMPLATES = {
    1: {
        title: "Reward Master",
        message: "You've been turning points into perks like a pro on PayZapp"
    },
    2: {
        title: "Deal Hunter",
        message: "You've been quietly stacking up rewards all year on PayZapp"
    },
    3: {
        title: "Planner",
        message: "You've mastered the art of seamless payments with PayZapp"
    },
    4: {
        title: "Night Owl",
        message: "You're a late night spender who prefers to pay after sunset"
    },
    5: {
        title: "Early Bird",
        message: "Your payments happen as soon as the sun rises"
    },
    6: {
        title: "Digital Nomad",
        message: "From tiny taps to big spends, you've kept PayZapp busy & your life easy"
    }
};

// Personality filter thresholds
const PERSONALITY_FILTERS = {
    minimumNumberOfRcbpTransactions: 15,
    minimumNumberOfPayments: 200,
    minimumCashpointsEarned: 20,
    minimumCashpointsBurned: 20,
    minimumNumberOfPaymentsInEvening: 12,
    minimumNumberOfPaymentsInMorning: 12,
    eveningTimeThresholdIn24Hours: 18,
    morningTimeThresholdIn24Hours: 10
};

// Determine payment personality based on API data
function getPaymentPersonality(data) {
    // Check conditions in order of priority

    // Personality 1: The Reward Master
    if (data.cashbackSpends >= PERSONALITY_FILTERS.minimumCashpointsBurned) {
        return PERSONALITY_TEMPLATES[1];
    }

    // Personality 2: The Deal Hunter
    if (data.userTotalCashbackEarned >= PERSONALITY_FILTERS.minimumCashpointsEarned) {
        return PERSONALITY_TEMPLATES[2];
    }

    // Personality 3: The Planner
    if (data.rcbpTxns >= PERSONALITY_FILTERS.minimumNumberOfRcbpTransactions) {
        return PERSONALITY_TEMPLATES[3];
    }

    // Personality 6: The Digital Nomad (check before time-based ones)
    if (data.totalTxns >= PERSONALITY_FILTERS.minimumNumberOfPayments) {
        return PERSONALITY_TEMPLATES[6];
    }

    // Personality 4: The Night Owl
    if (data.maxHour >= PERSONALITY_FILTERS.eveningTimeThresholdIn24Hours &&
        data.txnCountMaxHourwise >= PERSONALITY_FILTERS.minimumNumberOfPaymentsInEvening) {
        return PERSONALITY_TEMPLATES[4];
    }

    // Personality 5: The Early Bird
    if (data.maxHour <= PERSONALITY_FILTERS.morningTimeThresholdIn24Hours &&
        data.txnCountMaxHourwise >= PERSONALITY_FILTERS.minimumNumberOfPaymentsInMorning) {
        return PERSONALITY_TEMPLATES[5];
    }

    // Default fallback: The Digital Nomad
    return PERSONALITY_TEMPLATES[6];
}

// Store user's personality globally for use in outro
let userPersonality = null;
let userFirstName = '';

// Store user data for Card 1 animation
let userTotalSpends = 0;
let userSegment = 'inactive';

// Calculate cashback percentage
function getCashbackPercentage(userCashback) {
    return Math.round((userCashback / PLATFORM_STATS.maxPotentialCashback) * 100);
}

// Build questions from API data with segment-based content
function buildQuestionsFromData(data) {
    const firstName = getFirstName(data.userName);
    const correctMonth = getMonthName(data.maxMonth);
    const segment = getUserSegment(data.totalSpends);

    // Calculate chai cups (assuming ₹10 per cup)
    const chaiCups = Math.round(data.userTotalCashbackEarned / 10);
    const platformChaiCups = Math.round(PLATFORM_STATS.totalCashback / 10);
    const cashbackPercentage = getCashbackPercentage(data.userTotalCashbackEarned);

    // Helper function to check if value is valid (not null, undefined, or empty)
    const isValid = (value) => value !== null && value !== undefined && value !== '';

    // Array to collect valid questions
    const questions = [];
    let cardIndex = 0;

    // ========== CARD 1: Total Transaction Value ==========
    // Required fields: totalSpends (for engaged/power), or platform stats for inactive
    const card1Required = segment === 'inactive' || isValid(data.totalSpends);

    if (card1Required) {
        const card1 = {
            id: cardIndex++,
            illustration: "assets/illustration1.png",
            backgroundColor: "#0F4252",
            foreroundColor: "#D6F4FF",
            shareValue: segment === 'inactive' ? formatCurrency(PLATFORM_STATS.totalTransactionValue) : formatCurrency(data.totalSpends),
            shareLabel: segment === 'inactive' ? 'PAYZAPP TOTAL TRANSACTIONS' : `${firstName.toUpperCase()}'S TOTAL SPENDS`,
            shareMessage: segment === 'inactive'
                ? `PayZapp moved ${formatCurrency(PLATFORM_STATS.totalTransactionValue)} in 2025! Check it out 💸`
                : segment === 'engaged'
                    ? `${firstName} spent ${formatCurrency(data.totalSpends)} on PayZapp in 2025 — enough to buy ${getProductName(data.totalSpends)}!`
                    : `${firstName} spent ${formatCurrency(data.totalSpends)} on PayZapp in 2025 — enough to buy ${getVehicleName(data.totalSpends)}!`
        };

        if (segment === 'inactive') {
            card1.text = "Can you guess the total <span class='dm-serif-italic text-[1.45rem]'>money</span> moved on PayZapp this year?";
            card1.options = [formatCurrency(450000000000), formatCurrency(PLATFORM_STATS.totalTransactionValue)];
            card1.correctIndex = 1;
            card1.trivia = "PayZapp is safe, secure, and trusted by millions. Make your first payment today and join the club!";
            card1.shareTrivia = "PayZapp is safe, secure, and trusted by millions.";
            card1.shareProductImage = null;
        } else if (segment === 'engaged') {
            card1.text = "What's the total <span class='dm-serif-italic text-[1.45rem]'>cash</span> you moved on PayZapp?";
            card1.options = [formatCurrency(generateWrongOption(data.totalSpends, false)), formatCurrency(data.totalSpends)];
            card1.correctIndex = 1;
            card1.trivia = `We value every single rupee of your journey - thank you! Fun fact: That's enough to buy ${getProductName(data.totalSpends)}`;
            card1.shareTrivia = `That's enough to buy ${getProductName(data.totalSpends)}!`;
            card1.shareProductImage = getProductImage(data.totalSpends);
        } else {
            card1.text = "What's the total <span class='dm-serif-italic text-[1.45rem]'>cash</span> you moved on PayZapp?";
            card1.options = [formatCurrency(generateWrongOption(data.totalSpends, false)), formatCurrency(data.totalSpends)];
            card1.correctIndex = 1;
            card1.trivia = `Thanks for trusting us. That total is big enough to buy ${getVehicleName(data.totalSpends)}`;
            card1.shareTrivia = `That total could buy ${getVehicleName(data.totalSpends)}!`;
            card1.shareProductImage = getVehicleImage(data.totalSpends);
        }
        questions.push(card1);
    }

    // ========== CARD 2: Top Merchant ==========
    // Required fields: offusMerchantName (for engaged/power), or platform stats for inactive
    const card2Required = segment === 'inactive' || isValid(data.offusMerchantName);

    if (card2Required) {
        const merchantName = toTitleCase(data.offusMerchantName || '');
        const card2 = {
            id: cardIndex++,
            illustration: "assets/illustration2.png",
            shareIllustration: "assets/share-illustration2.png",
            backgroundColor: "#3F3313",
            foreroundColor: "#FFECB8",
            shareValue: segment === 'inactive' ? 'MobiKwik' : merchantName,
            shareLabel: segment === 'inactive' ? 'INDIA\'S TOP MERCHANT' : `${firstName.toUpperCase()}'S FAVOURITE MERCHANT`,
            shareMessage: segment === 'inactive'
                ? `MobiKwik was India's favourite merchant on PayZapp in 2025! 🛒`
                : `${firstName}'s top merchant on PayZapp in 2025 was ${merchantName}! 🛒`
        };

        if (segment === 'inactive') {
            card2.text = "Which <span class='dm-serif-italic text-[1.45rem]'>merchant</span> did India love the most on PayZapp?";
            card2.options = ['MobiKwik', 'Swiggy'];
            card2.correctIndex = 0;
            card2.trivia = "Experience 2X faster payments there with Zapp Account.";
            card2.shareTrivia = "Experience 2X faster payments with Zapp Account.";
        } else {
            card2.text = "Your absolute favourite <span class='dm-serif-italic text-[1.45rem]'>merchant</span> in 2025 was...";
            card2.options = [merchantName, merchantName === 'Mobikwik' ? 'Swiggy' : 'Zomato'];
            card2.correctIndex = 0;
            card2.trivia = "Want to pay 2X faster next time? Upgrade to Zapp Account.";
            card2.shareTrivia = `${firstName} loves shopping at ${merchantName}!`;
        }
        questions.push(card2);
    }

    // ========== CARD 3: Favourite Person ==========
    // Required fields: frqP2pPayee, frqP2pPayeeTxnCount (for engaged/power), or platform stats for inactive
    const card3Required = segment === 'inactive' || (isValid(data.frqP2pPayee) && isValid(data.frqP2pPayeeTxnCount));

    if (card3Required) {
        const card3 = {
            id: cardIndex++,
            illustration: "assets/illustration6.png",
            shareIllustration: "assets/share-illustration6.png",
            backgroundColor: "#0E3D4E",
            foreroundColor: "#D6F4FF",
            shareValue: segment === 'inactive' ? `${(PLATFORM_STATS.totalP2pPayments / 1000000).toFixed(0)}M` : toTitleCase(data.frqP2pPayee),
            shareLabel: segment === 'inactive' ? 'P2P PAYMENTS ON PAYZAPP' : `${firstName.toUpperCase()}'S FINANCIAL BESTIE`,
            shareMessage: segment === 'inactive'
                ? `${(PLATFORM_STATS.totalP2pPayments / 1000000).toFixed(0)} Million P2P payments on PayZapp in 2025!`
                : `${firstName}'s financial bestie on PayZapp is ${toTitleCase(data.frqP2pPayee)}!`
        };

        if (segment === 'inactive') {
            card3.text = "How many times did people send <span class='dm-serif-italic text-[1.45rem]'>love</span> (and money) to friends?";
            card3.options = [`${(PLATFORM_STATS.totalP2pPayments / 1000000).toFixed(0)}M times`, '25M times'];
            card3.correctIndex = 0;
            card3.trivia = "Sending money is great, but safety is key. Protect your money for just ₹5/month with Cyber Suraksha*.";
            card3.shareTrivia = "Sending money is great, but safety is key!";
        } else {
            // Funny Bollywood/TV character names for wrong option
            const funnyNames = [
                "Babu Bhaiya",
                "Geet",
                "Rocky Bhai",
                "Kattappa",
                "Sivagami",
                "Pushpa",
                "Bahubali",
                "Jethalal",
                "Anupama"
            ];
            const randomFunnyName = funnyNames[Math.floor(Math.random() * funnyNames.length)];

            card3.text = "Who is your financial <span class='dm-serif-italic text-[1.45rem]'>bestie</span> of 2025?";
            card3.options = [toTitleCase(data.frqP2pPayee), randomFunnyName];
            card3.correctIndex = 0;
            card3.trivia = `You paid ${toTitleCase(data.frqP2pPayee)} ${data.frqP2pPayeeTxnCount} times! Keep every transfer safe with Cyber Suraksha insurance for just ₹5/month*.`;
            card3.shareTrivia = `${firstName} paid ${toTitleCase(data.frqP2pPayee)} ${data.frqP2pPayeeTxnCount} times in 2025!`;
        }
        questions.push(card3);
    }

    // ========== CARD 4: Favourite Month ==========
    // Required fields: maxMonth (for all segments)
    const card4Required = isValid(data.maxMonth) && isValid(correctMonth);

    if (card4Required) {
        const card4 = {
            id: cardIndex++,
            illustration: "assets/illustration3.png",
            shareIllustration: "assets/share-illustration3.png",
            backgroundColor: "#373A27",
            foreroundColor: "#E9EECE",
            shareValue: correctMonth,
            shareLabel: segment === 'inactive' ? 'BIGGEST SPENDING MONTH' : `${firstName.toUpperCase()}'S PEAK MONTH`,
            shareMessage: segment === 'inactive'
                ? `${correctMonth} was the biggest spending month on PayZapp in 2025!`
                : `${firstName}'s peak spending month on PayZapp was ${correctMonth}!`
        };

        if (segment === 'inactive') {
            card4.text = "Which <span class='dm-serif-italic text-[1.45rem]'>month</span> saw the biggest spending spree on PayZapp?";
            card4.options = [correctMonth, generateWrongMonth(correctMonth)];
            card4.correctIndex = 0;
            card4.trivia = "Missed the sale? You can still save up to 16% on Groceries & Shopping via PayZapp Shop!";
            card4.shareTrivia = "Save up to 16% on Groceries & Shopping via PayZapp Shop!";
        } else {
            card4.text = "Which <span class='dm-serif-italic text-[1.45rem]'>month</span> turned you into a spending machine?";
            card4.options = [correctMonth, generateWrongMonth(correctMonth)];
            card4.correctIndex = 0;
            card4.trivia = "Planning a trip soon? You can save up to 33% on travel with PayZapp Shop.*";
            card4.shareTrivia = `${firstName} went all out in ${correctMonth}!`;
        }
        questions.push(card4);
    }

    // ========== CARD 5: Cashback Earned ==========
    // Required fields: userTotalCashbackEarned (for engaged/power), or platform stats for inactive
    // Skip if cashback is zero/missing OR if chai cups calculation results in 0
    const card5Required = segment === 'inactive' || (isValid(data.userTotalCashbackEarned) && data.userTotalCashbackEarned > 0 && chaiCups > 0);

    if (card5Required) {
        const card5 = {
            id: cardIndex++,
            illustration: "assets/illustration5.png",
            shareIllustration: "assets/share-illustration5.png",
            backgroundColor: "#3F2412",
            foreroundColor: "#FFE1DB",
            shareValue: segment === 'inactive' ? `${platformChaiCups.toLocaleString('en-IN')} Cups` : `${chaiCups} Cups`,
            shareLabel: segment === 'inactive' ? 'PAYZAPP CHAI FUND' : `${firstName.toUpperCase()}'S CHAI POTENTIAL`,
            shareMessage: segment === 'inactive'
                ? `PayZapp funded ${platformChaiCups.toLocaleString('en-IN')} cups of chai in 2025! ☕`
                : `${firstName}'s PayZapp cashback can buy ${chaiCups} cups of chai! ☕`
        };

        if (segment === 'inactive') {
            card5.text = "How many cups of <span class='dm-serif-italic text-[1.45rem]'>chai</span> did PayZapp fund this year?";
            card5.options = [`${(platformChaiCups / 1000000).toFixed(1)}M cups`, '5M cups'];
            card5.correctIndex = 0;
            card5.trivia = "Start paying your bills on PayZapp and you could earn up to ₹2,892/year!*";
            card5.shareTrivia = "PayZapp cashback funded millions of chai cups in 2025!";
        } else if (segment === 'engaged') {
            card5.text = "If your cashback was <span class='dm-serif-italic text-[1.45rem]'>chai</span>, how many cups would it be?";
            card5.options = [`${generateWrongOption(chaiCups, false)} cups`, `${chaiCups} cups`];
            card5.correctIndex = 1;
            card5.trivia = `You grabbed ${cashbackPercentage}% of the cashback PayZapp had to offer. Next year, let's aim for 100%!`;
            card5.shareTrivia = `${firstName}'s cashback equals ${chaiCups} cups of chai!`;
        } else {
            card5.text = "If your cashback was <span class='dm-serif-italic text-[1.45rem]'>chai</span>, how many cups would it be?";
            card5.options = [`${generateWrongOption(chaiCups, false)} cups`, `${chaiCups} cups`];
            card5.correctIndex = 1;
            card5.trivia = `Wow! That's ${cashbackPercentage}% of all available cashback. You are a certified Cashback Conqueror!`;
            card5.shareTrivia = `${firstName} is a certified Cashback Conqueror with ${chaiCups} cups worth!`;
        }
        questions.push(card5);
    }

    // ========== CARD 6: Longest Streak ==========
    // Required fields: streakDays (for engaged/power), or platform stats for inactive
    const card6Required = segment === 'inactive' || isValid(data.streakDays);

    if (card6Required) {
        const card6 = {
            id: cardIndex++,
            illustration: "assets/illustration4.png",
            shareIllustration: "assets/share-illustration4.png",
            backgroundColor: "#36255B",
            foreroundColor: "#EED3F8",
            shareValue: segment === 'inactive' ? `${PLATFORM_STATS.highestStreak} Days` : `${data.streakDays} Day${data.streakDays > 1 ? 's' : ''}`,
            shareLabel: segment === 'inactive' ? 'LEGENDARY STREAK' : `${firstName.toUpperCase()}'S PAYMENT STREAK`,
            shareMessage: segment === 'inactive'
                ? `The legendary PayZapp streak was ${PLATFORM_STATS.highestStreak} days in 2025!`
                : `${firstName}'s longest PayZapp payment streak was ${data.streakDays} day${data.streakDays > 1 ? 's' : ''}!`
        };

        if (segment === 'inactive') {
            card6.text = "What was the legendary payment <span class='dm-serif-italic text-[1.45rem]'>streak</span> on PayZapp in 2025?";
            card6.options = [`${PLATFORM_STATS.highestStreak} days`, '150 days'];
            card6.correctIndex = 0;
            card6.trivia = "Start your streak today: Scan & Pay 10 times to grab a ₹50 Swiggy voucher!";
            card6.shareTrivia = `The legendary PayZapp streak was ${PLATFORM_STATS.highestStreak} days!`;
        } else {
            card6.text = "What was your longest payment <span class='dm-serif-italic text-[1.45rem]'>streak</span> in days?";
            card6.options = [`${data.streakDays} day${data.streakDays > 1 ? 's' : ''}`, `${generateWrongOption(data.streakDays, true)} days`];
            card6.correctIndex = 0;
            card6.trivia = `Impressive! The platform record is a massive ${PLATFORM_STATS.highestStreak}-day streak! Can you beat that in 2026?`;
            card6.shareTrivia = `${firstName} kept a ${data.streakDays}-day PayZapp streak going!`;
        }
        questions.push(card6);
    }

    // Log if any questions were skipped
    if (questions.length < 6) {
        // console.log(`[buildQuestionsFromData] Skipped ${6 - questions.length} question(s) due to missing data`);
    }

    return questions;
}

// Default fallback questions (used if API fails)
const defaultQuestions = [
    {
        id: 0,
        text: "What's the total <span class='dm-serif-italic text-[1.45rem]'>cash</span> that you moved on PayZapp?",
        options: ["₹50,898", "₹1,12,827"],
        correctIndex: 1,
        illustration: "assets/illustration1.png",
        trivia: "Try Zapp Account to move money 2x faster next year! ⚡",
        backgroundColor: "#0F4252",
        foreroundColor: "#D6F4FF",
        shareValue: "₹1,12,827",
        shareLabel: "YOUR TOTAL SPENDS",
        shareMessage: "One year. Countless transactions. Can you guess your 2025 highlights?"
    }
];

// Outro configuration
const outroData = {
    title: "The Digital Nomad",
    message: "From tiny taps to big spends, you've kept PayZapp busy & your life easy.",
    backgroundColor: "#2E2419",
    shareMessage: "One year. Countless transactions. Can you guess your 2025 highlights?"
};

let currentQuestionIndex = 0;
let isFlipping = false;
// Tracks whether the user has already answered the current question
let hasAnsweredCurrentQuestion = false;
// Store user answers for each question: { selectedIndex, isCorrect }
let userAnswers = [];
// Track if card1 reveal animation (currency to product) has been triggered
let card1RevealTriggered = false;

// DOM Elements
const startBtn = document.getElementById('start-btn');
const introCover = document.querySelector('.intro-cover');
const validationOverlay = document.getElementById('validation-overlay');
const topContent = document.getElementById('top-content');
const introContentBelow = document.querySelector('.intro-content-below');
const notepad = document.querySelector('.notepad');
const stage = document.querySelector('.stage');
const replayBtn = document.getElementById('replay-btn');

// We have two physical cards in the DOM to create the infinite loop effect
const card1 = document.getElementById('card-1');
const card2 = document.getElementById('card-2');

// Audio for page flip sound effect
const pageFlipAudio = new Audio('assets/page-flip.m4a');
pageFlipAudio.preload = 'auto';
pageFlipAudio.volume = 0.7; // Set volume to 70%

let activeCard = card1;
let nextCard = card2;

let peepTimeline;
let bottomHalfNudgeTimeline;

// ========== AUTO-FLIP TIMER ==========
let autoFlipTimer = null;
const AUTO_FLIP_DELAY = 5000; // 3 seconds

function startAutoFlipTimer() {
    if (document.hidden || reducedMotion) return;
    // Don't auto-flip on outro state (after all questions answered)
    const inOutroState = currentQuestionIndex >= questions.length;
    if (inOutroState) return;

    // Clear any existing timer
    stopAutoFlipTimer();

    // Show and animate the progress bar
    const progressContainer = document.getElementById('autoflip-progress');
    const progressBar = progressContainer?.querySelector('.autoflip-progress-bar');

    if (progressContainer && progressBar) {
        // Reset progress bar
        progressBar.classList.remove('animating');
        progressBar.style.width = '0%';

        // Show progress container
        gsap.to(progressContainer, { opacity: 1, duration: 0.2 });

        // Start animation after a tiny delay to ensure reset
        setTimeout(() => {
            progressBar.classList.add('animating');
        }, 50);
    }

    // Set timer to auto-flip
    autoFlipTimer = setTimeout(() => {
        // Trigger the flip
        if (!isFlipping && hasAnsweredCurrentQuestion) {
            flipPage();
        }
    }, AUTO_FLIP_DELAY);
}

function stopAutoFlipTimer() {
    // Clear the timer
    if (autoFlipTimer) {
        clearTimeout(autoFlipTimer);
        autoFlipTimer = null;
    }

    // Hide and reset the progress bar
    const progressContainer = document.getElementById('autoflip-progress');
    const progressBar = progressContainer?.querySelector('.autoflip-progress-bar');

    if (progressContainer && progressBar) {
        progressBar.classList.remove('animating');
        progressBar.style.width = '0%';
        gsap.to(progressContainer, { opacity: 0, duration: 0.2 });
    }
}

// Utility function to add click scale animation to elements
function addClickScaleAnimation(element) {
    if (!element) return;

    const handleClick = (e) => {
        // Create a quick scale down animation
        gsap.to(element, {
            scale: 0.95,
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => {
                // Scale back up
                gsap.to(element, {
                    scale: 1,
                    duration: 0.15,
                    ease: "power2.out"
                });
            }
        });
    };

    element.addEventListener('mousedown', handleClick);
    element.addEventListener('touchstart', handleClick, { passive: true });
}

// Asset Preloader - All image assets
const ASSETS_TO_PRELOAD = [
    // Core UI assets
    'assets/logo.svg',
    'assets/logo.png',
    'assets/logo-plain.svg',
    'assets/pz-logo.svg',
    'assets/flipbook-rings.svg',
    'assets/flipbook-preview.png',
    'assets/cover-bg.png',
    'assets/hdfc.png',

    // Illustrations
    'assets/illustration1.png',
    'assets/illustration2.png',
    'assets/illustration3.png',
    'assets/illustration4.png',
    'assets/illustration5.png',
    'assets/illustration6.png',

    // Share Illustrations
    'assets/share-illustration1.png',
    'assets/share-illustration2.png',
    'assets/share-illustration3.png',
    'assets/share-illustration4.png',
    'assets/share-illustration5.png',
    'assets/share-illustration6.png',
    'assets/share-illustration-final.png',

    // Outro
    'assets/outro-top.png',
    'assets/outro-bottom.png',

    // Validation
    'assets/validation-emojis.png',

    // Card 1 overlays
    'assets/currency-note.png',
    'assets/product-iphone.png',
    'assets/product-ps5.png',
    'assets/product-samsung.png',
    'assets/product-speaker.png',
    'assets/product-watch.png',
    'assets/vehicle-aprilia.png',
    'assets/vehicle-byd.png',
    'assets/vehicle-compass.png',
    'assets/vehicle-defender.png',
    'assets/vehicle-enfield.png',
    'assets/vehicle-fortuner.png',
    'assets/vehicle-mercedes.png',
    'assets/vehicle-thar.png',
    'assets/vehicle-tiago.png',

    // Card 2 overlays
    'assets/smartphone.png',
    'assets/bubble1.png',
    'assets/bubble2.png',
    'assets/bubble3.png',
    'assets/bubble4.png',

    // Card 3 overlays
    'assets/handshake.png',
    'assets/heart.png',

    // Card 4 overlays
    'assets/calendar.png',
    'assets/calendar-tick.png',

    // Card 5 overlays
    'assets/chai.png',
    'assets/steam.png',

    // Feature cards
    'assets/feature-1.png',
    'assets/feature-2.png',
    'assets/feature-3.png',
    'assets/feature-4.png',
    'assets/feature-5.png',
    'assets/feature-6.png',

    // Icons & backgrounds
    'assets/rays-bg.svg',
    'assets/rays-bg-yellow.svg',
    'assets/security.svg',
    'assets/shopping.svg',
    'assets/speed.svg',
    'assets/users.svg'
];

function preloadAssets() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalAssets = ASSETS_TO_PRELOAD.length;

        // If no assets, resolve immediately
        if (totalAssets === 0) {
            resolve();
            return;
        }

        ASSETS_TO_PRELOAD.forEach((src) => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loadedCount++;
                if (loadedCount >= totalAssets) {
                    resolve();
                }
            };
            img.src = src;
        });

        // Fallback timeout - don't wait more than 10 seconds
        setTimeout(() => {
            resolve();
        }, 10000);
    });
}

function hidePreloader() {
    // Stop the rotating messages
    stopLoaderMessages();

    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Use GSAP for smooth, graceful fadeout
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.4,
            ease: "power2.inOut",
            onComplete: () => {
                preloader.style.display = 'none'; // Hide instead of remove for retry
            }
        });
    }
}

// Show preloader (for retry)
function showPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Kill any existing animations on preloader
        gsap.killTweensOf(preloader);

        // Reset state - make visible but transparent first
        preloader.style.display = 'flex';
        preloader.style.opacity = '0';

        // Now animate opacity to 1
        gsap.to(preloader, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
        });

        startLoaderMessages();
    }
}

// Rotating loader messages
const LOADER_MESSAGES = [
    "Polishing your trophy...",
    "Unwrapping your 2025 story...",
    "Brewing your year in review...",
    "Zapping the numbers together..."
];
let loaderMessageIndex = 0;
let loaderMessageInterval = null;

function startLoaderMessages() {
    const messageEl = document.getElementById('loader-message');
    if (!messageEl) return;

    // Set initial opacity explicitly for GSAP to animate
    messageEl.style.opacity = '0.6';

    loaderMessageInterval = setInterval(() => {
        // Fade out
        gsap.to(messageEl, {
            opacity: 0,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
                // Change message
                loaderMessageIndex = (loaderMessageIndex + 1) % LOADER_MESSAGES.length;
                messageEl.textContent = LOADER_MESSAGES[loaderMessageIndex];
                // Fade in
                gsap.to(messageEl, {
                    opacity: 0.6,
                    duration: 0.2,
                    ease: "power2.in"
                });
            }
        });
    }, 1200); // 800ms visible + 200ms fade out + 200ms fade in
}

function stopLoaderMessages() {
    if (loaderMessageInterval) {
        clearInterval(loaderMessageInterval);
        loaderMessageInterval = null;
    }
}

// Error screen functions
function showErrorScreen() {
    const errorScreen = document.getElementById('error-screen');
    if (errorScreen) {
        // Kill any existing animations
        gsap.killTweensOf(errorScreen);

        // Remove hidden class and reset opacity
        errorScreen.classList.remove('hidden');
        errorScreen.style.opacity = '0';

        // Fade in
        gsap.to(errorScreen, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    }
}

function hideErrorScreen() {
    const errorScreen = document.getElementById('error-screen');
    if (errorScreen) {
        // Kill any existing animations
        gsap.killTweensOf(errorScreen);

        // Fade out
        gsap.to(errorScreen, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                errorScreen.classList.add('hidden');
            }
        });
    }
}

// Retry function for API failure
async function retryFetchData() {
    const retryBtn = document.getElementById('retry-api-btn');
    const stage = document.querySelector('.stage');

    if (retryBtn) {
        retryBtn.disabled = true;
        retryBtn.innerHTML = 'Retrying...';
    }

    // Hide the stage (intro content) before fading out error screen
    if (stage) {
        gsap.set(stage, { opacity: 0 });
    }

    // Fade out error screen
    hideErrorScreen();

    // Wait for error screen to fade out
    await new Promise(resolve => setTimeout(resolve, 300));

    // Show preloader
    showPreloader();

    // Track when preloader appeared
    const preloaderStartTime = Date.now();
    const MIN_PRELOADER_DURATION = 1500; // Minimum 1.5 seconds

    // Try init again
    try {
        await init();

        // Ensure preloader is visible for minimum duration
        const elapsedTime = Date.now() - preloaderStartTime;
        const remainingTime = Math.max(0, MIN_PRELOADER_DURATION - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        // Fade out preloader
        hidePreloader();

        // Wait for preloader to fade out
        await new Promise(resolve => setTimeout(resolve, 500));

        // Now fade in the stage/intro content
        if (stage) {
            gsap.to(stage, { opacity: 1, duration: 0.5, ease: "power2.out" });
        }

        initSnowfall();
        animateIntroElements();
        if (recapScene !== 'intro') mountRecapScene(recapScene);
    } catch (error) {
        console.error('Retry failed:', error);

        // Ensure preloader is visible for minimum duration even on error
        const elapsedTime = Date.now() - preloaderStartTime;
        const remainingTime = Math.max(0, MIN_PRELOADER_DURATION - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        hidePreloader();
        // Error screen is already shown by init()

        // Reset retry button
        if (retryBtn) {
            retryBtn.disabled = false;
            retryBtn.innerHTML = 'Try Again';
        }
    }
}

// Subtle entry animations for intro elements
function animateIntroElements() {
    // Set initial states - subtle starting positions
    gsap.set('.notepad-anim', { opacity: 0, y: 15 });
    gsap.set('.intro-below-anim', { opacity: 0, y: 20 });

    // Create timeline for gentle animations
    const tl = gsap.timeline({ delay: 0.1 });

    // Animate notepad/flipbook as one unit - gentle fade and rise
    tl.to('.notepad-anim', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power1.out"
    })
        // Animate bottom content with gentle stagger
        .to('.intro-below-anim', {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power1.out",
            stagger: 0.12
        }, "-=0.5");

    return tl;
}

// Initialize
async function init() {
    // Isolated sample profile: this public prototype never reads an app or bank bridge.
    try {
        const data = window.RECAP_DEMO.profileForScene(recapScene);
        // Build questions from API data
        questions = buildQuestionsFromData(data);
        // Store user data for Card 1 animation
        userTotalSpends = data.totalSpends || 0;
        userSegment = getUserSegment(userTotalSpends);
        // Calculate and store user's payment personality
        userPersonality = getPaymentPersonality(data);
        // Store and update user's first name
        userFirstName = data.userName ? getFirstName(data.userName) : '';
        const userFirstNameEl = document.getElementById('user-first-name');
        if (userFirstNameEl && userFirstName) {
            userFirstNameEl.textContent = userFirstName;
        }
    } catch (error) {
        console.error('Error fetching remote data:', error);

        // Show error screen when API fails (only skip if mock data is enabled)
        showDebugToast('✗ Failed to fetch data', false);
        showErrorScreen();
        throw error; // Re-throw to prevent further initialization
    }

    // Initialize validation overlay with default emoji sprite
    if (validationOverlay) {
        const targetIcon = validationOverlay.querySelector('.target-icon');
        if (targetIcon) {
            targetIcon.innerHTML = ''; // Clear any existing content
            targetIcon.appendChild(createEmojiSprite('🎯', '76px')); // Default to first correct emoji
        }
    }

    // Don't render Q1 on Top Static yet - wait for intro to finish
    // renderTopContent(questions[0]); // REMOVED

    // 2. Render Q1 Illus on Card 1 Front
    // 3. Render Q2 Question on Card 1 Back (The Reveal!)
    // renderCard(activeCard, 0);

    // 4. Render Q2 Illus on Card 2 Front (Underneath)
    // 5. Render Q3 Question on Card 2 Back
    if (questions.length > 1) {
        renderCard(nextCard, 1);
    }

    // Start the peep-in animation loop
    startPeepAnimation();

    // Add click scale animation to start button
    if (startBtn) {
        addClickScaleAnimation(startBtn);
    }

    // Add click scale animation to nav buttons
    const navButtons = document.querySelectorAll('.nav-icon');
    navButtons.forEach(btn => addClickScaleAnimation(btn));

    // Add click handler for replay button
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            returnToIntro();
        });
    }

    // Function to start the quiz (extracted for reuse)
    function startQuiz() {
        // Check if intro cover is visible (prevent starting if quiz is already active)
        if (!introCover || introCover.style.display === 'none') {
            return;
        }

        // Reset notepad rotation to 0 when starting quiz
        if (notepad) {
            gsap.to(notepad, {
                rotation: 0,
                duration: 0.4,
                ease: "power2.out"
            });
        }

        // Reset state variables when starting quiz
        currentQuestionIndex = 0;
        hasAnsweredCurrentQuestion = false;
        isFlipping = false;
        userAnswers = []; // Clear answer history
        card1RevealTriggered = false; // Reset reveal state

        // Hide snowfall animation
        hideSnowfall();

        // Ensure topContent has the correct structure before starting
        if (topContent) {
            const questionSection = topContent.querySelector('.question-section');
            if (!questionSection) {
                // Restore question-section if missing
                topContent.innerHTML = `
                    <div class="question-section">
                        <!-- Carousel Indicator -->
                        <div class="carousel-indicator flex items-center justify-center gap-2 mb-6 opacity-0">
                            <div class="carousel-dots flex items-center gap-2 relative">
                                <!-- Dots will be dynamically generated -->
                            </div>
                        </div>
                        <h2 class="question-text text-center mb-5 opacity-0 text-xl/7 font-medium mt-4">Loading...</h2>
                        <div class="options-container flex flex-col gap-3"></div>
                    </div>
                `;
            }
        }

        // Ensure cards are cleared and reset
        clearCard(activeCard);
        clearCard(nextCard);
        gsap.set(activeCard, { rotationX: 0, zIndex: 3 });
        gsap.set(nextCard, { rotationX: 0, zIndex: 2 });

        // Show brand logo with subtle entry animation
        const brandLogo = document.getElementById('brand-logo');
        if (brandLogo) {
            // Reset initial state
            gsap.set(brandLogo, {
                opacity: 0,
                y: -20
            });
            // Animate in with fade + slide down
            gsap.to(brandLogo, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                delay: 0.2 // Slight delay for smoother entry
            });
        }

        // Stop the peep animation
        if (peepTimeline) peepTimeline.kill();
        gsap.to(introCover, { rotationX: 0, duration: 0.3 }); // Reset to flat before flip

        // Hide intro content below
        if (introContentBelow) {
            gsap.to(introContentBelow, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    introContentBelow.style.display = 'none';
                }
            });
        }

        // Render first question on the back of intro cover
        renderIntroBack(questions[0]);

        // Lock intro cover height to current value BEFORE notepad expands
        // This prevents height from changing during notepad expansion
        const currentHeight = introCover.offsetHeight;

        // Get current computed top position
        const computedStyle = window.getComputedStyle(introCover);
        const currentTop = computedStyle.top;

        // Lock height and current position to prevent CSS from jumping
        gsap.set(introCover, {
            height: currentHeight + 'px',
            top: currentTop // Use computed value to maintain current position
        });

        // Expand notepad height to full size
        if (notepad) {
            notepad.classList.add('expanded');
        }
        if (stage) {
            stage.classList.add('expanded');
        }

        // Animate intro cover moving down smoothly (no elastic effect)
        // Height is already locked, only animate position
        // Use a small delay to ensure notepad expansion has started
        gsap.to(introCover, {
            top: '50%',
            duration: 0.4,
            ease: 'power2.out', // Smooth, no elastic bounce
            delay: 0.01 // Tiny delay to ensure GSAP takes control before CSS
        });

        // Wait for intro cover animation to complete (0.6s) before starting flip
        setTimeout(() => {
            // Show the bottom-half immediately as flip starts
            gsap.set('.bottom-half', { opacity: 1 });

            // Play page flip sound with a slight delay
            setTimeout(() => {
                pageFlipAudio.currentTime = 0; // Reset to start
                if (!document.hidden) pageFlipAudio.play().catch(() => { }); // Play sound
            }, 400); // 400ms delay

            // Animate Intro Cover Flip
            gsap.to(introCover, {
                duration: 0.8, // Reduced from 1.2s
                rotationX: 180,
                transformOrigin: "top center",
                ease: "power2.inOut",
                onComplete: () => {
                    introCover.style.display = 'none'; // Remove immediately

                    // Show the top-half and copy content from intro back
                    gsap.to('.top-half', { opacity: 1, duration: 0 });

                    // Ensure topContent has correct structure before rendering
                    if (topContent) {
                        const questionSection = topContent.querySelector('.question-section');
                        if (!questionSection) {
                            topContent.innerHTML = `
                            <div class="question-section">
                                <!-- Carousel Indicator -->
                                <div class="carousel-indicator flex items-center justify-center gap-2 mb-6 opacity-0">
                                    <div class="carousel-dots flex items-center gap-2 relative">
                                        <!-- Dots will be dynamically generated -->
                                    </div>
                                </div>
                                <h2 class="question-text text-center mb-5 opacity-0 text-xl/7 font-medium mt-4">Loading...</h2>
                                <div class="options-container flex flex-col gap-3"></div>
                            </div>
                        `;
                        }
                    }

                    // Clear activeCard first to remove any outro content
                    clearCard(activeCard);

                    // Render and animate the first question
                    renderTopContent(questions[0]);

                    // Render Q1 on activeCard
                    renderCard(activeCard, 0);

                    // Prepare nextCard with Q2 if it exists
                    if (questions.length > 1) {
                        clearCard(nextCard);
                        renderCard(nextCard, 1);
                    }

                    // Enable swipe back gesture on top half
                    enableTopHalfSwipeBack();
                }
            });
        }, 800); // Wait for 0.8s (matching CSS transition duration)
    }

    // Add click handler to start button
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling to intro cover
        startQuiz();
    });

    // Add click and swipe handlers to intro cover
    if (introCover) {
        // Click handler
        introCover.addEventListener('click', (e) => {
            // Don't trigger if clicking on the start button
            if (e.target.closest('#start-btn')) {
                return;
            }
            startQuiz();
        });

        // Touch/swipe handlers
        let touchStartY = 0;
        let touchStartTime = 0;

        introCover.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        introCover.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();
            const swipeDistance = Math.abs(touchStartY - touchEndY);
            const touchDuration = touchEndTime - touchStartTime;

            // If it's a tap (small movement) or a swipe (any direction), start quiz
            if (swipeDistance < 50 || touchDuration < 300) {
                e.preventDefault();
                startQuiz();
            }
        }, { passive: false });
    }
}

// Render question on intro back
function renderIntroBack(qData) {
    const backContent = document.getElementById('intro-back-content');
    backContent.querySelector('.question-text').innerHTML = qData.text;

    const optsContainer = backContent.querySelector('.options-container');
    optsContainer.innerHTML = '';

    qData.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn', 'py-4', 'px-4', 'rounded-full', 'text-base/5', 'font-bold', 'opacity-0');
        btn.innerText = opt;
        // Don't override opacity - let it stay 0 so it's hidden on the back
        optsContainer.appendChild(btn);
    });

    // Apply foreground color to the intro-back-content container
    if (qData.foreroundColor) {
        gsap.to(backContent, {
            backgroundColor: qData.foreroundColor,
            duration: 0.6,
            ease: "power2.out"
        });
    }
}

// New function to animate the visible top content
function animateTopContent() {
    const indicator = topContent.querySelector('.carousel-indicator');
    const questionEl = topContent.querySelector('.question-text');
    const buttons = topContent.querySelectorAll('.option-btn');

    // Animate carousel indicator
    if (indicator) {
        gsap.fromTo(indicator,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
    }

    // Animate question text - faster and snappier
    gsap.fromTo(questionEl,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", delay: 0.1 }
    );

    // Staggered animation for buttons - faster stagger
    buttons.forEach((btn, i) => {
        gsap.fromTo(btn,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.25, delay: 0.1 + (i * 0.05), ease: "power2.out" }
        );
    });

    // Enable gesture zone after options appear (so user can try to swipe and get vibration feedback)
    // But don't show the hint yet - that happens after answering
    setTimeout(() => {
        enableFlipInteraction(false); // false = don't show hint
    }, 300);
}

// Function to update carousel indicator
function updateCarouselIndicator() {
    const indicator = topContent?.querySelector('.carousel-indicator');
    const dotsContainer = indicator?.querySelector('.carousel-dots');

    if (!indicator || !dotsContainer) return;

    const totalQuestions = questions.length;
    const totalPages = totalQuestions + 1; // Questions + outro
    const isOutroState = currentQuestionIndex >= totalQuestions;

    // Determine current page number (1-based)
    let currentPage;
    if (isOutroState) {
        currentPage = totalPages; // Outro is the last page
    } else {
        currentPage = currentQuestionIndex + 1; // Current question (1-based)
    }

    // Clear existing dots
    dotsContainer.innerHTML = '';

    // Calculate which dots to show (up to 2 on each side of active)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    // Create dots only for visible range
    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');

        // Calculate distance from active page
        const distance = Math.abs(pageNumber - currentPage);

        if (pageNumber === currentPage) {
            // Active dot
            dot.classList.add('active');
            dot.setAttribute('data-progress', `${currentPage}/${totalPages}`);
        } else if (distance === 2) {
            // Second dot from active - smaller and lower opacity
            dot.classList.add('secondary');
        }
        // distance === 1 dots remain default size and opacity

        dotsContainer.appendChild(dot);
    }
}

function renderTopContent(qData) {
    // New question (or outro) is being rendered; reset answered flag for questions
    if (qData) {
        hasAnsweredCurrentQuestion = false;
    }

    if (!qData) {
        // Note: outro-top.png is set in flipPage's onComplete callback after flip finishes
        // outro-bottom.png is set on nextCard before flip, and on activeCard in renderCard

        // Change body background color for outro state
        gsap.to(document.body, {
            backgroundColor: outroData.backgroundColor,
            duration: 0.6,
            ease: "power2.out"
        });

        // Show replay button in navbar
        if (replayBtn) {
            gsap.to(replayBtn, {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
                onStart: () => {
                    replayBtn.style.pointerEvents = 'auto';
                }
            });
        }

        // Show landing page and enable scrolling
        const landingPage = document.getElementById('landing-page');
        if (landingPage) {
            landingPage.classList.remove('hidden');
            gsap.fromTo(landingPage,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: "power2.out" }
            );

            // Show scroll indicator after landing page animates in
            const scrollIndicator = document.getElementById('landing-scroll-indicator');
            if (scrollIndicator) {
                gsap.to(scrollIndicator, {
                    opacity: 1,
                    duration: 0.5,
                    delay: 0.8,
                    ease: "power2.out"
                });

                // Hide scroll indicator on first scroll
                let scrollIndicatorHidden = false;
                const hideScrollIndicator = () => {
                    if (scrollIndicatorHidden) return;
                    scrollIndicatorHidden = true;

                    gsap.to(scrollIndicator, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });

                    // Remove all listeners
                    window.removeEventListener('scroll', hideScrollIndicator);
                    document.removeEventListener('scroll', hideScrollIndicator);
                    document.removeEventListener('touchmove', hideScrollIndicator);
                    document.removeEventListener('touchstart', hideOnTouchStart);
                };

                // Touch start handler - hide if user scrolls down
                const hideOnTouchStart = (e) => {
                    // Small delay to detect scroll intent
                    setTimeout(() => {
                        if (window.scrollY > 10 || document.documentElement.scrollTop > 10) {
                            hideScrollIndicator();
                        }
                    }, 100);
                };

                // Add multiple listeners for iOS compatibility
                window.addEventListener('scroll', hideScrollIndicator, { passive: true });
                document.addEventListener('scroll', hideScrollIndicator, { passive: true });
                document.addEventListener('touchmove', hideScrollIndicator, { passive: true });
                document.addEventListener('touchstart', hideOnTouchStart, { passive: true });

                // Also hide after a short delay if user has scrolled at all
                setTimeout(() => {
                    if (window.scrollY > 10 || document.documentElement.scrollTop > 10) {
                        hideScrollIndicator();
                    }
                }, 2000);
            }
        }

        // Make stage scrollable
        if (stage) {
            stage.style.overflow = 'visible';
            stage.style.minHeight = 'auto';
            stage.classList.add('outro-scrollable');
        }

        // Add background to navbar for outro
        const topNav = document.querySelector('.top-nav');
        if (topNav) {
            topNav.classList.add('outro-active');
        }

        // Enable body scroll
        document.body.style.overflow = 'auto';
        document.body.style.overflowX = 'hidden';

        // Use custom HTML template for top half outro
        const outroTopTemplate = document.getElementById('outro-top-template');
        if (outroTopTemplate) {
            // Clone the template content (the inner div)
            const templateContent = outroTopTemplate.querySelector('.outro-top-content');
            if (templateContent) {
                const outroTopContent = templateContent.cloneNode(true);

                // Update dynamic content from payment personality
                const titleEl = outroTopContent.querySelector('.outro-top-title');
                const messageEl = outroTopContent.querySelector('.outro-top-message');
                // Use calculated personality or fallback to outroData
                const personality = userPersonality || { title: outroData.title, message: outroData.message };
                if (titleEl) titleEl.textContent = personality.title;
                if (messageEl) messageEl.textContent = personality.message;

                // Clear existing content and insert template
                const questionSection = topContent.querySelector('.question-section');
                if (questionSection) {
                    // Preserve the carousel indicator structure
                    const existingIndicator = questionSection.querySelector('.carousel-indicator');

                    questionSection.innerHTML = '';

                    // Re-add the carousel indicator if it existed
                    if (existingIndicator) {
                        questionSection.appendChild(existingIndicator);
                    } else {
                        // Create indicator structure if it doesn't exist
                        const indicatorDiv = document.createElement('div');
                        indicatorDiv.className = 'carousel-indicator flex items-center justify-center gap-2 mb-6 opacity-0';
                        indicatorDiv.innerHTML = '<div class="carousel-dots flex items-center gap-2 relative"></div>';
                        questionSection.appendChild(indicatorDiv);
                    }

                    questionSection.appendChild(outroTopContent);

                    // Update carousel indicator for outro (after structure is in place)
                    updateCarouselIndicator();

                    // Animate elements with staggered entry
                    const p1 = outroTopContent.querySelector('p:first-of-type');
                    const h2 = outroTopContent.querySelector('h2');
                    const p2 = outroTopContent.querySelector('p:last-of-type');

                    // Set initial state for all elements
                    gsap.set([p1, h2, p2], {
                        opacity: 0,
                        y: 20
                    });

                    // Animate carousel indicator
                    const indicator = questionSection.querySelector('.carousel-indicator');
                    if (indicator) {
                        gsap.fromTo(indicator,
                            { opacity: 0, y: -10 },
                            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
                        );
                    }

                    // Staggered animation
                    const tl = gsap.timeline();
                    tl.to(p1, {
                        opacity: 1,
                        y: 0,
                        duration: 0.4,
                        ease: "power2.out"
                    })
                        .to(h2, {
                            opacity: 1,
                            y: 0,
                            duration: 0.4,
                            ease: "power2.out"
                        }, "-=0.3")
                        .to(p2, {
                            opacity: 1,
                            y: 0,
                            duration: 0.4,
                            ease: "power2.out"
                        }, "-=0.3");
                }
            }
        } else {
            // Fallback to old method if template doesn't exist
            topContent.querySelector('.question-text').innerText = "That's a wrap!";
            topContent.querySelector('.options-container').innerHTML = "<p class='text-center mt-5'>See you in 2026!</p>";
        }
        return;
    }

    // Update carousel indicator
    updateCarouselIndicator();

    const questionEl = topContent.querySelector('.question-text');
    if (!questionEl) {
        console.error('question-text element not found in topContent!');
        return;
    }
    questionEl.innerHTML = qData.text;

    const optsContainer = topContent.querySelector('.options-container');
    if (!optsContainer) {
        console.error('options-container element not found in topContent!');
        return;
    }
    optsContainer.innerHTML = '';

    qData.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn', 'py-4', 'px-4', 'rounded-full', 'text-base/5', 'font-bold', 'opacity-0');
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(i, btn, qData);
        addClickScaleAnimation(btn); // Add scale animation
        optsContainer.appendChild(btn);
    });

    // Apply background color from question data
    if (qData.backgroundColor) {
        gsap.to(document.body, {
            backgroundColor: qData.backgroundColor,
            duration: 0.6,
            ease: "power2.out"
        });
    }

    // Apply foreground color to the content-container
    // Use gsap.set (instant) since color was already set before flip started
    if (qData.foreroundColor && topContent) {
        gsap.set(topContent, {
            backgroundColor: qData.foreroundColor
        });
    }

    // Trigger animation after content is rendered
    animateTopContent();

    // Disable gesture zone until question is answered and trivia is shown
    const gestureZone = document.getElementById('gesture-zone');
    if (gestureZone) {
        gestureZone.style.pointerEvents = 'none';
    }
}

// Function to clear/reset a card's content (used when card becomes hidden)
function clearCard(cardElement) {
    if (!cardElement) return;

    // Clear illustration placeholder - remove any outro template content
    const illustrationPlaceholder = cardElement.querySelector('.illustration-placeholder');
    if (illustrationPlaceholder) {
        // Remove any outro template that might be there
        const outroContent = illustrationPlaceholder.querySelector('.outro-content');
        if (outroContent) {
            outroContent.remove();
        }
        // Clear background image
        illustrationPlaceholder.style.backgroundImage = '';
        illustrationPlaceholder.style.backgroundSize = '';
        illustrationPlaceholder.style.backgroundPosition = '';
        illustrationPlaceholder.style.backgroundRepeat = '';
        illustrationPlaceholder.innerHTML = '';
    }

    // Clear trivia text
    const triviaTextEl = cardElement.querySelector('.trivia-text');
    if (triviaTextEl) {
        triviaTextEl.innerText = '';
        triviaTextEl.innerHTML = '';
    }

    // Clear back content (question)
    const backContainer = cardElement.querySelector('.back-content');
    if (backContainer) {
        const questionText = backContainer.querySelector('.question-text');
        const optionsContainer = backContainer.querySelector('.options-container');
        if (questionText) questionText.innerText = '';
        if (optionsContainer) optionsContainer.innerHTML = '';
    }

}

// New function to render both Front (Illus) and Back (Next Q) of a card
function renderCard(cardElement, index) {
    // Handle outro case (index >= questions.length)
    const qData = (index < questions.length) ? questions[index] : null;
    const nextQData = (index + 1 < questions.length) ? questions[index + 1] : null;

    const cardId = cardElement?.id || 'unknown';
    const isActiveCard = (cardElement === activeCard);
    const activeCardId = activeCard?.id || 'unknown';

    // CRITICAL: Never render outro on activeCard if we're still on a valid question
    // This is the MOST IMPORTANT guard - it prevents 🎉 from appearing on Q3
    if (index >= questions.length) {
        // Trying to render outro
        if (isActiveCard || cardId === activeCardId) {
            // This is the activeCard (check both reference and ID)
            if (currentQuestionIndex < questions.length) {
                console.error(`🚫 BLOCKED: Attempted to render outro on activeCard (${cardId}) while currentQuestionIndex (${currentQuestionIndex}) < questions.length (${questions.length})`);
                console.error('This would overwrite a valid question illustration with 🎉. BLOCKING COMPLETELY!');
                return; // Don't render outro on activeCard when we're still on a valid question
            } else {
            }
        }
    }

    // Front: Illustration & Trivia
    const illustrationPlaceholder = cardElement.querySelector('.illustration-placeholder');
    if (!illustrationPlaceholder) {
        console.error('illustration-placeholder not found!');
        return;
    }

    if (qData) {
        if (isActiveCard && index !== currentQuestionIndex) {
            console.error(`🚨 CRITICAL ERROR: Rendering index ${index} on activeCard, but currentQuestionIndex is ${currentQuestionIndex}!`);
        }

        // FORCE CLEAR any emoji or existing content
        illustrationPlaceholder.innerHTML = '';

        // Remove any existing img elements
        const existingImg = illustrationPlaceholder.querySelector('img');
        if (existingImg) {
            existingImg.remove();
        }

        // Set illustration as background image with cover sizing
        illustrationPlaceholder.style.backgroundImage = `url(${qData.illustration})`;
        illustrationPlaceholder.style.backgroundSize = 'cover';
        illustrationPlaceholder.style.backgroundPosition = 'center top';
        illustrationPlaceholder.style.backgroundRepeat = 'no-repeat';

        // Card 1 special: Add currency note overlay with floating animation
        // Check by illustration path since IDs are now dynamic
        if (qData.illustration === 'assets/illustration1.png') {
            // Create container for centered overlays
            const overlayContainer = document.createElement('div');
            overlayContainer.className = 'card-overlay-container';
            overlayContainer.id = 'card1-overlay-container';

            // Create currency note overlay
            const currencyNote = document.createElement('img');
            currencyNote.src = 'assets/currency-note.png';
            currencyNote.className = 'currency-note-overlay';
            currencyNote.id = 'card1-currency-note';
            currencyNote.style.cssText = 'width: 80%; max-width: 280px;';
            overlayContainer.appendChild(currencyNote);

            // Set initial state for entrance animation (hidden and translated down)
            gsap.set(overlayContainer, { opacity: 0, y: 20 });

            illustrationPlaceholder.appendChild(overlayContainer);

            // Animate currency note entrance (slide up with fade)
            gsap.to(overlayContainer, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: 0.2,
                ease: "power2.out"
            });

            // Create hidden product/vehicle overlay (will be shown after answer)
            const revealImage = getCard1RevealImage(userTotalSpends, userSegment);
            if (revealImage) {
                const productContainer = document.createElement('div');
                productContainer.className = 'card-overlay-container';
                productContainer.id = 'card1-product-container';
                productContainer.style.opacity = '0';

                const productOverlay = document.createElement('img');
                productOverlay.src = revealImage;
                productOverlay.className = 'product-overlay';
                productOverlay.id = 'card1-product-reveal';
                productOverlay.style.cssText = 'width: 100%;';
                productContainer.appendChild(productOverlay);

                illustrationPlaceholder.appendChild(productContainer);
            }
        }

        // Card 2 special: Smartphone with floating bubbles
        if (qData.illustration === 'assets/illustration2.png') {
            // Create container for smartphone and bubbles
            const card2Container = document.createElement('div');
            card2Container.className = 'card-overlay-container';
            card2Container.id = 'card2-overlay-container';
            // Set initial hidden state in inline styles to prevent flash
            card2Container.style.cssText = 'flex-direction: column; opacity: 0; transform: translateY(30px);';

            // Create smartphone
            const smartphone = document.createElement('img');
            smartphone.src = 'assets/smartphone.png';
            smartphone.className = 'smartphone-overlay';
            smartphone.id = 'card2-smartphone';
            smartphone.style.cssText = 'width: 100%;';
            card2Container.appendChild(smartphone);

            illustrationPlaceholder.appendChild(card2Container);

            // Create bubbles (initially hidden)
            const bubblePositions = [
                { x: '-140px', y: '-30px' },   // Top-left
                { x: '80px', y: '-70px' },    // Top-right
                { x: '-110px', y: '60px' },    // Bottom-left
                { x: '65px', y: '50px' }      // Bottom-right
            ];

            bubblePositions.forEach((pos, index) => {
                const bubble = document.createElement('img');
                bubble.src = `assets/bubble${index + 1}.png`;
                bubble.className = `bubble-overlay bubble-${index + 1}`;
                bubble.id = `card2-bubble-${index + 1}`;
                // Set initial hidden state in inline styles to prevent flash
                bubble.style.cssText = `width: 56px; height: 56px; left: calc(50% + ${pos.x}); top: calc(50% + ${pos.y}); opacity: 0; transform: scale(0);`;
                illustrationPlaceholder.appendChild(bubble);
            });
        }

        // Card 3 special: Fist bump with hearts
        if (qData.illustration === 'assets/illustration6.png') {
            // Create container for fist bump
            const card3Container = document.createElement('div');
            card3Container.className = 'card-overlay-container fist-bump-container';
            card3Container.id = 'card3-overlay-container';

            // Create left hand (green sleeve) - positioned offset initially to prevent overlap
            const leftHand = document.createElement('img');
            leftHand.src = 'assets/l-hand.png';
            leftHand.className = 'fist-hand fist-hand-left';
            leftHand.id = 'card3-left-hand';
            leftHand.style.transform = 'translateX(-70px)'; // Initial offset
            card3Container.appendChild(leftHand);

            // Create right hand (blue sleeve) - positioned offset initially to prevent overlap
            const rightHand = document.createElement('img');
            rightHand.src = 'assets/r-hand.png';
            rightHand.className = 'fist-hand fist-hand-right';
            rightHand.id = 'card3-right-hand';
            rightHand.style.transform = 'translateX(70px)'; // Initial offset
            card3Container.appendChild(rightHand);

            illustrationPlaceholder.appendChild(card3Container);

            // Start fist bump animation immediately
            setTimeout(() => startFistBumpAnimation(), 300);
        }

        // Card 4 special: Calendar with checkmark reveal
        if (qData.illustration === 'assets/illustration3.png') {
            // Create container for calendar
            const card4Container = document.createElement('div');
            card4Container.className = 'card-overlay-container';
            card4Container.id = 'card4-overlay-container';
            // Set initial hidden state for entrance animation
            card4Container.style.cssText = 'opacity: 0; transform: translateY(15px);';

            // Create calendar image
            const calendar = document.createElement('img');
            calendar.src = 'assets/calendar.png';
            calendar.className = 'calendar-overlay';
            calendar.id = 'card4-calendar';
            calendar.style.cssText = 'width: 43%; max-width: 220px; margin-top: 80px;';
            card4Container.appendChild(calendar);

            // Create checkmark overlay (initially hidden via clip-path in CSS)
            const tick = document.createElement('img');
            tick.src = 'assets/calendar-tick.png';
            tick.className = 'calendar-tick-overlay';
            tick.id = 'card4-tick';
            tick.style.cssText = 'width: 20%; max-width: 220px; position: absolute; margin-top: 90px;';
            card4Container.appendChild(tick);

            illustrationPlaceholder.appendChild(card4Container);
        }

        // Card 5 special: Chai glass with steam
        if (qData.illustration === 'assets/illustration5.png') {
            // Create container for chai
            const card5Container = document.createElement('div');
            card5Container.className = 'card-overlay-container';
            card5Container.id = 'card5-overlay-container';
            // Set initial hidden state for entrance animation
            card5Container.style.cssText = 'opacity: 0; transform: translateY(30px);';

            // Create chai glass image
            const chai = document.createElement('img');
            chai.src = 'assets/chai.png';
            chai.className = 'chai-overlay';
            chai.id = 'card5-chai';
            chai.style.cssText = '180px; margin-top: 40px;';
            card5Container.appendChild(chai);

            illustrationPlaceholder.appendChild(card5Container);
            // Note: Steam elements are created dynamically after entrance animation
        }
        // Set trivia text - FORCE update
        const triviaTextEl = cardElement.querySelector('.trivia-text');
        if (triviaTextEl) {
            // Clear any existing trivia-word spans first
            triviaTextEl.innerHTML = '';
            triviaTextEl.innerText = qData.trivia; // Set the trivia from qData
            gsap.set(triviaTextEl, { opacity: 0 });
        } else {
            console.error('trivia-text element not found!');
        }

        // Clear any trivia-word elements that might be in the container
        const triviaWords = cardElement.querySelectorAll('.trivia-word');
        if (triviaWords.length > 0) {
            triviaWords.forEach(word => word.remove());
        }
    } else {
        // Outro case - but DOUBLE CHECK we're not rendering on activeCard when we shouldn't
        if (isActiveCard && currentQuestionIndex < questions.length) {
            console.error(`CRITICAL ERROR: Attempted to render outro on activeCard (${cardId}) when currentQuestionIndex (${currentQuestionIndex}) < questions.length (${questions.length})`);
            console.error('This should NEVER happen! Blocking outro render on activeCard.');
            return; // BLOCK the render completely
        }

        // Outro Front - use custom HTML template from HTML file
        const outroTemplate = document.getElementById('outro-template');
        if (outroTemplate) {
            // Set outro-bottom.png background image on illustration-placeholder
            illustrationPlaceholder.style.backgroundImage = 'url(assets/outro-bottom.png)';
            illustrationPlaceholder.style.backgroundSize = 'cover';
            illustrationPlaceholder.style.backgroundPosition = 'center top';
            illustrationPlaceholder.style.backgroundRepeat = 'no-repeat';

            // Clone the template
            const outroContent = outroTemplate.cloneNode(true);
            outroContent.style.display = 'block';
            outroContent.id = ''; // Remove ID from clone

            // Replace illustration placeholder with custom outro content
            // This clears any existing images, so we don't need to hide them separately
            illustrationPlaceholder.innerHTML = '';
            illustrationPlaceholder.appendChild(outroContent);

            // Set emoji sprite if there's an outro-emoji element
            const outroEmojiEl = outroContent.querySelector('.outro-emoji .emoji-sprite');
            if (outroEmojiEl) {
                const outroSprite = createEmojiSprite('🎉', '76px');
                outroEmojiEl.parentNode.replaceChild(outroSprite, outroEmojiEl);
            }

            // Note: We don't hide images here anymore since we cleared innerHTML
            // The image inside outroContent will be visible

            // Clear trivia text
            const triviaTextEl = cardElement.querySelector('.trivia-text');
            if (triviaTextEl) {
                triviaTextEl.innerText = '';
            }

            // Animate outro content with staggered entry
            const outroMessage = outroContent.querySelector('.outro-message');
            const outroShareBtn = outroContent.querySelector('.outro-share-btn');

            // Set initial state for message
            if (outroMessage) {
                gsap.set(outroMessage, {
                    opacity: 0,
                    y: 20
                });
            }

            // Set initial state for share button
            if (outroShareBtn) {
                gsap.set(outroShareBtn, {
                    opacity: 0,
                    y: 20
                });
                // Add click scale animation
                addClickScaleAnimation(outroShareBtn);
                // Add share click handler
                outroShareBtn.addEventListener('click', handleShare);
            }

            // Staggered animation
            const tl = gsap.timeline({ delay: 0.2 }); // Small delay after card appears
            if (outroMessage) {
                tl.to(outroMessage, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    ease: "power2.out"
                });
            }
            if (outroShareBtn) {
                tl.to(outroShareBtn, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    ease: "power2.out"
                }, "-=0.3"); // Start slightly before previous element finishes
            }
        } else {
            // Fallback to old method if template doesn't exist
            illustrationPlaceholder.innerHTML = '';
            const outroSprite = createEmojiSprite('🎉', '76px');
            illustrationPlaceholder.appendChild(outroSprite);
            // Clear background image for outro
            illustrationPlaceholder.style.backgroundImage = '';
            illustrationPlaceholder.style.backgroundSize = '';
            illustrationPlaceholder.style.backgroundPosition = '';
            illustrationPlaceholder.style.backgroundRepeat = '';
            const triviaTextEl = cardElement.querySelector('.trivia-text');
            if (triviaTextEl) {
                triviaTextEl.innerText = '';
            }
        }
    }

    // Back: Next Question
    const backContainer = cardElement.querySelector('.back-content');
    if (nextQData && backContainer) {
        const questionTextEl = backContainer.querySelector('.question-text');
        if (questionTextEl) {
            questionTextEl.innerHTML = nextQData.text;
        }
        const optsContainer = backContainer.querySelector('.options-container');
        if (optsContainer) {
            optsContainer.innerHTML = '';
            nextQData.options.forEach((opt) => {
                const btn = document.createElement('button');
                btn.classList.add('option-btn', 'py-4', 'px-4', 'rounded-full', 'text-base/5', 'font-bold', 'opacity-0');
                btn.innerText = opt;
                // No click handler needed on the back face, it's just visual during flip
                optsContainer.appendChild(btn);
            });
        }

        // Apply foreground color to the .card-back div
        const cardBack = cardElement.querySelector('.card-back');
        if (cardBack && nextQData.foreroundColor) {
            gsap.to(cardBack, {
                backgroundColor: nextQData.foreroundColor,
                duration: 0.6,
                ease: "power2.out"
            });
        }
    } else {
        // Outro Back - no next question yet, clear content
        if (backContainer) {
            backContainer.innerHTML = '';
        }
        // Do not set wrap text here; outro will be shown on separate card after last flip
    }
}

function handleAnswer(selectedIndex, btnElement, questionData) {
    // Ignore taps while flipping or if this question has already been answered
    if (isFlipping || hasAnsweredCurrentQuestion) return;
    hasAnsweredCurrentQuestion = true;

    const isCorrect = selectedIndex === questionData.correctIndex;

    // Store the user's answer for this question (for back navigation)
    userAnswers[currentQuestionIndex] = {
        selectedIndex: selectedIndex,
        isCorrect: isCorrect
    };

    const correctMessages = [
        { text: "Spot on!", emoji: "🎯" },
        { text: "Nailed it!", emoji: "😎" },
        { text: "You got it!", emoji: "🌟" },
        { text: "Correct!", emoji: "✅" },
        { text: "Awesome!", emoji: "🚀" }
    ];
    const wrongMessages = [
        { text: "Not quite!", emoji: "😅" },
        { text: "Oops!", emoji: "🙊" },
        { text: "Close one!", emoji: "🤏" },
        { text: "Missed it!", emoji: "❌" },
        { text: "Almost!", emoji: "😬" }
    ];

    if (isCorrect) {
        btnElement.classList.add('correct');
        const randomMsg = correctMessages[Math.floor(Math.random() * correctMessages.length)];
        validationOverlay.querySelector('h3').innerText = randomMsg.text;
        // Replace emoji text with sprite
        const targetIcon = validationOverlay.querySelector('.target-icon');
        targetIcon.innerHTML = ''; // Clear any existing content
        targetIcon.appendChild(createEmojiSprite(randomMsg.emoji, '76px'));
        // Play correct answer sound
        playAnswerSound(true);
    } else {
        btnElement.classList.add('wrong');
        const randomMsg = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
        validationOverlay.querySelector('h3').innerText = randomMsg.text;
        // Replace emoji text with sprite
        const targetIcon = validationOverlay.querySelector('.target-icon');
        targetIcon.innerHTML = ''; // Clear any existing content
        targetIcon.appendChild(createEmojiSprite(randomMsg.emoji, '76px'));
        const allBtns = topContent.querySelectorAll('.option-btn');
        if (allBtns[questionData.correctIndex]) {
            allBtns[questionData.correctIndex].classList.add('correct');
        }
        // Play wrong answer sound
        playAnswerSound(false);
    }

    // After answering once, disable all option buttons for this question
    const optionButtons = topContent.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
    });

    // Disable gesture zone when answering to prevent swiping during validation/trivia
    const gestureZone = document.getElementById('gesture-zone');
    if (gestureZone) {
        gestureZone.style.pointerEvents = 'none';
    }

    showValidationOverlay(() => {
        // Card 1 special animation: Transition currency note to product/vehicle
        // Check by illustration since card order may change if cards are skipped
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion && currentQuestion.illustration === 'assets/illustration1.png' && userSegment !== 'inactive') {
            triggerCard1RevealAnimation();
        }
        showTriviaAndEnableFlip();
    });
}

function showTriviaAndEnableFlip() {
    const triviaEl = activeCard.querySelector('.trivia-text');

    if (!triviaEl) return;

    // Ensure gesture zone is disabled at the start of trivia display
    const gestureZone = document.getElementById('gesture-zone');
    if (gestureZone) {
        gestureZone.style.pointerEvents = 'none';
    }

    // Get trivia text - it should already be set from renderCard
    let triviaText = triviaEl.innerText || triviaEl.textContent;

    // If trivia text is not set, get it from the current question
    if (!triviaText || !triviaText.trim()) {
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion && currentQuestion.trivia) {
            triviaText = currentQuestion.trivia;
            triviaEl.innerText = triviaText;
        }
    }

    // Make sure trivia element is visible (remove opacity-0 class if present)
    triviaEl.classList.remove('opacity-0');
    gsap.set(triviaEl, { opacity: 1 }); // Make parent visible

    if (triviaText && triviaText.trim()) {
        // Split trivia into words and create staggered animation
        const words = triviaText.trim().split(' ');
        triviaEl.innerHTML = words.map((word, i) =>
            `<span class="trivia-word" style="opacity: 0; display: inline-block; font-weight: 600;">${word}</span>`
        ).join(' ');

        // Animate words with stagger
        const triviaWords = triviaEl.querySelectorAll('.trivia-word');
        if (triviaWords.length > 0) {
            // Set initial state
            gsap.set(triviaWords, { opacity: 0, y: 10 });
            // Calculate total animation duration: base duration + (number of words - 1) * stagger
            const totalDuration = 0.3 + (triviaWords.length - 1) * 0.05;

            // Animate to final state with stagger
            const triviaTimeline = gsap.to(triviaWords, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.05,
                ease: "power2.out",
                onComplete: () => {
                    // Enable gesture zone only after trivia animation completes
                    enableFlipInteraction();
                }
            });
        } else {
            // No words to animate, enable immediately
            enableFlipInteraction();
        }
    } else {
        // Fallback: simple fade-in if no text or animation fails
        gsap.to(triviaEl, {
            opacity: 1,
            duration: 0.3,
            onComplete: () => {
                // Enable gesture zone after fade-in completes
                enableFlipInteraction();
            }
        });
    }

    // Check if we're on the last question
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
        // On last question: set card-back background image to outro-top.png
        const cardBack = activeCard.querySelector('.card-back');
        if (cardBack) {
            cardBack.style.backgroundImage = 'url(assets/outro-top.png)';
            cardBack.style.backgroundSize = 'cover';
            cardBack.style.backgroundPosition = 'center bottom';
            cardBack.style.backgroundRepeat = 'no-repeat';
            gsap.set(cardBack, {
                backgroundImage: 'url(assets/outro-top.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center bottom',
                backgroundRepeat: 'no-repeat'
            });
        }

        // Force unset background-image on illustration-placeholder of nextCard
        // This is the card that will show the outro after the flip
        // Use setProperty with !important to override CSS default background-image
        const nextCardIllustrationPlaceholder = nextCard.querySelector('.illustration-placeholder');
        if (nextCardIllustrationPlaceholder) {
            nextCardIllustrationPlaceholder.style.setProperty('background-image', 'none', 'important');
            nextCardIllustrationPlaceholder.style.setProperty('background-size', 'unset', 'important');
            nextCardIllustrationPlaceholder.style.setProperty('background-position', 'unset', 'important');
            nextCardIllustrationPlaceholder.style.setProperty('background-repeat', 'unset', 'important');
        }
    } else {
        // Not last question: Set the next question's foreground color on the .card-back div
        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < questions.length) {
            const nextQData = questions[nextQuestionIndex];
            const cardBack = activeCard.querySelector('.card-back');
            if (cardBack && nextQData.foreroundColor) {
                // Set directly on style attribute to ensure it persists and overrides any CSS
                cardBack.style.backgroundColor = nextQData.foreroundColor;
                // Also set with GSAP to ensure it's tracked
                gsap.set(cardBack, {
                    backgroundColor: nextQData.foreroundColor
                });
            }
        }
    }

    // Note: enableFlipInteraction() is now called in the onComplete callback of the trivia animation
    // This ensures the gesture zone is only enabled after trivia finishes displaying
}

// Card 1 animation: Transition from currency note to product/vehicle
function triggerCard1RevealAnimation() {
    const overlayContainer = document.getElementById('card1-overlay-container');
    const productContainer = document.getElementById('card1-product-container');

    if (!overlayContainer) return;

    // Mark that the reveal animation has been triggered (for back navigation)
    card1RevealTriggered = true;

    // Sequential animation: fade out currency note container, then fade in product container
    const tl = gsap.timeline();

    // Fade out currency note container
    tl.to(overlayContainer, {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
            overlayContainer.style.display = 'none';
        }
    });

    // Fade in product/vehicle container (if exists - not for inactive users)
    if (productContainer) {
        tl.to(productContainer, {
            opacity: 1,
            duration: 0.5,
            ease: "power2.out"
        });
    }
}

// Fist bump animation timeline (stored so it can be stopped)
let fistBumpTimeline = null;

// Start the repeating fist bump animation with hearts
function startFistBumpAnimation() {
    const container = document.getElementById('card3-overlay-container');
    const leftHand = document.getElementById('card3-left-hand');
    const rightHand = document.getElementById('card3-right-hand');

    if (!container || !leftHand || !rightHand) return;

    // Stop any existing animation
    stopFistBumpAnimation();

    // Initial positions: hands separated (larger fists need more separation)
    gsap.set(leftHand, { x: -70, y: 0 });
    gsap.set(rightHand, { x: 70, y: 0 });

    // Create repeating fist bump animation
    fistBumpTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

    // Simple fist bump sequence: come in → bump → go back
    fistBumpTimeline
        // 1. Both hands move toward center
        .to(leftHand, { x: -40, duration: 0.3, ease: "power2.in" }, 0)
        .to(rightHand, { x: 40, duration: 0.3, ease: "power2.in" }, 0)
        // 2. Spawn heart on bump
        .call(() => {
            spawnHeartParticle(container);
        })
        // 3. Hold briefly, then move back out
        .to(leftHand, { x: -70, duration: 0.4, ease: "power2.out" }, "+=0.3")
        .to(rightHand, { x: 70, duration: 0.4, ease: "power2.out" }, "<");
}

// Stop fist bump animation
function stopFistBumpAnimation() {
    if (fistBumpTimeline) {
        fistBumpTimeline.kill();
        fistBumpTimeline = null;
    }
}

// Legacy function name for compatibility
function startHandshakeAnimation() {
    startFistBumpAnimation();
}

function stopHandshakeAnimation() {
    stopFistBumpAnimation();
}

// Tick reveal animation interval (stored so it can be stopped)
let tickRevealInterval = null;

// Start the repeating tick reveal animation
function startTickRevealAnimation() {
    const tick = document.getElementById('card4-tick');
    if (!tick) return;

    // Stop any existing animation
    stopTickRevealAnimation();

    // Function to run the reveal animation
    const runReveal = () => {
        // Remove fade-out class and reset
        tick.classList.remove('fade-out');
        tick.classList.remove('animate-reveal');
        tick.style.clipPath = 'inset(0 100% 0 0)';
        // Force reflow to restart animation
        void tick.offsetWidth;
        tick.classList.add('animate-reveal');
    };

    // Run initial reveal after a short delay
    setTimeout(runReveal, 500);

    // Repeat every 3.5 seconds
    tickRevealInterval = setInterval(() => {
        // First fade out the tick
        tick.classList.add('fade-out');

        // After fade-out completes (0.4s), reset and reveal again
        setTimeout(() => {
            runReveal();
        }, 500);
    }, 3500);
}

// Stop tick reveal animation
function stopTickRevealAnimation() {
    if (tickRevealInterval) {
        clearInterval(tickRevealInterval);
        tickRevealInterval = null;
    }
}

// Spawn a heart particle that floats up and fades
function spawnHeartParticle(container) {
    const heart = document.createElement('img');
    heart.src = 'assets/heart.png';
    heart.className = 'heart-particle';
    heart.style.cssText = `
        width: 64px;
        height: 64px;
        left: calc(50% - 32px);
        top: calc(50% - 70px);
    `;

    container.appendChild(heart);

    // Remove heart after animation completes
    setTimeout(() => {
        heart.remove();
    }, 1000);
}

// Trigger entrance animations for the current card after flip completes
function triggerCardEntranceAnimation(questionIndex) {
    const qData = questions[questionIndex];
    if (!qData) return;

    // Card 2: Smartphone + bubbles (illustration2.png - merchant question)
    if (qData.illustration === 'assets/illustration2.png') {
        const card2Container = document.getElementById('card2-overlay-container');

        if (card2Container) {
            // Animate smartphone entrance (slide up with fade)
            gsap.to(card2Container, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: 0.2,
                ease: "power2.out"
            });
        }

        // Animate bubbles with stagger
        for (let i = 1; i <= 4; i++) {
            const bubble = document.getElementById(`card2-bubble-${i}`);
            if (bubble) {
                gsap.to(bubble, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.4,
                    delay: 0.5 + ((i - 1) * 0.15),
                    ease: "back.out(1.7)"
                });
            }
        }
    }

    // Card 3: Fist bump - animation starts immediately in renderCard (illustration6.png)

    // Card 4: Calendar with checkmark reveal (illustration3.png)
    if (qData.illustration === 'assets/illustration3.png') {
        const card4Container = document.getElementById('card4-overlay-container');
        const tick = document.getElementById('card4-tick');

        if (card4Container) {
            // Animate calendar entrance (subtle slide up with fade)
            gsap.to(card4Container, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                delay: 0.2,
                ease: "power2.out",
                onComplete: () => {
                    // Start the repeating tick reveal animation
                    startTickRevealAnimation();
                }
            });
        }
    }

    // Card 5: Chai glass with steam (illustration5.png)
    if (qData.illustration === 'assets/illustration5.png') {
        const card5Container = document.getElementById('card5-overlay-container');
        const illustrationPlaceholder = activeCard?.querySelector('.illustration-placeholder');

        if (card5Container && illustrationPlaceholder) {
            // Animate chai glass entrance (slide up with fade)
            gsap.to(card5Container, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: 0.2,
                ease: "power2.out",
                onComplete: () => {
                    // Create steam elements AFTER chai has settled
                    // Each steam has unique size, flip, rotation for variety
                    const steamConfigs = [
                        { x: '-65px', y: '-100px', width: '50px', scaleX: 1, rotate: -5 },     // Left steam - smaller, tilted left
                        { x: '-30px', y: '-100px', width: '70px', scaleX: -1, rotate: 0 },    // Center steam - larger, flipped
                        { x: '15px', y: '-100px', width: '55px', scaleX: 1, rotate: 8 }        // Right steam - medium, tilted right
                    ];

                    steamConfigs.forEach((config, index) => {
                        // Create wrapper div for flip/rotation (won't be affected by CSS animation)
                        const steamWrapper = document.createElement('div');
                        steamWrapper.style.cssText = `
                            position: absolute;
                            left: calc(50% + ${config.x});
                            top: calc(50% + ${config.y});
                            transform: scaleX(${config.scaleX}) rotate(${config.rotate}deg);
                            pointer-events: none;
                        `;
                        steamWrapper.id = `card5-steam-wrapper-${index + 1}`;

                        // Create steam image inside wrapper
                        // DON'T add steam-overlay class yet - it has the animation
                        const steam = document.createElement('img');
                        steam.src = 'assets/steam.png';
                        steam.id = `card5-steam-${index + 1}`;
                        // Set initial styles - NO opacity set, CSS animation will handle it
                        steam.style.cssText = `
                            width: ${config.width};
                            height: auto;
                            position: relative;
                            left: 0;
                            top: 0;
                            transform: scale(0.8);
                            visibility: hidden;
                        `;

                        steamWrapper.appendChild(steam);
                        illustrationPlaceholder.appendChild(steamWrapper);

                        // After staggered delay, show steam and start animation
                        // CSS animation handles the fade-in (0% opacity:0 -> 5% opacity:1)
                        setTimeout(() => {
                            steam.style.visibility = 'visible';
                            steam.classList.add('steam-overlay');
                        }, index * 800);
                    });
                }
            });
        }
    }
}

function showValidationOverlay(onComplete) {
    const content = validationOverlay.querySelector('.validation-content');
    const tl = gsap.timeline({
        onComplete: onComplete
    });

    tl.to(validationOverlay, { autoAlpha: 1, duration: 0.3 })
        .to(content, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }, "-=0.2")
        .to(content, { scale: 0.8, opacity: 0, duration: 0.3, delay: 0.4 })
        .to(validationOverlay, { autoAlpha: 0, duration: 0.3 }, "-=0.1");
}

function startPeepAnimation() {
    if (reducedMotion || document.hidden) return;
    peepTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    peepTimeline.to(introCover, {
        rotationX: 12,
        duration: 0.6,
        ease: "power2.out"
    })
        .to(introCover, {
            rotationX: 0,
            duration: 0.8,
            ease: "power2.out(1, 0.5)"
        });
}

function startBottomHalfNudge() {
    if (reducedMotion || document.hidden) return;
    // Stop any existing nudge animation
    if (bottomHalfNudgeTimeline) {
        bottomHalfNudgeTimeline.kill();
    }

    // Only animate if activeCard exists and we're not in outro state
    if (!activeCard || currentQuestionIndex >= questions.length) return;

    // Create a subtle peep-in animation using rotationX (similar to intro cover)
    bottomHalfNudgeTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    bottomHalfNudgeTimeline.to(activeCard, {
        rotationX: 12,
        duration: 0.6,
        ease: "power2.out"
    })
        .to(activeCard, {
            rotationX: 0,
            duration: 0.8,
            ease: "power2.out(1, 0.5)"
        });
}

function stopBottomHalfNudge() {
    if (bottomHalfNudgeTimeline) {
        bottomHalfNudgeTimeline.kill();
        bottomHalfNudgeTimeline = null;
    }
    // Reset rotation
    if (activeCard) {
        gsap.set(activeCard, { rotationX: 0 });
    }
}

function vibrateQuestionSection() {
    if (!notepad) {
        console.warn('vibrateQuestionSection: notepad element not found');
        return;
    }


    // Create a subtle shake/vibration animation using a timeline
    // This ensures the notepad returns to its original -2deg rotation
    const tl = gsap.timeline();
    tl.to(notepad, { rotation: -3, duration: 0.08, ease: "power2.out" })
        .to(notepad, { rotation: 1, duration: 0.08, ease: "power2.out" })
        .to(notepad, { rotation: -3, duration: 0.08, ease: "power2.out" })
        .to(notepad, { rotation: 0, duration: 0.08, ease: "power2.out" }); // Back to original
}

function flipPage() {
    if (isFlipping) {
        console.warn('flipPage called while already flipping, ignoring');
        return;
    }
    if (currentQuestionIndex >= questions.length) {
        console.warn('flipPage called but already past last question, ignoring');
        return;
    }

    // Stop the bottom half nudge animation when flip starts
    stopBottomHalfNudge();

    // Stop auto-flip timer
    stopAutoFlipTimer();

    // Stop any card-specific animations
    stopHandshakeAnimation();
    stopTickRevealAnimation();

    // If we're about to flip from the LAST question to the OUTRO,
    // start hiding the notepad::after pseudo-element right as the flip begins.
    // This makes the stacked pages slide up during the transition into the outro.
    if (currentQuestionIndex === questions.length - 1 && notepad) {
        notepad.classList.add('hide-stacked-pages');

        // Pre-set outro-bottom.png on nextCard's illustration-placeholder
        // (nextCard will become activeCard after flip and show the outro)
        const nextCardPlaceholder = nextCard?.querySelector('.illustration-placeholder');
        if (nextCardPlaceholder) {
            nextCardPlaceholder.style.backgroundImage = 'url(assets/outro-bottom.png)';
            nextCardPlaceholder.style.backgroundSize = 'cover';
            nextCardPlaceholder.style.backgroundPosition = 'center top';
            nextCardPlaceholder.style.backgroundRepeat = 'no-repeat';
        }
    }

    isFlipping = true;

    const overlay = activeCard.querySelector('.lighting-overlay');

    // Ensure it's strictly on top
    gsap.set(activeCard, { zIndex: 100 });

    // Play page flip sound with a slight delay
    setTimeout(() => {
        pageFlipAudio.currentTime = 0; // Reset to start
        if (!document.hidden) pageFlipAudio.play().catch(() => { }); // Play sound
    }, 100); // 100ms delay

    gsap.to(activeCard, {
        duration: 0.8, // Faster, snappier flip
        rotationX: 180,
        // REMOVED: This causes the scaling effect (perspective).
        ease: "power2.out", // Snappier easing
        onUpdate: function () {
            // Darken as it flips (simulating shadow)
            const progress = this.progress();
            // Peak darkness at 50% (0.5)
            const opacity = Math.sin(progress * Math.PI) * 0.3;
            if (overlay) overlay.style.opacity = opacity;
        },
        onComplete: () => {
            isFlipping = false;

            // Swap roles FIRST
            const temp = activeCard;
            activeCard = nextCard;
            nextCard = temp;


            // CRITICAL: Set z-index AFTER swap to ensure correct stacking
            // The new activeCard (which was underneath) should be on top (z-index: 3)
            gsap.set(activeCard, { zIndex: 3 });
            // Reset the flipped card (old activeCard, now nextCard) to bottom (z-index: 2)
            gsap.set(nextCard, { rotationX: 0, zIndex: 2 });

            // Clear the hidden card's content immediately to prevent stale content from showing
            // This prevents the brief flash of old content during transitions
            clearCard(nextCard);

            // Update content for the NEW active card (which was underneath)
            // It already has the Illustration for Q(i+1) on Front
            // And Question for Q(i+2) on Back

            // Update Top Half Static to match the Question we just revealed (Q(i+1))
            // Increment to the next question
            currentQuestionIndex++;

            // Handle the case where we've completed all questions
            if (currentQuestionIndex >= questions.length) {
                // All questions completed - show outro

                // Set outro-top.png background on topContent AFTER flip completes
                if (topContent) {
                    topContent.style.backgroundImage = 'url(assets/outro-top.png)';
                    topContent.style.backgroundSize = 'cover';
                    topContent.style.backgroundPosition = 'center bottom';
                    topContent.style.backgroundRepeat = 'no-repeat';
                }

                const activeCardPlaceholder = activeCard?.querySelector('.illustration-placeholder');
                if (activeCardPlaceholder) {
                    activeCardPlaceholder.style.backgroundImage = 'url(assets/outro-bottom.png)';
                    activeCardPlaceholder.style.backgroundSize = 'cover';
                    activeCardPlaceholder.style.backgroundPosition = 'center top';
                    activeCardPlaceholder.style.backgroundRepeat = 'no-repeat';
                }

                renderTopContent(null);
                // Now we can safely render outro on activeCard since all questions are done
                renderCard(activeCard, questions.length);
                renderCard(nextCard, questions.length);

                // Update swipe hint for outro state
                updateSwipeHintForOutro();
                // Disable gesture zone for outro state (user interacts via swipe hint instead)
                const gestureZone = document.getElementById('gesture-zone');
                if (gestureZone) {
                    gestureZone.style.pointerEvents = 'none';
                }

                // Start confetti celebration!
                startConfetti();

                // Auto-scroll down after 3 seconds to reveal more content
                setTimeout(() => {
                    window.scrollTo({
                        top: 500,
                        behavior: 'smooth'
                    });
                }, 3000);
            } else if (currentQuestionIndex === questions.length - 1) {
                // We're on the LAST question - show it on activeCard
                // DO NOT prepare outro on nextCard yet - wait until user actually flips past Q3

                // CRITICAL: Verify cards are different
                if (activeCard === nextCard) {
                    console.error('FATAL: activeCard and nextCard are the same! This should never happen!');
                    return;
                }

                // Check if this question was already answered (back navigation case)
                const lastQWasAnswered = userAnswers[currentQuestionIndex];
                if (lastQWasAnswered) {
                    renderTopContentWithAnswerState(currentQuestionIndex);
                    hasAnsweredCurrentQuestion = true; // Mark as answered
                } else {
                    renderTopContent(questions[currentQuestionIndex]);
                }

                // CRITICAL: Check if activeCard already has outro (from when it was nextCard)
                const existingEmoji = activeCard.querySelector('.illustration-placeholder .emoji');
                if (existingEmoji) {
                    existingEmoji.remove();
                }

                // CRITICAL: Render Q3 on activeCard and FORCE it to stay
                const q3Data = questions[currentQuestionIndex];
                renderCard(activeCard, currentQuestionIndex);

                // Verify Q3 was rendered correctly and FORCE it to stay
                const verifyPlaceholder = activeCard.querySelector('.illustration-placeholder');
                const verifyEmojiAfter = activeCard.querySelector('.illustration-placeholder .emoji');
                const verifyTrivia = activeCard.querySelector('.trivia-text');

                if (verifyEmojiAfter) {
                    console.error(`✗ ERROR: activeCard still has emoji after render! Removing and re-rendering Q3...`);
                    activeCard.querySelector('.illustration-placeholder').innerHTML = '';
                    renderCard(activeCard, currentQuestionIndex);
                }

                // Verify illustration background image
                const bgImage = verifyPlaceholder?.style.backgroundImage || '';
                if (bgImage && bgImage.includes(q3Data.illustration)) {
                } else {
                    console.error(`✗ ERROR: activeCard illustration mismatch! Expected: ${q3Data.illustration}, Got: ${bgImage}`);
                    console.error('Re-rendering Q3...');
                    renderCard(activeCard, currentQuestionIndex);
                }

                // Verify trivia
                if (verifyTrivia && verifyTrivia.innerText === q3Data.trivia) {
                } else {
                    console.error(`✗ ERROR: activeCard trivia mismatch! Expected: "${q3Data.trivia}", Got: "${verifyTrivia?.innerText}"`);
                    console.error('Re-rendering Q3...');
                    renderCard(activeCard, currentQuestionIndex);
                }

                // Trigger entrance animations for the last question
                triggerCardEntranceAnimation(currentQuestionIndex);

                // DO NOT prepare outro on nextCard yet - we'll do it when user flips past Q3
                // This prevents nextCard from having outro when it becomes activeCard

                // IMPORTANT: Re-enable gesture zone LAST if question was already answered
                if (lastQWasAnswered) {
                    enableFlipInteraction(true);
                }
            } else {
                // Still have questions to show
                // Show next question in the static top half
                // Check if this question was already answered (back navigation case)
                const questionWasAnswered = userAnswers[currentQuestionIndex];
                if (questionWasAnswered) {
                    renderTopContentWithAnswerState(currentQuestionIndex);
                    hasAnsweredCurrentQuestion = true; // Mark as answered
                } else {
                    renderTopContent(questions[currentQuestionIndex]);
                }

                // Ensure stacked pages are visible (not on last question yet)
                if (notepad) {
                    notepad.classList.remove('hide-stacked-pages');
                }

                // ALWAYS re-render activeCard with the current question to ensure it's correct
                renderCard(activeCard, currentQuestionIndex);

                // Trigger entrance animations for the current card
                triggerCardEntranceAnimation(currentQuestionIndex);

                // Prepare the nextCard (the one now at the bottom) for the following flip
                if (currentQuestionIndex < questions.length - 1) {
                    // There is another question after this one; render it on nextCard
                    renderCard(nextCard, currentQuestionIndex + 1);
                } else {
                    // This is the last question; render the outro on nextCard ONLY
                    // DO NOT render outro on activeCard - it should show the last question!
                    renderCard(nextCard, questions.length);
                }

                // IMPORTANT: Re-enable gesture zone LAST if question was already answered
                // This ensures nothing else can disable it after this point
                if (questionWasAnswered) {
                    enableFlipInteraction(true);
                }
            }
        }
    });
}

// ========== SWIPE BACK FUNCTIONALITY ==========

// Render top content (question) with answer state highlighting
function renderTopContentWithAnswerState(index) {
    const qData = questions[index];
    const answer = userAnswers[index];

    if (!qData || !answer) return;

    // DO NOT call renderTopContent - it has animations
    // Instead, render content directly with full opacity

    // Update carousel indicator first
    updateCarouselIndicator();

    // Set question text directly with full opacity
    const questionEl = topContent.querySelector('.question-text');
    if (questionEl) {
        questionEl.innerHTML = qData.text;
        gsap.set(questionEl, { opacity: 1, y: 0 }); // Visible immediately, no animation
    }

    // Set options directly with full opacity and answer highlighting
    const optsContainer = topContent.querySelector('.options-container');
    if (optsContainer) {
        optsContainer.innerHTML = '';

        qData.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn', 'py-4', 'px-4', 'rounded-full', 'text-base/5', 'font-bold');
            btn.innerText = opt;
            btn.disabled = true;
            btn.style.pointerEvents = 'none';

            // Mark user's wrong selection
            if (i === answer.selectedIndex && !answer.isCorrect) {
                btn.classList.add('wrong');
            }
            // Always show the correct answer
            if (i === qData.correctIndex) {
                btn.classList.add('correct');
            }

            // Set visible immediately
            gsap.set(btn, { opacity: 1, y: 0 });

            optsContainer.appendChild(btn);
        });
    }

    // Set background color immediately
    if (qData.backgroundColor) {
        gsap.set(document.body, { backgroundColor: qData.backgroundColor });
    }
    if (qData.foreroundColor && topContent) {
        gsap.set(topContent, { backgroundColor: qData.foreroundColor });
    }

    // Ensure carousel indicator is visible
    const indicator = topContent.querySelector('.carousel-indicator');
    if (indicator) {
        gsap.set(indicator, { opacity: 1 });
    }
}

// Render card (bottom half) with answered state including trivia
function renderCardWithAnswerState(cardElement, index) {
    const qData = questions[index];
    if (!qData) return;

    // Use the full renderCard function to get all illustrations and animations
    renderCard(cardElement, index);

    // Now ensure trivia is visible (since this is an answered question)
    const triviaTextEl = cardElement.querySelector('.trivia-text');
    if (triviaTextEl && qData.trivia) {
        triviaTextEl.innerText = qData.trivia;
        triviaTextEl.style.opacity = '1';
        triviaTextEl.classList.remove('opacity-0');
    }

    // Special handling for Q1 (index 0): Show correct overlay state
    // If reveal animation was triggered, hide currency and show product
    // If not triggered, show currency and hide product
    if (index === 0 && qData.illustration === 'assets/illustration1.png') {
        const overlayContainer = cardElement.querySelector('#card1-overlay-container');
        const productContainer = cardElement.querySelector('#card1-product-container');

        if (card1RevealTriggered) {
            // Product was revealed - hide currency, show product
            if (overlayContainer) {
                overlayContainer.style.display = 'none';
                gsap.set(overlayContainer, { opacity: 0 });
            }
            if (productContainer) {
                gsap.set(productContainer, { opacity: 1 });
            }
        } else {
            // Currency is still showing - show currency, hide product
            if (overlayContainer) {
                overlayContainer.style.display = 'flex';
                gsap.set(overlayContainer, { opacity: 1, y: 0 });
            }
            if (productContainer) {
                gsap.set(productContainer, { opacity: 0 });
            }
        }
    }

    // Special handling for Calendar question: Show checkmark in revealed state
    // The checkmark uses clip-path animation, so we need to show it fully revealed
    if (qData.illustration === 'assets/illustration3.png') {
        const tick = cardElement.querySelector('#card4-tick');
        if (tick) {
            // Show checkmark fully revealed (no clip-path hiding)
            tick.style.clipPath = 'inset(0 0 0 0)';
            tick.classList.remove('animate-reveal');
            tick.classList.remove('fade-out');
            gsap.set(tick, { opacity: 1 });
        }
    }
}

// Flip page backward to show previous question
function flipPageBack() {
    // Don't flip back if already at first question, flipping, or in outro state
    if (isFlipping || currentQuestionIndex <= 0) {
        return;
    }

    // Stop any ongoing animations
    stopBottomHalfNudge();
    stopAutoFlipTimer();
    stopHandshakeAnimation();
    stopTickRevealAnimation();

    isFlipping = true;

    const prevIndex = currentQuestionIndex - 1;

    // ========== RENDER CONTENT BEFORE FLIP STARTS ==========
    // This ensures everything is visible when the page flips down

    // 1. Render the bottom card (which will be revealed) with full content
    renderCardWithAnswerState(nextCard, prevIndex);

    // 2. Force all animated elements to be visible immediately (skip animations)
    const triviaEl = nextCard.querySelector('.trivia-text');
    if (triviaEl) {
        gsap.set(triviaEl, { opacity: 1 });
    }
    const overlayContainers = nextCard.querySelectorAll('.card-overlay-container');
    overlayContainers.forEach(container => {
        gsap.set(container, { opacity: 1, y: 0 });
    });

    // 3. Render top content (question + options) BEFORE flip
    // Decrement index temporarily to render correct question and update carousel
    const tempIndex = currentQuestionIndex;
    currentQuestionIndex = prevIndex;

    renderTopContentWithAnswerState(prevIndex);

    // Update carousel indicator (needs currentQuestionIndex set correctly)
    updateCarouselIndicator();

    currentQuestionIndex = tempIndex; // Restore for now

    // 4. Force question text and options to be visible immediately
    const questionText = topContent.querySelector('.question-text');
    if (questionText) {
        gsap.set(questionText, { opacity: 1 });
    }
    const optionBtns = topContent.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        gsap.set(btn, { opacity: 1, y: 0 });
    });

    // 5. Force carousel indicator to be visible
    const carouselIndicator = topContent.querySelector('.carousel-indicator');
    if (carouselIndicator) {
        gsap.set(carouselIndicator, { opacity: 1 });
    }

    // Position nextCard above activeCard, already flipped (rotationX: 180)
    // It will flip DOWN to reveal its content
    gsap.set(nextCard, { rotationX: 180, zIndex: 100 });

    // Play page flip sound
    setTimeout(() => {
        pageFlipAudio.currentTime = 0;
        if (!document.hidden) pageFlipAudio.play().catch(() => { });
    }, 100);

    const overlay = nextCard.querySelector('.lighting-overlay');

    // Animate reverse flip (180 -> 0)
    gsap.to(nextCard, {
        duration: 0.6,
        rotationX: 0,
        ease: "power2.out",
        onUpdate: function () {
            const progress = this.progress();
            const opacity = Math.sin(progress * Math.PI) * 0.3;
            if (overlay) overlay.style.opacity = opacity;
        },
        onComplete: () => {
            isFlipping = false;

            // Swap card roles
            const temp = activeCard;
            activeCard = nextCard;
            nextCard = temp;

            // Update z-indices
            gsap.set(activeCard, { zIndex: 3 });
            gsap.set(nextCard, { rotationX: 0, zIndex: 2 });

            // Update index AFTER swap
            currentQuestionIndex--;

            // Since we're viewing a previously answered question, set the flag
            hasAnsweredCurrentQuestion = true;

            // Re-render the bottom card (nextCard) for forward navigation
            if (currentQuestionIndex < questions.length - 1) {
                renderCard(nextCard, currentQuestionIndex + 1);
            } else {
                renderCard(nextCard, questions.length); // outro
            }

            // Show swipe hint (user can only go forward from here)
            const swipeHint = document.getElementById('swipe-hint');
            if (swipeHint) {
                gsap.to(swipeHint, { opacity: 1, duration: 0.3 });
            }

            // Enable gesture zone for forward navigation
            enableFlipInteraction(false); // false = don't show hint again, already shown
        }
    });
}

// Enable swipe down gesture on top half for back navigation
function enableTopHalfSwipeBack() {
    if (!topContent) return;

    // Remove any existing handlers
    if (topContent._swipeBackTouchStart) {
        topContent.removeEventListener('touchstart', topContent._swipeBackTouchStart);
    }
    if (topContent._swipeBackTouchEnd) {
        topContent.removeEventListener('touchend', topContent._swipeBackTouchEnd);
    }

    let touchStartY = 0;

    const onTouchStart = (e) => {
        touchStartY = e.changedTouches[0].screenY;
    };

    const onTouchEnd = (e) => {
        const touchEndY = e.changedTouches[0].screenY;
        const swipeDistance = touchEndY - touchStartY; // Positive = swipe down

        // Only allow swipe back if:
        // 1. Swiped down more than threshold (50px)
        // 2. Not on first question
        // 3. Not currently flipping
        // 4. Previous question was answered (check userAnswers array)
        // 5. NOT in outro state (no going back from outro)
        const isOutroState = currentQuestionIndex >= questions.length;
        const prevQuestionAnswered = currentQuestionIndex > 0 && userAnswers[currentQuestionIndex - 1];
        if (swipeDistance > 50 && prevQuestionAnswered && !isFlipping && !isOutroState) {
            flipPageBack();
        }
    };

    // Store references for cleanup
    topContent._swipeBackTouchStart = onTouchStart;
    topContent._swipeBackTouchEnd = onTouchEnd;

    topContent.addEventListener('touchstart', onTouchStart, { passive: true });
    topContent.addEventListener('touchend', onTouchEnd, { passive: true });
}

// Function to update swipe hint for outro state
function updateSwipeHintForOutro() {
    const swipeHint = document.getElementById('swipe-hint');
    const gestureZone = document.getElementById('gesture-zone');

    if (!swipeHint) return;

    // Disable gesture zone for outro state
    if (gestureZone) {
        gestureZone.style.pointerEvents = 'none';
        // Remove any event handlers
        if (gestureZone._onClickHandler) {
            gestureZone.removeEventListener('click', gestureZone._onClickHandler);
            gestureZone._onClickHandler = null;
        }
        if (gestureZone._onTouchStartHandler) {
            gestureZone.removeEventListener('touchstart', gestureZone._onTouchStartHandler);
            gestureZone._onTouchStartHandler = null;
        }
        if (gestureZone._onTouchEndHandler) {
            gestureZone.removeEventListener('touchend', gestureZone._onTouchEndHandler);
            gestureZone._onTouchEndHandler = null;
        }
    }

    // Hide the swipe hint on outro state - replay button is now in navbar
    gsap.to(swipeHint, { opacity: 0, duration: 0.3 });
    swipeHint.style.pointerEvents = 'none';
}

// Function to reset swipe hint to default state
function resetSwipeHint() {
    const swipeHint = document.getElementById('swipe-hint');
    if (!swipeHint) return;

    const icon = swipeHint.querySelector('.material-symbols-rounded');
    const text = swipeHint.querySelector('span:last-of-type');

    if (icon) {
        icon.textContent = 'keyboard_double_arrow_up';
        // Restore bounce and margin for default state
        icon.classList.add('animate-bounce', 'mt-2');
    }
    if (text) {
        text.textContent = 'Swipe up for next';
    }

    // Remove outro click handler and reset pointer events
    if (swipeHint._outroClickHandler) {
        swipeHint.removeEventListener('click', swipeHint._outroClickHandler);
        swipeHint._outroClickHandler = null;
    }
    swipeHint.style.pointerEvents = 'none';
    swipeHint.style.cursor = 'default';
}

// Function to return to intro state
function returnToIntro() {

    // Reset body background to --blue-dark
    gsap.set(document.body, {
        backgroundColor: '#183862' // --blue-dark
    });
    document.body.style.backgroundColor = '#183862';

    // Hide replay button
    if (replayBtn) {
        gsap.to(replayBtn, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
                replayBtn.style.pointerEvents = 'none';
            }
        });
    }

    // Reset topContent background image (clear outro-top.png)
    if (topContent) {
        topContent.style.backgroundImage = '';
        topContent.style.backgroundSize = '';
        topContent.style.backgroundPosition = '';
        topContent.style.backgroundRepeat = '';
        gsap.set(topContent, {
            backgroundImage: '',
            backgroundSize: '',
            backgroundPosition: '',
            backgroundRepeat: ''
        });
    }

    // Stop the bottom half nudge animation
    stopBottomHalfNudge();

    // Reset state variables
    currentQuestionIndex = 0;
    hasAnsweredCurrentQuestion = false;
    isFlipping = false;
    userAnswers = []; // Clear answer history
    card1RevealTriggered = false; // Reset reveal state

    // Stop confetti if still running
    stopConfetti();

    // Hide top-half and bottom-half
    gsap.to('.top-half', { opacity: 0, duration: 0.1 });
    gsap.to('.bottom-half', { opacity: 0, duration: 0.1 });

    // Remove expanded classes
    if (notepad) {
        notepad.classList.remove('expanded');
        notepad.classList.remove('hide-stacked-pages');
    }
    if (stage) {
        stage.classList.remove('expanded');
        stage.classList.remove('outro-scrollable');
        stage.style.overflow = '';
        stage.style.minHeight = '';
    }

    // Remove navbar outro background
    const topNav = document.querySelector('.top-nav');
    if (topNav) {
        topNav.classList.remove('outro-active');
    }

    // Hide landing page
    const landingPage = document.getElementById('landing-page');
    if (landingPage) {
        landingPage.classList.add('hidden');
        gsap.set(landingPage, { opacity: 0 });
    }

    // Hide landing scroll indicator
    const landingScrollIndicator = document.getElementById('landing-scroll-indicator');
    if (landingScrollIndicator) {
        gsap.set(landingScrollIndicator, { opacity: 0 });
    }

    // Reset body scroll
    document.body.style.overflow = '';
    document.body.style.overflowX = '';
    window.scrollTo(0, 0);

    // Clear card content
    clearCard(activeCard);
    clearCard(nextCard);

    // Reset card-back backgrounds (clear outro-top.png if present)
    const allCards = document.querySelectorAll('.bottom-half');
    allCards.forEach(card => {
        const cardBack = card.querySelector('.card-back');
        if (cardBack) {
            cardBack.style.backgroundImage = '';
            cardBack.style.backgroundSize = '';
            cardBack.style.backgroundPosition = '';
            cardBack.style.backgroundRepeat = '';
            cardBack.style.backgroundColor = '';
        }
        // Also reset illustration-placeholder backgrounds
        const illustrationPlaceholder = card.querySelector('.illustration-placeholder');
        if (illustrationPlaceholder) {
            illustrationPlaceholder.style.backgroundImage = '';
            illustrationPlaceholder.style.backgroundSize = '';
            illustrationPlaceholder.style.backgroundPosition = '';
            illustrationPlaceholder.style.backgroundRepeat = '';
        }
    });

    // Reset card positions and z-index
    gsap.set(activeCard, { rotationX: 0, zIndex: 3 });
    gsap.set(nextCard, { rotationX: 0, zIndex: 2 });

    // Reset activeCard and nextCard references
    activeCard = card1;
    nextCard = card2;

    // Disable gesture zone immediately and clean up handlers
    const gestureZone = document.getElementById('gesture-zone');
    if (gestureZone) {
        gestureZone.style.pointerEvents = 'none';
        // Clean up any event handlers
        if (gestureZone._onClickHandler) {
            gestureZone.removeEventListener('click', gestureZone._onClickHandler);
            gestureZone._onClickHandler = null;
        }
        if (gestureZone._onTouchStartHandler) {
            gestureZone.removeEventListener('touchstart', gestureZone._onTouchStartHandler);
            gestureZone._onTouchStartHandler = null;
        }
        if (gestureZone._onTouchEndHandler) {
            gestureZone.removeEventListener('touchend', gestureZone._onTouchEndHandler);
            gestureZone._onTouchEndHandler = null;
        }
    }

    // Hide validation overlay if visible
    if (validationOverlay) {
        gsap.set(validationOverlay, { autoAlpha: 0 });
    }

    // Wait for transitions, then show intro
    setTimeout(() => {
        // Show intro cover
        if (introCover) {
            introCover.style.display = 'block';
            gsap.set(introCover, {
                rotationX: 0,
                opacity: 0,
                height: '100%',
                top: '0'
            });
            gsap.to(introCover, { opacity: 1, duration: 0.1 });
        }

        // Show intro content below
        if (introContentBelow) {
            introContentBelow.style.display = 'flex';
            gsap.set(introContentBelow, { opacity: 0 });
            gsap.to(introContentBelow, { opacity: 1, duration: 0.1 });
        }

        // Hide brand logo
        const brandLogo = document.getElementById('brand-logo');
        if (brandLogo) {
            gsap.set(brandLogo, { opacity: 0 });
        }

        // Reset swipe hint
        resetSwipeHint();
        const swipeHint = document.getElementById('swipe-hint');
        if (swipeHint) {
            gsap.set(swipeHint, { opacity: 0 });
        }

        // Ensure start button is clickable
        if (startBtn) {
            startBtn.style.pointerEvents = 'auto';
            startBtn.disabled = false;
        }

        // Restart peep animation
        startPeepAnimation();

        // Reset topContent structure - ensure question-section exists with carousel indicator
        // Always restore the proper structure (in case outro template replaced it)
        if (topContent) {
            topContent.innerHTML = `
                <div class="question-section">
                    <!-- Auto-flip Progress Bar (Instagram story style) -->
                    <div id="autoflip-progress" class="autoflip-progress-container opacity-0">
                        <div class="autoflip-progress-bar"></div>
                    </div>
                    <!-- Carousel Indicator -->
                    <div class="carousel-indicator flex items-center justify-center mb-4 opacity-0">
                        <div class="carousel-dots flex items-center relative">
                            <!-- Dots will be dynamically generated -->
                        </div>
                    </div>
                    <h2 class="question-text text-center mb-5 opacity-0 text-xl/7 font-medium mt-5">Loading...</h2>
                    <div class="options-container flex flex-col gap-3"></div>
                </div>
            `;
        }

        // Clear and reset both cards completely - don't render anything yet
        clearCard(activeCard);
        clearCard(nextCard);

        // Reset card rotations and ensure they're in correct state
        gsap.set(activeCard, { rotationX: 0, zIndex: 3 });
        gsap.set(nextCard, { rotationX: 0, zIndex: 2 });

        // Don't render anything on cards yet - wait for quiz to start
        // Cards will be rendered when the intro cover flips

        // Ensure swipe hint is completely hidden until user answers a question
        const swipeHintEl = document.getElementById('swipe-hint');
        if (swipeHintEl) {
            gsap.set(swipeHintEl, { opacity: 0 });
            swipeHintEl.style.pointerEvents = 'none';
        }

        // Disable gesture zone until quiz starts
        const gestureZoneEl = document.getElementById('gesture-zone');
        if (gestureZoneEl) {
            gestureZoneEl.style.pointerEvents = 'none';
        }

    }, 100);
}

function enableFlipInteraction(showHint = true) {
    const swipeHint = document.getElementById('swipe-hint');
    const gestureZone = document.getElementById('gesture-zone');

    if (!swipeHint || !gestureZone) return;

    // Clean up any previous handlers to avoid duplicate behavior across quiz runs
    if (gestureZone._onClickHandler) {
        gestureZone.removeEventListener('click', gestureZone._onClickHandler);
    }
    if (gestureZone._onTouchStartHandler) {
        gestureZone.removeEventListener('touchstart', gestureZone._onTouchStartHandler);
    }
    if (gestureZone._onTouchEndHandler) {
        gestureZone.removeEventListener('touchend', gestureZone._onTouchEndHandler);
    }

    // Check if we're on outro state
    const isOutroState = currentQuestionIndex >= questions.length;

    // Only show hint and start nudge if showHint is true (after answering)
    if (showHint) {
        gsap.to(swipeHint, { opacity: 1, duration: 0.5 });

        // Start the bottom half nudge animation to encourage swiping
        if (!isOutroState) {
            startBottomHalfNudge();
        }

        // Start auto-flip timer (only after answering, not on initial question load)
        startAutoFlipTimer();
    }

    // Enable interaction on the zone only after trivia animation completes
    gestureZone.style.pointerEvents = 'auto';
    gestureZone.style.touchAction = 'auto';

    // Click Handler - check outro state dynamically
    const onClick = () => {
        const inOutro = currentQuestionIndex >= questions.length;
        if (inOutro) {
            returnToIntro();
        } else {
            triggerFlip();
        }
    };

    // Touch Handlers
    let touchStartY = 0;
    const onTouchStart = (e) => {
        touchStartY = e.changedTouches[0].screenY;
    };
    const onTouchEnd = (e) => {
        const touchEndY = e.changedTouches[0].screenY;
        const swipeDistance = touchStartY - touchEndY;
        // Lower threshold and start flip immediately on swipe detection
        if (swipeDistance > 30) { // Swipe Up - reduced threshold for faster response
            const inOutro = currentQuestionIndex >= questions.length;
            if (inOutro) {
                returnToIntro();
            } else {
                triggerFlip();
            }
        }
    };

    // Trigger Flip and Cleanup
    const triggerFlip = () => {
        const inOutro = currentQuestionIndex >= questions.length;

        // Check if user has answered the current question
        // Either via hasAnsweredCurrentQuestion flag OR via userAnswers array (for back navigation case)
        const currentQuestionAnswered = hasAnsweredCurrentQuestion || userAnswers[currentQuestionIndex];
        if (!currentQuestionAnswered && !inOutro) {
            // User tried to swipe without answering - show vibration animation
            vibrateQuestionSection();
            return; // Don't proceed with flip
        }

        // Stop the nudge animation when user starts to flip
        stopBottomHalfNudge();

        // Stop auto-flip timer since user is manually flipping
        stopAutoFlipTimer();

        gestureZone.removeEventListener('click', onClick);
        gestureZone.removeEventListener('touchstart', onTouchStart);
        gestureZone.removeEventListener('touchend', onTouchEnd);

        // Disable interaction immediately
        gestureZone.style.pointerEvents = 'none';

        // Hide hint instantly and start flip immediately - no delay
        gsap.set(swipeHint, { opacity: 0 });
        flipPage(); // Start flip immediately
    };

    // Store handlers on the element so we can clean them up next time
    gestureZone._onClickHandler = onClick;
    gestureZone._onTouchStartHandler = onTouchStart;
    gestureZone._onTouchEndHandler = onTouchEnd;

    gestureZone.addEventListener('click', onClick);
    gestureZone.addEventListener('touchstart', onTouchStart, { passive: true });
    gestureZone.addEventListener('touchend', onTouchEnd, { passive: true });
}

// ========== CONFETTI ANIMATION ==========
let confettiInterval = null;
let confettiContainer = null;

// Create confetti celebration for outro
function startConfetti() {
    if (reducedMotion || document.hidden) return;
    // Create container if it doesn't exist
    if (!confettiContainer) {
        confettiContainer = document.createElement('div');
        confettiContainer.id = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(confettiContainer);
    }

    // Clear any existing confetti
    confettiContainer.innerHTML = '';

    // Confetti colors (festive palette)
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const shapes = ['square', 'rectangle', 'circle'];

    // Initial burst of confetti
    for (let i = 0; i < 80; i++) {
        setTimeout(() => createConfettiPiece(colors, shapes), i * 15);
    }

    // Continue slower stream of confetti
    confettiInterval = setInterval(() => {
        for (let i = 0; i < 3; i++) {
            createConfettiPiece(colors, shapes);
        }
    }, 200);

    // Stop after 2.5 seconds
    setTimeout(() => stopConfetti(), 2000);
}

function createConfettiPiece(colors, shapes) {
    if (!confettiContainer) return;

    const piece = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    // Random starting position (spread across top)
    const startX = Math.random() * 100;
    const startY = -5;

    // Random sizes
    const width = Math.random() * 6 + 4;
    const height = shape === 'rectangle' ? width * 2 : width;

    // Random movement values
    const driftX = (Math.random() - 0.5) * 200; // Horizontal drift
    const fallDuration = Math.random() * 2 + 2.5; // 2.5-4.5 seconds
    const rotateDegrees = Math.random() * 720 - 360; // -360 to 360 degrees

    piece.style.cssText = `
        position: absolute;
        left: ${startX}%;
        top: ${startY}%;
        width: ${width}px;
        height: ${height}px;
        background: ${color};
        border-radius: ${shape === 'circle' ? '50%' : '2px'};
        opacity: 1;
        pointer-events: none;
    `;

    confettiContainer.appendChild(piece);

    // Animate with GSAP
    gsap.to(piece, {
        y: window.innerHeight + 50,
        x: driftX,
        rotation: rotateDegrees,
        opacity: 0,
        duration: fallDuration,
        ease: "power1.in",
        onComplete: () => piece.remove()
    });
}

function stopConfetti() {
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
    // Let existing pieces finish falling, then remove container
    setTimeout(() => {
        if (confettiContainer) {
            confettiContainer.innerHTML = '';
        }
    }, 3000);
}

// Snowfall Animation
function initSnowfall() {
    if (reducedMotion || document.hidden) return;
    const snowfallContainer = document.getElementById('snowfall-container');
    if (!snowfallContainer) return;

    const snowflakes = ['❄', '❅', '❆', '•', '∘'];
    const numberOfSnowflakes = 30; // Subtle amount

    for (let i = 0; i < numberOfSnowflakes; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];

        // Randomize properties
        const startPositionX = Math.random() * 100; // Random horizontal position (0-100%)
        const size = Math.random() * 0.6 + 0.6; // Size between 0.4rem and 1rem
        const duration = Math.random() * 8 + 6; // Duration between 6-14 seconds
        const delay = Math.random() * 10; // Delay between 0-10 seconds
        const opacity = Math.random() * 0.4 + 0.2; // Opacity between 0.2-0.6

        snowflake.style.left = `${startPositionX}%`;
        snowflake.style.fontSize = `${size}rem`;
        snowflake.style.animationDuration = `${duration}s`;
        snowflake.style.animationDelay = `${delay}s`;
        snowflake.style.setProperty('--snow-opacity', opacity); // Use CSS variable for animation

        snowfallContainer.appendChild(snowflake);
    }
}

// Hide snowfall when quiz starts
function hideSnowfall() {
    const snowfallContainer = document.getElementById('snowfall-container');
    if (snowfallContainer) {
        gsap.to(snowfallContainer, {
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            onComplete: () => {
                snowfallContainer.style.display = 'none';
            }
        });
    }
}

// ========== SHARE FUNCTIONALITY ==========

const shareBtn = document.getElementById('share-btn');

// Check if we're in question state (not intro/outro)
function isInQuestionState() {
    const introCover = document.querySelector('.intro-cover');
    // If intro cover is visible, we're in intro state
    if (introCover && introCover.style.display !== 'none') {
        return false;
    }
    // If we've passed all questions, we're in outro state
    if (currentQuestionIndex >= questions.length) {
        return false;
    }
    return true;
}

// Check if we're in outro state (after all questions)
function isInOutroState() {
    return currentQuestionIndex >= questions.length;
}

// Generate share image for question-specific share
async function generateQuestionShareImage() {
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    const template = document.getElementById('share-template-question');
    if (!template) return null;

    // Update template with question data
    const bgImage = template.querySelector('#share-bg-image');
    const dataValue = template.querySelector('#share-data-value');
    const dataLabel = template.querySelector('#share-data-label');
    const triviaText = template.querySelector('#share-trivia');
    const containerBg = template.querySelector('#share-container-bg');
    const productImage = template.querySelector('#share-product-image');

    // Use shareIllustration if available (for cards 2-6), otherwise use illustration (for card 1)
    if (bgImage) bgImage.src = question.shareIllustration || question.illustration;
    if (dataValue) dataValue.textContent = question.shareValue || question.options[question.correctIndex];
    if (dataLabel) dataLabel.textContent = question.shareLabel || '';
    if (triviaText) triviaText.textContent = question.shareTrivia || question.trivia; // Use shareTrivia for third-person

    // Show product/vehicle image for Card 1 (if shareProductImage exists)
    if (productImage) {
        if (question.shareProductImage) {
            productImage.src = question.shareProductImage;
            productImage.style.display = 'block';
        } else {
            productImage.style.display = 'none';
        }
    }

    // Set the foreground color as background
    if (containerBg && question.foreroundColor) {
        containerBg.style.backgroundColor = question.foreroundColor;
    }

    // Set all text colors to backgroundColor value
    const textColor = question.backgroundColor || '#183862';
    if (dataValue) dataValue.style.color = textColor;
    if (dataLabel) dataLabel.style.color = textColor;
    if (triviaText) triviaText.style.color = textColor;

    // Position template for html2canvas rendering (stays off-screen but renderable)
    // Using a position that allows html2canvas to capture it without showing on viewport
    template.style.position = 'fixed';
    template.style.left = '0';
    template.style.top = '0';
    template.style.opacity = '0';
    template.style.pointerEvents = 'none';
    template.style.zIndex = '-1';

    // Wait for image to load
    await new Promise(resolve => {
        if (bgImage.complete) {
            resolve();
        } else {
            bgImage.onload = resolve;
            bgImage.onerror = resolve;
        }
    });

    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const canvas = await html2canvas(template.querySelector('.share-container'), {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: null,
            logging: false,
            onclone: (clonedDoc) => {
                // Make the cloned element visible for rendering
                const clonedTemplate = clonedDoc.getElementById('share-template-question');
                if (clonedTemplate) {
                    clonedTemplate.style.opacity = '1';
                }
            }
        });

        // Reset template position
        template.style.position = 'absolute';
        template.style.left = '-9999px';
        template.style.opacity = '';
        template.style.zIndex = '';

        return canvas;
    } catch (error) {
        console.error('Error generating share image:', error);
        template.style.position = 'absolute';
        template.style.left = '-9999px';
        template.style.opacity = '';
        template.style.zIndex = '';
        return null;
    }
}

// Generate outro share image with payment personality
async function generateOutroShareImage() {
    const template = document.getElementById('share-template-question');
    if (!template) return null;

    // Update template with outro/personality data
    const bgImage = template.querySelector('#share-bg-image');
    const dataValue = template.querySelector('#share-data-value');
    const dataLabel = template.querySelector('#share-data-label');
    const triviaText = template.querySelector('#share-trivia');
    const containerBg = template.querySelector('#share-container-bg');
    const productImage = template.querySelector('#share-product-image');

    // Set personality data - use background image instead of product overlay
    if (bgImage) bgImage.src = 'assets/share-illustration-final.png';
    if (dataValue) dataValue.textContent = userPersonality?.title || 'Digital Nomad';
    if (dataLabel) dataLabel.textContent = 'PAYMENT PERSONALITY';
    if (triviaText) {
        triviaText.textContent = userPersonality?.message || 'You\'ve kept PayZapp busy & your life easy.';
        triviaText.style.display = 'block';
    }

    // Hide the product image overlay for outro (using bg image instead)
    if (productImage) {
        productImage.style.display = 'none';
    }

    // Set outro colors (warm cream theme)
    if (containerBg) {
        containerBg.style.backgroundColor = '#FCEAB0';
    }

    // Set text colors
    const textColor = '#2E2419';
    if (dataValue) dataValue.style.color = textColor;
    if (dataLabel) dataLabel.style.color = textColor;
    if (triviaText) triviaText.style.color = textColor;

    // Position template for html2canvas rendering
    template.style.position = 'fixed';
    template.style.left = '0';
    template.style.top = '0';
    template.style.opacity = '0';
    template.style.pointerEvents = 'none';
    template.style.zIndex = '-1';

    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const canvas = await html2canvas(template.querySelector('#share-container-bg'), {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: '#FCEAB0',
            logging: false,
            onclone: (clonedDoc) => {
                const clonedTemplate = clonedDoc.getElementById('share-template-question');
                if (clonedTemplate) {
                    clonedTemplate.style.opacity = '1';
                }
            }
        });

        // Reset template position and styles
        template.style.position = 'absolute';
        template.style.left = '-9999px';
        template.style.opacity = '';
        template.style.zIndex = '';

        // Reset product image for next question share
        if (productImage) {
            productImage.style.display = 'none';
            productImage.style.height = '100%'; // Reset to original
        }

        return canvas;
    } catch (error) {
        console.error('Error generating outro share image:', error);
        template.style.position = 'absolute';
        template.style.left = '-9999px';
        template.style.opacity = '';
        template.style.zIndex = '';
        if (productImage) {
            productImage.style.display = 'none';
            productImage.style.height = '100%';
        }
        return null;
    }
}

// Generate generic share image for intro/outro
async function generateGenericShareImage() {
    const template = document.getElementById('share-template-generic');
    if (!template) return null;

    // Position template for html2canvas rendering (stays invisible but renderable)
    template.style.position = 'fixed';
    template.style.left = '0';
    template.style.top = '0';
    template.style.opacity = '0';
    template.style.pointerEvents = 'none';
    template.style.zIndex = '-1';

    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const canvas = await html2canvas(template.querySelector('.share-container'), {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: '#183862',
            logging: false,
            onclone: (clonedDoc) => {
                // Make the cloned element visible for rendering
                const clonedTemplate = clonedDoc.getElementById('share-template-generic');
                if (clonedTemplate) {
                    clonedTemplate.style.opacity = '1';
                }
            }
        });

        // Reset template position
        template.style.position = 'absolute';
        template.style.left = '-9999px';
        template.style.opacity = '';
        template.style.zIndex = '';

        return canvas;
    } catch (error) {
        console.error('Error generating share image:', error);
        template.style.position = 'absolute';
        template.style.left = '-9999px';
        template.style.opacity = '';
        template.style.zIndex = '';
        return null;
    }
}

// PayZapp download link and CTA
const PAYZAPP_DOWNLOAD_LINK = "https://cs.payzapp.hdfcbank.com/download-payzapp/android-ios/";
const PAYZAPP_DOWNLOAD_CTA = "\n\nGet PayZapp — HDFC Bank's super app for payments, rewards & more! Download now:";

// Get share message based on state
function getShareMessage() {
    let baseMessage = "";

    if (isInQuestionState()) {
        const question = questions[currentQuestionIndex];
        baseMessage = question?.shareMessage || "Check out this 2025 PayZapp Recap!";
    } else if (isInOutroState()) {
        const personalityTitle = userPersonality?.title || 'Digital Nomad';
        baseMessage = `${userFirstName}'s payment personality is "${personalityTitle}"!`;
    } else {
        baseMessage = "Where did your money go in 2025? Check out your PayZapp story!";
    }

    // Append download CTA and link
    return `${baseMessage}${PAYZAPP_DOWNLOAD_CTA}\n${PAYZAPP_DOWNLOAD_LINK}`;
}

// Handle share action
async function handleShare(event) {
    const shareIcon = shareBtn?.querySelector('.material-symbols-rounded');

    // Check if clicked from outro share button
    const clickedButton = event?.target?.closest('.outro-share-btn');
    const outroShareText = clickedButton?.querySelector('.outro-share-text');
    const outroShareLoader = clickedButton?.querySelector('.outro-share-loader');

    // Show loading state on navbar share icon
    if (shareBtn && shareIcon) {
        shareIcon.textContent = 'progress_activity';
        shareIcon.classList.add('animate-spin');
        shareBtn.style.pointerEvents = 'none';
    }

    // Show loading state on outro share button (if clicked from there)
    if (clickedButton && outroShareText && outroShareLoader) {
        outroShareText.textContent = '';
        outroShareLoader.classList.remove('hidden');
        clickedButton.style.pointerEvents = 'none';
    }

    // Set timeout to revert after 5 seconds
    const revertTimeout = setTimeout(() => {
        // Revert navbar icon
        if (shareBtn && shareIcon) {
            shareIcon.textContent = 'share';
            shareIcon.classList.remove('animate-spin');
            shareBtn.style.pointerEvents = '';
        }
        // Revert outro button
        if (clickedButton && outroShareText && outroShareLoader) {
            outroShareText.textContent = 'Share with Friends';
            outroShareLoader.classList.add('hidden');
            clickedButton.style.pointerEvents = '';
        }
    }, 5000);

    try {
        // Generate appropriate image
        let canvas;
        if (isInQuestionState()) {
            canvas = await generateQuestionShareImage();
        } else if (isInOutroState()) {
            canvas = await generateOutroShareImage();
        } else {
            canvas = await generateGenericShareImage();
        }

        if (!canvas) {
            throw new Error('Failed to generate share image');
        }

        showRecapDialog('Your share card', 'Preview created with sample activity. Nothing has been sent.', canvas.toDataURL('image/png'));
    } catch (error) {
        if (error.name !== 'AbortError') {
            showRecapDialog('Preview unavailable', 'Please try again once the artwork has loaded.');
        }
    }
}

// Initialize share button
if (shareBtn) {
    shareBtn.addEventListener('click', handleShare);
}

// Initialize outro share button
const outroShareBtn = document.querySelector('.outro-share-btn');
if (outroShareBtn) {
    outroShareBtn.addEventListener('click', handleShare);
}

// Start the app after preloading assets (minimum 1.6s display time)
const minDisplayTime = new Promise(resolve => setTimeout(resolve, 1600));

const goBack = () => {
    if (window.parent !== window) window.parent.postMessage({ type: 'recap:home' }, window.location.origin);
    else window.location.href = '../../index.html';
};
const openDeepLink = () => showRecapDialog('Explore PayZapp', 'This is a design preview. This action would open the relevant screen in the PayZapp app.');

// Start rotating loader messages immediately
startLoaderMessages();

Promise.all([preloadAssets(), minDisplayTime]).then(async () => {
    try {
        await init();
        hidePreloader();
        initSnowfall();
        animateIntroElements();
        if (recapScene !== 'intro') mountRecapScene(recapScene);
    } catch (error) {
        // Error screen is already shown by init()
        hidePreloader();
        console.error('Initialization failed:', error);
    }
});

// Scene entry uses the same original renderers as the full flipbook journey.
function mountRecapScene(scene) {
    if (peepTimeline) peepTimeline.kill();
    gsap.killTweensOf(introCover);
    introCover.style.display = 'none';
    introContentBelow.style.display = 'none';
    gsap.set('.notepad-anim', { opacity: 1, y: 0 });
    gsap.set('.notepad', { rotation: 0 });
    notepad.classList.add('expanded');
    stage.classList.add('expanded');
    gsap.set('.top-half, .bottom-half, #brand-logo', { opacity: 1 });
    hideSnowfall();
    currentQuestionIndex = scene === 'summary' ? questions.length : 0;
    clearCard(activeCard); clearCard(nextCard);
    gsap.set(activeCard, { rotationX: 0, zIndex: 3 });
    gsap.set(nextCard, { rotationX: 0, zIndex: 2 });
    renderTopContent(questions[currentQuestionIndex] || null);
    renderCard(activeCard, currentQuestionIndex);
    renderCard(nextCard, Math.min(currentQuestionIndex + 1, questions.length));
    if (scene === 'summary') {
        topContent.style.backgroundImage = 'url(assets/outro-top.png)';
        topContent.style.backgroundSize = 'cover';
        topContent.style.backgroundPosition = 'center bottom';
        updateSwipeHintForOutro();
        startConfetti();
    }
    enableTopHalfSwipeBack();
}

function showRecapDialog(title, message, imageURL) {
    stopAutoFlipTimer();
    const previousFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'recap-dialog';
    const heading = document.createElement('h2'); heading.textContent = title;
    heading.id = 'recap-dialog-title'; dialog.setAttribute('aria-labelledby', heading.id);
    const copy = document.createElement('p'); copy.textContent = message;
    dialog.append(heading, copy);
    if (imageURL) { const img = document.createElement('img'); img.src = imageURL; img.alt = 'Your PayZapp Recap share card with sample activity'; dialog.append(img); }
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close preview';
    close.onclick = () => dialog.close(); dialog.append(close);
    dialog.addEventListener('close', () => { dialog.remove(); previousFocus?.focus(); });
    document.body.append(dialog); dialog.showModal(); close.focus();
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        [correctSound, wrongSound, pageFlipAudio].forEach(sound => sound.pause());
        stopAutoFlipTimer(); gsap.globalTimeline.pause();
    } else gsap.globalTimeline.resume();
});
window.addEventListener('pagehide', () => {
    [correctSound, wrongSound, pageFlipAudio].forEach(sound => sound.pause());
    stopAutoFlipTimer();
});
document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"]')) {
        event.preventDefault(); event.target.click(); return;
    }
    if (event.key === 'ArrowUp' && hasAnsweredCurrentQuestion && !isFlipping && currentQuestionIndex < questions.length) {
        event.preventDefault(); flipPage();
    } else if (event.key === 'ArrowDown' && !isFlipping && introCover.style.display === 'none') {
        event.preventDefault(); flipPageBack();
    }
});
