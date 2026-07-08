/**
 * Premium Scientific Calculator Logic
 * Built with Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const closeHistoryBtn = document.getElementById('close-history');
    const clearHistoryBtn = document.getElementById('clear-history');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    const copyResultBtn = document.getElementById('copy-result');
    const expressionDisplay = document.getElementById('expression-display');
    const mainDisplay = document.getElementById('main-display');
    const keys = document.querySelectorAll('.key');

    // --- State ---
    let currentOperand = '0';
    let previousOperand = '';
    let operation = undefined;
    let shouldResetScreen = false;
    let history = JSON.parse(localStorage.getItem('calcHistory')) || [];

    // --- Theme Management ---
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // --- History Management ---
    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li class="history-item"><div class="expr">No history yet</div></li>';
            return;
        }
        history.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('history-item');
            li.innerHTML = `
                <div class="expr">${item.expression} =</div>
                <div class="res">${item.result}</div>
            `;
            // Click history item to recall result
            li.addEventListener('click', () => {
                currentOperand = item.result.toString();
                updateDisplay();
                if (window.innerWidth <= 900) {
                    historyPanel.classList.remove('open');
                }
            });
            historyList.appendChild(li);
        });
    }

    function addToHistory(expression, result) {
        history.unshift({ expression, result });
        if (history.length > 20) {
            history.pop();
        }
        localStorage.setItem('calcHistory', JSON.stringify(history));
        renderHistory();
    }

    toggleHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('open');
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.remove('open');
    });

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('calcHistory');
        renderHistory();
    });

    renderHistory(); // Initial render

    // --- Calculator Logic ---
    function clear() {
        currentOperand = '0';
        previousOperand = '';
        operation = undefined;
    }

    function deleteNumber() {
        if (currentOperand === 'Error' || currentOperand === 'Infinity' || currentOperand === 'NaN') {
            currentOperand = '0';
            return;
        }
        if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
            currentOperand = '0';
            return;
        }
        currentOperand = currentOperand.toString().slice(0, -1);
    }

    function appendNumber(number) {
        if (currentOperand === '0' && number !== '.') {
            currentOperand = number;
            return;
        }
        if (number === '.' && currentOperand.includes('.')) return;
        if (shouldResetScreen) {
            currentOperand = number;
            shouldResetScreen = false;
            return;
        }
        currentOperand = currentOperand.toString() + number;
    }

    function chooseOperation(op) {
        if (currentOperand === 'Error') return;
        if (previousOperand !== '') {
            compute();
        }
        operation = op;
        previousOperand = currentOperand;
        shouldResetScreen = true;
    }

    function compute() {
        let computation;
        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentOperand);
        if (isNaN(prev) || isNaN(current)) return;

        switch (operation) {
            case 'add':
                computation = prev + current;
                break;
            case 'subtract':
                computation = prev - current;
                break;
            case 'multiply':
                computation = prev * current;
                break;
            case 'divide':
                if (current === 0) {
                    currentOperand = 'Error';
                    previousOperand = '';
                    operation = undefined;
                    return;
                }
                computation = prev / current;
                break;
            case 'pow':
                computation = Math.pow(prev, current);
                break;
            case 'mod':
                computation = prev % current;
                break;
            default:
                return;
        }

        computation = formatResult(computation);
        const expression = `${formatNumber(prev)} ${getOperatorSymbol(operation)} ${formatNumber(current)}`;
        addToHistory(expression, computation);
        
        currentOperand = computation;
        operation = undefined;
        previousOperand = '';
        shouldResetScreen = true;
    }

    function computeScientific(func) {
        const current = parseFloat(currentOperand);
        if (isNaN(current)) return;
        let result;
        let expr = '';

        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(current);
                    expr = `sin(${current})`;
                    break;
                case 'cos':
                    result = Math.cos(current);
                    expr = `cos(${current})`;
                    break;
                case 'tan':
                    result = Math.tan(current);
                    expr = `tan(${current})`;
                    break;
                case 'log':
                    if (current <= 0) throw new Error();
                    result = Math.log10(current);
                    expr = `log(${current})`;
                    break;
                case 'ln':
                    if (current <= 0) throw new Error();
                    result = Math.log(current);
                    expr = `ln(${current})`;
                    break;
                case 'sqrt':
                    if (current < 0) throw new Error();
                    result = Math.sqrt(current);
                    expr = `√(${current})`;
                    break;
                case 'square':
                    result = Math.pow(current, 2);
                    expr = `(${current})²`;
                    break;
                case 'inverse':
                    if (current === 0) throw new Error();
                    result = 1 / current;
                    expr = `1/(${current})`;
                    break;
                case 'fact':
                    if (current < 0 || !Number.isInteger(current)) throw new Error();
                    result = factorial(current);
                    expr = `${current}!`;
                    break;
                case 'percent':
                    result = current / 100;
                    expr = `${current}%`;
                    break;
                case 'negate':
                    currentOperand = (current * -1).toString();
                    return; // Don't add simple negation to history
                default:
                    return;
            }

            result = formatResult(result);
            addToHistory(expr, result);
            currentOperand = result.toString();
            shouldResetScreen = true;
        } catch (error) {
            currentOperand = 'Error';
            shouldResetScreen = true;
        }
    }

    function insertConstant(constant) {
        if (constant === 'pi') {
            currentOperand = Math.PI.toString();
        } else if (constant === 'e') {
            currentOperand = Math.E.toString();
        }
        shouldResetScreen = true;
    }

    function factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    function formatResult(number) {
        if (!isFinite(number)) return 'Error';
        // Handle floating point precision issues
        return Math.round(number * 10000000000) / 10000000000;
    }

    function getOperatorSymbol(op) {
        const symbols = {
            'add': '+',
            'subtract': '−',
            'multiply': '×',
            'divide': '÷',
            'pow': '^',
            'mod': 'mod'
        };
        return symbols[op] || '';
    }

    function getDisplayNumber(number) {
        if (number === 'Error' || number === 'Infinity' || number === 'NaN') return number;
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    function formatNumber(number) {
        return getDisplayNumber(number);
    }

    function updateDisplay() {
        mainDisplay.textContent = getDisplayNumber(currentOperand);
        if (operation != null) {
            expressionDisplay.textContent = `${formatNumber(previousOperand)} ${getOperatorSymbol(operation)}`;
        } else {
            expressionDisplay.textContent = '';
        }
        
        // Auto resize text if it gets too long
        if (mainDisplay.textContent.length > 12) {
            mainDisplay.style.fontSize = '2rem';
        } else if (mainDisplay.textContent.length > 9) {
            mainDisplay.style.fontSize = '2.5rem';
        } else {
            mainDisplay.style.fontSize = '3rem';
        }
    }

    // --- Event Listeners for Keys ---
    keys.forEach(key => {
        key.addEventListener('click', (e) => {
            // Ripple effect
            createRipple(e, key);

            const action = key.dataset.action;
            const value = key.dataset.value;

            if (value !== undefined) {
                appendNumber(value);
            } else if (['add', 'subtract', 'multiply', 'divide', 'pow', 'mod'].includes(action)) {
                chooseOperation(action);
            } else if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'square', 'inverse', 'fact', 'percent', 'negate'].includes(action)) {
                computeScientific(action);
            } else if (['pi', 'e'].includes(action)) {
                insertConstant(action);
            } else if (action === 'calculate') {
                compute();
            } else if (action === 'clear') {
                clear();
            } else if (action === 'delete') {
                deleteNumber();
            }
            
            updateDisplay();
        });
    });

    // --- Keyboard Support ---
    document.addEventListener('keydown', (e) => {
        if (e.key >= 0 && e.key <= 9) appendNumber(e.key);
        if (e.key === '.') appendNumber('.');
        if (e.key === '=' || e.key === 'Enter') {
            e.preventDefault();
            compute();
        }
        if (e.key === 'Backspace') deleteNumber();
        if (e.key === 'Escape') clear();
        if (e.key === '+') chooseOperation('add');
        if (e.key === '-') chooseOperation('subtract');
        if (e.key === '*') chooseOperation('multiply');
        if (e.key === '/') chooseOperation('divide');
        if (e.key === '^') chooseOperation('pow');
        if (e.key === '%') computeScientific('percent');
        
        updateDisplay();
        
        // Add visual feedback to keys
        animateKeypress(e.key);
    });

    function animateKeypress(key) {
        const keyMap = {
            'Enter': '=',
            'Escape': 'clear',
            'Backspace': 'delete',
            '+': 'add',
            '-': 'subtract',
            '*': 'multiply',
            '/': 'divide'
        };
        
        let targetKey = null;
        
        if (key >= 0 && key <= 9 || key === '.') {
            targetKey = document.querySelector(`.key[data-value="${key}"]`);
        } else if (keyMap[key]) {
             targetKey = document.querySelector(`.key[data-action="${keyMap[key]}"]`) || document.querySelector(`.key.btn-equals`);
        }

        if (targetKey) {
            targetKey.classList.add('active');
            setTimeout(() => targetKey.classList.remove('active'), 100);
        }
    }

    // --- Copy Result ---
    copyResultBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentOperand).then(() => {
            const originalHTML = copyResultBtn.innerHTML;
            // Show checkmark icon
            copyResultBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
                copyResultBtn.innerHTML = originalHTML;
            }, 2000);
        });
    });

    // --- Ripple Animation Function ---
    function createRipple(event, button) {
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.querySelector('.ripple');
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }
});
