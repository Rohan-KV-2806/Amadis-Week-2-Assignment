/**
 * Job Application Tracker – Main App Logic
 * ==========================================
 * Steps 5–10: Render, Add, Dashboard, Search/Filter, Edit, Delete
 */

// ===== STATE =====
let editingId = null; // null = adding new; number = editing existing

// ===== DOM REFERENCES =====
const tableBody    = document.getElementById('tableBody');
const searchInput  = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const addBtn       = document.getElementById('addBtn');
const formOverlay  = document.getElementById('formOverlay');
const formTitle    = document.getElementById('formTitle');
const appForm      = document.getElementById('appForm');
const cancelBtn    = document.getElementById('cancelBtn');

const companyInput       = document.getElementById('company');
const roleInput          = document.getElementById('role');
const statusInput        = document.getElementById('status');
const appliedDateInput   = document.getElementById('appliedDate');
const interviewDateInput = document.getElementById('interviewDate');
const notesInput         = document.getElementById('notes');

// ================================================================
//  STEP 5 – Render the Table
// ================================================================
function renderTable(apps) {
  // If no array passed, get all from storage
  if (!apps) apps = getApplications();

  if (apps.length === 0) {
    tableBody.innerHTML = `<tr>
      <td colspan="7" class="empty-message">No applications yet. Click "+ Add Application" to get started!</td>
    </tr>`;
    return;
  }

  let html = '';
  apps.forEach(app => {
    const statusClass = `status-badge status-${app.status}`;
    html += `<tr>
      <td>${escapeHtml(app.company)}</td>
      <td>${escapeHtml(app.role)}</td>
      <td><span class="${statusClass}">${escapeHtml(app.status)}</span></td>
      <td>${app.appliedDate || '—'}</td>
      <td>${app.interviewDate || '—'}</td>
      <td>${app.notes ? `<button class="btn-view-notes" onclick="viewNotes(${app.id})">📄 View Notes</button>` : '—'}</td>
      <td>
        <button class="btn-company" onclick="viewCompanyDetails(${app.id})">🏢 Details</button>
        <button class="btn-edit" onclick="editApplication(${app.id})">Edit</button>
        <button class="btn-delete" onclick="deleteApplication(${app.id})">Delete</button>
      </td>
    </tr>`;
  });
  tableBody.innerHTML = html;
}

// ================================================================
//  STEP 7 – Dashboard Stats
// ================================================================
function updateDashboard() {
  const apps = getApplications();
  const total = apps.length;

  let appliedCount  = 0;
  let interviewCount = 0;
  let offerCount     = 0;
  // Rejected is not shown on dashboard (or could add a 4th card for it,
  // but the existing CSS only has 4 cards: Total, Applied, Interview, Offer)

  apps.forEach(app => {
    switch (app.status) {
      case 'Applied':   appliedCount++;  break;
      case 'Interview': interviewCount++; break;
      case 'Offer':     offerCount++;     break;
      // Rejected is counted in Total but not shown separately
    }
  });

  document.getElementById('stat-total').textContent     = total;
  document.getElementById('stat-applied').textContent   = appliedCount;
  document.getElementById('stat-interview').textContent = interviewCount;
  document.getElementById('stat-offer').textContent     = offerCount;
}

// ================================================================
//  STEP 6 – Add Application (Show Form & Submit)
// ================================================================

// Show the form in "Add" mode
addBtn.addEventListener('click', () => {
  editingId = null;
  formTitle.textContent = 'Add Application';
  appForm.reset();
  formOverlay.classList.remove('hidden');
});

// Cancel button – hide the form
cancelBtn.addEventListener('click', () => {
  formOverlay.classList.add('hidden');
});

// Click overlay background to close
formOverlay.addEventListener('click', (e) => {
  if (e.target === formOverlay) formOverlay.classList.add('hidden');
});

// Form submit – Create or Update
appForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = {
    company:       companyInput.value.trim(),
    role:          roleInput.value.trim(),
    status:        statusInput.value,
    appliedDate:   appliedDateInput.value,
    interviewDate: interviewDateInput.value,
    notes:         notesInput.value.trim()
  };

  let apps = getApplications();

  if (editingId !== null) {
    // STEP 10 – UPDATE existing application
    apps = apps.map(app => {
      if (app.id === editingId) {
        return { ...app, ...formData };
      }
      return app;
    });
  } else {
    // STEP 6 – CREATE new application
    formData.id = Date.now();
    apps.push(formData);
  }

  saveApplications(apps);

  // Reset and close
  editingId = null;
  formOverlay.classList.add('hidden');
  renderTable();
  updateDashboard();
});

