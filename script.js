/**
 * script.js - Monster Energy Official E-Commerce Store & Scrollytelling Engine
 * High-performance 60 FPS HTML5 Canvas Scrubbing & Interactive Store Logic
 */

(function () {
  'use strict';

  // ========================================================
  // 1. GLOBAL STATE & PRODUCT DATA
  // ========================================================
  const TOTAL_FRAMES = 84;
  const FRAME_BASE_PATH = 'Assets/Scrollytelling/frame_';

  const PRODUCTS = [
    {
      id: 'peachy-keen',
      name: 'Ultra Peachy Keen',
      category: 'ultra',
      categoryLabel: 'ULTRA // ZERO SUGAR',
      badge: 'NEW 2026 DROP',
      badgeClass: 'badge-zero',
      price: 359,
      rating: 4.9,
      reviewsCount: 2840,
      notes: 'Sweet juicy peach nectar with zero sugar. Summer nostalgia with explosive energy.',
      image: 'Assets/products/peachy_keen.jpg',
      color: '#FF7A3D',
      glow: 'rgba(255, 122, 61, 0.45)',
      caffeine: '160mg',
      calories: '10 Cal',
      sugar: '0g',
      intensity: 95
    },
    {
      id: 'original-green',
      name: 'Monster Original Green',
      category: 'original',
      categoryLabel: 'HERITAGE // ORIGINAL',
      badge: 'IMMORTAL GOAT',
      badgeClass: 'badge-zero',
      price: 359,
      rating: 4.9,
      reviewsCount: 12400,
      notes: 'The meanest energy drink on the planet. Crisp citrus punch that started the revolution.',
      image: 'Assets/products/original_green.jpg',
      color: '#00FF41',
      glow: 'rgba(0, 255, 65, 0.45)',
      caffeine: '160mg',
      calories: '210 Cal',
      sugar: '54g',
      intensity: 100
    },
    {
      id: 'mango-loco',
      name: 'Mango Loco',
      category: 'juice',
      categoryLabel: 'JUICE MONSTER',
      badge: 'FAN FAVORITE',
      badgeClass: '',
      price: 399,
      rating: 5.0,
      reviewsCount: 8920,
      notes: 'Heavenly blend of exotic tropical juices crafted to awaken the wild fiesta spirit.',
      image: 'Assets/products/mango_loco.jpg',
      color: '#FFB300',
      glow: 'rgba(255, 179, 0, 0.45)',
      caffeine: '160mg',
      calories: '150 Cal',
      sugar: '36g Real Juice',
      intensity: 90
    },
    {
      id: 'pipeline-punch',
      name: 'Pipeline Punch',
      category: 'juice',
      categoryLabel: 'JUICE MONSTER',
      badge: 'TROPICAL WAVE',
      badgeClass: '',
      price: 399,
      rating: 4.8,
      reviewsCount: 6100,
      notes: 'Hawaiian passion fruit, orange, and guava with the signature Monster power blend.',
      image: 'Assets/products/pipeline_punch.jpg',
      color: '#FF2E93',
      glow: 'rgba(255, 46, 147, 0.45)',
      caffeine: '160mg',
      calories: '160 Cal',
      sugar: '38g Real Juice',
      intensity: 88
    },
    {
      id: 'ultra-white',
      name: 'Zero Ultra White',
      category: 'ultra',
      categoryLabel: 'ULTRA // ZERO SUGAR',
      badge: 'GLOBAL BESTSELLER',
      badgeClass: 'badge-zero',
      price: 359,
      rating: 4.9,
      reviewsCount: 9500,
      notes: 'Crisp, frosty citrus flavor with zero calories and zero sugar. The silver standard.',
      image: 'Assets/products/ultra_white.jpg',
      color: '#00E5FF',
      glow: 'rgba(0, 229, 255, 0.45)',
      caffeine: '150mg',
      calories: '10 Cal',
      sugar: '0g',
      intensity: 85
    },
    {
      id: 'ultra-violet',
      name: 'Ultra Violet',
      category: 'ultra',
      categoryLabel: 'ULTRA // ZERO SUGAR',
      badge: 'LIMITED EDITION',
      badgeClass: 'badge-zero',
      price: 359,
      rating: 4.8,
      reviewsCount: 4320,
      notes: 'Crisp purple grape & citrus blend inspired by the psychedelic 70s. Zero sugar.',
      image: 'Assets/products/ultra_violet.jpg',
      color: '#B339EC',
      glow: 'rgba(179, 57, 236, 0.45)',
      caffeine: '150mg',
      calories: '10 Cal',
      sugar: '0g',
      intensity: 92
    },
    {
      id: 'monster-nitro',
      name: 'Monster Nitro Super Dry',
      category: 'original',
      categoryLabel: 'NITROUS INFUSION',
      badge: 'EXPLOSIVE LIFT',
      badgeClass: '',
      price: 399,
      rating: 4.9,
      reviewsCount: 5200,
      notes: 'Infused with nitrous oxide for an ultra-smooth, creamy citrus mouthfeel and explosive lift.',
      image: 'Assets/products/monster_nitro.jpg',
      color: '#39FF14',
      glow: 'rgba(57, 255, 20, 0.45)',
      caffeine: '160mg',
      calories: '220 Cal',
      sugar: '52g',
      intensity: 98
    }
  ];

  // E-commerce Cart State
  const cart = {
    items: [],
    discountRate: 0,
    appliedPromo: null,
    freeShipping: false
  };

  // Vault Builder State (Target: 12 cans)
  const vaultCounts = {};
  PRODUCTS.forEach(p => { vaultCounts[p.id] = 0; });

  // Scrollytelling Frames Array & Canvas State
  const frameImages = new Array(TOTAL_FRAMES);
  let loadedFramesCount = 0;
  let targetFrameIndex = 0;
  let currentFrameIndex = 0;
  let needsRedraw = true;
  let isCanvasReady = false;

  // DOM Elements
  const canvas = document.getElementById('scrolly-canvas');
  const ctx = canvas.getContext('2d');
  const backdropCanvas = document.getElementById('ambient-backdrop-canvas');
  const backdropCtx = backdropCanvas ? backdropCanvas.getContext('2d') : null;
  let currentScrollyProgress = 0;

  const loaderEl = document.getElementById('scrolly-loader');
  const loaderFill = document.getElementById('loader-fill');
  const loaderPercent = document.getElementById('loader-percent');
  const hudFrame = document.getElementById('hud-frame');
  const hudProgress = document.getElementById('hud-progress');

  // Story Overlays
  const step1 = document.getElementById('story-step-1');
  const step2 = document.getElementById('story-step-2');
  const step3 = document.getElementById('story-step-3');
  const step4 = document.getElementById('story-step-4');

  // Hero Buy Panel State
  let heroCurrentPack = 'single';
  let heroCurrentPrice = 359;

  // ========================================================
  // 2. SCROLLYTELLING FRAME PRELOADER & CANVAS ENGINE
  // ========================================================

  function initScrollyEngine() {
    setupCanvasResolution();
    window.addEventListener('resize', () => {
      setupCanvasResolution();
      needsRedraw = true;
    });

    // Mount React Bits SplitFlapText component on loading screen
    let loaderSplitFlap = null;
    const splitFlapBoardEl = document.getElementById('split-flap-board');
    const statusTextEl = document.getElementById('loader-status-text');

    if (splitFlapBoardEl && window.SplitFlapText) {
      loaderSplitFlap = new window.SplitFlapText(splitFlapBoardEl, {
        words: ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'],
        flipDuration: 0.12,
        stagger: 0.06,
        cycleDelay: 2400,
        charset: 'alphanumeric',
        flipsPerChar: 8,
        tileColor: '#111827',
        textColor: '#f8fafc',
        tileRadius: 8,
        gap: 6,
        fontSize: window.innerWidth < 640 ? 22 : (window.innerWidth < 900 ? 32 : 44),
        loop: true,
        padTo: 12
      });

      // Clicking on board triggers immediate cascade flip with audio tick
      splitFlapBoardEl.addEventListener('click', () => {
        const phrases = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE', 'UNLEASH BEAST'];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        loaderSplitFlap.animateTo(randomPhrase);
      });
    }

    function markSiteLoaded() {
      if (isCanvasReady) return;
      isCanvasReady = true;

      if (loaderFill) loaderFill.style.width = '100%';
      if (loaderPercent) loaderPercent.textContent = '100%';
      if (statusTextEl) statusTextEl.textContent = 'SYSTEMS ONLINE';

      // Hold loader briefly so user experiences the mechanical SplitFlap board
      setTimeout(() => {
        if (loaderEl) loaderEl.classList.add('loaded');
        // Reveal step 1 narrative section smoothly now that the site has loaded
        if (step1 && currentScrollyProgress < 0.22) {
          step1.classList.add('active');
        }
      }, 900);
    }

    // Preload frames in priority order: first 0..5, then remainder
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(3, '0');
      img.src = `${FRAME_BASE_PATH}${numStr}.jpg`;

      img.onload = () => {
        loadedFramesCount++;
        const percent = Math.min(100, Math.round((loadedFramesCount / TOTAL_FRAMES) * 100));
        if (loaderFill) loaderFill.style.width = `${percent}%`;
        if (loaderPercent) loaderPercent.textContent = `${percent}%`;

        if (statusTextEl) {
          if (percent < 35) {
            statusTextEl.textContent = 'CONNECTING SENSORS';
          } else if (percent < 75) {
            statusTextEl.textContent = 'CALIBRATING 3D FRAMES';
          } else if (percent < 100) {
            statusTextEl.textContent = 'UNPACKING CAN';
          } else {
            statusTextEl.textContent = 'SYSTEMS ONLINE';
          }
        }

        // Render immediately as soon as frame 0 arrives
        if (i === 0) {
          needsRedraw = true;
          renderFrame(0);
        }

        if (loadedFramesCount >= TOTAL_FRAMES) {
          markSiteLoaded();
        }
      };

      img.onerror = () => {
        console.warn(`Frame ${i} failed to load, skipping...`);
        loadedFramesCount++;
        if (loadedFramesCount >= TOTAL_FRAMES) {
          markSiteLoaded();
        }
      };

      frameImages[i] = img;
    }

    // Safety fallback: ensure loading completes even under latency
    setTimeout(() => {
      if (!isCanvasReady) {
        markSiteLoaded();
      }
    }, 3500);

    // Start RAF rendering loop for silky smooth inertia
    requestAnimationFrame(renderLoop);
  }

  function setupCanvasResolution() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    const displayWidth = rect.width || window.innerWidth;
    const displayHeight = rect.height || window.innerHeight;

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    if (backdropCanvas) {
      backdropCanvas.width = Math.floor(displayWidth * 0.4);
      backdropCanvas.height = Math.floor(displayHeight * 0.4);
    }

    needsRedraw = true;
  }

  function renderFrame(frameIdx) {
    if (!ctx || !canvas) return;
    const img = frameImages[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ambient background canvas if available (soft glow on background)
    if (backdropCtx && backdropCanvas) {
      backdropCtx.clearRect(0, 0, backdropCanvas.width, backdropCanvas.height);
      backdropCtx.drawImage(img, 0, 0, backdropCanvas.width, backdropCanvas.height);
    }

    // Maintain aspect ratio: contain with high-fidelity alignment
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvas.width / canvas.height;

    let drawW, drawH, drawX, drawY;

    if (canvasRatio > imgRatio) {
      // Screen is wider (desktop): fit height
      drawH = canvas.height * 0.94;
      drawW = drawH * imgRatio;
    } else {
      // Screen is narrower (mobile / portrait): fit width
      drawW = canvas.width * 0.92;
      drawH = drawW / imgRatio;
    }

    drawY = (canvas.height - drawH) / 2;

    // Scrollytelling starts and remains centered on the page
    drawX = (canvas.width - drawW) / 2;

    // Draw frame
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // Linear Interpolation (LERP) rendering loop with inertia damping
  function renderLoop() {
    const diff = targetFrameIndex - currentFrameIndex;

    if (Math.abs(diff) > 0.005 || needsRedraw) {
      currentFrameIndex += diff * 0.16; // 16% inertia factor for fluid spring feel
      const rounded = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameIndex)));

      renderFrame(rounded);
      needsRedraw = false;

      // Update HUD frame readout
      if (hudFrame) {
        hudFrame.textContent = `${String(rounded + 1).padStart(2, '0')} / ${TOTAL_FRAMES}`;
      }
    }

    requestAnimationFrame(renderLoop);
  }

  // Handle Scroll Progress Calculations
  function handleScrollyProgress() {
    const scrollySection = document.getElementById('hero-experience');
    if (!scrollySection) return;

    const rect = scrollySection.getBoundingClientRect();
    const scrollHeight = scrollySection.offsetHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    // Relative scroll inside container
    let progress = -rect.top / scrollHeight;
    progress = Math.min(1, Math.max(0, progress));
    currentScrollyProgress = progress;
    needsRedraw = true;

    // Map progress to frames [0, 59]
    targetFrameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 0.01)));

    if (hudProgress) {
      hudProgress.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    // Toggle Narrative Steps based on progress ranges
    // Step 1: 0.00 -> 0.22 (Epic Hero Glitch Title)
    if (progress < 0.22) {
      if (isCanvasReady) {
        step1?.classList.add('active');
      }
      step2?.classList.remove('active');
      step3?.classList.remove('active');
      step4?.classList.remove('active');
    }
    // Step 2: 0.22 -> 0.52 (Telemetry Cards Parallax)
    else if (progress >= 0.22 && progress < 0.52) {
      step1?.classList.remove('active');
      step2?.classList.add('active');
      step3?.classList.remove('active');
      step4?.classList.remove('active');
    }
    // Step 3: 0.52 -> 0.74 (Sensory Callouts / Ice condensation)
    else if (progress >= 0.52 && progress < 0.74) {
      step1?.classList.remove('active');
      step2?.classList.remove('active');
      step3?.classList.add('active');
      step4?.classList.remove('active');
    }
    // Step 4: 0.74 -> 1.00 (Hero Buy Box with Pack switcher)
    else {
      step1?.classList.remove('active');
      step2?.classList.remove('active');
      step3?.classList.remove('active');
      step4?.classList.add('active');
    }

    // Navbar Scrolled State
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 60) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScrollyProgress, { passive: true });

  // Hover-reveal Navbar (Smooth Top Proximity & Interaction Tracking)
  const navHeaderEl = document.getElementById('navbar');
  if (navHeaderEl) {
    let hideTimer = null;

    window.addEventListener('mousemove', (e) => {
      // Reveal when mouse is near top edge (within 55px of screen top)
      if (e.clientY <= 55) {
        clearTimeout(hideTimer);
        navHeaderEl.classList.add('is-hovered');
      } else if (!navHeaderEl.contains(e.target)) {
        // Hide with a smooth grace period when moving away
        if (!navHeaderEl.classList.contains('nav-mobile-open')) {
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            navHeaderEl.classList.remove('is-hovered');
          }, 240);
        }
      }
    }, { passive: true });

    navHeaderEl.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      navHeaderEl.classList.add('is-hovered');
    });

    navHeaderEl.addEventListener('mouseleave', () => {
      if (!navHeaderEl.classList.contains('nav-mobile-open')) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          navHeaderEl.classList.remove('is-hovered');
        }, 280);
      }
    });

    // Touch support: tap top trigger zone to reveal
    navHeaderEl.addEventListener('touchstart', () => {
      navHeaderEl.classList.add('is-hovered');
    }, { passive: true });
  }

  // Mouse Parallax on Ambient Orbs
  window.addEventListener('mousemove', (e) => {
    const peachOrb = document.querySelector('.glow-peach');
    if (peachOrb) {
      const moveX = (e.clientX / window.innerWidth - 0.5) * 30;
      const moveY = (e.clientY / window.innerHeight - 0.5) * 30;
      peachOrb.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
    }
  }, { passive: true });

  // Hero Pack Selector Handling
  const heroPackOptions = document.getElementById('hero-pack-options');
  const heroDisplayPrice = document.getElementById('hero-display-price');
  const heroAddCartBtn = document.getElementById('hero-add-cart-btn');

  if (heroPackOptions) {
    heroPackOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.pack-btn');
      if (!btn) return;

      heroPackOptions.querySelectorAll('.pack-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      heroCurrentPack = btn.dataset.pack;
      heroCurrentPrice = parseFloat(btn.dataset.price);

      if (heroDisplayPrice) {
        heroDisplayPrice.textContent = Math.round(heroCurrentPrice);
      }

      window.beastSound?.playClick();
    });
  }

  if (heroAddCartBtn) {
    heroAddCartBtn.addEventListener('click', () => {
      const packLabel = {
        single: 'Single Can (500ml)',
        '4pack': '4-Pack Box',
        '12pack': '12-Pack Case',
        '24pack': '24-Pack Vault'
      }[heroCurrentPack];

      addToCart({
        id: `original-green-${heroCurrentPack}`,
        name: `Monster Original Green (${packLabel})`,
        price: heroCurrentPrice,
        image: 'Assets/products/original_green.jpg',
        color: '#00FF41'
      });
    });
  }

  // ========================================================
  // 3. PRODUCT ARSENAL (E-COMMERCE STORE GRID)
  // ========================================================

  function renderProductsGrid(filter = 'all') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = filter === 'all'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.category === filter);

    filtered.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.style.setProperty('--flavor-color', product.color);
      card.style.setProperty('--flavor-glow', product.glow);
      card.style.setProperty('--flavor-border', product.color);

      card.innerHTML = `
        <div class="card-header-bar">
          <span class="card-badge ${product.badgeClass}">${product.badge}</span>
          <div class="card-rating">★★★★★ <span>${product.rating}</span></div>
        </div>

        <div class="product-visual">
          <div class="product-backlight"></div>
          <img src="${product.image}" alt="${product.name}" class="product-can-img" loading="lazy">
        </div>

        <div class="product-info">
          <div class="product-category">${product.categoryLabel}</div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-notes">${product.notes}</p>

          <!-- Pack selector pills -->
          <div class="card-pack-selector" data-pid="${product.id}">
            <button class="card-pack-opt active" data-pack="single" data-mult="1">SINGLE (₹${product.price})</button>
            <button class="card-pack-opt" data-pack="12pack" data-mult="10.8">12-CASE (₹${Math.round(product.price * 10.8)})</button>
            <button class="card-pack-opt" data-pack="24pack" data-mult="20">24-VAULT (₹${Math.round(product.price * 20)})</button>
          </div>

          <div class="card-action-bar">
            <div class="card-pricing">
              <span class="card-price-currency">₹</span>
              <span class="card-price-amount" id="price-${product.id}">${product.price}</span>
            </div>
            <div class="card-btns">
              <button class="btn-quick-view" data-pid="${product.id}" title="Quick Specs & 360 View" aria-label="Quick View">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button class="btn-add-card" data-pid="${product.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                </svg>
                <span>ADD</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // 3D Tilt Interaction on Card (Desktop only for smooth mobile scrolling)
      card.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 900) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = -(y / rect.height) * 10;
        const rotateY = (x / rect.width) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });

      // Pack selector inside card
      const packOpts = card.querySelectorAll('.card-pack-opt');
      packOpts.forEach(opt => {
        opt.addEventListener('click', () => {
          packOpts.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
          const mult = parseFloat(opt.dataset.mult);
          const priceEl = card.querySelector(`#price-${product.id}`);
          if (priceEl) priceEl.textContent = Math.round(product.price * mult);
          window.beastSound?.playClick();
        });
      });

      // Quick View button
      const qvBtn = card.querySelector('.btn-quick-view');
      qvBtn?.addEventListener('click', () => openQuickView(product));

      // Add To Cart button
      const addBtn = card.querySelector('.btn-add-card');
      addBtn?.addEventListener('click', () => {
        const activeOpt = card.querySelector('.card-pack-opt.active');
        const mult = parseFloat(activeOpt.dataset.mult);
        const packName = activeOpt.dataset.pack;
        const packLabel = packName === 'single' ? 'Single Can' : (packName === '12pack' ? '12-Pack Case' : '24-Pack Vault');
        const calcPrice = Math.round(product.price * mult);

        addToCart({
          id: `${product.id}-${packName}`,
          name: `${product.name} (${packLabel})`,
          price: calcPrice,
          image: product.image,
          color: product.color
        });
      });

      grid.appendChild(card);
    });
  }

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.flavor-filters .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProductsGrid(btn.dataset.filter);
      window.beastSound?.playClick();
    });
  });

  // ========================================================
  // 4. INTERACTIVE 12-PACK VAULT BUILDER CRATE
  // ========================================================

  function initVaultBuilder() {
    renderVaultSlots();
    renderVaultPicker();
  }

  function renderVaultSlots() {
    const slotsGrid = document.getElementById('vault-slots');
    if (!slotsGrid) return;
    slotsGrid.innerHTML = '';

    // Create an ordered array of selected cans
    const selectedCans = [];
    Object.keys(vaultCounts).forEach(pid => {
      const p = PRODUCTS.find(prod => prod.id === pid);
      if (p) {
        for (let i = 0; i < vaultCounts[pid]; i++) {
          selectedCans.push(p);
        }
      }
    });

    for (let slot = 0; slot < 12; slot++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'vault-slot';

      if (slot < selectedCans.length) {
        const item = selectedCans[slot];
        slotEl.classList.add('filled');
        slotEl.style.setProperty('--slot-color', item.color);
        slotEl.style.setProperty('--slot-glow', item.glow);
        slotEl.innerHTML = `
          <img src="${item.image}" alt="${item.name}" class="slot-can-icon" title="${item.name}">
        `;
      } else {
        slotEl.textContent = `0${slot + 1}`;
      }

      slotsGrid.appendChild(slotEl);
    }

    const totalCans = selectedCans.length;
    const countEl = document.getElementById('vault-count');
    const statusMsg = document.getElementById('vault-status-msg');
    const totalEl = document.getElementById('vault-total');
    const strikeEl = document.getElementById('vault-strike');
    const addVaultBtn = document.getElementById('btn-add-vault-cart');

    if (countEl) countEl.textContent = totalCans;

    // Calculate Vault Pricing
    let subtotal = 0;
    selectedCans.forEach(c => { subtotal += c.price; });

    if (totalCans === 12) {
      // 15% Bundle Discount applied!
      const discounted = Math.round(subtotal * 0.85);
      if (totalEl) totalEl.textContent = `₹${discounted.toLocaleString('en-IN')}`;
      if (strikeEl) {
        strikeEl.textContent = `₹${Math.round(subtotal).toLocaleString('en-IN')}`;
        strikeEl.style.display = 'inline-block';
      }
      if (statusMsg) {
        statusMsg.textContent = '🎉 12/12 VAULT LOCKED! 15% DISCOUNT & FREE EXPRESS SHIPPING UNLOCKED!';
        statusMsg.classList.add('unlocked');
      }
      if (addVaultBtn) addVaultBtn.disabled = false;
    } else {
      if (totalEl) totalEl.textContent = `₹${Math.round(subtotal).toLocaleString('en-IN')}`;
      if (strikeEl) strikeEl.style.display = 'none';
      if (statusMsg) {
        const remaining = 12 - totalCans;
        statusMsg.textContent = `Add ${remaining} more can${remaining > 1 ? 's' : ''} to complete your 12-Pack Vault & unlock 15% OFF!`;
        statusMsg.classList.remove('unlocked');
      }
      if (addVaultBtn) addVaultBtn.disabled = true;
    }
  }

  function renderVaultPicker() {
    const list = document.getElementById('vault-picker-list');
    if (!list) return;
    list.innerHTML = '';

    PRODUCTS.forEach(p => {
      const item = document.createElement('div');
      item.className = 'vault-picker-item';
      item.innerHTML = `
        <div class="picker-flavor-meta">
          <img src="${p.image}" alt="${p.name}" class="picker-thumb">
          <div>
            <div class="picker-name">${p.name}</div>
            <div class="picker-sub">₹${p.price} • ${p.caffeine}</div>
          </div>
        </div>
        <div class="picker-counter">
          <button class="btn-picker-step" data-action="minus" data-pid="${p.id}">−</button>
          <span class="picker-count-val" id="count-${p.id}">${vaultCounts[p.id]}</span>
          <button class="btn-picker-step" data-action="plus" data-pid="${p.id}">+</button>
        </div>
      `;

      item.querySelectorAll('.btn-picker-step').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          const pid = btn.dataset.pid;
          const currentTotal = Object.values(vaultCounts).reduce((a, b) => a + b, 0);

          if (action === 'plus') {
            if (currentTotal < 12) {
              vaultCounts[pid]++;
              window.beastSound?.playClick();
              if (currentTotal + 1 === 12) {
                window.beastSound?.playPowerUp();
              }
            }
          } else if (action === 'minus') {
            if (vaultCounts[pid] > 0) {
              vaultCounts[pid]--;
              window.beastSound?.playClick();
            }
          }

          const countVal = document.getElementById(`count-${pid}`);
          if (countVal) countVal.textContent = vaultCounts[pid];
          renderVaultSlots();
        });
      });

      list.appendChild(item);
    });
  }

  // Add Custom Vault to Cart CTA
  const btnAddVaultCart = document.getElementById('btn-add-vault-cart');
  if (btnAddVaultCart) {
    btnAddVaultCart.addEventListener('click', () => {
      const flavorBreakdown = Object.keys(vaultCounts)
        .filter(pid => vaultCounts[pid] > 0)
        .map(pid => {
          const p = PRODUCTS.find(x => x.id === pid);
          return `${vaultCounts[pid]}x ${p.name}`;
        }).join(', ');

      // Base price before 15% discount
      let sub = 0;
      Object.keys(vaultCounts).forEach(pid => {
        const p = PRODUCTS.find(x => x.id === pid);
        sub += p.price * vaultCounts[pid];
      });
      const finalVaultPrice = parseFloat((sub * 0.85).toFixed(2));

      addToCart({
        id: `custom-vault-${Date.now()}`,
        name: `Custom 12-Pack Vault (${flavorBreakdown})`,
        price: finalVaultPrice,
        image: 'Assets/products/peachy_keen.jpg',
        color: '#00FF41'
      });

      // Reset Vault
      PRODUCTS.forEach(p => { vaultCounts[p.id] = 0; });
      renderVaultSlots();
      renderVaultPicker();
    });
  }

  // ========================================================
  // 5. E-COMMERCE CART DRAWER & CHECKOUT
  // ========================================================

  function addToCart(product) {
    const existing = cart.items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.items.push({
        ...product,
        qty: 1
      });
    }

    // Play tactile can crack fizz sound!
    window.beastSound?.playCanPop();

    updateCartUI();
    openCart();

    // Badge bounce animation
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.classList.add('bounce');
      setTimeout(() => badge.classList.remove('bounce'), 400);
    }
  }

  function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-badge');
    const headerCount = document.getElementById('cart-header-count');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountRow = document.getElementById('cart-discount-row');
    const discountEl = document.getElementById('cart-discount');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    const shippingGoalText = document.getElementById('shipping-goal-text');
    const shippingMeterFill = document.getElementById('shipping-meter-fill');

    const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0);
    if (badge) {
      if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
        badge.setAttribute('data-count', totalItems);
      } else {
        badge.textContent = '';
        badge.style.display = 'none';
        badge.setAttribute('data-count', '0');
      }
    }
    if (headerCount) headerCount.textContent = `(${totalItems} item${totalItems === 1 ? '' : 's'})`;

    if (!container) return;

    if (cart.items.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-state">
          <div class="empty-icon">🥫</div>
          <h4>YOUR CART IS EMPTY</h4>
          <p>You haven't added any fuel yet. Unleash the beast and pick your poison!</p>
          <button class="btn-primary btn-empty-shop" onclick="window.closeCart(); window.location.hash='#flavors-section';">
            BROWSE FLAVORS
          </button>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '₹0';
      if (totalEl) totalEl.textContent = '₹0';
      if (discountRow) discountRow.style.display = 'none';
      if (shippingMeterFill) shippingMeterFill.style.width = '0%';
      if (shippingGoalText) shippingGoalText.innerHTML = 'Add <strong>₹999</strong> more to unlock <strong>FREE 2-DAY COLD SHIPPING</strong>';
      return;
    }

    // Render items
    container.innerHTML = '';
    let subtotal = 0;

    cart.items.forEach((item, index) => {
      const linePrice = item.price * item.qty;
      subtotal += linePrice;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <div class="cart-item-pack">₹${item.price} each</div>
          <div class="cart-item-controls">
            <button class="qty-btn" data-action="minus" data-idx="${index}">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-action="plus" data-idx="${index}">+</button>
          </div>
        </div>
        <div class="cart-item-pricing">
          <span class="cart-item-price">₹${Math.round(linePrice).toLocaleString('en-IN')}</span>
          <button class="cart-item-remove" data-idx="${index}">Remove</button>
        </div>
      `;

      itemEl.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          const idx = parseInt(btn.dataset.idx, 10);
          if (action === 'plus') {
            cart.items[idx].qty += 1;
          } else {
            cart.items[idx].qty -= 1;
            if (cart.items[idx].qty <= 0) {
              cart.items.splice(idx, 1);
            }
          }
          window.beastSound?.playClick();
          updateCartUI();
        });
      });

      itemEl.querySelector('.cart-item-remove')?.addEventListener('click', () => {
        cart.items.splice(index, 1);
        window.beastSound?.playClick();
        updateCartUI();
      });

      container.appendChild(itemEl);
    });

    // Discount computation
    let discountAmount = Math.round(subtotal * cart.discountRate);
    let shipping = subtotal >= 999 || cart.freeShipping ? 0 : 99;
    let finalTotal = Math.round(subtotal - discountAmount + shipping);

    if (subtotalEl) subtotalEl.textContent = `₹${Math.round(subtotal).toLocaleString('en-IN')}`;

    if (cart.discountRate > 0) {
      if (discountRow) discountRow.style.display = 'flex';
      if (discountEl) discountEl.textContent = `-₹${discountAmount.toLocaleString('en-IN')}`;
    } else {
      if (discountRow) discountRow.style.display = 'none';
    }

    if (shippingEl) {
      shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
      shippingEl.style.color = shipping === 0 ? 'var(--neon-green)' : 'inherit';
    }

    if (totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

    // Free Shipping Progress calculation
    if (subtotal >= 999 || cart.freeShipping) {
      if (shippingGoalText) shippingGoalText.innerHTML = '⚡ <strong>FREE 2-DAY COLD SHIPPING UNLOCKED!</strong>';
      if (shippingMeterFill) shippingMeterFill.style.width = '100%';
    } else {
      const remaining = Math.round(999 - subtotal);
      const percent = Math.min(100, (subtotal / 999) * 100);
      if (shippingGoalText) shippingGoalText.innerHTML = `Add <strong>₹${remaining}</strong> more for <strong>FREE EXPRESS SHIPPING</strong>`;
      if (shippingMeterFill) shippingMeterFill.style.width = `${percent}%`;
    }
  }

  // Promo Code Application
  const promoInput = document.getElementById('promo-input');
  const promoBtn = document.getElementById('apply-promo-btn');
  const promoFeedback = document.getElementById('promo-feedback');

  if (promoBtn) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) return;

      if (code === 'UNLEASH15' || code === 'MONSTER15') {
        cart.discountRate = 0.15;
        cart.appliedPromo = code;
        promoFeedback.textContent = '✓ 15% VIP Discount applied!';
        promoFeedback.className = 'promo-feedback success';
        window.beastSound?.playSuccess();
      } else if (code === 'FREESHIP') {
        cart.freeShipping = true;
        cart.appliedPromo = code;
        promoFeedback.textContent = '✓ Free shipping unlocked!';
        promoFeedback.className = 'promo-feedback success';
        window.beastSound?.playSuccess();
      } else {
        promoFeedback.textContent = '✕ Invalid promo code. Try UNLEASH15';
        promoFeedback.className = 'promo-feedback error';
        window.beastSound?.playClick();
      }
      updateCartUI();
    });
  }

  // Drawer Controls
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');

  function openCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
    }
  }

  function closeCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    }
  }

  window.openCart = openCart;
  window.closeCart = closeCart;

  if (openCartBtn) openCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Quick View Modal
  const qvOverlay = document.getElementById('quick-view-overlay');
  const qvModal = document.getElementById('quick-view-modal');
  const qvBody = document.getElementById('quick-view-body');
  const closeQvBtn = document.getElementById('close-modal-btn');

  function openQuickView(product) {
    if (!qvBody) return;

    qvBody.innerHTML = `
      <div style="display: flex; gap: 32px; padding: 32px; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px; display: flex; justify-content: center; background: radial-gradient(circle, ${product.glow} 0%, transparent 70%); padding: 20px; border-radius: 12px;">
          <img src="${product.image}" alt="${product.name}" style="height: 320px; object-fit: contain; filter: drop-shadow(0 15px 30px rgba(0,0,0,0.8));">
        </div>
        <div style="flex: 1.2; min-width: 240px;">
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: ${product.color}; font-weight: 700; letter-spacing: 0.12em;">${product.categoryLabel}</span>
          <h2 style="font-family: var(--font-title); font-size: 2.2rem; line-height: 1; margin: 6px 0 12px 0;">${product.name}</h2>
          <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">${product.notes}</p>
          
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; margin-bottom: 24px; font-family: var(--font-mono); font-size: 0.8rem; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between;"><span>Caffeine Matrix:</span><strong style="color: ${product.color};">${product.caffeine}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Calories:</span><span>${product.calories}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Total Sugar:</span><strong>${product.sugar}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Sensory Rating:</span><span style="color:#fbbf24;">★★★★★ (${product.rating})</span></div>
          </div>

          <div style="display: flex; gap: 12px; align-items: center;">
            <span style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800;">₹${product.price}</span>
            <button class="btn-primary" style="flex: 1; background: ${product.color}; color: #000;" id="qv-add-btn">
              ADD TO ARSENAL
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('qv-add-btn')?.addEventListener('click', () => {
      addToCart({
        id: `${product.id}-single`,
        name: `${product.name} (Single Can)`,
        price: product.price,
        image: product.image,
        color: product.color
      });
      closeQuickView();
    });

    qvOverlay?.classList.add('open');
    window.beastSound?.playClick();
  }

  function closeQuickView() {
    qvOverlay?.classList.remove('open');
  }

  if (closeQvBtn) closeQvBtn.addEventListener('click', closeQuickView);
  if (qvOverlay) qvOverlay.addEventListener('click', (e) => {
    if (e.target === qvOverlay) closeQuickView();
  });

  // Simulated Checkout Flow
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutOverlay = document.getElementById('checkout-overlay');
  const closeCheckoutBtn = document.getElementById('close-checkout-btn');
  const checkoutStepForm = document.getElementById('checkout-step-form');
  const checkoutStepSuccess = document.getElementById('checkout-step-success');
  const checkoutModalSum = document.getElementById('checkout-modal-sum');

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.items.length === 0) return;
      closeCart();

      // Compute total
      let sub = 0;
      cart.items.forEach(i => { sub += i.price * i.qty; });
      let discount = Math.round(sub * cart.discountRate);
      let shipping = sub >= 999 || cart.freeShipping ? 0 : 99;
      let sum = Math.round(sub - discount + shipping);

      if (checkoutModalSum) checkoutModalSum.textContent = `₹${sum.toLocaleString('en-IN')}`;

      checkoutStepForm.style.display = 'block';
      checkoutStepSuccess.style.display = 'none';
      checkoutOverlay?.classList.add('open');
      window.beastSound?.playClick();
    });
  }

  function completeCheckout() {
    checkoutStepForm.style.display = 'none';
    checkoutStepSuccess.style.display = 'block';

    const trackId = `ME-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}X`;
    const trackEl = document.getElementById('generated-tracking');
    if (trackEl) trackEl.textContent = trackId;

    window.beastSound?.playSuccess();
  }

  function closeCheckout() {
    checkoutOverlay?.classList.remove('open');
  }

  function clearCart() {
    cart.items = [];
    updateCartUI();
  }

  window.completeCheckout = completeCheckout;
  window.closeCheckout = closeCheckout;
  window.clearCart = clearCart;
  window.replayLoader = function () {
    if (loaderEl) {
      isCanvasReady = false;
      step1?.classList.remove('active');
      step2?.classList.remove('active');
      step3?.classList.remove('active');
      step4?.classList.remove('active');
      loaderEl.classList.remove('loaded');
      if (loaderFill) loaderFill.style.width = '0%';
      if (loaderPercent) loaderPercent.textContent = '0%';
      let p = 0;
      const interval = setInterval(() => {
        p += 4;
        if (loaderFill) loaderFill.style.width = `${p}%`;
        if (loaderPercent) loaderPercent.textContent = `${p}%`;
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            isCanvasReady = true;
            loaderEl.classList.add('loaded');
            if (currentScrollyProgress < 0.22) {
              step1?.classList.add('active');
            }
          }, 900);
        }
      }, 70);
    }
  };

  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckout);

  // Audio Engine Toggle
  const soundBtn = document.getElementById('sound-btn');
  const soundState = document.getElementById('sound-state');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isEnabled = window.beastSound?.toggle();
      if (isEnabled) {
        soundBtn.classList.add('sound-active');
        if (soundState) soundState.textContent = 'ON';
      } else {
        soundBtn.classList.remove('sound-active');
        if (soundState) soundState.textContent = 'OFF';
      }
    });
  }

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.style.display === 'block';
      mobileDrawer.style.display = isOpen ? 'none' : 'block';
    });

    mobileDrawer.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.style.display = 'none';
      });
    });

    document.getElementById('mobile-shop-cta')?.addEventListener('click', () => {
      mobileDrawer.style.display = 'none';
      window.location.hash = '#flavors-section';
    });
  }

  // Newsletter handler
  window.handleNewsletter = function () {
    const email = document.getElementById('news-email')?.value;
    alert(`⚡ Welcome to the Monster Army! A 15% discount code has been sent to ${email}`);
    document.getElementById('newsletter-form')?.reset();
    window.beastSound?.playSuccess();
  };

  // Keyboard Shortcuts: ESC to close modals/drawers, C to toggle cart
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeQuickView();
      closeCheckout();
    } else if (e.key === 'c' || e.key === 'C') {
      if (document.activeElement.tagName !== 'INPUT') {
        cartDrawer.classList.contains('open') ? closeCart() : openCart();
      }
    }
  });



  // ========================================================
  // 3D WEBGL INFINITEMENU FLAVOUR VAULT GALLERY
  // ========================================================
  const VAULT_FLAVORS = [
    {
      id: 'original-green',
      title: 'Monster Energy Original',
      subtitle: 'ORIGINAL HERITAGE • 160MG CAFFEINE',
      series: 'ORIGINAL HERITAGE',
      description: 'Tear into a can of the meanest energy drink on the planet. Smooth, sweet, and packed with 160mg of raw energy.',
      image: 'Assets/products/original_green.jpg',
      link: '#modal-original',
      caffeine: '160 MG',
      taurine: '1000 MG',
      vitamins: 'B3, B6, B12, B2',
      calories: '210 CAL',
      electrolytes: 'SODIUM + POTASSIUM',
      price: 359,
      color: '#39FF14'
    },
    {
      id: 'ultra-white',
      title: 'Zero Ultra',
      subtitle: 'ZERO ULTRA • ZERO SUGAR',
      series: 'ZERO ULTRA',
      description: 'Zero calories, zero sugar, crisp citrus blend with a lighter, sparkling flavor profile.',
      image: 'Assets/products/ultra_white.jpg',
      link: '#modal-zero-ultra',
      caffeine: '150 MG',
      taurine: '1000 MG',
      vitamins: 'B3, B6, B12, B2',
      calories: '10 CAL',
      electrolytes: 'ZERO SUGAR ELECTROLYTES',
      price: 359,
      color: '#00E5FF'
    },
    {
      id: 'mango-loco',
      title: 'Juice Monster: Mango Loco',
      subtitle: 'JUICE MONSTER • 16% REAL JUICE',
      series: 'JUICE MONSTER',
      description: 'A heavenly blend of exotic real fruit juices guaranteed to attract even the most stubborn spirit.',
      image: 'Assets/products/mango_loco.jpg',
      link: '#modal-mango-loco',
      caffeine: '160 MG',
      taurine: '1000 MG',
      vitamins: 'B3, B6, B12, B2',
      calories: '150 CAL',
      electrolytes: '16% REAL FRUIT JUICE',
      price: 399,
      color: '#FFB300'
    },
    {
      id: 'pipeline-punch',
      title: 'Pipeline Punch',
      subtitle: 'JUICE MONSTER • HAWAIIAN WAVE',
      series: 'JUICE MONSTER',
      description: 'The perfect mix of Hawaiian passionfruit, orange, and guava with the classic Monster energy blend.',
      image: 'Assets/products/pipeline_punch.jpg',
      link: '#modal-pipeline-punch',
      caffeine: '160 MG',
      taurine: '1000 MG',
      vitamins: 'B3, B6, B12, B2',
      calories: '160 CAL',
      electrolytes: 'PASSIONFRUIT • ORANGE • GUAVA',
      price: 399,
      color: '#FF2E93'
    },
    {
      id: 'ultra-violet',
      title: 'Ultra Violet',
      subtitle: 'ZERO ULTRA • 70S RETRO PURPLE',
      series: 'ZERO ULTRA',
      description: 'Crisp sweet-and-tart grape flavor wrapped in zero-sugar refreshment from the funky 70s.',
      image: 'Assets/products/ultra_violet.jpg',
      link: '#modal-ultra-violet',
      caffeine: '150 MG',
      taurine: '1000 MG',
      vitamins: 'B3, B6, B12, B2',
      calories: '10 CAL',
      electrolytes: 'CRISP PURPLE CITRUS',
      price: 359,
      color: '#B339EC'
    },
    {
      id: 'monster-nitro',
      title: 'Monster Nitro Super Dry',
      subtitle: 'NITROUS OXIDE • EXPLOSIVE LIFT',
      series: 'NITROUS INFUSION',
      description: 'Infused with nitrous oxide for a remarkably smooth, creamy citrus mouthfeel and explosive lift.',
      image: 'Assets/products/monster_nitro.jpg',
      link: '#modal-nitro',
      caffeine: '160 MG',
      taurine: '1000 MG',
      vitamins: 'B3, B6, B12, B2',
      calories: '220 CAL',
      electrolytes: 'NITROUS OXIDE INFUSION',
      price: 399,
      color: '#39FF14'
    }
  ];

  let infiniteMenuInstance = null;
  let activeModalFlavor = null;

  function initInfiniteMenuVault() {
    const mount = document.getElementById('infinite-menu-mount');
    if (!mount || !window.InfiniteMenu) return;

    infiniteMenuInstance = new window.InfiniteMenu(mount, {
      items: VAULT_FLAVORS,
      theme: 'dark',
      accentColor: '#39FF14',
      count: 140,
      tileSize: 0.62,
      roundness: 0.12,
      zoom: 1.75,
      stretch: 0.65,
      pullBack: 1.1,
      inertia: 0.7,
      autoplay: 2.5,
      grayscale: false,
      dim: 0.35,
      intro: true,
      showInfo: true,
      onItemClick: (item) => {
        openFlavorModal(item);
      }
    });

    // Wire up modal events
    const modalOverlay = document.getElementById('flavor-detail-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const buyBtn = document.getElementById('modal-buy-btn');
    const locateBtn = document.getElementById('modal-locate-btn');

    closeBtn?.addEventListener('click', closeFlavorModal);
    modalOverlay?.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeFlavorModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay?.classList.contains('open')) {
        closeFlavorModal();
      }
    });

    buyBtn?.addEventListener('click', () => {
      if (!activeModalFlavor) return;
      addToCart({
        id: `${activeModalFlavor.id}-single`,
        name: `${activeModalFlavor.title} (Single Can)`,
        price: activeModalFlavor.price,
        image: activeModalFlavor.image,
        color: activeModalFlavor.color
      });
      window.beastSound?.playCanOpen();
      closeFlavorModal();
      openCart();
    });

    locateBtn?.addEventListener('click', () => {
      showToast(`📍 Locating authorized Monster retail vaults nearby...`);
      window.beastSound?.playClick();
    });
  }

  function openFlavorModal(item) {
    if (!item) return;
    activeModalFlavor = item;

    const modalOverlay = document.getElementById('flavor-detail-modal');
    const canImg = document.getElementById('modal-can-img');
    const seriesEl = document.getElementById('modal-series');
    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const caffeineEl = document.getElementById('modal-caffeine');
    const taurineEl = document.getElementById('modal-taurine');
    const vitaminsEl = document.getElementById('modal-vitamins');
    const caloriesEl = document.getElementById('modal-calories');
    const electrolytesEl = document.getElementById('modal-electrolytes');
    const priceEl = document.getElementById('modal-price');

    if (item.color && modalOverlay) {
      modalOverlay.style.setProperty('--infinite-menu-accent', item.color);
    }

    if (canImg) {
      canImg.src = item.image;
      canImg.alt = item.title;
    }
    if (seriesEl) seriesEl.textContent = item.series || 'MONSTER VAULT';
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.description;
    if (caffeineEl) caffeineEl.textContent = item.caffeine || '160 MG';
    if (taurineEl) taurineEl.textContent = item.taurine || '1000 MG';
    if (vitaminsEl) vitaminsEl.textContent = item.vitamins || 'B3, B6, B12, B2';
    if (caloriesEl) caloriesEl.textContent = item.calories || '210 CAL';
    if (electrolytesEl) electrolytesEl.textContent = item.electrolytes || 'SODIUM + POTASSIUM';
    if (priceEl) priceEl.textContent = `₹${item.price || 359}`;

    modalOverlay?.classList.add('open');
    modalOverlay?.setAttribute('aria-hidden', 'false');
    window.beastSound?.playClick();
  }

  function closeFlavorModal() {
    const modalOverlay = document.getElementById('flavor-detail-modal');
    modalOverlay?.classList.remove('open');
    modalOverlay?.setAttribute('aria-hidden', 'true');
    window.beastSound?.playClick();
  }

  // ========================================================
  // 6. PILLNAV & SECTION FADE-IN ANIMATIONS
  // ========================================================
  let pillNavInstance = null;

  function initPillNavigation() {
    if (typeof window.PillNav === 'function' && document.getElementById('pill-nav-root')) {
      pillNavInstance = new window.PillNav('#pill-nav-root', {
        logo: 'Assets/monster-logo.svg',
        logoAlt: 'Monster Energy Official Logo',
        items: [
          { label: 'THE DROP', href: '#hero-experience' },
          { label: 'FLAVORS', href: '#flavors-section' },
          { label: 'CUSTOM VAULT', href: '#vault-builder' },
          { label: 'THE LAB', href: '#performance-lab' },
          { label: 'ATHLETES', href: '#athletes-section' },
          { label: 'REVIEWS', href: '#reviews-section' }
        ],
        activeHref: '#hero-experience',
        ease: 'power3.easeOut',
        baseColor: '#00FF41',
        pillColor: '#10131a',
        hoveredPillTextColor: '#000000',
        pillTextColor: '#ffffff'
      });
    }

    // ScrollSpy to keep active pill indicator synced with viewport
    const navSections = [
      '#hero-experience',
      '#flavors-section',
      '#vault-builder',
      '#performance-lab',
      '#athletes-section',
      '#reviews-section'
    ];

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 280;
      for (let i = navSections.length - 1; i >= 0; i--) {
        const sec = document.querySelector(navSections[i]);
        if (sec && sec.offsetTop <= scrollPos) {
          const pills = document.querySelectorAll('.pill-nav-items .pill, .mobile-menu-list .mobile-menu-link');
          pills.forEach(p => {
            if (p.getAttribute('href') === navSections[i]) {
              p.classList.add('is-active');
            } else {
              p.classList.remove('is-active');
            }
          });
          break;
        }
      }
    }, { passive: true });
  }

  function initSectionFadingAnimations() {
    const fadeSections = document.querySelectorAll('.fade-section-reveal');
    if (!fadeSections.length) return;

    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      });

      fadeSections.forEach(sec => sectionObserver.observe(sec));
    } else {
      fadeSections.forEach(sec => sec.classList.add('revealed'));
    }
  }

  // ========================================================
  // 7. INITIALIZATION CALLS
  // ========================================================
  window.addEventListener('DOMContentLoaded', () => {
    initPillNavigation();
    initSectionFadingAnimations();
    initScrollyEngine();
    renderProductsGrid('all');
    initInfiniteMenuVault();
    initVaultBuilder();
    updateCartUI();
    handleScrollyProgress();
  });

})();
