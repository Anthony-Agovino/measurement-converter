/* =============================================================
   MyMeasurementConverter (UnitDash) - script.js
   Updates: Implemented duplicate unit prevention in dropdowns.
   ============================================================= */

const units = {
    weight: {
        base: 'g',
        options: {
            'mg': { name: 'Milligrams', toBase: 0.001 },
            'g': { name: 'Grams', toBase: 1 },
            'kg': { name: 'Kilograms', toBase: 1000 },
            'oz': { name: 'Ounces', toBase: 28.3495 },
            'lb': { name: 'Pounds', toBase: 453.592 }
        },
        defaultFrom: 'kg',
        defaultTo: 'lb'
    },
    distance: {
        base: 'm',
        options: {
            'mm': { name: 'Millimeters', toBase: 0.001 },
            'cm': { name: 'Centimeters', toBase: 0.01 },
            'm': { name: 'Meters', toBase: 1 },
            'km': { name: 'Kilometers', toBase: 1000 },
            'in': { name: 'Inches', toBase: 0.0254 },
            'ft': { name: 'Feet', toBase: 0.3048 },
            'yd': { name: 'Yards', toBase: 0.9144 },
            'mi': { name: 'Miles', toBase: 1609.34 }
        },
        defaultFrom: 'km',
        defaultTo: 'mi'
    },
    volume: {
        base: 'ml',
        options: {
            'ml': { name: 'Milliliters', toBase: 1 },
            'l': { name: 'Liters', toBase: 1000 },
            'tsp': { name: 'Teaspoons (US)', toBase: 4.92892 },
            'tbsp': { name: 'Tablespoons (US)', toBase: 14.7868 },
            'fl_oz': { name: 'Fluid Ounces (US)', toBase: 29.5735 },
            'cup': { name: 'Cups (US)', toBase: 236.588 },
            'pt': { name: 'Pints (US)', toBase: 473.176 },
            'qt': { name: 'Quarts (US)', toBase: 946.353 },
            'gal': { name: 'Gallons (US)', toBase: 3785.41 }
        },
        defaultFrom: 'l',
        defaultTo: 'gal'
    },
    temperature: {
        options: {
            'c': { name: 'Celsius' },
            'f': { name: 'Fahrenheit' },
            'k': { name: 'Kelvin' }
        },
        defaultFrom: 'c',
        defaultTo: 'f'
    },
    area: {
        base: 'sq_m',
        options: {
            'sq_mm': { name: 'Square Millimeters', toBase: 0.000001 },
            'sq_cm': { name: 'Square Centimeters', toBase: 0.0001 },
            'sq_m': { name: 'Square Meters', toBase: 1 },
            'sq_km': { name: 'Square Kilometers', toBase: 1000000 },
            'sq_in': { name: 'Square Inches', toBase: 0.00064516 },
            'sq_ft': { name: 'Square Feet', toBase: 0.092903 },
            'sq_yd': { name: 'Square Yards', toBase: 0.836127 },
            'sq_mi': { name: 'Square Miles', toBase: 2589988 },
            'acre': { name: 'Acres', toBase: 4046.86 },
            'hectare': { name: 'Hectares', toBase: 10000 }
        },
        defaultFrom: 'sq_m',
        defaultTo: 'sq_ft'
    }
};

const categoryBtns = document.querySelectorAll('.category-btn');
const fromInput = document.getElementById('from-value');
const toInput = document.getElementById('to-value');
const fromSelect = document.getElementById('from-unit');
const toSelect = document.getElementById('to-unit');
const swapBtn = document.getElementById('swap-btn');
const formulaDisplay = document.getElementById('formula-display');
const copyBtn = document.getElementById('copy-btn');
const historyList = document.getElementById('history-list');
const historyPanel = document.getElementById('history-panel');

const cmdKOverlay = document.getElementById('cmd-k-overlay');
const cmdKInput = document.getElementById('cmd-k-input');
const modalResult = document.getElementById('modal-result');

let currentCategory = 'weight';
let conversionHistory = [];

function init() {
    setupCategoryListeners();
    setupInputListeners();
    setupUIListeners();
    loadHistory();

    const savedCategory = localStorage.getItem('mc_last_category');
    if (savedCategory && units[savedCategory]) {
        currentCategory = savedCategory;
        categoryBtns.forEach(b => {
            if (b.dataset.category === currentCategory) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    populateSelects(currentCategory, true);
}

function setupCategoryListeners() {
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.category-btn');
            if (!targetBtn) return;

            categoryBtns.forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');

            currentCategory = targetBtn.dataset.category;
            localStorage.setItem('mc_last_category', currentCategory);

            populateSelects(currentCategory, true);
        });
    });
}

