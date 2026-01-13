// State management
let adminToken = null;
let allFeedback = [];
let filteredFeedback = [];
let currentOffset = 0;
const ITEMS_PER_PAGE = 50;

// DOM elements
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const tokenInput = document.getElementById('tokenInput');
const authError = document.getElementById('authError');
const dashboard = document.getElementById('dashboard');
const statsGrid = document.getElementById('statsGrid');
const feedbackList = document.getElementById('feedbackList');
const skeletonLoader = document.getElementById('skeletonLoader');
const emptyState = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const statusFilter = document.getElementById('statusFilter');
const categoryFilter = document.getElementById('categoryFilter');
const sortOrder = document.getElementById('sortOrder');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Authentication
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = tokenInput.value.trim();
  
  if (!token) {
    showAuthError('Please enter an access token');
    return;
  }
  
  // Show loading
  const submitBtn = authForm.querySelector('.auth-btn');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  
  try {
    // Test authentication
    const response = await fetch('/api/admin/statistics', {
      headers: {
        'X-Admin-Token': token
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid access token');
    }
    
    // Store token
    adminToken = token;
    sessionStorage.setItem('adminToken', token);
    
    // Show dashboard
    authModal.style.display = 'none';
    dashboard.classList.remove('hidden');
    
    // Load data
    await loadDashboard();
    
  } catch (error) {
    showAuthError(error.message);
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.add('show');
  tokenInput.style.animation = 'shake 0.3s ease-in-out';
  setTimeout(() => {
    tokenInput.style.animation = '';
  }, 300);
}

// Check for existing session
window.addEventListener('DOMContentLoaded', () => {
  const storedToken = sessionStorage.getItem('adminToken');
  if (storedToken) {
    tokenInput.value = storedToken;
    authForm.dispatchEvent(new Event('submit'));
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  adminToken = null;
  sessionStorage.removeItem('adminToken');
  dashboard.classList.add('hidden');
  authModal.style.display = 'flex';
  tokenInput.value = '';
  authError.classList.remove('show');
});

// Load dashboard data
async function loadDashboard() {
  await Promise.all([
    loadStatistics(),
    loadFeedback()
  ]);
}

// Load statistics
async function loadStatistics() {
  try {
    const response = await fetch('/api/admin/statistics', {
      headers: {
        'X-Admin-Token': adminToken
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error);
    }
    
    renderStatistics(data.data);
    
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}

// Render statistics
function renderStatistics(stats) {
  const statsHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Feedback</div>
      <div class="stat-value">${stats.total}</div>
    </div>
    <div class="stat-card warning">
      <div class="stat-label">Unread</div>
      <div class="stat-value">${stats.unread}</div>
    </div>
    <div class="stat-card success">
      <div class="stat-label">Read</div>
      <div class="stat-value">${stats.total - stats.unread}</div>
    </div>
    <div class="stat-card info">
      <div class="stat-label">Categories</div>
      <div class="stat-value">${stats.byCategory.length}</div>
    </div>
  `;
  
  statsGrid.innerHTML = statsHTML;
}

// Load feedback
async function loadFeedback(append = false) {
  try {
    skeletonLoader.classList.remove('hidden');
    
    const response = await fetch(
      `/api/admin/feedback?limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`,
      {
        headers: {
          'X-Admin-Token': adminToken
        }
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error);
    }
    
    if (append) {
      allFeedback = [...allFeedback, ...data.data.feedback];
    } else {
      allFeedback = data.data.feedback;
      currentOffset = 0;
    }
    
    // Apply filters
    applyFilters();
    
    // Update load more button
    if (data.data.pagination.hasMore) {
      loadMoreContainer.classList.remove('hidden');
    } else {
      loadMoreContainer.classList.add('hidden');
    }
    
  } catch (error) {
    console.error('Failed to load feedback:', error);
  } finally {
    skeletonLoader.classList.add('hidden');
  }
}

// Apply filters
function applyFilters() {
  const status = statusFilter.value;
  const category = categoryFilter.value;
  const sort = sortOrder.value;
  
  // Filter by status
  filteredFeedback = allFeedback.filter(item => {
    if (status !== 'all' && item.status !== status) return false;
    if (category !== 'all' && item.category !== category) return false;
    return true;
  });
  
  // Sort
  if (sort === 'oldest') {
    filteredFeedback.sort((a, b) => a.created_at - b.created_at);
  } else {
    filteredFeedback.sort((a, b) => b.created_at - a.created_at);
  }
  
  renderFeedback();
}

// Render feedback
function renderFeedback() {
  if (filteredFeedback.length === 0) {
    feedbackList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  // Group by time
  const groups = {
    today: [],
    thisWeek: [],
    older: []
  };
  
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  
  filteredFeedback.forEach(item => {
    const age = now - item.created_at;
    if (age < dayMs) {
      groups.today.push(item);
    } else if (age < weekMs) {
      groups.thisWeek.push(item);
    } else {
      groups.older.push(item);
    }
  });
  
  // Render groups
  let html = '';
  
  if (groups.today.length > 0) {
    html += renderTimeGroup('Today', groups.today);
  }
  
  if (groups.thisWeek.length > 0) {
    html += renderTimeGroup('This Week', groups.thisWeek);
  }
  
  if (groups.older.length > 0) {
    html += renderTimeGroup('Older', groups.older);
  }
  
  feedbackList.innerHTML = html;
  
  // Attach event listeners
  attachFeedbackListeners();
}

// Render time group
function renderTimeGroup(title, items) {
  const itemsHTML = items.map(item => renderFeedbackCard(item)).join('');
  
  return `
    <div class="time-group">
      <h2 class="time-group-header">${title}</h2>
      <div class="feedback-items">
        ${itemsHTML}
      </div>
    </div>
  `;
}

// Render feedback card
function renderFeedbackCard(item) {
  const date = new Date(item.created_at);
  const formattedDate = date.toLocaleString();
  
  // Determine length indicator
  let lengthClass = '';
  if (item.char_count > 1000) lengthClass = 'long';
  else if (item.char_count > 500) lengthClass = 'medium';
  
  return `
    <div class="feedback-card ${item.status}" data-id="${item.id}">
      <div class="feedback-header">
        <div class="feedback-meta">
          <span class="category-badge ${item.category}">${item.category}</span>
          <span class="status-badge ${item.status}">${item.status}</span>
          <span class="timestamp">${formattedDate}</span>
        </div>
        <div class="feedback-actions">
          ${item.status === 'unread' ? `
            <button class="action-btn mark-read" data-id="${item.id}" title="Mark as read">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          ` : ''}
          <button class="action-btn delete" data-id="${item.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="feedback-content">${escapeHtml(item.content)}</div>
      <div class="feedback-footer">
        <div class="char-length">
          <span class="length-indicator ${lengthClass}"></span>
          <span>${item.char_count} characters</span>
        </div>
        <span>ID: ${item.id}</span>
      </div>
    </div>
  `;
}

// Attach event listeners to feedback cards
function attachFeedbackListeners() {
  // Mark as read
  document.querySelectorAll('.action-btn.mark-read').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      await markAsRead(id);
    });
  });
  
  // Delete
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('Are you sure you want to delete this feedback?')) {
        await deleteFeedback(id);
      }
    });
  });
}

// Mark feedback as read
async function markAsRead(id) {
  try {
    const response = await fetch(`/api/admin/feedback/${id}/read`, {
      method: 'PATCH',
      headers: {
        'X-Admin-Token': adminToken
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }
    
    // Update local state
    const item = allFeedback.find(f => f.id === parseInt(id));
    if (item) {
      item.status = 'read';
    }
    
    // Refresh display
    applyFilters();
    await loadStatistics();
    
  } catch (error) {
    console.error('Failed to mark as read:', error);
    alert('Failed to mark feedback as read');
  }
}

// Delete feedback
async function deleteFeedback(id) {
  try {
    const response = await fetch(`/api/admin/feedback/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Token': adminToken
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete feedback');
    }
    
    // Remove from local state
    allFeedback = allFeedback.filter(f => f.id !== parseInt(id));
    
    // Refresh display
    applyFilters();
    await loadStatistics();
    
  } catch (error) {
    console.error('Failed to delete feedback:', error);
    alert('Failed to delete feedback');
  }
}

// Refresh button
refreshBtn.addEventListener('click', async () => {
  refreshBtn.classList.add('spinning');
  await loadDashboard();
  setTimeout(() => {
    refreshBtn.classList.remove('spinning');
  }, 600);
});

// Filter listeners
statusFilter.addEventListener('change', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
sortOrder.addEventListener('change', applyFilters);

// Load more
loadMoreBtn.addEventListener('click', async () => {
  currentOffset += ITEMS_PER_PAGE;
  await loadFeedback(true);
});

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-refresh every 30 seconds
setInterval(async () => {
  if (adminToken && !dashboard.classList.contains('hidden')) {
    await loadStatistics();
  }
}, 30000);
