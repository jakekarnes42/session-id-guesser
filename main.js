// --- Event Handlers ---

/**
 * Updates the displayed total number of possible session IDs based on the number of bits (B).
 * Updates expected guesses after changing the total IDs.
 */
function updateTotalIds() {
  const B = parseInt(document.getElementById('bits').value);
  const totalIds = BigInt(2) ** BigInt(B); // Use BigInt for large B values
  const totalIdsElement = document.getElementById('totalIds');
  totalIdsElement.textContent = totalIds.toString(); // Convert BigInt to string for display
  totalIdsElement.classList.add('updated');

  // Handle error and disable simulation if B > 32
  if (B > 32) {
      document.getElementById('bitLimitError').style.display = 'block'; // Show error message
      document.getElementById('runSimulation').disabled = true; // Disable the simulation button
  } else {
      document.getElementById('bitLimitError').style.display = 'none'; // Hide error message
      document.getElementById('runSimulation').disabled = false; // Enable the simulation button
  }

  setTimeout(() => totalIdsElement.classList.remove('updated'), 500); // Highlight change

  updateExpectedGuesses();
}


/**
 * Updates the displayed expected number of guesses and dynamically adjusts guessing strategy explanations.
 */
/**
 * Updates the displayed expected number of guesses and dynamically adjusts guessing strategy explanations.
 */
