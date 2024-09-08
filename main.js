// --- Utility Functions ---

/**
 * Generates a random integer up to a given maximum value using crypto.
 * @param {number} max - The upper limit for the random integer.
 * @returns {number} - A random integer between 0 and max.
 */
function getRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Generates a set of valid session IDs.
 * @param {number} S - The number of active sessions.
 * @param {number} totalPossibleIds - The total number of possible session IDs.
 * @returns {Set<number>} - A set containing unique valid session IDs.
 */
function generateSessionIDs(S, totalPossibleIds) {
  const validSessions = new Set();
  while (validSessions.size < S) {
    validSessions.add(getRandomInt(totalPossibleIds));
  }
  return validSessions;
}

/**
 * Returns a session ID guesser function based on the selected guessing strategy.
 * @param {string} guessStrategy - The guessing strategy ('random', 'increment', or 'decrement').
 * @param {number} totalPossibleIds - The total number of possible session IDs.
 * @returns {function} - A function that generates the next guess.
 */
function getSessionIdGuesser(guessStrategy, totalPossibleIds) {
  let guess = 0;

  if (guessStrategy === 'random') {
    return function () {
      return getRandomInt(totalPossibleIds);
    };
  } else if (guessStrategy === 'increment') {
    return function () {
      const currentGuess = guess % totalPossibleIds;
      guess++;
      return currentGuess;
    };
  } else if (guessStrategy === 'decrement') {
    let currentGuess = totalPossibleIds - 1;
    return function () {
      const guess = currentGuess;
      currentGuess = (currentGuess - 1 + totalPossibleIds) % totalPossibleIds;
      return guess;
    };
  }
}

// --- Event Handlers ---

/**
 * Updates the displayed total number of possible session IDs based on the number of bits (B).
 * Updates expected guesses after changing the total IDs.
 */
function updateTotalIds() {
  const B = parseInt(document.getElementById('bits').value);
  const totalIds = Math.pow(2, B);
  document.getElementById('totalIds').textContent = totalIds;
  updateExpectedGuesses();
}

/**
 * Updates the displayed expected number of guesses and dynamically adjusts guessing strategy explanations.
 */
function updateExpectedGuesses() {
  const B = parseInt(document.getElementById('bits').value);
  const S = parseInt(document.getElementById('sessions').value);
  const A = document.getElementById('requests').value ? parseInt(document.getElementById('requests').value) : null;
  const totalPossibleIds = Math.pow(2, B);
  const sessionMethod = document.querySelector('input[name="sessionMethod"]:checked').value;
  const guessStrategy = document.querySelector('input[name="guessStrategy"]:checked').value;

  // Update guessing strategy explanations based on session ID selection method
  updateStrategyExplanations(sessionMethod, guessStrategy);

  // Calculate expected guesses and update the formula
  const { expectedGuesses, formula } = calculateExpectedGuesses(B, S, A, totalPossibleIds, sessionMethod, guessStrategy);
  
  // Update the displayed formula and result
  document.getElementById('formula').textContent = formula;
  document.getElementById('expectedGuesses').textContent = formatExpectedGuesses(expectedGuesses, A);
  document.getElementById('BValue').textContent = B;
  document.getElementById('SValue').textContent = S;
  document.getElementById('AValue').textContent = A ? A : 'N/A';
}

/**
 * Updates guessing strategy explanations based on the session method and strategy.
 * @param {string} sessionMethod - The selected session ID method ('dynamic' or 'static').
 * @param {string} guessStrategy - The selected guessing strategy.
 */
function updateStrategyExplanations(sessionMethod, guessStrategy) {
  const randomExplanation = document.getElementById('randomExplanation');
  const incrementExplanation = document.getElementById('incrementExplanation');
  const decrementExplanation = document.getElementById('decrementExplanation');

  if (sessionMethod === 'dynamic') {
    const dynamicMessage = 'All guessing strategies perform equally in dynamic mode because the valid session IDs change with every guess.';
    randomExplanation.textContent = dynamicMessage;
    incrementExplanation.textContent = dynamicMessage;
    decrementExplanation.textContent = dynamicMessage;
    randomExplanation.style.color = '';
  } else {
    // Static session method explanations
    randomExplanation.textContent = 'In static mode, random guessing may result in repeated guesses and is less efficient than incremental or decremental guessing.';
    incrementExplanation.textContent = 'Incremental guessing avoids repeat guesses in static mode and is more efficient.';
    decrementExplanation.textContent = 'Decremental guessing avoids repeat guesses in static mode and is more efficient.';

    if (guessStrategy === 'random') {
      randomExplanation.style.color = 'red';
    } else {
      randomExplanation.style.color = '';
    }
  }
}

