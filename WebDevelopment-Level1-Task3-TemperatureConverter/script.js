
const form = document.getElementById("converter-form");
const temperatureInput = document.getElementById("temperature");
const unitSelect = document.getElementById("input-unit");
const errorMessage = document.getElementById("input-error");
const resultStatus = document.getElementById("result-status");

const celsiusResult = document.getElementById("celsius-result");
const fahrenheitResult = document.getElementById("fahrenheit-result");
const kelvinResult = document.getElementById("kelvin-result");

const ABSOLUTE_ZERO_C = -273.15;
const ABSOLUTE_ZERO_F = -459.67;
const ABSOLUTE_ZERO_K = 0;

// Convert a temperature to Celsius first.
// Celsius is our common base unit.
function convertToCelsius(value, unit) {
    switch (unit) {
        case "celsius":
            return value;

        case "fahrenheit":
            return (value - 32) * 5 / 9;

        case "kelvin":
            return value - 273.15;

        default:
            return NaN;
    }
}

// Display numbers neatly without unnecessary decimal places.
function formatTemperature(value) {
    if (Math.abs(value) < 0.0000001) {
        value = 0;
    }

    return Number(value.toFixed(2)).toLocaleString("en-US", {
        maximumFractionDigits: 2,
        useGrouping: false
    });
}

// Clear old results when the input is invalid.
function clearResults() {
    celsiusResult.textContent = "—";
    fahrenheitResult.textContent = "—";
    kelvinResult.textContent = "—";
}

// Show an error and clear previous results.
function showError(message) {
    errorMessage.textContent = message;
    resultStatus.textContent = "Please correct the input and try again.";
    clearResults();
}

// Calculate and display all three temperature values.
function convertTemperature(value, unit) {
    const celsius = convertToCelsius(value, unit);

    const fahrenheit = (celsius * 9 / 5) + 32;
    const kelvin = celsius + 273.15;

    celsiusResult.textContent = `${formatTemperature(celsius)} °C`;
    fahrenheitResult.textContent = `${formatTemperature(fahrenheit)} °F`;
    kelvinResult.textContent = `${formatTemperature(kelvin)} K`;

    errorMessage.textContent = "";
    resultStatus.textContent = "Conversion completed successfully.";
}

// Validate input and convert on button click.
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const rawValue = temperatureInput.value.trim();
    const unit = unitSelect.value;

    // Reject an empty input.
    if (rawValue === "") {
        showError("Please enter a temperature value.");
        temperatureInput.focus();
        return;
    }

    const value = Number(rawValue);

    // Reject invalid or non-finite numbers.
    if (!Number.isFinite(value)) {
        showError("Please enter a valid numeric temperature.");
        temperatureInput.focus();
        return;
    }

    // Convert to Celsius to validate absolute zero consistently.
    const celsius = convertToCelsius(value, unit);

    if (!Number.isFinite(celsius)) {
        showError("Please select a valid temperature unit.");
        return;
    }

    const epsilon = 1e-9;

    if (celsius < ABSOLUTE_ZERO_C - epsilon) {
        let minimum;

        if (unit === "fahrenheit") {
            minimum = `${ABSOLUTE_ZERO_F} °F`;
        } else if (unit === "kelvin") {
            minimum = `${ABSOLUTE_ZERO_K} K`;
        } else {
            minimum = `${ABSOLUTE_ZERO_C} °C`;
        }

        showError(
            `Temperature cannot be below absolute zero (${minimum}).`
        );
        temperatureInput.focus();
        return;
    }

    // Avoid tiny floating-point errors near absolute zero.
    const safeCelsius = Math.max(ABSOLUTE_ZERO_C, celsius);

    const safeValue = unit === "celsius"
        ? safeCelsius
        : unit === "fahrenheit"
            ? safeCelsius * 9 / 5 + 32
            : safeCelsius + 273.15;

    convertTemperature(safeValue, "celsius");
});

// Clear the error as the user edits the input.
temperatureInput.addEventListener("input", function () {
    errorMessage.textContent = "";
});

// Clear the error when a different input unit is selected.
unitSelect.addEventListener("change", function () {
    errorMessage.textContent = "";
});