function updateExpectedGuesses() {
  const B = parseInt(document.getElementById('bits').value);
  const totalPossibleIds = BigInt(2) ** BigInt(B); // Use BigInt for large B values

  let S = BigInt(document.getElementById('sessions').value);

  // Enforce S to be less than totalPossibleIds
  if (S >= totalPossibleIds) {
    S = totalPossibleIds - BigInt(1);
    document.getElementById('sessions').value = S.toString(); // Update input value
  }

  let A = document.getElementById('requests').value ? parseInt(document.getElementById('requests').value) : null;

  // Enforce A to be less than or equal to 100,000,000
  if (A && A > 100000000) {
    A = 100000000;
    document.getElementById('requests').value = A; // Update input value
  }

  const sessionMethod = document.querySelector('input[name="sessionMethod"]:checked').value;
  const guessStrategy = document.querySelector('input[name="guessStrategy"]:checked').value;

  // Update guessing strategy explanations based on session ID selection method
  updateStrategyExplanations(sessionMethod, guessStrategy);

  // Calculate expected guesses and update the formula
  const { expectedGuesses, formula } = calculateExpectedGuesses(B, S, A, sessionMethod, guessStrategy);

  // Check if expectedGuesses is a BigInt
  const expectedGuessesIsBigInt = typeof expectedGuesses === "bigint";

  // Update the displayed formula and result
  document.getElementById('expectedGuessesFormula').textContent = formula;
  document.getElementById('BValue').textContent = B;
  document.getElementById('SValue').textContent = S.toString();
  document.getElementById('AValue').textContent = A ? A : 'N/A';

  document.getElementById('expectedGuesses').textContent = `${expectedGuessesIsBigInt ? expectedGuesses.toString() : expectedGuesses.toFixed(2)} guesses`;

  // Display both expected guesses and duration if A is provided
  if (A) {
    const expectedDuration = expectedGuessesIsBigInt ? expectedGuesses / BigInt(A) : expectedGuesses / A;
    const humanizedDuration = humanizeDuration(Number(expectedDuration) * 1000, { round: true });

    // Check if expectedDuration is a BigInt
    const expectedDurationIsBigInt = typeof expectedDuration === "bigint";

    // Add a new line for expected duration formula
    const durationElementFormulaLine = document.getElementById('expectedDurationFormulaLine');
    durationElementFormulaLine.style.display = 'block';
    document.getElementById('expectedDurationFormula').textContent = `Expected Guesses / A`;

    // Add a new line for expected duration
    const durationElementLine = document.getElementById('expectedDurationLine');
    durationElementLine.style.display = 'block';
    document.getElementById('expectedDuration').textContent = `${expectedDurationIsBigInt ? expectedDuration.toString() : expectedDuration.toFixed(2)} seconds ≈ ${humanizedDuration}`;
  } else {
    document.getElementById('expectedDurationFormulaLine').style.display = 'none';
    document.getElementById('expectedDurationLine').style.display = 'none';
  }
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
 * @param {BigInt} S - The number of active sessions.
 * @param {BigInt} A - The number of requests per second.
 * @param {string} sessionMethod - The selected session method ('dynamic' or 'static').
 * @param {string} guessStrategy - The selected guessing strategy.
 * @returns {Object} - The expected guesses and the corresponding formula.
 */
function calculateExpectedGuesses(B, S, A, sessionMethod, guessStrategy) {
  let expectedGuesses, formula;

  const totalPossibleIds = BigInt(2) ** BigInt(B); // Use BigInt for large B values


  if (sessionMethod === 'dynamic' || guessStrategy === 'random') {
    if (A) {
      formula = `2^B / (S * A)`;
    } else {
      formula = `2^B / S`;
    }

    //Check if they are very large numbers that need special handling
    if (totalPossibleIds > BigInt(Number.MAX_SAFE_INTEGER) || S > BigInt(Number.MAX_SAFE_INTEGER)) {
      //They are large, so use the BigInt math
      expectedGuesses = totalPossibleIds / S;
    } else {
      //They are small enough to do Number math
      expectedGuesses = Number(totalPossibleIds) / Number(S);
    }

  } else {
    if (A) {
      formula = `(2^B + 1) / ((S + 1) * A)`;
    } else {
      formula = `(2^B + 1) / (S + 1)`;
    }

    //Check if they are very large numbers that need special handling
    if (totalPossibleIds > BigInt(Number.MAX_SAFE_INTEGER) || S > BigInt(Number.MAX_SAFE_INTEGER)) {
      //They are large, so use the BigInt math
      expectedGuesses = (totalPossibleIds + BigInt(1)) / (S + BigInt(1));
    } else {
      //They are small enough to do Number math
      expectedGuesses = (Number(totalPossibleIds) + 1) / (Number(S) + 1);
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

let workers = [];
let workerProgress = {}; // Track progress per worker
let runningSimulation = false;
let totalTrials = 0;
let completedTrials = 0;
let totalGuesses = 0;
let workersDone = 0;

// Maximum number of trials to run per worker report
const BATCH_SIZE = 1000;

function runSimulation() {
  if (runningSimulation) return; // Prevent multiple simulations from starting	

  // Ensure no lingering workers from a previous simulation
  if (workers.length > 0) {
    workers.forEach(worker => worker.terminate()); // Terminate existing workers
    workers = []; // Clear the workers array
  }

  const B = parseInt(document.getElementById('bits').value);
  const S = parseInt(document.getElementById('sessions').value);
  const trials = parseInt(document.getElementById('trials').value);
  const A = document.getElementById('requests').value ? parseInt(document.getElementById('requests').value) : null;
  const guessStrategy = document.querySelector('input[name="guessStrategy"]:checked').value;
  const sessionMethod = document.querySelector('input[name="sessionMethod"]:checked').value;
  const totalPossibleIds = Math.pow(2, B);

  const numWorkers = navigator.hardwareConcurrency || 4;
  const trialsPerWorker = Math.floor(trials / numWorkers);

  // Reset global state
  totalTrials = trials;
  completedTrials = 0;
  totalGuesses = 0;
  workersDone = 0; // Reset workersDone for a new simulation
  runningSimulation = true;
  workerProgress = {}; // Reset progress tracking

  // Reset the progress bar to green and set it to 0%
  document.getElementById('progressBarFill').style.backgroundColor = '#4caf50';
  document.getElementById('progressBarFill').style.width = '0%';
  document.getElementById('progress').textContent = '0%';

  document.getElementById('runSimulation').textContent = 'Stop Simulation';
  document.getElementById('runSimulation').onclick = stopSimulation;
  document.getElementById('avgGuesses').textContent = '-';
  document.getElementById('simTime').textContent = '-';
  document.getElementById('timeResults').style.display = 'none';
  document.getElementById('progress').textContent = `0%`;

  // Create workers
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker('worker.js');
    const workerId = `worker${i}`; // Unique ID for each worker

    // Initialize progress for each worker
    workerProgress[workerId] = {
      completedTrials: 0,
      totalGuesses: 0
    };

    // Send worker its data
    worker.postMessage({
      B,
      S,
      trials: i === numWorkers - 1 ? trialsPerWorker + (trials % numWorkers) : trialsPerWorker, // Ensure all trials are covered
      A,
      guessStrategy,
      sessionMethod,
      totalPossibleIds,
      batchSize: BATCH_SIZE,
    });

    // Handle messages from worker
    worker.onmessage = function (e) {
      if (e.data.type === 'progress') {
        // Update only the delta (difference since last report) for this worker
        const deltaTrials = e.data.completedTrials - workerProgress[workerId].completedTrials;
        const deltaGuesses = e.data.totalGuesses - workerProgress[workerId].totalGuesses;

        completedTrials += deltaTrials;
        totalGuesses += deltaGuesses;

        // Update the worker's progress
        workerProgress[workerId].completedTrials = e.data.completedTrials;
        workerProgress[workerId].totalGuesses = e.data.totalGuesses;

        updateProgress();

      } else if (e.data.type === 'done') {
        // Final message from the worker, process the last delta
        const deltaTrials = e.data.completedTrials - workerProgress[workerId].completedTrials;
        const deltaGuesses = e.data.totalGuesses - workerProgress[workerId].totalGuesses;

        completedTrials += deltaTrials;
        totalGuesses += deltaGuesses;

        // Mark the worker as done
        workersDone++;
        stopWorker(worker);

        // Check if all workers are done
        if (workersDone === workers.length) {
          finalizeSimulation(); // Finalize only when all workers are done
        }

        updateProgress();
      }
    };

    workers.push(worker);
  }
}

function updateProgress() {
  const avgGuesses = totalGuesses / completedTrials;
  document.getElementById('avgGuesses').textContent = avgGuesses.toFixed(2);
  document.getElementById('avgGuessesMeaning').textContent = avgGuesses.toFixed(2);

  const percentComplete = Math.floor((completedTrials / totalTrials) * 100);
  document.getElementById('progress').textContent = `${percentComplete}%`;
  document.getElementById('progressBarFill').style.width = `${percentComplete}%`;

  // If requests per second (A) is provided, calculate and display the average duration
  const A = document.getElementById('requests').value ? parseInt(document.getElementById('requests').value) : null;
  if (A) {
    const simTime = avgGuesses / A;
    const humanizedTime = humanizeDuration(simTime * 1000, { round: true });

    document.getElementById('simTime').textContent = `${simTime.toFixed(2)} seconds ≈ ${humanizedTime}`;
    document.getElementById('timeResults').style.display = 'block';

    // Update the simulation results section to show both values
    document.getElementById('avgGuesses').innerHTML = `${avgGuesses.toFixed(2)} guesses<br>(${simTime.toFixed(2)} seconds ≈ ${humanizedTime})`;
  } else {
    document.getElementById('timeResults').style.display = 'none'; // Hide if A is not set
  }
}

function finalizeSimulation() {
  runningSimulation = false;
  document.getElementById('runSimulation').textContent = 'Run Simulation';
  document.getElementById('runSimulation').onclick = runSimulation;

  // Calculate the average guesses
  const avgGuesses = totalGuesses / completedTrials;
  document.getElementById('avgGuesses').textContent = avgGuesses.toFixed(2);
  document.getElementById('avgGuessesMeaning').textContent = avgGuesses.toFixed(2);

  // If requests per second (A) is provided, calculate and display the average duration
  const A = document.getElementById('requests').value ? parseInt(document.getElementById('requests').value) : null;
  if (A) {
    const simTime = avgGuesses / A;
    const humanizedTime = humanizeDuration(simTime * 1000, { round: true });

    document.getElementById('simTime').textContent = `${simTime.toFixed(2)} seconds ≈ ${humanizedTime}`;
    document.getElementById('timeResults').style.display = 'block';

    // Update the simulation results section to show both values
    document.getElementById('avgGuesses').innerHTML = `${avgGuesses.toFixed(2)} guesses<br>(${simTime.toFixed(2)} seconds ≈ ${humanizedTime})`;
  } else {
    document.getElementById('timeResults').style.display = 'none'; // Hide if A is not set
  }
}


function stopSimulation() {
  runningSimulation = false;
  workers.forEach(worker => worker.terminate()); // Terminate all active workers
  workers = []; // Clear the workers list

  // Reset the UI
  document.getElementById('runSimulation').textContent = 'Run Simulation';
  document.getElementById('runSimulation').onclick = runSimulation;
  document.getElementById('progressBarFill').style.backgroundColor = 'red';
  document.getElementById('progress').textContent = 'Simulation stopped.';
}

function stopWorker(worker) {
  worker.terminate(); // Properly terminate the worker
  workers = workers.filter(w => w !== worker); // Remove the worker from the active list
}

// --- Initialization ---

// Add event listeners to update values when inputs change
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('bits').addEventListener('input', updateTotalIds);
  document.getElementById('sessions').addEventListener('input', updateExpectedGuesses);
  document.getElementById('requests').addEventListener('input', updateExpectedGuesses);
  document.querySelectorAll('input[name="sessionMethod"]').forEach(radio => {
    radio.addEventListener('change', updateExpectedGuesses);
  });
  document.querySelectorAll('input[name="guessStrategy"]').forEach(radio => {
    radio.addEventListener('change', updateExpectedGuesses);
  });

  // Set event listener for the simulation button
  document.getElementById('runSimulation').onclick = runSimulation;

  // Initial update of total IDs on page load
  updateTotalIds();
});
