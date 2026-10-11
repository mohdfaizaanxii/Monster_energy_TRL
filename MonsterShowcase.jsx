'use client';

import React, { useState, useMemo } from 'react';
import OptionWheel from './OptionWheel';
import './MonsterShowcase.css';

// Flavor Arsenal Database
const MONSTER_FLAVORS = [
  {
    id: 'original-green',
    name: 'Original Green',
    series: 'ORIGINAL HERITAGE',
    tagline: 'UNLEASH THE BEAST®',
    description: 'Tear into a can of the meanest energy drink on the planet. Our killer energy blend delivers a smooth, robust citrus punch that ignited the global rebellion.',
    caffeine: '160 MG',
    calories: '210 CAL',
    sugar: '54G PUNCH',
    badge: 'IMMORTAL ICON',
    color: '#39ff14',
    glowColor: 'rgba(57, 255, 20, 0.45)',
    image: 'Assets/products/original_green.jpg',
    basePrice: 359,
    profile: {
      intensity: 100,
      carbonation: 'Heavy Spark',
      flavorTone: 'Classic Citrus Punch'
    }
  },
  {
    id: 'ultra-white',
    name: 'Ultra White',
    series: 'ZERO ULTRA',
    tagline: 'LIGHT, CRISP & ZERO SUGAR',
    description: 'Some people are impossible to please. As soon as they got what they thought they wanted, they always wanted more. Unleash the Ultra Beast with zero calories, zero sugar, and crisp citrus frost.',
    caffeine: '150 MG',
    calories: '10 CAL',
    sugar: '0G SUGAR',
    badge: 'ZERO COMPROMISE',
    color: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    image: 'Assets/products/ultra_white.jpg',
    basePrice: 359,
    profile: {
      intensity: 85,
      carbonation: 'Crisp Frost',
      flavorTone: 'Grapefruit & Citrus Ice'
    }
  },
  {
    id: 'mango-loco',
    name: 'Juiced Mango Loco',
    series: 'JUICE MONSTER',
    tagline: 'A HEAVENLY TROPICAL BLEND',
    description: 'On the eve of October 31st each year, friends and family gather to celebrate Dia de Los Muertos. Mango Loco is a heavenly blend of exotic real fruit juices that beckons even the most stubborn spirit.',
    caffeine: '160 MG',
    calories: '150 CAL',
    sugar: '16% REAL JUICE',
    badge: 'FIESTA FAVORITE',
    color: '#FFB300',
    glowColor: 'rgba(255, 179, 0, 0.45)',
    image: 'Assets/products/mango_loco.jpg',
    basePrice: 399,
    profile: {
      intensity: 95,
      carbonation: 'Smooth Fizz',
      flavorTone: 'Ripe Mango & Guava'
    }
  },
  {
    id: 'ultra-paradise',
    name: 'Ultra Paradise',
    series: 'ZERO SUGAR ESCAPE',
    tagline: 'WHERE PARADISE MEETS POWER',
    description: 'Where is paradise? Somewhere crisp, green, and completely untamed. Ultra Paradise delivers an invigorating burst of island kiwi, lime, and cucumber with zero sugar to fuel your wildest escapades.',
    caffeine: '150 MG',
    calories: '10 CAL',
    sugar: '0G SUGAR',
    badge: 'TROPICAL CHILL',
    color: '#76FF03',
    glowColor: 'rgba(118, 255, 3, 0.45)',
    image: 'Assets/products/peachy_keen.jpg',
    basePrice: 359,
    profile: {
      intensity: 88,
      carbonation: 'Crisp Effervescence',
      flavorTone: 'Kiwi, Lime & Cucumber'
    }
  },
  {
    id: 'pipeline-punch',
    name: 'Pipeline Punch',
    series: 'JUICE MONSTER',
    tagline: 'THE HAWAIIAN TROPICAL RUSH',
    description: 'Banzai Pipeline, the legendary surf reef off Oahu. We created the perfect blend of the best flavors Hawaii has to offer: passion fruit, orange & guava, supercharged with our monster energy kick.',
    caffeine: '160 MG',
    calories: '160 CAL',
    sugar: '16% REAL JUICE',
    badge: 'PACIFIC WAVE',
    color: '#FF2E93',
    glowColor: 'rgba(255, 46, 147, 0.45)',
    image: 'Assets/products/pipeline_punch.jpg',
    basePrice: 399,
    profile: {
      intensity: 92,
      carbonation: 'Tropical Spark',
      flavorTone: 'Passion Fruit, Orange, Guava'
    }
  },
  {
    id: 'ultra-violet',
    name: 'Ultra Violet',
    series: 'ZERO ULTRA',
    tagline: 'THE PSYCHEDELIC PURPLE RUSH',
    description: 'Welcome to the 70s. Hazy bell-bottoms, tie-dye, and psychedelic guitar riffs. Ultra Violet delivers a crisp purple citrus and grape blend without any sugar, artificial heaviness, or energy crash.',
    caffeine: '150 MG',
    calories: '10 CAL',
    sugar: '0G SUGAR',
    badge: 'RETRO REVOLUTION',
    color: '#B339EC',
    glowColor: 'rgba(179, 57, 236, 0.45)',
    image: 'Assets/products/ultra_violet.jpg',
    basePrice: 359,
    profile: {
      intensity: 90,
      carbonation: 'Fizzy Tart',
      flavorTone: 'Purple Grape & Citrus'
    }
  }
];

