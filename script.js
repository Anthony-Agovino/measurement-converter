const units = {
    weight: {
        base: 'g', // Keep base unit internally to convert easily
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
        // Temperature requires custom formulas, so we handle it differently
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

// Initialize App
function init() {
    setupCategoryListeners();
    setupInputListeners();
    setupUIListeners();
    loadHistory();
    populateSelects(currentCategory);
}

// Set up category buttons
function setupCategoryListeners() {
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            categoryBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            e.target.classList.add('active');
            
            // Update category
            currentCategory = e.target.dataset.category;
            populateSelects(currentCategory);
        });
    });
}

// Populate select dropdowns based on category
function populateSelects(category) {
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    const catData = units[category];
    
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

    // Set defaults
    fromSelect.value = catData.defaultFrom;
    toSelect.value = catData.defaultTo;

    // Trigger conversion
    convert();
}

// Set up input and select listeners
function setupInputListeners() {
    fromInput.addEventListener('input', convert);
    fromSelect.addEventListener('change', convert);
    toSelect.addEventListener('change', convert);

    swapBtn.addEventListener('click', () => {
        // Swap selected units
        const tempUnit = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tempUnit;
        
        // Add a subtle animation to the button
        swapBtn.style.transform = 'rotate(180deg) scale(0.92)';
        setTimeout(() => {
            swapBtn.style.transform = '';
        }, 150);

        convert();
    });
}

// UI listeners for copy, modal, and history clicks
function setupUIListeners() {
    // Copy button
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

    // History item click delegation
    historyList.addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (!item) return;
        
        // Re-run the specific conversion clicked
        const cat = item.dataset.cat;
        
        // Switch category if needed
        if (currentCategory !== cat) {
            document.querySelector(`[data-category="${cat}"]`).click();
        }
        
        // Set values and convert
        fromSelect.value = item.dataset.fromUnit;
        toSelect.value = item.dataset.toUnit;
        fromInput.value = item.dataset.fromVal;
        convert();
        
        // Ensure UI represents new values
        fromInput.focus();
    });

    // Cmd+K Modal toggle
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleModal();
        }
        if (e.key === 'Escape' && cmdKOverlay.classList.contains('active')) {
            toggleModal();
        }
    });
    
    // Close modal on outside click
    cmdKOverlay.addEventListener('click', (e) => {
        if (e.target === cmdKOverlay) toggleModal();
    });

    // Process natural language in modal
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
        setTimeout(() => cmdKInput.focus(), 50); // wait for display
    }
}

// Convert natural language string "5 kg in lb"
function processNaturalLanguage(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        modalResult.textContent = 'Start typing to instantly convert...';
        return;
    }

    // Basic regex: (number) (unit) (to/in/into/=>) (unit)
    // E.g. "5 kg to lb" => match[1]=5, match[2]=kg, match[4]=lb
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

    // Search for units across all categories to build a flat map
    let foundCategory = null;
    let validFrom = null;
    let validTo = null;

    // First find the category the "from" unit belongs to
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

    // Ensure the "to" unit exists IN THE SAME CATEGORY
    if (units[foundCategory].options[toStr]) {
        validTo = toStr;
    } else {
        modalResult.textContent = `'${toStr}' is not a valid ${foundCategory} unit.`;
        return;
    }

    // Perform calculation
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

// Handle temperature conversion
function convertTemperature(value, from, to) {
    let celsius;

    // First convert to Celsius
    if (from === 'c') celsius = value;
    else if (from === 'f') celsius = (value - 32) * 5/9;
    else if (from === 'k') celsius = value - 273.15;

    // Then convert Celsius to target
    if (to === 'c') return celsius;
    if (to === 'f') return (celsius * 9/5) + 32;
    if (to === 'k') return celsius + 273.15;
}

// Main conversion logic
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

    if (currentCategory === 'temperature') {
        result = convertTemperature(fromVal, fromUnit, toUnit);
    } else {
        // Standard ratio conversion using chosen base unit
        const fromBaseRatio = units[currentCategory].options[fromUnit].toBase;
        const toBaseRatio = units[currentCategory].options[toUnit].toBase;
        
        // Convert input to base unit, then to target unit
        const valueInBase = fromVal * fromBaseRatio;
        result = valueInBase / toBaseRatio;
    }

    // Format output (handle floating point precision issues)
    // Show up to 2 decimal places
    toInput.value = parseFloat(result.toFixed(2));
    updateFormulaDisplay(fromUnit, toUnit);
    saveHistory(fromVal, fromUnit, parseFloat(result.toFixed(2)), toUnit, currentCategory);
}

// History Management
function saveHistory(fVal, fUnit, tVal, tUnit, cat) {
    if (isNaN(fVal) || isNaN(tVal)) return;

    const entry = { fVal, fUnit, tVal, tUnit, cat, id: Date.now() };

    // Prevent immediate duplicate of exactly the same conversion
    if (conversionHistory.length > 0) {
        const last = conversionHistory[0];
        if (last.fVal === fVal && last.fUnit === fUnit && last.tUnit === tUnit) {
            return;
        }
    }

    conversionHistory.unshift(entry);
    
    // Keep only last 5
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
        } catch(e) {
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

        // E.g. 1 kg → 2.2 lb
        div.innerHTML = `
            <span><strong>${item.fVal}</strong> ${item.fUnit}</span>
            <span style="color: var(--text-muted); font-size: 0.8em;">→</span>
            <span><strong>${item.tVal}</strong> ${item.tUnit}</span>
        `;
        historyList.appendChild(div);
    });
}

// Update the formula text at the bottom
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

// Run init on load
document.addEventListener('DOMContentLoaded', init);