// ================================================================
//  STEP 9 – Delete Application
// ================================================================
function deleteApplication(id) {
  if (!confirm('Are you sure you want to delete this application?')) return;

  let apps = getApplications();
  apps = apps.filter(app => app.id !== id);
  saveApplications(apps);
  renderTable();
  updateDashboard();
}

// ================================================================
//  VIEW NOTES – Show notes in alert popup
// ================================================================
function viewNotes(id) {
  const apps = getApplications();
  const app = apps.find(a => a.id === id);
  if (!app || !app.notes) {
    alert('No notes for this application.');
    return;
  }
  alert(`📝 Notes for ${app.company} - ${app.role}:\n\n${app.notes}`);
}

// ================================================================
//  STEP 10 – Edit Application
// ================================================================
function editApplication(id) {
  const apps = getApplications();
  const app = apps.find(a => a.id === id);
  if (!app) return;

  editingId = id;
  formTitle.textContent = 'Edit Application';

  companyInput.value       = app.company;
  roleInput.value          = app.role;
  statusInput.value        = app.status;
  appliedDateInput.value   = app.appliedDate || '';
  interviewDateInput.value = app.interviewDate || '';
  notesInput.value         = app.notes || '';

  formOverlay.classList.remove('hidden');
}

// ================================================================
//  STEP 8 – Search & Filter
// ================================================================
function filterAndRender() {
  const query  = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  let apps     = getApplications();

  // Filter by status
  if (status) {
    apps = apps.filter(app => app.status === status);
  }

  // Filter by search text (company or role)
  if (query) {
    apps = apps.filter(app =>
      app.company.toLowerCase().includes(query) ||
      app.role.toLowerCase().includes(query)
    );
  }

  renderTable(apps);
}

searchInput.addEventListener('input', filterAndRender);
statusFilter.addEventListener('change', filterAndRender);

// ================================================================
//  INIT – On Page Load
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  updateDashboard();
});

// ================================================================
//  COMPANY DETAILS – Fetch from Wikipedia API
// ================================================================
const companyOverlay     = document.getElementById('companyOverlay');
const companyTitle       = document.getElementById('companyDetailsTitle');
const companyDesc        = document.getElementById('companyDetailsDesc');
const companyLogo        = document.getElementById('companyLogo');
const companyExtract     = document.getElementById('companyExtract');
const companyWikiLink    = document.getElementById('companyWikiLink');
const companyLoading     = document.getElementById('companyLoading');
const companyContent     = document.getElementById('companyContent');
const companyError       = document.getElementById('companyError');
const companyCloseBtn    = document.getElementById('companyCloseBtn');

// Close company modal
companyCloseBtn.addEventListener('click', () => {
  companyOverlay.classList.add('hidden');
});

companyOverlay.addEventListener('click', (e) => {
  if (e.target === companyOverlay) companyOverlay.classList.add('hidden');
});

function viewCompanyDetails(id) {
  const apps = getApplications();
  const app = apps.find(a => a.id === id);
  if (!app) return;

  // Show modal with loading state
  companyOverlay.classList.remove('hidden');
  companyTitle.textContent = app.company;
  companyDesc.textContent = '';
  companyLogo.style.display = 'none';
  companyLoading.classList.remove('hidden');
  companyContent.classList.add('hidden');
  companyError.classList.add('hidden');

  // Try fetching from Clearbit for the logo first
  const cleanName = app.company.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const domainGuess = cleanName.replace(/\s+/g, '') + '.com';
  companyLogo.src = `https://logo.clearbit.com/${domainGuess}`;
  companyLogo.style.display = 'block';

  // Fetch company info from Wikipedia API (free, no key needed)
  const searchQuery = encodeURIComponent(app.company);
  const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${searchQuery}`;

  fetch(wikiUrl)
    .then(res => {
      if (!res.ok) throw new Error('Not found');
      return res.json();
    })
    .then(data => {
      if (data.type === 'disambiguation' || !data.extract) {
        throw new Error('Disambiguation page');
      }
      companyDesc.textContent = data.description || '';
      companyExtract.textContent = data.extract;
      companyWikiLink.href = data.content_urls.desktop.page;
      companyLoading.classList.add('hidden');
      companyContent.classList.remove('hidden');
    })
    .catch(() => {
      // Try a broader search fallback
      const fallbackUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${searchQuery}_company`;
      return fetch(fallbackUrl)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          companyDesc.textContent = data.description || '';
          companyExtract.textContent = data.extract;
          companyWikiLink.href = data.content_urls.desktop.page;
          companyLoading.classList.add('hidden');
          companyContent.classList.remove('hidden');
        })
        .catch(() => {
          companyLoading.classList.add('hidden');
          companyError.classList.remove('hidden');
        });
    });
}

// ================================================================
//  UTILITY – Escape HTML to prevent XSS
// ================================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
