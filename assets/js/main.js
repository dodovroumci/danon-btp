(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Header : fond plein au scroll
  --------------------------------------------------------------- */
  const header = document.getElementById('site-header');
  const onScrollHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------------------------------------------------------------
     Navigation mobile plein écran
  --------------------------------------------------------------- */
  const burgerBtn = document.getElementById('burger-btn');
  const closeBtn = document.getElementById('close-btn');
  const mobileNav = document.getElementById('mobile-nav');

  const openMobileNav = () => {
    mobileNav.hidden = false;
    document.body.style.overflow = 'hidden';
    burgerBtn.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  };
  const closeMobileNav = () => {
    mobileNav.hidden = true;
    document.body.style.overflow = '';
    burgerBtn.setAttribute('aria-expanded', 'false');
    burgerBtn.focus();
  };

  burgerBtn.addEventListener('click', openMobileNav);
  closeBtn.addEventListener('click', closeMobileNav);
  mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileNav));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileNav.hidden) closeMobileNav();
  });

  /* ---------------------------------------------------------------
     Reveal au scroll (IntersectionObserver)
  --------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.closest('.services-grid, .projects-grid, .process-list, .reasons-list, .experience-columns') || el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = groups.get(el.parentElement) || [el];
        const index = siblings.indexOf(el);
        const delay = Math.max(0, index) * 80;
        setTimeout(() => el.classList.add('is-visible'), delay);
        obs.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------------------------------------------------------
     Compteur animé ("16 ans d'expérience")
  --------------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-counter]');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------------------------------------------------------------
     Tabs — Réalisations
  --------------------------------------------------------------- */
  const tabs = document.querySelectorAll('.tab[role="tab"]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const panelId = tab.getAttribute('aria-controls');
      const tablist = tab.closest('[role="tablist"]');

      tablist.querySelectorAll('.tab').forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', String(isActive));
        t.tabIndex = isActive ? 0 : -1;
      });

      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.hidden = panel.id !== panelId;
      });
    });

    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tablist = Array.from(tab.closest('[role="tablist"]').querySelectorAll('.tab'));
      const currentIndex = tablist.indexOf(tab);
      const nextIndex = e.key === 'ArrowRight'
        ? (currentIndex + 1) % tablist.length
        : (currentIndex - 1 + tablist.length) % tablist.length;
      tablist[nextIndex].focus();
      tablist[nextIndex].click();
    });
  });

  /* ---------------------------------------------------------------
     Barre d'action mobile — masquée quand un champ a le focus
     (évite le conflit avec le clavier virtuel)
  --------------------------------------------------------------- */
  const actionbar = document.getElementById('mobile-actionbar');
  document.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('focus', () => actionbar.classList.add('is-hidden'));
    field.addEventListener('blur', () => actionbar.classList.remove('is-hidden'));
  });

  /* ---------------------------------------------------------------
     Formulaire de devis
  --------------------------------------------------------------- */
  const form = document.getElementById('quote-form');
  const sameAsPhone = document.getElementById('f-same');
  const phoneField = document.getElementById('f-tel');
  const whatsappField = document.getElementById('f-whatsapp');

  sameAsPhone.addEventListener('change', () => {
    if (sameAsPhone.checked) {
      whatsappField.value = phoneField.value;
      whatsappField.disabled = true;
    } else {
      whatsappField.disabled = false;
    }
  });
  phoneField.addEventListener('input', () => {
    if (sameAsPhone.checked) whatsappField.value = phoneField.value;
  });

  const validators = {
    'f-nom': (v) => v.trim().length >= 2 || 'Merci d\'indiquer votre nom.',
    'f-tel': (v) => /^[0-9+ ]{8,}$/.test(v.trim()) || 'Numéro de téléphone invalide.',
    'f-type': (v) => v !== '' || 'Merci de sélectionner un type de projet.',
    'f-lieu': (v) => v.trim().length >= 2 || 'Merci d\'indiquer la localisation du projet.',
    'f-desc': (v) => v.trim().length >= 10 || 'Merci de décrire votre projet (10 caractères minimum).',
  };

  const validateField = (id) => {
    const input = document.getElementById(id);
    const errorEl = document.getElementById('err-' + id.replace('f-', ''));
    const validate = validators[id];
    if (!validate) return true;
    const result = validate(input.value);
    const isValid = result === true;
    input.closest('.field').classList.toggle('has-error', !isValid);
    if (errorEl) errorEl.textContent = isValid ? '' : result;
    return isValid;
  };

  Object.keys(validators).forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('blur', () => validateField(id));
  });

  const submitBtn = document.getElementById('submit-btn');
  const statusEl = document.getElementById('form-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const allValid = Object.keys(validators)
      .map(validateField)
      .every(Boolean);

    if (!allValid) {
      statusEl.textContent = 'Merci de corriger les champs indiqués ci-dessus.';
      statusEl.className = 'form-status is-error';
      form.querySelector('.has-error input, .has-error select, .has-error textarea')?.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-label').textContent = 'Envoi...';
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    // ---------------------------------------------------------------
    // Point d'intégration backend : la soumission est simulée ici.
    // Brancher un service de formulaire (ex. Formspree) ou un endpoint
    // API dédié une fois choisi, puis remplacer ce setTimeout par un
    // véritable appel fetch() gérant les mêmes états succès/erreur.
    // ---------------------------------------------------------------
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-label').textContent = 'Demander mon devis';

      const successBlock = document.createElement('div');
      successBlock.className = 'form-success';
      successBlock.innerHTML = `
        <svg class="icon icon-lg" aria-hidden="true"><use href="#icon-check"/></svg>
        <h3>Demande envoyée</h3>
        <p>Merci, votre demande de devis a bien été enregistrée. Notre équipe vous recontactera rapidement.
        Pour aller plus vite, vous pouvez aussi nous écrire directement sur
        <a href="https://wa.me/2250777098800" target="_blank" rel="noopener" style="color:var(--c-navy);font-weight:700;text-decoration:underline;">WhatsApp</a>.</p>
      `;
      form.appendChild(successBlock);
      form.classList.add('is-submitted');
      successBlock.setAttribute('tabindex', '-1');
      successBlock.focus();
    }, 900);
  });
})();