/**
 * Calculates the expected number of guesses based on the input parameters.
 * @param {number} B - The number of bits.
 * @param {number} S - The number of active sessions.
 * @param {number} A - The number of requests per second (optional).
 * @param {number} totalPossibleIds - The total number of possible session IDs.
 * @param {string} sessionMethod - The selected session method ('dynamic' or 'static').
 * @param {string} guessStrategy - The selected guessing strategy.
 * @returns {Object} - The expected guesses and the corresponding formula.
 */
function calculateExpectedGuesses(B, S, A, totalPossibleIds, sessionMethod, guessStrategy) {
  let expectedGuesses, formula;

  if (sessionMethod === 'dynamic' || guessStrategy === 'random') {
    if (A) {
      formula = `2^B / (S * A)`;
      expectedGuesses = totalPossibleIds / (S * A);
    } else {
      formula = `2^B / S`;
      expectedGuesses = totalPossibleIds / S;
    }
  } else {
    if (A) {
      formula = `(2^B + 1) / ((S + 1) * A)`;
      expectedGuesses = (totalPossibleIds + 1) / ((S + 1) * A);
    } else {
      formula = `(2^B + 1) / (S + 1)`;
      expectedGuesses = (totalPossibleIds + 1) / (S + 1);
    }
  }

  return { expectedGuesses, formula };
}

/**
 * Formats the expected guesses result for display.
 * @param {number} expectedGuesses - The expected number of guesses.
 * @param {number|null} A - The number of requests per second (optional).
 * @returns {string} - A formatted string representing the expected guesses or time.
 */
function formatExpectedGuesses(expectedGuesses, A) {
  if (A) {
    return `${expectedGuesses.toFixed(2)} seconds ≈ ${humanizeDuration(expectedGuesses * 1000, { round: true })}`;
  }
  return `${expectedGuesses.toFixed(2)} guesses`;
}

// --- Simulation Functions ---

/**
 * Runs the session ID guessing simulation.
 */
function runSimulation() {
  const B = parseInt(document.getElementById('bits').value);
  const S = parseInt(document.getElementById('sessions').value);
  const trials = parseInt(document.getElementById('trials').value);
  const A = document.getElementById('requests').value ? parseInt(document.getElementById('requests').value) : null;
  const guessStrategy = document.querySelector('input[name="guessStrategy"]:checked').value;
  const sessionMethod = document.querySelector('input[name="sessionMethod"]:checked').value;
  const totalPossibleIds = Math.pow(2, B);

  const guessSessionId = getSessionIdGuesser(guessStrategy, totalPossibleIds);
  let totalGuesses = 0;

  // Run the simulation for the specified number of trials
  for (let trial = 0; trial < trials; trial++) {
    let validSessions = generateSessionIDs(S, totalPossibleIds);
    let guesses = 0;

    // Guess until a valid session ID is found
    while (true) {
      guesses++;
      const guess = guessSessionId();
      if (validSessions.has(guess)) break;

      if (sessionMethod === 'dynamic') {
        validSessions = generateSessionIDs(S, totalPossibleIds);
      }
    }

    totalGuesses += guesses;
  }

  // Calculate and display the average guesses
  const avgGuesses = totalGuesses / trials;
  document.getElementById('avgGuesses').textContent = avgGuesses.toFixed(2);

  // Calculate and display the time to first success if requests per second (A) is provided
  if (A) {
    const simTime = avgGuesses / A;
    const humanizedTime = humanizeDuration(simTime * 1000, { round: true });
    document.getElementById('simTime').textContent = `${simTime.toFixed(2)} seconds ≈ ${humanizedTime}`;
    document.getElementById('timeResults').style.display = 'block';
  } else {
    document.getElementById('timeResults').style.display = 'none';
  }
}

// --- Initialization ---

// Add event listeners to update values when inputs change
document.getElementById('bits').addEventListener('input', updateTotalIds);
document.getElementById('sessions').addEventListener('input', updateExpectedGuesses);
document.getElementById('requests').addEventListener('input', updateExpectedGuesses);
document.querySelectorAll('input[name="sessionMethod"]').forEach(radio => {
  radio.addEventListener('change', updateExpectedGuesses);
});
document.querySelectorAll('input[name="guessStrategy"]').forEach(radio => {
  radio.addEventListener('change', updateExpectedGuesses);
});

// Add event listener for the simulation button
document.getElementById('runSimulation').addEventListener('click', runSimulation);

// Initial update of total IDs on page load
updateTotalIds();
