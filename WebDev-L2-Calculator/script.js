
const keypad = document.getElementById("keypad");
const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");
const statusDisplay = document.getElementById("status");

let currentInput = "0";
let expression = "";
let justCalculated = false;
let hasError = false;

function updateDisplay() {
    display.textContent = currentInput;
    expressionDisplay.textContent = expression || "Ready to calculate";
}

function showError(message) {
    currentInput = "Error";
    expression = "";
    hasError = true;

    display.textContent = currentInput;
    expressionDisplay.textContent = message;
    statusDisplay.textContent = message;
}

function clearCalculator() {
    currentInput = "0";
    expression = "";
    justCalculated = false;
    hasError = false;

    updateDisplay();
    statusDisplay.textContent = "Calculator cleared.";
}

function enterNumber(number) {
    if (hasError || justCalculated) {
        currentInput = number;
        expression = "";
        hasError = false;
        justCalculated = false;
    } else if (currentInput === "0") {
        currentInput = number;
    } else if (currentInput === "-0") {
        currentInput = "-" + number;
    } else {
        currentInput += number;
    }

    updateDisplay();
    statusDisplay.textContent = "Enter an operation or another number.";
}

function enterDecimal() {
    if (hasError || justCalculated) {
        currentInput = "0.";
        expression = "";
        hasError = false;
        justCalculated = false;
    } else if (!currentInput.includes(".")) {
        currentInput += ".";
    }

    updateDisplay();
}

function enterOperator(operator) {
    if (hasError) {
        clearCalculator();
        return;
    }

    if (currentInput === "-") {
        return;
    }

    if (expression === "") {
        expression = currentInput + " " + operator + " ";
    } else if (/[+\-*/] $/.test(expression)) {
        // Replace the last operator if another is selected.
        expression = expression.slice(0, -3) + " " + operator + " ";
    } else {
        expression += currentInput + " " + operator + " ";
    }

    currentInput = "0";
    justCalculated = false;

    updateDisplay();
    statusDisplay.textContent = "Operation selected.";
}

function deleteLast() {
    if (hasError) {
        clearCalculator();
        return;
    }

    if (justCalculated) {
        currentInput = "0";
        expression = "";
        justCalculated = false;
    } else if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);

        if (currentInput === "-") {
            currentInput = "0";
        }
    } else {
        currentInput = "0";
    }

    updateDisplay();
}

function tokenize(input) {
    const tokens = input.match(
        /(?:\d+\.?\d*|\.\d+)|[+\-*/]/g
    );

    if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
        throw new Error("Invalid expression.");
    }

    return tokens;
}

// Evaluate an expression without using eval().
function calculate(expressionText) {
    const tokens = tokenize(expressionText);
    const values = [];
    const operators = [];
    let expectingNumber = true;

    const precedence = {
        "+": 1,
        "-": 1,
        "*": 2,
        "/": 2
    };

    function applyOperator() {
        const operator = operators.pop();
        const right = values.pop();
        const left = values.pop();

        if (left === undefined || right === undefined) {
            throw new Error("Incomplete expression.");
        }

        let result;

        switch (operator) {
            case "+":
                result = left + right;
                break;
            case "-":
                result = left - right;
                break;
            case "*":
                result = left * right;
                break;
            case "/":
                if (right === 0) {
                    throw new Error("Cannot divide by zero.");
                }
                result = left / right;
                break;
            default:
                throw new Error("Unknown operator.");
        }

        if (!Number.isFinite(result)) {
            throw new Error("Result is too large to calculate.");
        }

        values.push(result);
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (!Number.isNaN(Number(token))) {
            if (!expectingNumber) {
                throw new Error("Invalid expression.");
            }

            values.push(Number.parseFloat(token));
            expectingNumber = false;
        } else if (
            (token === "+" || token === "-") &&
            expectingNumber
        ) {
            // Support unary plus and minus, e.g. -5 + 2.
            const next = tokens[i + 1];

            if (
                next === undefined ||
                Number.isNaN(Number(next))
            ) {
                throw new Error("Enter a number after the sign.");
            }

            const signedValue = Number.parseFloat(next);
            values.push(token === "-" ? -signedValue : signedValue);
            i++;
            expectingNumber = false;
        } else if (Object.hasOwn(precedence, token)) {
            if (expectingNumber) {
                throw new Error("Enter a number before the operator.");
            }

            while (
                operators.length > 0 &&
                precedence[operators[operators.length - 1]] >= precedence[token]
            ) {
                applyOperator();
            }

            operators.push(token);
            expectingNumber = true;
        } else {
            throw new Error("Invalid expression.");
        }
    }

    if (expectingNumber) {
        throw new Error("Complete the expression first.");
    }

    while (operators.length > 0) {
        applyOperator();
    }

    if (values.length !== 1) {
        throw new Error("Unable to calculate this expression.");
    }

    return values[0];
}

function formatResult(number) {
    if (Object.is(number, -0)) {
        number = 0;
    }

    return Number(number.toPrecision(12)).toString();
}

function calculateResult() {
    if (hasError) {
        return;
    }

    let fullExpression;

    if (expression.trim() === "") {
        statusDisplay.textContent = "Enter an operation first.";
        return;
    }

    if (/[+\-*/]\s*$/.test(expression)) {
        fullExpression = expression.trimEnd() + " " + currentInput;
    } else {
        fullExpression = expression + currentInput;
    }

    try {
        const result = calculate(fullExpression);
        const formattedResult = formatResult(result);

        expressionDisplay.textContent = fullExpression + " =";
        currentInput = formattedResult;
        expression = "";
        justCalculated = true;

        display.textContent = currentInput;
        statusDisplay.textContent = "Calculation complete.";
    } catch (error) {
        showError(error.message);
    }
}

// One event listener handles all calculator buttons.
keypad.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    if (button.dataset.number !== undefined) {
        enterNumber(button.dataset.number);
        return;
    }

    if (button.dataset.operator !== undefined) {
        enterOperator(button.dataset.operator);
        return;
    }

    switch (button.dataset.action) {
        case "clear":
            clearCalculator();
            break;
        case "delete":
            deleteLast();
            break;
        case "decimal":
            enterDecimal();
            break;
        case "equals":
            calculateResult();
            break;
    }
});
