// worker.js
self.onmessage = function (e) {
  const { B, S, trials, A, guessStrategy, sessionMethod, totalPossibleIds, batchSize } = e.data;

  const results = {
    totalGuesses: 0,
    completedTrials: 0,
  };

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

  // Run the simulation in batches for better reporting
  for (let i = 0; i < trials; i += batchSize) {

    // Run a batch of simulations
    for (let j = 0; j < batchSize && i + j < trials; j++) {
      //Run a single simulation
      let validSessions = generateSessionIDs(S, totalPossibleIds);
      const guessSessionId = getSessionIdGuesser(guessStrategy, totalPossibleIds);
      let guesses = 0;
      while (true) {
        guesses++;
        const guess = guessSessionId();
        if (validSessions.has(guess)) break;

        if (sessionMethod === 'dynamic') {
          validSessions = generateSessionIDs(S, totalPossibleIds);
        }
      }
      results.totalGuesses += guesses;
      results.completedTrials++;
    }

    // Report progress back to the main thread
    self.postMessage({ type: 'progress', completedTrials: results.completedTrials, totalGuesses: results.totalGuesses });
  }

  // Final result
  self.postMessage({ type: 'done', completedTrials: results.completedTrials, totalGuesses: results.totalGuesses });
};