const PACK_SIZES = [
  { id: 'single', label: 'SINGLE CAN', multiplier: 1, savings: '' },
  { id: '12pack', label: '12-PACK CASE', multiplier: 10, savings: 'SAVE 16%' },
  { id: '24pack', label: '24-VAULT', multiplier: 18, savings: 'SAVE 25%' }
];

export default function MonsterShowcase() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPack, setSelectedPack] = useState('single');
  const [cartAlert, setCartAlert] = useState(null);

  // Wheel Items array
  const flavorNames = useMemo(() => MONSTER_FLAVORS.map(f => f.name), []);
  const currentFlavor = MONSTER_FLAVORS[selectedIndex] || MONSTER_FLAVORS[0];

  // Price Calculation
  const packMultiplier = PACK_SIZES.find(p => p.id === selectedPack)?.multiplier || 1;
  const currentPrice = (currentFlavor.basePrice * packMultiplier).toFixed(2);

  const handleWheelChange = (index) => {
    setSelectedIndex(index);
  };

  const handleAddToCart = () => {
    const packObj = PACK_SIZES.find(p => p.id === selectedPack);
    const msg = `⚡ Added ${packObj.label} of ${currentFlavor.name} (₹${currentPrice}) to your Arsenal!`;
    setCartAlert(msg);
    setTimeout(() => setCartAlert(null), 3500);
  };

  return (
    <div
      className="monster-showcase-page"
      style={{
        '--dynamic-flavor-color': currentFlavor.color,
        '--dynamic-flavor-glow': currentFlavor.glowColor
      }}
    >
      {/* Background Dynamic Atmospheric Lighting */}
      <div className="showcase-ambient-grid" />
      <div className="showcase-ambient-spotlight" />
      <div className="showcase-watermark-text" aria-hidden="true">
        {currentFlavor.name.toUpperCase()}
      </div>

      {/* Top Brand Bar */}
      <header className="showcase-top-bar">
        <div className="showcase-brand">
          <div className="showcase-claw-logo">
            <svg viewBox="0 0 48 56" fill="none" className="claw-svg">
              <path d="M12 2C11 12 8 26 5 48C8 40 10 24 13 4L12 2Z" fill="currentColor" />
              <path d="M25 1C24 14 22 34 19 54C22 43 25 25 27 3L25 1Z" fill="currentColor" />
              <path d="M37 6C35 18 34 32 32 50C35 40 37 26 39 8L37 6Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span className="brand-title">MONSTER</span>
            <span className="brand-subtitle">ENERGY ARCHIVE</span>
          </div>
        </div>

        <div className="showcase-nav-stats">
          <span className="stat-pill">
            <span className="live-dot" /> 6 FLAVORS LOADED
          </span>
          <span className="stat-pill">
            ENERGY MATRIX: <strong>160MG</strong>
          </span>
        </div>
      </header>

      {/* Main Split Screen Area */}
      <main className="showcase-main-layout">
        {/* LEFT COLUMN: OptionWheel Selector */}
        <section className="showcase-wheel-column" aria-label="Flavor Selector Wheel">
          <div className="wheel-header">
            <span className="wheel-sub-tag">CYLINDRICAL SELECTOR</span>
            <h2 className="wheel-heading">DRAG OR SCROLL TO SELECT</h2>
          </div>

          <div className="wheel-stage-wrapper">
            <OptionWheel
              items={flavorNames}
              defaultSelected={0}
              textColor="#737373"
              activeColor={currentFlavor.color}
              side="left"
              fontSize={2.8}
              spacing={1.4}
              curve={1}
              tilt={6}
              blur={2}
              fade={0.25}
              smoothing={200}
              inset={80}
              loop={false}
              draggable={true}
              soundUrl="/sounds/click-soft.mp3"
              soundVolume={0.4}
              onChange={handleWheelChange}
            />
          </div>

          <div className="wheel-hint-bar">
            <span>↑ SCROLL • DRAG • CLICK TO CYCLE ↓</span>
          </div>
        </section>

        {/* RIGHT COLUMN: Dynamic Flavor Showcase Card */}
        <section className="showcase-preview-column" aria-label="Flavor Preview Panel">
          <div className="preview-card-frame">
            {/* Top Meta Header */}
            <div className="preview-meta-row">
              <span className="series-badge">{currentFlavor.series}</span>
              <span className="spec-badge">{currentFlavor.badge}</span>
            </div>

            {/* Giant Title & Tagline */}
            <h1 className="flavor-headline">{currentFlavor.name}</h1>
            <p className="flavor-tagline">{currentFlavor.tagline}</p>
            <p className="flavor-description">{currentFlavor.description}</p>

            {/* Product Can Centerpiece with Reactive Backlight */}
            <div className="preview-visual-stage">
              <div className="can-backlight-circle" />
              <img
                src={currentFlavor.image}
                alt={currentFlavor.name}
                className="preview-can-image"
                key={currentFlavor.id}
              />
            </div>

            {/* Performance Telemetry Grid */}
            <div className="flavor-telemetry-grid">
              <div className="telemetry-cell">
                <span className="cell-k">CAFFEINE</span>
                <strong className="cell-v text-dynamic">{currentFlavor.caffeine}</strong>
              </div>
              <div className="telemetry-cell">
                <span className="cell-k">CALORIES</span>
                <strong className="cell-v">{currentFlavor.calories}</strong>
              </div>
              <div className="telemetry-cell">
                <span className="cell-k">SUGAR</span>
                <strong className="cell-v text-dynamic">{currentFlavor.sugar}</strong>
              </div>
              <div className="telemetry-cell">
                <span className="cell-k">PROFILE</span>
                <span className="cell-v-small">{currentFlavor.profile.flavorTone}</span>
              </div>
            </div>

            {/* Pack Size Selector Buttons */}
            <div className="pack-size-row">
              <span className="pack-label">CHOOSE FORMAT:</span>
              <div className="pack-buttons-group">
                {PACK_SIZES.map(pack => (
                  <button
                    key={pack.id}
                    className={`pack-option-btn ${selectedPack === pack.id ? 'active' : ''}`}
                    onClick={() => setSelectedPack(pack.id)}
                  >
                    <span className="pack-name">{pack.label}</span>
                    {pack.savings && <span className="pack-save-badge">{pack.savings}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Add to Arsenal CTA */}
            <div className="showcase-cta-strip">
              <div className="price-display">
                <span className="price-symbol">₹</span>
                <span className="price-value">{currentPrice}</span>
                <span className="price-unit">INR</span>
              </div>

              <button className="btn-add-arsenal" onClick={handleAddToCart}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cart-svg">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>ADD TO ARSENAL</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Cart Notification Toast */}
      {cartAlert && (
        <div className="cart-toast-alert" role="alert">
          {cartAlert}
        </div>
      )}
    </div>
  );
}
