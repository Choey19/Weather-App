// ============================================
// NimbusIQ — Animation Utilities
// ============================================

/**
 * Observe elements and animate them on scroll into view
 */
export function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Animate a number counting up
 */
export function animateCounter(element, targetValue, duration = 1000, decimals = 0) {
  const startValue = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (targetValue - startValue) * eased;

    element.textContent = currentValue.toFixed(decimals);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Stagger animation for a list of card elements
 */
export function staggerCards(container) {
  const cards = container.querySelectorAll('.card, [data-stagger]');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.animation = `fadeInUp 0.4s var(--ease-out) ${i * 60}ms both`;
  });
}

/**
 * Smooth page transition
 */
export function pageTransition(container, renderFn) {
  container.style.opacity = '0';
  container.style.transform = 'translateY(10px)';

  // Small delay for the exit
  setTimeout(() => {
    renderFn();
    container.style.transition = 'opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out)';
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';

    // Stagger child cards
    staggerCards(container);
  }, 50);
}
