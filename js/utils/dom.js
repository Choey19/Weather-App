// ============================================
// NimbusIQ — DOM Utility Helpers
// ============================================

/**
 * Query a single element
 */
export const $ = (selector, parent = document) => {
  if (selector instanceof Element) return selector;
  return parent.querySelector(selector);
};

/**
 * Query all elements
 */
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/**
 * Create an element with optional classes, attributes, and children
 */
export function createElement(tag, options = {}) {
  const el = document.createElement(tag);

  if (options.classes) {
    const list = Array.isArray(options.classes) ? options.classes : options.classes.split(' ');
    el.classList.add(...list.filter(Boolean));
  }

  if (options.attrs) {
    for (const [key, val] of Object.entries(options.attrs)) {
      el.setAttribute(key, val);
    }
  }

  if (options.text) {
    el.textContent = options.text;
  }

  if (options.html) {
    el.innerHTML = options.html;
  }

  if (options.style) {
    Object.assign(el.style, options.style);
  }

  if (options.children) {
    for (const child of options.children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child) {
        el.appendChild(child);
      }
    }
  }

  if (options.events) {
    for (const [event, handler] of Object.entries(options.events)) {
      el.addEventListener(event, handler);
    }
  }

  return el;
}

/**
 * Shorthand — set innerHTML safely for a container
 */
export function render(container, html) {
  if (typeof container === 'string') {
    container = $(container);
  }
  if (container) {
    container.innerHTML = html;
  }
}

/**
 * Add event listener shorthand
 */
export function on(el, event, handler, options) {
  if (typeof el === 'string') el = $(el);
  if (el) el.addEventListener(event, handler, options);
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Show/hide loading skeleton
 */
export function showSkeleton(container, count = 3) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="card animate-in stagger-${i + 1}">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text" style="width:50%"></div>
        <div class="skeleton skeleton--chart" style="margin-top:16px"></div>
      </div>
    `;
  }
  render(container, html);
}

/**
 * Show loading spinner inside a card
 */
export function showCardLoading(container) {
  const overlay = createElement('div', { classes: 'loading-overlay' });
  overlay.appendChild(createElement('div', { classes: 'spinner spinner--lg' }));
  if (typeof container === 'string') container = $(container);
  if (container) {
    container.style.position = 'relative';
    container.appendChild(overlay);
  }
  return overlay;
}

/**
 * Remove loading overlay
 */
export function hideCardLoading(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}
