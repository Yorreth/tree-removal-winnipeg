(() => {
  // ---------- Single source of truth for the phone number ----------
  // Change the number here and it updates on every page that loads this
  // file: header, footer, mobile bar, CTA banners, and JSON-LD schema.
  const SITE_PHONE = {
    display: '(204) 881-0634',
    tel: '+12048810634',
    schema: '+1-204-881-0634', // format used inside application/ld+json blocks
  };

  document.querySelectorAll('[data-phone-link]').forEach((el) => {
    el.setAttribute('href', `tel:${SITE_PHONE.tel}`);
  });
  document.querySelectorAll('[data-phone-display]').forEach((el) => {
    el.textContent = SITE_PHONE.display;
  });
  document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    let data;
    try {
      data = JSON.parse(el.textContent);
    } catch {
      return;
    }
    const patchTelephone = (node) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.telephone === 'string') node.telephone = SITE_PHONE.schema;
      Object.values(node).forEach(patchTelephone);
    };
    patchTelephone(data);
    el.textContent = JSON.stringify(data);
  });

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header scroll state
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('main-nav');
  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // Reveal-on-scroll
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  // ---------- Multi-step lead form ----------
  const form = document.getElementById('leadForm');
  if (form) {
    const steps = Array.from(form.querySelectorAll('.form-step'));
    const dots = Array.from(form.querySelectorAll('.step-dot'));
    const serviceInput = document.getElementById('serviceInput');
    const successPanel = document.getElementById('formSuccess');
    const successMessage = document.getElementById('successMessage');
    let currentStep = 1;

    const showStep = (n) => {
      currentStep = n;
      steps.forEach((step) => {
        step.classList.toggle('active', Number(step.dataset.step) === n);
      });
      dots.forEach((dot) => {
        const dotStep = Number(dot.dataset.dot);
        dot.classList.toggle('active', dotStep === n);
        dot.classList.toggle('completed', dotStep < n);
      });
    };

    const validateStep = (n) => {
      const step = steps.find((s) => Number(s.dataset.step) === n);
      const fields = step.querySelectorAll('input, select, textarea');
      for (const field of fields) {
        if (!field.checkValidity()) {
          field.reportValidity();
          return false;
        }
      }
      return true;
    };

    // Step 1: service selection auto-advances
    form.querySelectorAll('.service-option').forEach((option) => {
      option.addEventListener('click', () => {
        form.querySelectorAll('.service-option').forEach((o) => o.classList.remove('selected'));
        option.classList.add('selected');
        serviceInput.value = option.dataset.value;
        setTimeout(() => showStep(2), 220);
      });
    });

    form.querySelectorAll('.next-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (validateStep(currentStep)) showStep(currentStep + 1);
      });
    });

    form.querySelectorAll('.back-btn').forEach((btn) => {
      btn.addEventListener('click', () => showStep(currentStep - 1));
    });

    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdekorza';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateStep(3)) return;

      const data = Object.fromEntries(new FormData(form).entries());
      const submitBtn = form.querySelector('[data-step="3"] .next-btn, [data-step="3"] button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form),
        });

        if (!res.ok) throw new Error('Form submission failed');

        steps.forEach((step) => step.classList.remove('active'));
        form.querySelector('.form-progress').style.display = 'none';
        successMessage.textContent = `Thanks, ${data.name.split(' ')[0]} — a licensed local tree crew will reach out to you at ${data.phone} within 24 hours.`;
        successPanel.hidden = false;
      } catch (err) {
        console.error('Lead submission error:', err);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Get My Free Quote'; }
        alert(`Something went wrong sending your request. Please call ${SITE_PHONE.display} directly and we'll get you a quote right away.`);
      }
    });
  }
})();