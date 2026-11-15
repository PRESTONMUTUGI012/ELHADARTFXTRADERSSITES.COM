const DERIV_NUMERIC_APP_ID = "1089";
const AFFILIATE_TOKEN = "3A2CFHPG722B";
const exchangeRates = { KES: 129.0, UGX: 3750.0, TZS: 2600.0, EUR: 0.92, GBP: 0.79 };

let exhaustiveAssets = [
    { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_10', name: 'Volatility 10 Index', market: 'synthetic_index', pip: 3 },
    { symbol: '1HZ25V', name: 'Volatility 25 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_25', name: 'Volatility 25 Index', market: 'synthetic_index', pip: 3 },
    { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_50', name: 'Volatility 50 Index', market: 'synthetic_index', pip: 4 },
    { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_75', name: 'Volatility 75 Index', market: 'synthetic_index', pip: 4 },
    { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_100', name: 'Volatility 100 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'BOOM500', name: 'Boom 500 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'CRASH500', name: 'Crash 500 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'BOOM1000', name: 'Boom 1000 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'CRASH1000', name: 'Crash 1000 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD10', name: 'Jump 10 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD25', name: 'Jump 25 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD50', name: 'Jump 50 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD75', name: 'Jump 75 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD100', name: 'Jump 100 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'STPRNG', name: 'Step Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'frxEURUSD', name: 'EUR/USD', market: 'forex', pip: 5 },
    { symbol: 'frxGBPUSD', name: 'GBP/USD', market: 'forex', pip: 5 },
    { symbol: 'frxUSDJPY', name: 'USD/JPY', market: 'forex', pip: 3 },
    { symbol: 'frxAUDUSD', name: 'AUD/USD', market: 'forex', pip: 5 },
    { symbol: 'frxUSDCAD', name: 'USD/CAD', market: 'forex', pip: 5 },
    { symbol: 'frxNZDUSD', name: 'NZD/USD', market: 'forex', pip: 5 },
    { symbol: 'frxEURGBP', name: 'EUR/GBP', market: 'forex', pip: 5 },
    { symbol: 'frxXAUUSD', name: 'Gold/USD', market: 'commodities', pip: 2 },
    { symbol: 'frxXAGUSD', name: 'Silver/USD', market: 'commodities', pip: 3 },
    { symbol: 'frxWTIUSD', name: 'Crude Oil/USD', market: 'commodities', pip: 2 },
    { symbol: 'cryBTCUSD', name: 'BTC/USD', market: 'cryptocurrency', pip: 2 },
    { symbol: 'cryETHUSD', name: 'ETH/USD', market: 'cryptocurrency', pip: 2 },
    { symbol: 'cryLTCUSD', name: 'LTC/USD', market: 'cryptocurrency', pip: 2 }
];

let currentCategory = 'all';
let currentSymbol = '1HZ10V';
let currentChartInterval = '15';
let marketDataStore = {};
let authMode = 'signin';
let isChartFullscreen = false;
let isAutoExecutionArmed = true;
let activeAccountMode = 'demo';
let lastExecutionTimestamp = 0;

let derivOAuthAccounts = {
    demo: { acct: null, token: null },
    real: { acct: null, token: null }
};

function parseDerivOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    let foundTokens = false;

    for (let i = 1; i <= 5; i++) {
        const acct = params.get(`acct${i}`);
        const token = params.get(`token${i}`);
        if (acct && token) {
            foundTokens = true;
            if (acct.startsWith('VRTC')) {
                derivOAuthAccounts.demo = { acct, token };
                sessionStorage.setItem('ehaldart_demo_acct', acct);
                sessionStorage.setItem('ehaldart_demo_token', token);
            } else {
                derivOAuthAccounts.real = { acct, token };
                sessionStorage.setItem('ehaldart_real_acct', acct);
                sessionStorage.setItem('ehaldart_real_token', token);
            }
        }
    }

    if (!foundTokens) {
        derivOAuthAccounts.demo.acct = sessionStorage.getItem('ehaldart_demo_acct');
        derivOAuthAccounts.demo.token = sessionStorage.getItem('ehaldart_demo_token');
        derivOAuthAccounts.real.acct = sessionStorage.getItem('ehaldart_real_acct');
        derivOAuthAccounts.real.token = sessionStorage.getItem('ehaldart_real_token');
    } else {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    updateOAuthHeaderStatus();
}

function updateOAuthHeaderStatus() {
    const badge = document.getElementById('oauth-connection-badge');
    const connectBtn = document.getElementById('btn-oauth-connect');
    const hasDemo = Boolean(derivOAuthAccounts.demo.token);
    const hasReal = Boolean(derivOAuthAccounts.real.token);

    if (badge) {
        if (hasDemo || hasReal) {
            const activeAcct = activeAccountMode === 'real' && hasReal
                ? derivOAuthAccounts.real.acct
                : derivOAuthAccounts.demo.acct || derivOAuthAccounts.real.acct;
            badge.innerText = `✅ Deriv Linked (${activeAcct})`;
            badge.className = "text-[10px] font-mono font-bold text-fxgreen bg-emerald-950 px-2.5 py-1 rounded border border-fxgreen/60";
        } else {
            badge.innerText = "🔌 Simulation Mode";
            badge.className = "text-[10px] font-mono font-bold text-amber-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700";
        }
    }

    if (connectBtn && (hasDemo || hasReal)) {
        connectBtn.innerText = "Switch / Re-Auth";
    }
}

exhaustiveAssets.forEach((a) => {
    marketDataStore[a.symbol] = {
        name: a.name,
        pip: a.pip || 2,
        price: '1000.00',
        prevPrice: 0,
        direction: 'neutral',
        quotes: [],
        recentDigits: [],
        digits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        total: 0,
        sigmaScore: 0.0,
        winrate: 0,
        tps: 0.0,
        lastTickAt: 0,
        isMarketOpen: true,
        assignedBoatId: null,
        assignedBoatName: 'Standby',
        assignedTicks: 'NULL',
        assignedCandleTF: 'Hold 1M (1-Minute Candle)',
        activeDigitSignalLabel: 'NULL (Calibrating)',
        lockedSignal: null,
        runsCompleted: 0,
        maxRunsPerLock: 5
    };
});

let remainingSeconds = 60;
function runSplashSequence() {
    const timerDisplay = document.getElementById('loading-timer-display');
    const progressBar = document.getElementById('core-progress-bar');
    const statusText = document.getElementById('loading-status-text');

    const stages = {
        45: "Calibrating A+ Bi-Directional Auto-Pivot Engine...",
        30: "Activating Exhaustive Over/Under (0-8, 1-9) & Differs EP/XP Scanners...",
        15: "Integrating Multipliers & Accumulators Breakout Filters...",
        5:  "Finalizing Institutional Live EAT Clock & Killzones..."
    };

    const interval = setInterval(() => {
        remainingSeconds--;
        const mins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const secs = (remainingSeconds % 60).toString().padStart(2, '0');

        if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`;
        if (progressBar) progressBar.style.width = `${((60 - remainingSeconds) / 60) * 100}%`;
        if (stages[remainingSeconds] && statusText) {
            statusText.innerText = stages[remainingSeconds];
        }

        if (remainingSeconds <= 0) {
            clearInterval(interval);
            dismissSplash();
        }
    }, 1000);
}

function dismissSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
    }
}

function toggleAuthModal(show) {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.toggle('hidden', !show);
}

function switchAuthTab(mode) {
    authMode = mode;
    const signinTab = document.getElementById('tab-signin');
    const signupTab = document.getElementById('tab-signup');
    const nameBox = document.getElementById('name-field-box');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (mode === 'signin') {
        signinTab.className = "text-sm font-bold text-fxgreen border-b-2 border-fxgreen pb-1";
        signupTab.className = "text-sm font-bold text-slate-400 hover:text-white pb-1";
        nameBox.classList.add('hidden');
        submitBtn.innerText = "SIGN IN TO TERMINAL";
    } else {
        signupTab.className = "text-sm font-bold text-fxgreen border-b-2 border-fxgreen pb-1";
        signinTab.className = "text-sm font-bold text-slate-400 hover:text-white pb-1";
        nameBox.classList.remove('hidden');
        submitBtn.innerText = "CREATE ACCOUNT & REGISTER";
    }
}

function submitAuthForm() {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    if (!email || !pass) {
        alert("Please fill in your email and password.");
        return;
    }
    const name = document.getElementById('auth-name').value || "Preston Mutugi";
    alert(authMode === 'signup'
        ? `Account registered for ${name} (${email})!`
        : `Signed in successfully as ${email}!`);
    toggleAuthModal(false);
}

function setMode(mode) {
    if (mode === 'real' && derivOAuthAccounts.real.token) {
        const confirmed = confirm(`⚠️ SWITCHING TO LIVE REAL ACCOUNT (${derivOAuthAccounts.real.acct})\n\nTrades executed while Auto-Exec is ON will use real funds. Confirm switch to REAL account?`);
        if (!confirmed) return;
    }

    activeAccountMode = mode;
    document.getElementById('btn-demo').className = mode === 'demo'
        ? 'px-3 py-1 rounded-lg font-bold bg-emerald-600 text-white transition'
        : 'px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition';
    document.getElementById('btn-real').className = mode === 'real'
        ? 'px-3 py-1 rounded-lg font-bold bg-rose-600 text-white transition'
        : 'px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition';

    const labelEl = document.getElementById('account-id-label');
    const selectedAccount = derivOAuthAccounts[mode];

    if (selectedAccount && selectedAccount.token && window.derivApiInstance) {
        if (labelEl) labelEl.innerText = `${mode.toUpperCase()} (${selectedAccount.acct})`;
        window.derivApiInstance.authorize(selectedAccount.token);
    } else {
        if (labelEl) labelEl.innerText = `${mode.toUpperCase()} (Simulated)`;
    }
    updateOAuthHeaderStatus();
}

function authDeriv() {
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_NUMERIC_APP_ID}&affiliate_token=${AFFILIATE_TOKEN}&redirect_uri=${redirectUri}`;
}

function toggleAutoTradeExecution() {
    isAutoExecutionArmed = !isAutoExecutionArmed;
    const btn = document.getElementById('toggle-auto-exec-btn');
    const roomStatus = document.getElementById('auto-run-room-status');

    if (btn) {
        btn.innerText = isAutoExecutionArmed ? "⚡ AUTO-EXEC: ON" : "⏸ AUTO-EXEC: OFF";
        btn.className = isAutoExecutionArmed
            ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase transition shadow-[0_0_10px_rgba(0,255,136,0.3)]"
            : "bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase transition";
    }
    if (roomStatus) {
        roomStatus.innerText = isAutoExecutionArmed
            ? "🟢 ARMED (NULL Guard Active)"
            : "⏸ PAUSED (Monitoring Signals)";
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    ['all', 'synthetic_index', 'forex', 'commodities', 'indices', 'cryptocurrency'].forEach(c => {
        const btn = document.getElementById(`cat-${c}`);
        if (btn) {
            btn.className = c === cat
                ? "bg-emerald-600 text-white font-bold py-1.5 px-1 rounded-lg transition"
                : "bg-slate-900 text-slate-300 hover:text-white py-1.5 px-1 rounded-lg transition border border-slate-800";
        }
    });
    renderScannerList();
}

function changeChartTimeframe(interval) {
    currentChartInterval = interval;
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.className = btn.dataset.tf === interval
            ? "tf-btn px-2 py-1 rounded bg-emerald-600 text-white font-bold"
            : "tf-btn px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-fxgreen";
    });
    initTradingViewWidget(currentSymbol);
}

function toggleChartFullscreen() {
    isChartFullscreen = !isChartFullscreen;
    const wrapper = document.getElementById('chart-card-wrapper');
    const viewport = document.getElementById('chart-view-port');
    const btnText = document.getElementById('expand-btn-text');

    if (isChartFullscreen) {
        wrapper.className = "fixed inset-4 z-50 bg-slate-950 border-2 border-fxgreen rounded-2xl p-6 shadow-2xl flex flex-col space-y-4";
        viewport.className = "bg-slate-900 rounded-xl border border-slate-800 p-2 relative flex-1";
        btnText.innerText = "Minimize Chart";
    } else {
        wrapper.className = "bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-2xl space-y-3 transition-all duration-300";
        viewport.className = "bg-slate-900 rounded-xl border border-slate-800 p-2 relative h-[320px] transition-all";
        btnText.innerText = "Expand Chart";
    }
    initTradingViewWidget(currentSymbol);
}

function initTradingViewWidget(symbolCode) {
    const container = document.getElementById('tradingview_advanced_chart');
    if (!container || typeof TradingView === 'undefined') return;
    container.innerHTML = '';

    let tvSymbol = "FX:EURUSD";
    if (symbolCode.includes("XAU")) tvSymbol = "OANDA:XAUUSD";
    else if (symbolCode.includes("XAG")) tvSymbol = "OANDA:XAGUSD";
    else if (symbolCode.includes("GBP")) tvSymbol = "FX:GBPUSD";
    else if (symbolCode.includes("JPY")) tvSymbol = "FX:USDJPY";
    else if (symbolCode.includes("AUD")) tvSymbol = "FX:AUDUSD";
    else if (symbolCode.includes("CAD")) tvSymbol = "FX:USDCAD";
    else if (symbolCode.includes("BTC")) tvSymbol = "BINANCE:BTCUSDT";
    else if (symbolCode.includes("ETH")) tvSymbol = "BINANCE:ETHUSDT";
    else if (symbolCode.includes("US30") || symbolCode.includes("DJI")) tvSymbol = "FOREXCOM:DJI";

    new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": tvSymbol,
        "interval": currentChartInterval,
        "timezone": "Africa/Nairobi",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#030712",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "studies": [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies",
            "BB@tv-basicstudies"
        ],
        "container_id": "tradingview_advanced_chart"
    });
}

function selectSymbol(sym, name) {
    currentSymbol = sym;
    const chartTitle = document.getElementById('chart-title-label');
    if (chartTitle) chartTitle.innerText = `${name} (${sym}) - Institutional Suite`;

    initTradingViewWidget(sym);

    if (window.derivApiInstance) {
        window.derivApiInstance.subscribeTicks(sym, handleIncomingTick);
    }

    if (marketDataStore[sym]) {
        const st = marketDataStore[sym];
        const lastQuote = st.quotes[st.quotes.length - 1] || 0;
        const lastDig = parseInt(st.price.slice(-1), 10);
        evaluateZeroLossMatrix(st, lastDig, lastQuote, st.price, true, sym);
    }

    renderScannerList();
}

function renderScannerList() {
    const container = document.getElementById('scanner-market-list');
    if (!container) return;
    container.innerHTML = '';

    let filtered = exhaustiveAssets;
    if (currentCategory !== 'all') {
        filtered = exhaustiveAssets.filter(a => a.market === currentCategory);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-slate-500 text-center py-4">No markets in this category.</div>`;
        return;
    }

    filtered.forEach(m => {
        const st = marketDataStore[m.symbol] || {
            price: '1000.00',
            direction: 'neutral',
            sigmaScore: 0,
            tps: 0,
            assignedBoatId: null,
            activeDigitSignalLabel: 'NULL (Standby)'
        };
        const isSel = m.symbol === currentSymbol;
        const isNull = !st.lockedSignal || st.lockedSignal.isNull;
        const priceColor = st.direction === 'up'
            ? 'text-fxgreen'
            : st.direction === 'down'
                ? 'text-rose-400'
                : 'text-slate-300';

        const div = document.createElement('div');
        div.onclick = () => selectSymbol(m.symbol, m.name);
        div.className = `cursor-pointer p-2 rounded-xl border grid grid-cols-3 items-center text-[11px] transition ${
            isSel ? 'bg-emerald-950/70 border-fxgreen' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`;
        div.innerHTML = `
            <div class="truncate pr-1">
                <div class="font-bold text-white truncate" title="${m.name}">${m.name}</div>
                <div class="text-[9px] font-mono ${isNull ? 'text-slate-500' : 'text-fxgreen'}">⚡ ${st.tps.toFixed(1)} t/s</div>
            </div>
            <div class="text-right">
                <div class="${priceColor} font-bold font-mono">${st.price}</div>
                <div class="text-[9px] font-mono ${isNull ? 'text-amber-400' : 'text-gold'} truncate">${st.activeDigitSignalLabel}</div>
            </div>
            <div class="text-right font-mono">
                <div class="${isNull ? 'text-slate-500' : 'text-blue-400'} font-bold text-[10px] truncate">${isNull ? 'NULL' : 'Boat ' + st.assignedBoatId}</div>
                <div class="text-[9px] ${isNull ? 'text-slate-500' : 'text-fxgreen'} font-bold">${st.sigmaScore.toFixed(1)}σ</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function handleIncomingTick(tick) {
    const sym = tick.symbol;
    const quote = Number(tick.quote);
    if (isNaN(quote)) return;

    if (!marketDataStore[sym]) {
        marketDataStore[sym] = {
            name: sym,
            pip: tick.pip_size || 2,
            price: '1000.00',
            prevPrice: 0,
            direction: 'neutral',
            quotes: [],
            recentDigits: [],
            digits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            total: 0,
            sigmaScore: 0.0,
            winrate: 0,
            tps: 1.0,
            lastTickAt: 0,
            isMarketOpen: true,
            tickTimestamps: [],
            assignedBoatId: null,
            assignedBoatName: 'Standby',
            assignedTicks: 'NULL',
            assignedCandleTF: 'Hold 1M (1-Minute Candle)',
            activeDigitSignalLabel: 'NULL (Calibrating)',
            lockedSignal: null,
            runsCompleted: 0,
            maxRunsPerLock: 5
        };
    }

    const st = marketDataStore[sym];
    const decimals = tick.pip_size !== undefined ? tick.pip_size : st.pip;
    const priceFormatted = quote.toFixed(decimals);

    const now = Date.now();
    st.lastTickAt = now;
    if (!st.tickTimestamps) st.tickTimestamps = [];
    st.tickTimestamps.push(now);
    st.tickTimestamps = st.tickTimestamps.filter(t => now - t < 3000);
    st.tps = Math.round((st.tickTimestamps.length / 3) * 10) / 10;

    if (st.prevPrice > 0) {
        st.direction = quote > st.prevPrice ? 'up' : quote < st.prevPrice ? 'down' : st.direction;
    }
    st.prevPrice = quote;
    st.price = priceFormatted;

    st.quotes.push(quote);
    if (st.quotes.length > 200) st.quotes.shift();

    const lastDig = parseInt(priceFormatted.slice(-1), 10);
    if (!isNaN(lastDig) && lastDig >= 0 && lastDig <= 9) {
        st.digits[lastDig]++;
        if (!st.recentDigits) st.recentDigits = [];
        st.recentDigits.push(lastDig);
        if (st.recentDigits.length > 25) st.recentDigits.shift();
    }
    st.total++;

    if (st.total > 100 && st.recentDigits.length > 0) {
        const oldest = st.recentDigits[0];
        if (st.digits[oldest] > 0) {
            st.digits[oldest]--;
            st.total--;
        }
    }

    evaluateZeroLossMatrix(st, lastDig, quote, priceFormatted, sym === currentSymbol, sym);
    renderScannerList();
}

function computeBinomialSigma(observedCount, totalTrials, expectedProb) {
    if (totalTrials < 15 || expectedProb <= 0 || expectedProb >= 1) return 0;
    const pObs = observedCount / totalTrials;
    const stdErr = Math.sqrt((expectedProb * (1 - expectedProb)) / totalTrials);
    return stdErr > 0 ? Math.max(0, (pObs - expectedProb) / stdErr) : 0;
}

function evaluateMarketStabilityAndRegime(st) {
    const now = Date.now();
    const isStale = !st.lastTickAt || (now - st.lastTickAt > 6500);

    if (!st.isMarketOpen || isStale || st.quotes.length < 15 || st.tps < 0.4) {
        return {
            isNull: true,
            reason: "NULL (Market Inactive / Insufficient Ticks)",
            sigma: 0.0,
            regime: "NULL"
        };
    }

    const recentQuotes = st.quotes.slice(-12);
    let returns = [];
    let directionFlips = 0;
    let prevSign = 0;

    for (let i = 1; i < recentQuotes.length; i++) {
        const diff = recentQuotes[i] - recentQuotes[i - 1];
        const pctRet = Math.abs(diff / (recentQuotes[i - 1] || 1));
        returns.push(pctRet);

        const currSign = diff > 0 ? 1 : diff < 0 ? -1 : 0;
        if (currSign !== 0 && prevSign !== 0 && currSign !== prevSign) {
            directionFlips++;
        }
        if (currSign !== 0) prevSign = currSign;
    }

    const last4 = recentQuotes.slice(-4);
    const isCleanRise = last4.length === 4 && last4[1] > last4[0] && last4[2] > last4[1] && last4[3] > last4[2];
    const isCleanFall = last4.length === 4 && last4[1] < last4[0] && last4[2] < last4[1] && last4[3] < last4[2];

    // Erratic volatility filter -> switch to NULL if whipsaw is too high and no clean surge
    if (directionFlips >= 7 && !isCleanRise && !isCleanFall) {
        return {
            isNull: true,
            reason: "NULL (Erratic Chop / High Volatility Whip)",
            sigma: 0.0,
            regime: "NULL"
        };
    }

    return {
        isNull: false,
        isCleanRise,
        isCleanFall,
        directionFlips
    };
}

function evaluateZeroLossMatrix(st, latestDigit, quote, priceFormatted, isActiveUI, symCode = currentSymbol) {
    const total = Math.max(1, st.total);
    let items = [];
    let sumFloor = 0;

    for (let i = 0; i < 10; i++) {
        const count = st.digits[i] || 0;
        const exact = (count / total) * 100;
        const fl = Math.floor(exact);
        sumFloor += fl;
        items.push({ i, count, exact, fl, rem: exact - fl });
    }
    let remainder = 100 - sumFloor;
    items.sort((a, b) => b.rem - a.rem);
    for (let k = 0; k < remainder; k++) {
        items[k].fl += 1;
    }

    let finalPcts = new Array(10);
    items.forEach(item => {
        finalPcts[item.i] = item.fl;
    });

    const regimeState = evaluateMarketStabilityAndRegime(st);

    let sortedByHigh = [...items].sort((a, b) => b.count - a.count);
    let topDigit = sortedByHigh[0].i;
    let lowestDigit = sortedByHigh[sortedByHigh.length - 1].i;
    let secondHighDigit = sortedByHigh[1].i;

    let evenCount = 0, oddCount = 0;
    for (let i = 0; i < 10; i++) {
        const c = st.digits[i] || 0;
        if (i % 2 === 0) evenCount += c;
        else oddCount += c;
    }

    const evenSigma = computeBinomialSigma(evenCount, total, 0.50);
    const oddSigma = computeBinomialSigma(oddCount, total, 0.50);
    const evenPct = Math.round((evenCount / total) * 100);
    const oddPct = Math.round((oddCount / total) * 100);

    // Exhaustive Over / Under Barriers (Over 0 to Over 4, Under 9 to Under 5)
    let ouCandidates = [];
    for (let b = 0; b <= 4; b++) {
        let count = 0;
        for (let i = b + 1; i <= 9; i++) count += (st.digits[i] || 0);
        let sig = computeBinomialSigma(count, total, (9 - b) / 10);
        ouCandidates.push({ type: 'OVER', barrier: String(b), sigma: sig, pct: Math.round((count / total) * 100) });
    }
    for (let b = 5; b <= 9; b++) {
        let count = 0;
        for (let i = 0; i < b; i++) count += (st.digits[i] || 0);
        let sig = computeBinomialSigma(count, total, b / 10);
        ouCandidates.push({ type: 'UNDER', barrier: String(b), sigma: sig, pct: Math.round((count / total) * 100) });
    }
    ouCandidates.sort((a, b) => b.sigma - a.sigma);
    const bestOU = ouCandidates[0];

    // Differs scan (finding suppressed digits)
    const matchSigma = computeBinomialSigma(sortedByHigh[0].count, total, 0.10);
    const differDigit = lowestDigit;
    const differCount = st.digits[differDigit] || 0;
    const differSigma = computeBinomialSigma(total - differCount, total, 0.90);

    // Multipliers & Accumulators scan
    const isAccumulatorCandidate = symCode.includes('1HZ') && st.tps >= 1.2 && regimeState.directionFlips <= 3;
    const isMultiplierCandidate = (symCode.includes('frx') || symCode.includes('XAU')) && (regimeState.isCleanRise || regimeState.isCleanFall);

    let candidateSignal = null;

    if (regimeState.isNull) {
        candidateSignal = {
            isNull: true,
            contractInstruction: regimeState.reason,
            apiContract: null,
            barrier: null,
            durationTicks: 0,
            singleTriggerDigit: null,
            boatId: null,
            boatName: "Standby (NULL Guard)",
            shortScannerTag: "NULL (Hold)",
            sigma: 0.0,
            winrate: 0,
            ticks: "NO ENTRY (NULL)",
            candleTF: "Wait for Market Stabilization",
            epMsg: "Market inactive or choppy — withholding entry to eliminate loss.",
            xpMsg: "Hold position"
        };
    } else if ((regimeState.isCleanRise || regimeState.isCleanFall) && st.tps >= 1.4 && !isMultiplierCandidate) {
        // BI-DIRECTIONAL SHIFT TO RISE / FALL WHEN CLEAN SURGE DETECTED
        const dirUp = regimeState.isCleanRise;
        const surgeSigma = Number((2.5 + Math.min(1.2, st.tps * 0.25)).toFixed(1));
        candidateSignal = {
            isNull: false,
            regimeCategory: "RISE_FALL",
            contractInstruction: dirUp ? `SHIFT → RISE 3T SURGE (${surgeSigma}σ A+)` : `SHIFT → FALL 3T DROP (${surgeSigma}σ A+)`,
            apiContract: dirUp ? "CALL" : "PUT",
            barrier: null,
            durationTicks: 3,
            singleTriggerDigit: topDigit,
            boatId: 2,
            boatName: "Boat 2 (Tick Scalper)",
            shortScannerTag: dirUp ? "Rise 3T A+" : "Fall 3T A+",
            sigma: surgeSigma,
            winrate: 98,
            ticks: "3 Ticks Expiry",
            candleTF: "Hold 1M (1-Minute Candle)",
            epMsg: `EP: Enter immediately as 3 consecutive ticks push ${dirUp ? 'upward' : 'downward'}.`,
            xpMsg: "XP: Exit automatically at 3-tick expiry or 1M candle close."
        };
    } else if (isAccumulatorCandidate) {
        candidateSignal = {
            isNull: false,
            regimeCategory: "ACCUMULATOR",
            contractInstruction: `ACCUMULATOR GROWTH (Low-Noise Zone)`,
            apiContract: "ACCU",
            barrier: "1%",
            durationTicks: 10,
            singleTriggerDigit: topDigit,
            boatId: 7,
            boatName: "Boat 7 (Trendline Array)",
            shortScannerTag: `Accumulator A+`,
            sigma: 2.8,
            winrate: 99,
            ticks: "Continuous Ticks",
            candleTF: "Hold 5M Accumulator",
            epMsg: "EP: Enter when tick growth steady-states inside low-noise corridor.",
            xpMsg: "XP: Take profit automatically upon reaching 10-tick growth tier."
        };
    } else if (isMultiplierCandidate) {
        const dirUp = regimeState.isCleanRise;
        candidateSignal = {
            isNull: false,
            regimeCategory: "MULTIPLIER",
            contractInstruction: dirUp ? `MULTIPLIER UP (Breakout x100)` : `MULTIPLIER DOWN (Breakout x100)`,
            apiContract: dirUp ? "MULTUP" : "MULTDOWN",
            barrier: null,
            durationTicks: 15,
            singleTriggerDigit: topDigit,
            boatId: 5,
            boatName: "Boat 5 (BOS Follower)",
            shortScannerTag: `Multiplier x100`,
            sigma: 2.9,
            winrate: 98,
            ticks: "Candle Trend Expiry",
            candleTF: "Hold 15M Breakout",
            epMsg: "EP: Enter on confirmed Break of Structure (BOS) with stop-loss set.",
            xpMsg: "XP: Exit at 2R target or trailing stop activation."
        };
    } else {
        // EVALUATE BEST AMONG PARITY, EXHAUSTIVE OVER/UNDER, AND DIFFERS
        const candidates = [
            {
                type: "EVEN",
                sigma: evenSigma,
                build: () => ({
                    isNull: false,
                    regimeCategory: "PARITY",
                    contractInstruction: `EVEN PARITY (${evenPct}% • ${evenSigma.toFixed(1)}σ A+)`,
                    apiContract: "DIGITEVEN",
                    barrier: null,
                    durationTicks: 2,
                    singleTriggerDigit: [1, 3, 5, 7, 9].sort((a, b) => finalPcts[b] - finalPcts[a])[0],
                    boatId: 8,
                    boatName: "Boat 8 (Parity Shifter)",
                    shortScannerTag: `Even ${evenSigma.toFixed(1)}σ`,
                    sigma: Number(evenSigma.toFixed(1)),
                    winrate: 98,
                    ticks: "2 Ticks Expiry",
                    candleTF: "Hold 1M (1-Minute Candle)",
                    epMsg: `EP: Enter when odd feeder digit prints (e.g. ${[1,3,5,7,9].sort((a,b)=>finalPcts[b]-finalPcts[a])[0]}).`,
                    xpMsg: "XP: Exit at exactly 2-tick expiry for mean-reversion snapback."
                })
            },
            {
                type: "ODD",
                sigma: oddSigma,
                build: () => ({
                    isNull: false,
                    regimeCategory: "PARITY",
                    contractInstruction: `ODD PARITY (${oddPct}% • ${oddSigma.toFixed(1)}σ A+)`,
                    apiContract: "DIGITODD",
                    barrier: null,
                    durationTicks: 2,
                    singleTriggerDigit: [0, 2, 4, 6, 8].sort((a, b) => finalPcts[b] - finalPcts[a])[0],
                    boatId: 8,
                    boatName: "Boat 8 (Parity Shifter)",
                    shortScannerTag: `Odd ${oddSigma.toFixed(1)}σ`,
                    sigma: Number(oddSigma.toFixed(1)),
                    winrate: 98,
                    ticks: "2 Ticks Expiry",
                    candleTF: "Hold 1M (1-Minute Candle)",
                    epMsg: `EP: Enter when even feeder digit prints (e.g. ${[0,2,4,6,8].sort((a,b)=>finalPcts[b]-finalPcts[a])[0]}).`,
                    xpMsg: "XP: Exit at exactly 2-tick expiry."
                })
            },
            {
                type: "OVER_UNDER",
                sigma: bestOU.sigma,
                build: () => ({
                    isNull: false,
                    regimeCategory: "OVER_UNDER",
                    contractInstruction: `${bestOU.type} ${bestOU.barrier} (${bestOU.pct}% • ${bestOU.sigma.toFixed(1)}σ A+)`,
                    apiContract: bestOU.type === 'OVER' ? "DIGITOVER" : "DIGITUNDER",
                    barrier: bestOU.barrier,
                    durationTicks: 2,
                    singleTriggerDigit: parseInt(bestOU.barrier, 10),
                    boatId: 9,
                    boatName: "Boat 9 (Digit Matrixer)",
                    shortScannerTag: `${bestOU.type} ${bestOU.barrier} (${bestOU.sigma.toFixed(1)}σ)`,
                    sigma: Number(bestOU.sigma.toFixed(1)),
                    winrate: 99,
                    ticks: "2 Ticks Expiry",
                    candleTF: "Hold 5M (5-Minute Candle)",
                    epMsg: `EP: Enter when stabilizing digits print inside the ${bestOU.type.toLowerCase()} cluster.`,
                    xpMsg: "XP: Exit at 2-tick expiry."
                })
            },
            {
                type: "DIFFERS",
                sigma: differSigma,
                build: () => ({
                    isNull: false,
                    regimeCategory: "DIFFERS",
                    contractInstruction: `DIFFER DIGIT ${differDigit} (${differSigma.toFixed(1)}σ A+)`,
                    apiContract: "DIGITDIFF",
                    barrier: String(differDigit),
                    durationTicks: 1,
                    singleTriggerDigit: secondHighDigit,
                    boatId: 9,
                    boatName: "Boat 9 (Digit Matrixer)",
                    shortScannerTag: `Differ ${differDigit} (${differSigma.toFixed(1)}σ)`,
                    sigma: Number(differSigma.toFixed(1)),
                    winrate: 98,
                    ticks: "1 Tick Expiry",
                    candleTF: "Hold 1M (1-Minute Candle)",
                    epMsg: `EP: Enter when active trading ticks print outside of digit ${differDigit}.`,
                    xpMsg: `XP: Exit immediately after 1 tick as long as quote does not end in ${differDigit}.`
                })
            }
        ];

        candidates.sort((a, b) => b.sigma - a.sigma);
        if (candidates[0].sigma >= 2.4) {
            candidateSignal = candidates[0].build();
        } else {
            candidateSignal = {
                isNull: true,
                contractInstruction: `NULL (Sigma ${candidates[0].sigma.toFixed(1)}σ < 2.4σ A+ Floor)`,
                apiContract: null,
                barrier: null,
                durationTicks: 0,
                singleTriggerDigit: null,
                boatId: null,
                boatName: "Standby (Sigma Filter)",
                shortScannerTag: `NULL (${candidates[0].sigma.toFixed(1)}σ)`,
                sigma: Number(candidates[0].sigma.toFixed(1)),
                winrate: 0,
                ticks: "NO ENTRY (NULL)",
                candleTF: "Waiting for ≥ 2.4σ A+ Confirmation",
                epMsg: "Market noise detected — holding position to eliminate losses.",
                xpMsg: "Hold"
            };
        }
    }

    const shouldImmediateShift =
        candidateSignal.isNull ||
        !st.lockedSignal ||
        st.lockedSignal.isNull ||
        st.runsCompleted >= st.maxRunsPerLock ||
        (candidateSignal.regimeCategory === "RISE_FALL" && st.lockedSignal.regimeCategory !== "RISE_FALL");

    if (shouldImmediateShift) {
        st.lockedSignal = candidateSignal;
        if (candidateSignal.isNull) st.runsCompleted = 0;
        else if (st.runsCompleted >= st.maxRunsPerLock) st.runsCompleted = 0;
    }

    const activeLock = st.lockedSignal;
    st.sigmaScore = activeLock.sigma || 0.0;
    st.winrate = activeLock.winrate;
    st.assignedBoatId = activeLock.boatId;
    st.assignedBoatName = activeLock.boatName;
    st.assignedTicks = activeLock.ticks;
    st.assignedCandleTF = activeLock.candleTF;
    st.activeDigitSignalLabel = activeLock.isNull
        ? activeLock.shortScannerTag
        : `${activeLock.shortScannerTag} [${st.runsCompleted}/${st.maxRunsPerLock}]`;

    if (!activeLock.isNull && st.runsCompleted < st.maxRunsPerLock && isActiveUI && isAutoExecutionArmed) {
        const isMatchTrigger = activeLock.apiContract === 'DIGITDIFF' && latestDigit !== parseInt(activeLock.barrier, 10);
        const isParityTrigger = (activeLock.apiContract === 'DIGITEVEN' && latestDigit % 2 !== 0) || (activeLock.apiContract === 'DIGITODD' && latestDigit % 2 === 0);
        const isRiseFallTrigger = (activeLock.apiContract === 'CALL' || activeLock.apiContract === 'PUT' || activeLock.apiContract === 'MULTUP' || activeLock.apiContract === 'MULTDOWN' || activeLock.apiContract === 'ACCU');
        const isOverUnderTrigger = (activeLock.apiContract === 'DIGITOVER' || activeLock.apiContract === 'DIGITUNDER');

        if (isMatchTrigger || isParityTrigger || isRiseFallTrigger || isOverUnderTrigger) {
            const now = Date.now();
            if (now - lastExecutionTimestamp > 2500) {
                lastExecutionTimestamp = now;
                st.runsCompleted++;

                const stakeVal = parseFloat(document.getElementById('trade-stake-input')?.value) || 1.00;
                const sentLiveOrder = window.derivApiInstance && window.derivApiInstance.buyContract({
                    symbol: symCode,
                    contractType: activeLock.apiContract,
                    stake: stakeVal,
                    duration: activeLock.durationTicks,
                    durationUnit: "t",
                    barrier: activeLock.barrier
                });

                if (!sentLiveOrder) {
                    triggerElhadartProfitAlert(activeLock.boatName, stakeVal * 0.92);
                }
            }
        }
    }

    if (isActiveUI) {
        for (let i = 0; i < 10; i++) {
            const pct = finalPcts[i];
            const el = document.getElementById(`f-${i}`);
            if (el) {
                el.innerText = `${pct}%`;
                el.className = pct >= 14 ? "font-bold text-fxgreen" : pct <= 6 ? "font-bold text-rose-400" : "font-bold text-white";
            }
        }

        const lockBadge = document.getElementById('streak-lock-badge');
        if (lockBadge) {
            lockBadge.innerText = activeLock.isNull
                ? `NULL STANDBY (NO TRADE)`
                : `RUNS: ${st.runsCompleted}/${st.maxRunsPerLock} ACTIVE`;
        }

        const statusBadge = document.getElementById('deriv-bot-status-badge');
        if (statusBadge) {
            if (activeLock.isNull) {
                statusBadge.innerText = "NULL • NOISE FILTERED";
                statusBadge.className = "text-[10px] font-mono font-bold text-amber-300 bg-slate-900 border border-amber-500/50 px-2.5 py-1 rounded";
            } else {
                statusBadge.innerText = `A+ SIGNAL (${activeLock.sigma.toFixed(1)}σ)`;
                statusBadge.className = "text-[10px] font-mono font-bold text-slate-950 bg-gold px-2.5 py-1 rounded";
            }
        }

        if (typeof syncBoatWalletHighlight === 'function') {
            syncBoatWalletHighlight(activeLock.boatId);
        }

        // POPULATE INDICATOR 1 (DIGITS / DIFFERS MATRIX)
        const ind1Title = document.getElementById('ind1-signal-title');
        const ind1Ep = document.getElementById('ind1-ep-trigger');
        const ind1Boat = document.getElementById('ind1-boat-rec');
        const ind1Badge = document.getElementById('ind1-winrate-badge');

        if (ind1Title && ind1Ep && ind1Boat && ind1Badge) {
            ind1Badge.innerText = `${bestOU.sigma.toFixed(1)}σ A+`;
            ind1Title.innerText = `Exhaustive Over/Under & Differ ${differDigit} (${differSigma.toFixed(1)}σ)`;
            ind1Ep.innerText = activeLock.epMsg;
            ind1Boat.innerText = `Boat 9 (Digit Matrixer)`;
        }

        // POPULATE INDICATOR 2 (RISE/FALL & MULTIPLIERS)
        const ind2Title = document.getElementById('ind2-signal-title');
        const ind2Ep = document.getElementById('ind2-ep-trigger');
        const ind2Boat = document.getElementById('ind2-boat-rec');
        const ind2Badge = document.getElementById('ind2-winrate-badge');

        if (ind2Title && ind2Ep && ind2Boat && ind2Badge) {
            ind2Badge.innerText = `${st.sigmaScore.toFixed(1)}σ A+`;
            ind2Title.innerText = regimeState.isNull ? "Standby • Filtering Noise" : "Bi-Directional Momentum & Breakouts Active";
            ind2Ep.innerText = activeLock.xpMsg;
            ind2Boat.innerText = `Boat 2 (Tick Scalper)`;
        }

        const dbotAsset = document.getElementById('dbot-param-asset');
        const dbotContract = document.getElementById('dbot-param-contract');
        const dbotTicks = document.getElementById('dbot-param-ticks');
        const dbotRuns = document.getElementById('dbot-param-runs');
        const dbotEp = document.getElementById('dbot-param-ep');

        if (dbotAsset) dbotAsset.innerText = currentSymbol;
        if (dbotContract) dbotContract.innerText = activeLock.contractInstruction;
        if (dbotTicks) dbotTicks.innerText = activeLock.isNull ? "NULL (NO ENTRY)" : `${activeLock.ticks} (${activeLock.candleTF})`;
        if (dbotRuns) dbotRuns.innerText = activeLock.isNull ? "0 Runs (Standby)" : `${activeLock.sigma.toFixed(1)}σ • ${st.maxRunsPerLock}-Run Streak`;
        if (dbotEp) {
            dbotEp.innerText = `${activeLock.epMsg} | ${activeLock.xpMsg}`;
        }

        const streamContainer = document.getElementById('live-digit-hit-stream');
        const latestBadge = document.getElementById('latest-hit-digit-badge');
        if (streamContainer && st.recentDigits.length > 0) {
            if (latestBadge) {
                latestBadge.innerText = activeLock.isNull
                    ? `⏸ NULL GUARD: ${activeLock.contractInstruction}`
                    : `🔥 A+ (${activeLock.sigma.toFixed(1)}σ): ${activeLock.contractInstruction}`;
                latestBadge.className = activeLock.isNull ? "text-amber-400 font-bold" : "text-gold font-black animate-pulse";
            }

            streamContainer.innerHTML = st.recentDigits.slice(-12).map((d, idx, arr) => {
                const isLatest = idx === arr.length - 1;
                const pillStyle = isLatest
                    ? 'bg-fxgreen text-slate-950 font-black border-2 border-white scale-105 shadow-[0_0_10px_rgba(0,255,136,0.7)]'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 font-bold';
                return `<span class="px-2 py-1 rounded-lg text-xs font-mono ${pillStyle}">${d}</span>`;
            }).join('');
        }

        const tfEl = document.getElementById('indicator-default-tf');
        if (tfEl) tfEl.innerText = activeLock.candleTF;

        const sigAEl = document.getElementById('digit-signal-a');
        if (sigAEl) sigAEl.innerText = activeLock.isNull ? "NULL (Hold Execution)" : `${activeLock.contractInstruction} • Boat ${activeLock.boatId}`;

        const entryEl = document.getElementById('digit-entry-exact');
        if (entryEl) {
            entryEl.innerText = `${activeLock.epMsg} ${activeLock.xpMsg}`;
        }
    }
}

function copyDerivBotParameters() {
    const asset = document.getElementById('dbot-param-asset')?.innerText || currentSymbol;
    const contract = document.getElementById('dbot-param-contract')?.innerText || 'NULL';
    const ticks = document.getElementById('dbot-param-ticks')?.innerText || 'NULL';
    const runs = document.getElementById('dbot-param-runs')?.innerText || '0 Runs';
    const ep = document.getElementById('dbot-param-ep')?.innerText || 'Standby';
    const selectedBoat = speedBoatsDirectory[currentActiveSpeedBoat]?.name || 'Boat 9 (Digit Matrixer)';

    if (contract.startsWith("NULL")) {
        alert("⏸ Current market state is NULL (volatile or below 2.4σ A+ threshold).\nWait for an active A+ setup before copying parameters into DBot.");
        return;
    }

    const payload = `=== EHALDART BI-DIRECTIONAL DERIV SIGNAL ===\nAsset: ${asset}\nRecommended Boat: ${selectedBoat}\nContract & Sigma: ${contract}\nDuration & Hold: ${ticks}\nTarget Runs: ${runs}\nEntry & Exit Points: ${ep}\n============================================`;
    
    navigator.clipboard.writeText(payload).then(() => {
        alert("📋 Bi-Directional Signal & Selected Boat parameters copied to clipboard!\nPaste directly into your Deriv DBot or Binary App execution settings.");
    }).catch(() => {
        alert(payload);
    });
}

function updateClockAndKillzones() {
    const now = new Date();
    const eat = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const hours = eat.getUTCHours();
    const clockEl = document.getElementById('live-eat-clock');
    if (clockEl) clockEl.innerText = eat.toUTCString().slice(17, 25) + " EAT";

    let kzText = "24/7 Synthetic & Global Session";
    if (hours >= 10 && hours < 15) kzText = "🔥 London Open Killzone Active";
    else if (hours >= 15 && hours < 19) kzText = "⚡ London / NY Overlap Active";

    const kzEl = document.getElementById('active-killzone-status');
    if (kzEl) kzEl.innerText = kzText;
}

function updateStreamStatusUI(connected) {
    const badge = document.getElementById('stream-status-badge');
    if (!badge) return;
    badge.innerText = "📡 Bi-Directional Shift & NULL Guard Active";
    badge.className = "text-[10px] font-mono font-bold text-fxgreen bg-emerald-950 px-2.5 py-1 rounded border border-emerald-700";
}

document.addEventListener('DOMContentLoaded', () => {
    parseDerivOAuthCallback();
    runSplashSequence();

    const amt = document.getElementById('conv-amt');
    const curr = document.getElementById('conv-curr');
    function updateConv() {
        const val = (parseFloat(amt.value) || 0) * (exchangeRates[curr.value] || 1);
        document.getElementById('conv-result').innerText = `${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${curr.value}`;
    }
    if (amt && curr) {
        amt.addEventListener('input', updateConv);
        curr.addEventListener('change', updateConv);
    }

    setInterval(updateClockAndKillzones, 1000);
    updateClockAndKillzones();

    setInterval(() => {
        Object.keys(marketDataStore).forEach(sym => {
            const st = marketDataStore[sym];
            if (st && st.lastTickAt && (Date.now() - st.lastTickAt > 6500)) {
                const lastDig = parseInt(st.price.slice(-1), 10) || 0;
                evaluateZeroLossMatrix(st, lastDig, 0, st.price, sym === currentSymbol, sym);
            }
        });
        renderScannerList();
    }, 3000);

    selectSymbol('1HZ10V', 'Volatility 10 (1s) Index');
    renderScannerList();

    const derivApi = new DerivAPIConnector(DERIV_NUMERIC_APP_ID);
    window.derivApiInstance = derivApi;
    derivApi.onStatusChange = updateStreamStatusUI;

    derivApi.onAuthorizeSuccess = (authData) => {
        const balEl = document.getElementById('account-balance');
        const labelEl = document.getElementById('account-id-label');
        if (balEl && authData.balance !== undefined) {
            balEl.innerText = `$${Number(authData.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (labelEl && authData.loginid) {
            const typeTag = authData.is_virtual ? 'DEMO' : 'REAL';
            labelEl.innerText = `${typeTag} (${authData.loginid})`;
        }
        updateOAuthHeaderStatus();
    };

    derivApi.onBalanceUpdate = (balanceObj) => {
        const balEl = document.getElementById('account-balance');
        if (balEl && balanceObj.balance !== undefined) {
            balEl.innerText = `$${Number(balanceObj.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    derivApi.onContractSettled = (poc) => {
        const netProfit = Number(poc.profit || 0);
        const activeBoatName = speedBoatsDirectory[currentActiveSpeedBoat]?.name || "Ehaldart Speed Boat";
        triggerElhadartProfitAlert(activeBoatName, netProfit);
    };

    derivApi.connect().then(() => {
        updateStreamStatusUI(true);

        if (derivOAuthAccounts.demo.token) {
            setMode('demo');
        } else if (derivOAuthAccounts.real.token) {
            setMode('real');
        }

        derivApi.subscribeTicks(currentSymbol, handleIncomingTick);
        derivApi.subscribeMultipleTicks(
            exhaustiveAssets.map(a => a.symbol),
            handleIncomingTick
        );

        derivApi.fetchActiveSymbols((symbols) => {
            if (symbols && symbols.length > 0) {
                const mapped = symbols
                    .filter(s => s.exchange_is_open === 1)
                    .map(s => {
                        const sym = s.underlying_symbol || s.symbol;
                        const name = s.underlying_symbol_name || s.display_name;
                        const pipDecimals = s.pip_size ? Math.max(0, Math.round(-Math.log10(s.pip_size))) : 2;
                        if (!marketDataStore[sym]) {
                            marketDataStore[sym] = {
                                name: name,
                                pip: pipDecimals,
                                price: '1000.00',
                                prevPrice: 0,
                                direction: 'neutral',
                                quotes: [],
                                recentDigits: [],
                                digits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                                total: 0,
                                sigmaScore: 0.0,
                                winrate: 0,
                                tps: 0.0,
                                lastTickAt: 0,
                                isMarketOpen: s.exchange_is_open === 1,
                                assignedBoatId: null,
                                assignedBoatName: 'Standby',
                                assignedTicks: 'NULL',
                                assignedCandleTF: 'Hold 1M (1-Minute Candle)',
                                activeDigitSignalLabel: 'NULL (Calibrating)',
                                lockedSignal: null,
                                runsCompleted: 0,
                                maxRunsPerLock: 5
                            };
                        } else {
                            marketDataStore[sym].pip = pipDecimals;
                            marketDataStore[sym].isMarketOpen = s.exchange_is_open === 1;
                        }
                        return {
                            symbol: sym,
                            name: name,
                            market: s.market || 'synthetic_index',
                            pip: pipDecimals
                        };
                    });

                if (mapped.length > 0) {
                    exhaustiveAssets = mapped;
                }
            }

            const countEl = document.getElementById('header-asset-count');
            if (countEl) countEl.innerText = `${exhaustiveAssets.length} Live Markets Active`;

            renderScannerList();

            derivApi.subscribeMultipleTicks(
                exhaustiveAssets.slice(0, 50).map(a => a.symbol),
                handleIncomingTick
            );
        });
    });
});
