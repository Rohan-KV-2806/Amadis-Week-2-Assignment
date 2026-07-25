/**
 * Phase 2 – Step 4: Local Storage Logic
 * ======================================
 * Handles reading/writing application data to localStorage.
 */

const STORAGE_KEY = 'jobApplications';

/**
 * Retrieve all applications from localStorage.
 * @returns {Array} Array of application objects.
 */
function getApplications() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save an array of applications to localStorage.
 * @param {Array} apps - Array of application objects.
 */
function saveApplications(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}