function populateSelects(category, isInitialOrNewCategory = false) {
    const fromValBefore = fromSelect.value;
    const toValBefore = toSelect.value;

    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    const catData = units[category];
    if (!catData) return;

    for (const [key, val] of Object.entries(catData.options)) {
        const option1 = document.createElement('option');
        option1.value = key;
        option1.textContent = `${val.name} (${key})`;
        fromSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = key;
        option2.textContent = `${val.name} (${key})`;
        toSelect.appendChild(option2);
    }

    if (isInitialOrNewCategory) {
        const savedFrom = localStorage.getItem(`mc_last_from_${category}`);
        const savedTo = localStorage.getItem(`mc_last_to_${category}`);

        fromSelect.value = (savedFrom && catData.options[savedFrom]) ? savedFrom : catData.defaultFrom;
        toSelect.value = (savedTo && catData.options[savedTo]) ? savedTo : catData.defaultTo;
    } else {
        if (fromValBefore) fromSelect.value = fromValBefore;
        if (toValBefore) toSelect.value = toValBefore;
    }

    const currentFrom = fromSelect.value;
    const currentTo = toSelect.value;

    Array.from(toSelect.options).forEach(opt => {
        opt.disabled = (opt.value === currentFrom);
    });

    Array.from(fromSelect.options).forEach(opt => {
        opt.disabled = (opt.value === currentTo);
    });

    convert();
}

function setupInputListeners() {
    fromInput.addEventListener('input', convert);

    fromSelect.addEventListener('change', () => {
        localStorage.setItem(`mc_last_from_${currentCategory}`, fromSelect.value);
        populateSelects(currentCategory, false);
    });

    toSelect.addEventListener('change', () => {
        localStorage.setItem(`mc_last_to_${currentCategory}`, toSelect.value);
        populateSelects(currentCategory, false);
    });

    swapBtn.addEventListener('click', () => {
        const tempUnit = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tempUnit;

        localStorage.setItem(`mc_last_from_${currentCategory}`, fromSelect.value);
        localStorage.setItem(`mc_last_to_${currentCategory}`, toSelect.value);

        swapBtn.style.transform = 'rotate(180deg) scale(0.92)';
        setTimeout(() => {
            swapBtn.style.transform = '';
        }, 150);

        populateSelects(currentCategory, false);
    });
}

function setupUIListeners() {
    copyBtn.addEventListener('click', () => {
        if (!toInput.value) return;
        navigator.clipboard.writeText(toInput.value).then(() => {
            const originalTitle = copyBtn.getAttribute('title');
            copyBtn.setAttribute('title', 'Copied!');
            copyBtn.style.color = 'var(--accent)';
            setTimeout(() => {
                copyBtn.setAttribute('title', originalTitle);
                copyBtn.style.color = '';
            }, 1000);
        });
    });

    historyList.addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (!item) return;

        const cat = item.dataset.cat;

        if (currentCategory !== cat) {
            document.querySelector(`[data-category="${cat}"]`).click();
        }

        fromSelect.value = item.dataset.fromUnit;
        toSelect.value = item.dataset.toUnit;
        fromInput.value = item.dataset.fromVal;

        populateSelects(currentCategory, false);

        fromInput.focus();
    });

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleModal();
        }
        if (e.key === 'Escape' && cmdKOverlay.classList.contains('active')) {
            toggleModal();
        }
    });

    cmdKOverlay.addEventListener('click', (e) => {
        if (e.target === cmdKOverlay) toggleModal();
    });

    cmdKInput.addEventListener('input', processNaturalLanguage);
}

function toggleModal() {
    const isActive = cmdKOverlay.classList.contains('active');
    if (isActive) {
        cmdKOverlay.classList.remove('active');
        cmdKInput.blur();
    } else {
        cmdKOverlay.classList.add('active');
        cmdKInput.value = '';
        modalResult.textContent = 'Start typing to instantly convert...';
        setTimeout(() => cmdKInput.focus(), 50);
    }
}

