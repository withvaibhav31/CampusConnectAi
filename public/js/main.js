/**
 * CampusConnect AI - Main Frontend JavaScript
 * Handles: Navbar, Chatbot, Flash messages, UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Auto-dismiss flash messages after 5 seconds ──────────────
  const flashes = document.querySelectorAll('.flash');
  flashes.forEach(flash => {
    setTimeout(() => {
      flash.style.opacity = '0';
      flash.style.transform = 'translateX(100px)';
      flash.style.transition = 'all 0.4s ease';
      setTimeout(() => flash.remove(), 400);
    }, 5000);
  });

  // ─── Mobile Navbar Toggle ──────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '64px';
      navLinks.style.right = '1rem';
      navLinks.style.background = 'var(--bg-3)';
      navLinks.style.border = '1px solid var(--border)';
      navLinks.style.borderRadius = '12px';
      navLinks.style.padding = '1rem';
      navLinks.style.zIndex = '200';
      navLinks.style.minWidth = '200px';
      navLinks.style.boxShadow = 'var(--shadow-lg)';
    });
    // Close nav on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.style.display = '';
      }
    });
  }

  // ─── Chatbot ───────────────────────────────────────────────────
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotPanel = document.getElementById('chatbotPanel');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');

  if (chatbotToggle && chatbotPanel) {
    // Toggle panel
    chatbotToggle.addEventListener('click', () => {
      chatbotPanel.classList.toggle('open');
      if (chatbotPanel.classList.contains('open') && chatInput) {
        setTimeout(() => chatInput.focus(), 100);
      }
    });

    // Close button
    if (chatbotClose) {
      chatbotClose.addEventListener('click', () => {
        chatbotPanel.classList.remove('open');
      });
    }

    // Send message on button click
    if (chatSend) {
      chatSend.addEventListener('click', sendChatMessage);
    }

    // Send message on Enter key
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChatMessage();
        }
      });
    }
  }

  /**
   * Send a chat message to the AI chatbot
   */
  async function sendChatMessage() {
    if (!chatInput || !chatMessages) return;
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to UI
    appendChatMessage(message, 'user');
    chatInput.value = '';

    // Show typing indicator
    const typingEl = showTypingIndicator();

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();

      // Remove typing indicator
      typingEl.remove();

      // Add bot response
      appendChatMessage(data.response || "Sorry, I couldn't process that. Try again!", 'bot');
    } catch (error) {
      typingEl.remove();
      appendChatMessage("Sorry, I'm having trouble connecting. Please try again!", 'bot');
    }
  }

  /**
   * Append a message to the chat panel
   */
  function appendChatMessage(text, sender) {
    if (!chatMessages) return;

    // Remove suggestion chips once user sends a message
    const suggestions = chatMessages.querySelector('.chat-suggestions');
    if (suggestions && sender === 'user') suggestions.remove();

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${sender}`;

    // Convert **bold** markdown to <strong>
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    msgEl.innerHTML = `<span>${formatted}</span>`;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Show typing animation
   */
  function showTypingIndicator() {
    if (!chatMessages) return { remove: () => {} };
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
  }

  // ─── Animate stats on scroll ────────────────────────────────────
  const statNumbers = document.querySelectorAll('.stat-item strong, .stat-card strong');
  const observerOptions = { threshold: 0.5 };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateNumber(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  statNumbers.forEach(el => {
    // Only animate if it's a plain number
    const text = el.textContent.replace('+', '');
    if (!isNaN(parseInt(text))) {
      statsObserver.observe(el);
    }
  });

  function animateNumber(el) {
    const original = el.textContent;
    const num = parseInt(original.replace('+', ''));
    const hasPlus = original.includes('+');
    if (isNaN(num) || num === 0) return;

    let current = 0;
    const increment = Math.max(1, Math.floor(num / 40));
    const duration = 800;
    const steps = Math.min(40, num);
    const interval = duration / steps;

    const timer = setInterval(() => {
      current = Math.min(current + increment, num);
      el.textContent = current + (hasPlus ? '+' : '');
      if (current >= num) clearInterval(timer);
    }, interval);
  }

  // ─── Event Card hover glow effect ──────────────────────────────
  const eventCards = document.querySelectorAll('.event-card');
  eventCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });

  // ─── Search bar live suggestions ────────────────────────────────
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const q = e.target.value.trim();
      if (q.length < 2) {
        removeSearchDropdown();
        return;
      }
      searchTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`/api/events/search?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          showSearchDropdown(data.events || [], searchInput);
        } catch (err) { /* silent fail */ }
      }, 300);
    });

    // Hide on blur (with delay to allow click)
    searchInput.addEventListener('blur', () => {
      setTimeout(removeSearchDropdown, 200);
    });
  }

  function showSearchDropdown(events, input) {
    removeSearchDropdown();
    if (events.length === 0) return;

    const dropdown = document.createElement('div');
    dropdown.id = 'searchDropdown';
    dropdown.style.cssText = `
      position: absolute; z-index: 100; background: var(--bg-3);
      border: 1px solid var(--border); border-radius: 10px;
      box-shadow: var(--shadow-lg); width: 320px; overflow: hidden;
      margin-top: 4px;
    `;

    events.slice(0, 5).forEach(ev => {
      const item = document.createElement('a');
      item.href = `/events/${ev._id}`;
      item.style.cssText = `
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.65rem 1rem; color: var(--text-2); font-size: 0.85rem;
        border-bottom: 1px solid var(--border); transition: background 0.15s;
      `;
      item.innerHTML = `
        <span style="font-size:1.1rem">${getCategoryEmoji(ev.category)}</span>
        <div>
          <strong style="color:var(--text);font-size:0.875rem">${ev.title}</strong>
          <span style="display:block;font-size:0.75rem;color:var(--text-3)">
            📅 ${new Date(ev.date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})} · ${ev.venue || ''}
          </span>
        </div>
      `;
      item.addEventListener('mouseover', () => item.style.background = 'var(--bg-4)');
      item.addEventListener('mouseout', () => item.style.background = '');
      dropdown.appendChild(item);
    });

    const searchBox = input.closest('.search-box');
    if (searchBox) {
      searchBox.style.position = 'relative';
      searchBox.appendChild(dropdown);
    }
  }

  function removeSearchDropdown() {
    const existing = document.getElementById('searchDropdown');
    if (existing) existing.remove();
  }

  function getCategoryEmoji(cat) {
    const emojis = {
      coding:'💻', music:'🎵', dance:'💃', sports:'⚽', art:'🎨',
      science:'🔬', business:'💼', gaming:'🎮', photography:'📸',
      drama:'🎭', debate:'🗣', literature:'📚', workshop:'🛠',
      seminar:'📊', other:'🎯'
    };
    return emojis[cat] || '🎯';
  }

  // ─── Capacity bar animation on page load ────────────────────────
  const capacityFills = document.querySelectorAll('.capacity-fill, .mini-bar-fill');
  capacityFills.forEach(bar => {
    const targetWidth = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = 'width 1s ease';
      bar.style.width = targetWidth;
    }, 300);
  });

  // ─── Form validation enhancements ───────────────────────────────
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span style="opacity:0.7">Processing...</span>';
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'not-allowed';
        // Re-enable after 5s as fallback
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.style.opacity = '';
          submitBtn.style.cursor = '';
        }, 5000);
      }
    });
  });

  // ─── AI recommendation refresh ──────────────────────────────────
  const refreshBtn = document.getElementById('refreshRecommendations');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = '🔄 Refreshing...';
      try {
        const res = await fetch('/api/recommendations');
        const data = await res.json();
        if (data.recommendations) {
          window.location.reload();
        }
      } catch (err) {
        refreshBtn.textContent = '🤖 Refresh AI';
      }
    });
  }

  // ─── Sticky header shadow ────────────────────────────────────────
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
      } else {
        navbar.style.boxShadow = '';
      }
    });
  }

  // ─── Interest chips animation ────────────────────────────────────
  const interestChips = document.querySelectorAll('.interest-chip');
  interestChips.forEach((chip, i) => {
    chip.style.animationDelay = `${i * 30}ms`;
    chip.style.animation = 'fadeInUp 0.3s ease forwards';
    chip.style.opacity = '0';
  });

  // Add fadeInUp keyframe if not present
  if (!document.querySelector('#fadeInUpStyle')) {
    const style = document.createElement('style');
    style.id = 'fadeInUpStyle';
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Confirm unregister ──────────────────────────────────────────
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (!confirm(el.dataset.confirm)) e.preventDefault();
    });
  });

  console.log('🎓 CampusConnect AI frontend loaded!');
});

/**
 * Global function: send suggestion chip text as chat message
 * Called from onclick in EJS templates
 */
function sendSuggestion(el) {
  const chatInput = document.getElementById('chatInput');
  const chatbotPanel = document.getElementById('chatbotPanel');
  if (chatInput && chatbotPanel) {
    chatbotPanel.classList.add('open');
    chatInput.value = el.textContent.trim();
    // Trigger send
    const chatSend = document.getElementById('chatSend');
    if (chatSend) chatSend.click();
  }
}
