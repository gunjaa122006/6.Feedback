// State management
let selectedCategory = null;

// DOM elements
const categoryButtons = document.querySelectorAll('.category-btn');
const categoryInput = document.getElementById('category');
const categoryError = document.getElementById('categoryError');
const contentTextarea = document.getElementById('content');
const contentError = document.getElementById('contentError');
const charCount = document.getElementById('charCount');
const charProgressBar = document.getElementById('charProgressBar');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackCard = document.getElementById('feedbackCard');
const successCard = document.getElementById('successCard');
const submitBtn = document.getElementById('submitBtn');
const submitAnotherBtn = document.getElementById('submitAnotherBtn');

// Category selection
categoryButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons
    categoryButtons.forEach(b => b.classList.remove('active'));
    
    // Add active class to clicked button
    btn.classList.add('active');
    
    // Store selected category
    selectedCategory = btn.dataset.category;
    categoryInput.value = selectedCategory;
    
    // Clear error
    categoryError.classList.remove('show');
    
    // Micro-interaction
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 100);
  });
});

// Character counter
contentTextarea.addEventListener('input', () => {
  const length = contentTextarea.value.length;
  const maxLength = 2000;
  const percentage = (length / maxLength) * 100;
  
  // Update counter
  charCount.textContent = `${length} / ${maxLength}`;
  charProgressBar.style.width = `${percentage}%`;
  
  // Color coding
  charProgressBar.classList.remove('warning', 'danger');
  if (percentage > 90) {
    charProgressBar.classList.add('danger');
  } else if (percentage > 75) {
    charProgressBar.classList.add('warning');
  }
  
  // Clear error when user starts typing
  if (length >= 10) {
    contentError.classList.remove('show');
  }
});

// Form validation
function validateForm() {
  let isValid = true;
  
  // Validate category
  if (!selectedCategory) {
    categoryError.textContent = 'Please select a category';
    categoryError.classList.add('show');
    isValid = false;
  } else {
    categoryError.classList.remove('show');
  }
  
  // Validate content
  const content = contentTextarea.value.trim();
  if (content.length < 10) {
    contentError.textContent = 'Feedback must be at least 10 characters';
    contentError.classList.add('show');
    isValid = false;
  } else if (content.length > 2000) {
    contentError.textContent = 'Feedback must not exceed 2000 characters';
    contentError.classList.add('show');
    isValid = false;
  } else {
    contentError.classList.remove('show');
  }
  
  return isValid;
}

// Form submission
feedbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate
  if (!validateForm()) {
    return;
  }
  
  // Prepare data
  const formData = {
    content: contentTextarea.value.trim(),
    category: selectedCategory
  };
  
  // Update UI - loading state
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  feedbackCard.classList.add('submitting');
  
  try {
    // Submit feedback
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit feedback');
    }
    
    // Success - show success card with animation
    setTimeout(() => {
      feedbackCard.classList.add('hidden');
      successCard.classList.remove('hidden');
      
      // Reset form
      feedbackForm.reset();
      categoryButtons.forEach(b => b.classList.remove('active'));
      selectedCategory = null;
      charCount.textContent = '0 / 2000';
      charProgressBar.style.width = '0%';
    }, 300);
    
  } catch (error) {
    // Show error
    contentError.textContent = error.message;
    contentError.classList.add('show');
    
    // Shake animation
    feedbackCard.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(() => {
      feedbackCard.style.animation = '';
    }, 300);
    
  } finally {
    // Reset button state
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    feedbackCard.classList.remove('submitting');
  }
});

// Submit another feedback
submitAnotherBtn.addEventListener('click', () => {
  successCard.classList.add('hidden');
  feedbackCard.classList.remove('hidden');
  
  // Scroll to top smoothly
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Real-time validation on blur
contentTextarea.addEventListener('blur', () => {
  const content = contentTextarea.value.trim();
  if (content.length > 0 && content.length < 10) {
    contentError.textContent = 'Feedback must be at least 10 characters';
    contentError.classList.add('show');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to submit
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (!feedbackCard.classList.contains('hidden')) {
      feedbackForm.dispatchEvent(new Event('submit'));
    }
  }
});

// Initialize - add focus to textarea on load
setTimeout(() => {
  contentTextarea.focus();
}, 500);