function processNaturalLanguage(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        modalResult.textContent = 'Start typing to instantly convert...';
        return;
    }

    const regex = /^([\d.]+)\s*([a-z_]+)\s+(to|in|into|=>|-|>)\s+([a-z_]+)$/i;
    const match = query.match(regex);

    if (!match) {
        modalResult.textContent = 'Parsing... (try "var unit to unit")';
        return;
    }

    const val = parseFloat(match[1]);
    const fromStr = match[2];
    const toStr = match[4];

    if (isNaN(val)) return;

    let foundCategory = null;
    let validFrom = null;
    let validTo = null;

    for (const [catName, catData] of Object.entries(units)) {
        if (catData.options[fromStr]) {
            foundCategory = catName;
            validFrom = fromStr;
            break;
        }
    }

    if (!foundCategory) {
        modalResult.textContent = `Unknown unit: '${fromStr}'`;
        return;
    }

    if (units[foundCategory].options[toStr]) {
        validTo = toStr;
    } else {
        modalResult.textContent = `'${toStr}' is not a valid ${foundCategory} unit.`;
        return;
    }

    if (validFrom === validTo) {
        modalResult.textContent = 'Cannot convert a unit to itself.';
        return;
    }

    let ans = 0;
    if (foundCategory === 'temperature') {
        ans = convertTemperature(val, validFrom, validTo);
    } else {
        const fromBaseRatio = units[foundCategory].options[validFrom].toBase;
        const toBaseRatio = units[foundCategory].options[validTo].toBase;
        const valueInBase = val * fromBaseRatio;
        ans = valueInBase / toBaseRatio;
    }

    ans = parseFloat(ans.toFixed(2));
    modalResult.textContent = `${val} ${validFrom} = ${ans} ${validTo}`;
}

function convertTemperature(value, from, to) {
    let celsius;

    if (from === 'c') celsius = value;
    else if (from === 'f') celsius = (value - 32) * 5 / 9;
    else if (from === 'k') celsius = value - 273.15;

    if (to === 'c') return celsius;
    if (to === 'f') return (celsius * 9 / 5) + 32;
    if (to === 'k') return celsius + 273.15;
}

function convert() {
    const fromVal = parseFloat(fromInput.value);

    if (isNaN(fromVal)) {
        toInput.value = '';
        formulaDisplay.textContent = '';
        return;
    }

    const fromUnit = fromSelect.value;
    const toUnit = toSelect.value;
    let result = 0;

    if (fromUnit === toUnit) {
        toInput.value = fromVal;
        updateFormulaDisplay(fromUnit, toUnit);
        return;
    }

    if (currentCategory === 'temperature') {
        result = convertTemperature(fromVal, fromUnit, toUnit);
    } else {
        const fromBaseRatio = units[currentCategory].options[fromUnit].toBase;
        const toBaseRatio = units[currentCategory].options[toUnit].toBase;

        const valueInBase = fromVal * fromBaseRatio;
        result = valueInBase / toBaseRatio;
    }

    toInput.value = parseFloat(result.toFixed(2));
    updateFormulaDisplay(fromUnit, toUnit);
    saveHistory(fromVal, fromUnit, parseFloat(result.toFixed(2)), toUnit, currentCategory);
}

function saveHistory(fVal, fUnit, tVal, tUnit, cat) {
    if (isNaN(fVal) || isNaN(tVal) || fUnit === tUnit) return;

    const entry = { fVal, fUnit, tVal, tUnit, cat, id: Date.now() };

    if (conversionHistory.length > 0) {
        const last = conversionHistory[0];
        if (last.fVal === fVal && last.fUnit === fUnit && last.tUnit === tUnit) {
            return;
        }
    }

    conversionHistory.unshift(entry);

    if (conversionHistory.length > 5) {
        conversionHistory.pop();
    }

    localStorage.setItem('mc_history', JSON.stringify(conversionHistory));
    renderHistory();
}

function loadHistory() {
    const saved = localStorage.getItem('mc_history');
    if (saved) {
        try {
            conversionHistory = JSON.parse(saved);
        } catch (e) {
            conversionHistory = [];
        }
    }
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';

    if (conversionHistory.length === 0) {
        historyPanel.style.display = 'none';
        return;
    }

    historyPanel.style.display = 'block';

    conversionHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.dataset.cat = item.cat;
        div.dataset.fromUnit = item.fUnit;
        div.dataset.toUnit = item.tUnit;
        div.dataset.fromVal = item.fVal;

        div.innerHTML = `
            <span><strong>${item.fVal}</strong> ${item.fUnit}</span>
            <span style="color: var(--text-muted); font-size: 0.8em; margin: 0 4px;">→</span>
            <span><strong>${item.tVal}</strong> ${item.tUnit}</span>
        `;
        historyList.appendChild(div);
    });
}

function updateFormulaDisplay(fromUnit, toUnit) {
    if (fromUnit === toUnit) {
        formulaDisplay.textContent = 'Units are identical';
        return;
    }

    let formulaVal = 0;
    if (currentCategory === 'temperature') {
        formulaVal = parseFloat(convertTemperature(1, fromUnit, toUnit).toFixed(2));
    } else {
        const fromBaseRatio = units[currentCategory].options[fromUnit].toBase;
        const toBaseRatio = units[currentCategory].options[toUnit].toBase;
        formulaVal = parseFloat((fromBaseRatio / toBaseRatio).toFixed(2));
    }

    formulaDisplay.textContent = `1 ${fromUnit} ≈ ${formulaVal} ${toUnit}`;
}

document.addEventListener('DOMContentLoaded', init); s