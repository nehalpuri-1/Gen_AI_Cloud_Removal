/* ==========================================================================
   CLEAR_SEE - Interactive Frontend Controller & Simulation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- State Variables ---
  let activeTab = 'overview';
  let activeRegion = 'shillong';
  let activeModel = 'diffusion';
  let reconstructionFidelity = 90;
  let sarWeight = 75;
  let showCloudMask = false;
  let showSarGuidance = true;
  let isDraggingSlider = false;
  let sliderPosition = 50; // percentage from left (0 to 100)

  // --- DOM Elements ---
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const dynamicPageTitle = document.getElementById('dynamic-page-title');
  const dynamicPageDesc = document.getElementById('dynamic-page-desc');
  
  const regionSelector = document.getElementById('region-selector');
  const modelBtns = document.querySelectorAll('.model-btn');
  const sliderFidelity = document.getElementById('slider-fidelity');
  const sliderFidelityVal = document.getElementById('slider-fidelity-val');
  const sliderSar = document.getElementById('slider-sar');
  const sliderSarVal = document.getElementById('slider-sar-val');
  const toggleCloudMask = document.getElementById('toggle-cloud-mask');
  const toggleSarGuide = document.getElementById('toggle-sar-guide');
  const btnReconstruct = document.getElementById('btn-reconstruct');
  
  const sliderContainer = document.getElementById('slider-container');
  const sliderOverlay = document.getElementById('slider-overlay');
  const sliderDivider = document.getElementById('slider-divider');
  const rightLabelName = document.getElementById('right-label-name');
  
  const canvasCloudy = document.getElementById('canvas-cloudy');
  const canvasReconstructed = document.getElementById('canvas-reconstructed');
  
  const infoRegionName = document.getElementById('info-region-name');
  const infoCoords = document.getElementById('info-coords');
  
  // Processing Overlay Elements
  const processingOverlay = document.getElementById('processing-overlay');
  const processingStatusText = document.getElementById('processing-status-text');
  
  // Quantitative Metrics Elements
  const valSsim = document.getElementById('val-ssim');
  const valPsnr = document.getElementById('val-psnr');
  const valSam = document.getElementById('val-sam');
  const valF1 = document.getElementById('val-f1');

  // --- Page Definitions ---
  const pageTitles = {
    overview: {
      title: 'Overview & Context',
      desc: 'CLEAR_SEE: See through every cloud — Generative AI-based Cloud Removal & Surface Reconstruction'
    },
    sandbox: {
      title: 'Interactive Sandbox Simulator',
      desc: 'Simulate, adjust, and compare Generative AI reconstructions using multi-modal sensor inputs'
    },
    architectures: {
      title: 'Deep Learning Model Architectures',
      desc: 'Technical structure of Latent Diffusion Models, Transformers, and GANs utilized in LISS-IV recovery'
    },
    metrics: {
      title: 'Quantitative Performance Analytics',
      desc: 'Spectral consistency curves, SSIM/PSNR comparisons, and Land Use-Land Cover classification enhancement metrics'
    },
    details: {
      title: 'Technical Specs & Satellite Details',
      desc: 'Detailed specifications of ISRO LISS-IV cameras, Sentinel-1 SAR configurations, and NER constraints'
    },
    threedee: {
      title: '3D Depth & Terrestrial Dehazing',
      desc: 'Interactive 3D elevation wireframe rendering and single-image terrestrial dehazing parallax'
    }
  };

  // --- Region Coords Map ---
  const regionCoords = {
    shillong: { name: 'Shillong (Valley & Forest)', coords: '25.5788° N, 91.8931° E' },
    cherrapunji: { name: 'Cherrapunji (Extreme Clouds)', coords: '25.2702° N, 91.7323° E' },
    guwahati: { name: 'Guwahati (Urban / Brahmaputra)', coords: '26.1445° N, 91.7362° E' },
    gangtok: { name: 'Gangtok (Mountain Snow Peaks)', coords: '27.3314° N, 88.6138° E' }
  };

  // --- Background Image Mapping for Tabs ---
  const tabBackgrounds = {
    overview: 'bg_overview.jpg',
    sandbox: 'bg_sandbox.jpg',
    threedee: 'bg_threedee.png',
    architectures: 'bg_threedee.png',
    metrics: 'bg_sandbox.jpg',
    details: 'bg_overview.jpg'
  };

  const bgLayer = document.getElementById('parallax-bg-layer');

  function updateTabBackground(tabId) {
    if (!bgLayer) return;
    const bgImg = tabBackgrounds[tabId] || 'bg_overview.jpg';
    bgLayer.style.backgroundImage = `url('${bgImg}')`;
  }

  // --- Smooth Parallax Mouse & Scroll Movement ---
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5);
    targetY = (e.clientY / window.innerHeight - 0.5);
  });

  function updateParallaxPosition() {
    mouseX += (targetX - mouseX) * 0.08;
    mouseY += (targetY - mouseY) * 0.08;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    
    if (bgLayer) {
      bgLayer.style.transform = `translate3d(${mouseX * -35}px, ${mouseY * -25 - scrollY * 0.12}px, 0) scale(1.06)`;
    }

    requestAnimationFrame(updateParallaxPosition);
  }

  updateParallaxPosition();

  // --- Tab Navigation Logic ---
  window.switchTab = function(tabId) {
    activeTab = tabId;
    updateTabBackground(tabId);
    
    // Update active tab link styling
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle tab visibility
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Update headers
    if (pageTitles[tabId]) {
      if (dynamicPageTitle) dynamicPageTitle.innerText = pageTitles[tabId].title;
      if (dynamicPageDesc) dynamicPageDesc.innerText = pageTitles[tabId].desc;
    }

    // Trigger canvas resize and rendering if sandbox is selected
    if (tabId === 'sandbox') {
      setTimeout(resizeCanvases, 100);
    }
    
    // Trigger chart animation if metrics is selected
    if (tabId === 'metrics') {
      animateLulcCharts();
    }

    // Trigger 3D and Dehazing init if threedee is selected
    if (tabId === 'threedee') {
      setTimeout(initThreeDeeTab, 100);
    }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // --- Setup Canvas Resizing ---
  function resizeCanvases() {
    if (!sliderContainer) return;
    const rect = sliderContainer.getBoundingClientRect();
    
    // Adjust canvas elements size to match CSS container
    [canvasCloudy, canvasReconstructed].forEach(canvas => {
      if (canvas) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    });

    renderSandboxVisuals();
    updateComparisonSlider();
  }

  window.addEventListener('resize', () => {
    if (activeTab === 'sandbox') {
      resizeCanvases();
    }
  });

  // --- Procedural Canvas Image Generator ---
  // Generates realistic satellite features (Forests, Rivers, Urban grids, Mountains, Clouds)
  function renderSandboxVisuals() {
    if (!canvasCloudy || !canvasReconstructed) return;
    const width = canvasCloudy.width;
    const height = canvasCloudy.height;

    const ctxCloudy = canvasCloudy.getContext('2d');
    const ctxReconstructed = canvasReconstructed.getContext('2d');

    if (width === 0 || height === 0) return;

    // Clear canvases
    ctxCloudy.clearRect(0, 0, width, height);
    ctxReconstructed.clearRect(0, 0, width, height);

    // 1. Draw Base Clear Optical Ground Truth (Reconstructed Canvas base)
    drawGroundTruth(ctxReconstructed, activeRegion);

    // 2. If Generative artifacts apply, morph the reconstructed canvas
    applyModelReconstructionEffects(ctxReconstructed, width, height, activeModel, reconstructionFidelity);

    // 3. Draw SAR Guidance overlay on Reconstructed if toggled
    if (showSarGuidance) {
      drawSarGridOverlay(ctxReconstructed, width, height);
    }

    // 4. Draw Cloudy canvas: starts with the clear base ground truth
    drawGroundTruth(ctxCloudy, activeRegion);

    // Add Clouds and Shadows to Cloudy canvas
    drawCloudsAndShadows(ctxCloudy, activeRegion, showCloudMask);
  }

  // --- Draw Landscape Features ---
  function drawGroundTruth(ctx, region) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Base background colors (vegetation green or valley brown)
    let fillStyle = '#143d22'; // Deep forest
    if (region === 'gangtok') fillStyle = '#2f3d32'; // High pine forest/rock
    if (region === 'guwahati') fillStyle = '#2d4c1b'; // agricultural green
    if (region === 'cherrapunji') fillStyle = '#1b3823'; // dark wet gorges
    
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, w, h);

    // Draw mountains, ridges, valleys
    ctx.shadowBlur = 0;
    
    if (region === 'shillong' || region === 'cherrapunji' || region === 'gangtok') {
      // Draw mountain folds
      ctx.fillStyle = 'rgba(25, 48, 30, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.3);
      ctx.lineTo(w * 0.4, h * 0.1);
      ctx.lineTo(w * 0.8, h * 0.5);
      ctx.lineTo(w, h * 0.2);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Opposite mountain ridge (casting shadow)
      ctx.fillStyle = 'rgba(10, 24, 15, 0.6)';
      ctx.beginPath();
      ctx.moveTo(w, h * 0.6);
      ctx.lineTo(w * 0.6, h * 0.8);
      ctx.lineTo(w * 0.2, h * 0.4);
      ctx.lineTo(0, h * 0.7);
      ctx.lineTo(0, h);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    // Draw rivers/water bodies (rivers are dark blue/cyan with sandbanks)
    if (region === 'guwahati') {
      // Brahmaputra is a massive, wide winding river
      ctx.strokeStyle = '#1d4ed8'; // deep blue
      ctx.lineWidth = 90;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-50, h * 0.4);
      ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.6, h * 0.7, w + 50, h * 0.45);
      ctx.stroke();

      // Sandbanks inside river (Brahmaputra chars)
      ctx.fillStyle = '#b45309'; // Sand brown
      ctx.beginPath();
      ctx.ellipse(w * 0.25, h * 0.31, 40, 15, Math.PI / 10, 0, Math.PI * 2);
      ctx.ellipse(w * 0.6, h * 0.52, 60, 20, -Math.PI / 8, 0, Math.PI * 2);
      ctx.ellipse(w * 0.78, h * 0.49, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rivers are light blue/green details
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 80;
      ctx.beginPath();
      ctx.moveTo(-50, h * 0.4);
      ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.6, h * 0.7, w + 50, h * 0.45);
      ctx.stroke();
    } else {
      // Normal winding mountain rivers
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, h * 0.1);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.45, h * 0.5);
      ctx.lineTo(w * 0.7, h * 0.6);
      ctx.lineTo(w + 10, h * 0.95);
      ctx.stroke();

      // River branch
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.5);
      ctx.lineTo(w * 0.2, h * 0.75);
      ctx.lineTo(w * 0.1, h * 0.99);
      ctx.stroke();
    }

    // Draw Urban Settlements (grids of red/grey/yellow pixels)
    if (region === 'guwahati') {
      // Guwahati city blocks (large urban grids)
      drawCityBlocks(ctx, w * 0.15, h * 0.6, 120, 100);
      drawCityBlocks(ctx, w * 0.7, h * 0.15, 150, 120);
      drawCityBlocks(ctx, w * 0.5, h * 0.75, 100, 90);
    } else if (region === 'shillong') {
      // Scattered town clusters in valleys
      drawCityBlocks(ctx, w * 0.2, h * 0.35, 60, 50);
      drawCityBlocks(ctx, w * 0.55, h * 0.65, 80, 60);
    } else if (region === 'gangtok') {
      // Mountain village terracing
      drawCityBlocks(ctx, w * 0.35, h * 0.55, 45, 40);
    }

    // Draw Snow Capped Peaks for Gangtok
    if (region === 'gangtok') {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.95)'; // Snow white
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Peak 1
      ctx.moveTo(w * 0.1, h * 0.1);
      ctx.lineTo(w * 0.25, h * 0.05);
      ctx.lineTo(w * 0.4, h * 0.25);
      ctx.lineTo(w * 0.3, h * 0.3);
      ctx.lineTo(w * 0.18, h * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Peak 2 (Highest)
      ctx.beginPath();
      ctx.moveTo(w * 0.75, h * 0.2);
      ctx.lineTo(w * 0.88, h * 0.08);
      ctx.lineTo(w * 0.98, h * 0.25);
      ctx.lineTo(w * 0.9, h * 0.35);
      ctx.lineTo(w * 0.82, h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw Agricultural fields (regular rectangular patches)
    if (region === 'guwahati' || region === 'shillong') {
      ctx.fillStyle = 'rgba(190, 242, 100, 0.25)'; // Light lime green
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';
      ctx.lineWidth = 1;
      
      const fieldCount = region === 'guwahati' ? 12 : 5;
      const startX = region === 'guwahati' ? w * 0.1 : w * 0.7;
      const startY = region === 'guwahati' ? h * 0.15 : h * 0.2;
      
      for (let i = 0; i < fieldCount; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        ctx.fillRect(startX + col * 25, startY + row * 18, 22, 15);
        ctx.strokeRect(startX + col * 25, startY + row * 18, 22, 15);
      }
    }
  }

  // Draw grid cluster of urban rectangles
  function drawCityBlocks(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    
    const size = 6;
    const gap = 2;
    const cols = Math.floor(width / (size + gap));
    const rows = Math.floor(height / (size + gap));
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Render 85% density of buildings
        if (Math.random() > 0.15) {
          const buildingColors = ['#94a3b8', '#cbd5e1', '#b45309', '#f97316', '#78716c'];
          ctx.fillStyle = buildingColors[Math.floor(Math.random() * buildingColors.length)];
          ctx.fillRect(c * (size + gap), r * (size + gap), size, size);
        }
      }
    }
    ctx.restore();
  }

  // --- Render Clouds and Shadows (for the Cloudy Canvas) ---
  function drawCloudsAndShadows(ctx, region, overlayMask) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Define cloud clusters based on region severity
    let cloudClusters = [];
    
    if (region === 'shillong') {
      cloudClusters = [
        { cx: w * 0.2, cy: h * 0.3, r: 85 },
        { cx: w * 0.3, cy: h * 0.25, r: 60 },
        { cx: w * 0.7, cy: h * 0.6, r: 90 },
        { cx: w * 0.75, cy: h * 0.7, r: 75 },
        { cx: w * 0.8, cy: h * 0.55, r: 60 }
      ];
    } else if (region === 'cherrapunji') {
      // Extremely heavy clouds cover almost everything
      cloudClusters = [
        { cx: w * 0.15, cy: h * 0.2, r: 120 },
        { cx: w * 0.3, cy: h * 0.35, r: 150 },
        { cx: w * 0.45, cy: h * 0.25, r: 110 },
        { cx: w * 0.6, cy: h * 0.55, r: 140 },
        { cx: w * 0.75, cy: h * 0.7, r: 160 },
        { cx: w * 0.85, cy: h * 0.4, r: 120 },
        { cx: w * 0.5, cy: h * 0.8, r: 130 }
      ];
    } else if (region === 'guwahati') {
      // Scattered smaller clouds
      cloudClusters = [
        { cx: w * 0.1, cy: h * 0.5, r: 50 },
        { cx: w * 0.15, cy: h * 0.52, r: 40 },
        { cx: w * 0.5, cy: h * 0.3, r: 70 },
        { cx: w * 0.85, cy: h * 0.75, r: 65 }
      ];
    } else if (region === 'gangtok') {
      // Moderate sized clouds (blends in with snow)
      cloudClusters = [
        { cx: w * 0.22, cy: h * 0.18, r: 75 }, // overlays Peak 1 snow
        { cx: w * 0.45, cy: h * 0.65, r: 95 },
        { cx: w * 0.55, cy: h * 0.7, r: 70 },
        { cx: w * 0.8, cy: h * 0.25, r: 80 } // overlays Peak 2 snow
      ];
    }

    // Sun illumination direction offset for shadows: shifted down (+dy) and right (+dx)
    const dx = 25;
    const dy = 30;

    // 1. Draw Cloud Shadows first (semi-transparent black with soft edges)
    cloudClusters.forEach(c => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.cx + dx, c.cy + dy, c.r * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();
    });

    // 2. Draw Cloud Puffs (white gradients, soft boundaries)
    cloudClusters.forEach(c => {
      ctx.save();
      const radGrad = ctx.createRadialGradient(
        c.cx - c.r * 0.2, c.cy - c.r * 0.2, c.r * 0.1,
        c.cx, c.cy, c.r
      );
      radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');      // saturated white center
      radGrad.addColorStop(0.2, 'rgba(250, 250, 250, 0.95)');
      radGrad.addColorStop(0.7, 'rgba(235, 240, 245, 0.85)'); // light gray core
      radGrad.addColorStop(1, 'rgba(220, 230, 240, 0)');     // transparent fluffy edge

      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      ctx.fillStyle = radGrad;
      ctx.fill();
      ctx.restore();
    });

    // 3. Draw Segmentation Cloud Mask Overlay if toggled (yellow/orange overlay boundary)
    if (overlayMask) {
      cloudClusters.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.cx + dx*0.5, c.cy + dy*0.5, c.r * 1.08, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)'; // amber fill
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)'; // amber dashed boundary
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }

  // --- Apply Model Reconstruction Artefacts to Output Canvas ---
  function applyModelReconstructionEffects(ctx, w, h, model, fidelity) {
    const scale = fidelity / 100;
    
    if (model === 'diffusion') {
      // Latent Diffusion - Near perfect reconstruction.
      if (scale < 0.95) {
        // Just very minor noise at lower slider values
        addSpeckleNoise(ctx, w, h, (1 - scale) * 0.05);
      }
    } 
    else if (model === 'transformer') {
      // Transformer - Good reconstruction, but blocky patch artifacts if fidelity is not 100%
      const patchGrid = 16; // 16x16 pixel patches
      const opacity = (1 - scale) * 0.4;
      
      if (opacity > 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += patchGrid) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += patchGrid) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Apply slight grid blur
        ctx.save();
        ctx.filter = `blur(${(1 - scale) * 2}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
      }
    } 
    else if (model === 'cyclegan') {
      // CycleGAN - Unpaired translation, exhibits blurring and slight color distortion
      ctx.save();
      // Apply blur proportional to inverse fidelity
      const blurAmount = (1 - scale) * 6 + 1.5; // at 90% = 2.1px, at 50% = 4.5px
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.restore();

      // CycleGAN color shifts (spectral mismatch) - shifting overall hue towards yellow/green tint
      ctx.fillStyle = `rgba(163, 230, 53, ${(1 - scale) * 0.15 + 0.05})`; // yellow green overlay tint
      ctx.globalCompositeOperation = 'color';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over'; // restore
    }
  }

  // Draw speckle noise on canvas (resembles minor reconstruction artifacts)
  function addSpeckleNoise(ctx, w, h, amount) {
    if (amount <= 0) return;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const limit = amount * 255;
    
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < amount) {
        const noise = (Math.random() - 0.5) * limit;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise)); // G
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise)); // B
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // --- Draw Sentinel-1 SAR Guidance Scan Lines overlay ---
  function drawSarGridOverlay(ctx, w, h) {
    ctx.save();
    // Green HUD overlay showing SAR radar penetration grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)'; // faint green grid
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw little SAR crosshair markers in the corners
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 1.5;
    const padding = 15;
    const size = 10;
    
    // Top Left
    ctx.beginPath();
    ctx.moveTo(padding, padding + size);
    ctx.lineTo(padding, padding);
    ctx.lineTo(padding + size, padding);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(w - padding, padding + size);
    ctx.lineTo(w - padding, padding);
    ctx.lineTo(w - padding - size, padding);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(padding, h - padding - size);
    ctx.lineTo(padding, h - padding);
    ctx.lineTo(padding + size, h - padding);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(w - padding, h - padding - size);
    ctx.lineTo(w - padding, h - padding);
    ctx.lineTo(w - padding - size, h - padding);
    ctx.stroke();

    ctx.restore();
  }

  // --- Interactive Slider Handle Logic ---
  function updateComparisonSlider() {
    if (!sliderDivider || !sliderOverlay) return;
    if (sliderPosition < 0) sliderPosition = 0;
    if (sliderPosition > 100) sliderPosition = 100;
    
    // Move divider bar
    sliderDivider.style.left = `${sliderPosition}%`;
    
    // Crop overlay width (Reconstructed side is right side)
    sliderOverlay.style.clipPath = `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`;
  }

  // Handle Dragging Events
  function getMouseX(e) {
    if (!sliderContainer) return 0;
    const rect = sliderContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return clientX - rect.left;
  }

  function handleSliderMove(e) {
    if (!isDraggingSlider || !sliderContainer) return;
    const mouseX = getMouseX(e);
    const containerWidth = sliderContainer.getBoundingClientRect().width;
    if (containerWidth === 0) return;
    sliderPosition = (mouseX / containerWidth) * 100;
    updateComparisonSlider();
  }

  if (sliderContainer) {
    sliderContainer.addEventListener('mousedown', (e) => {
      isDraggingSlider = true;
      const mouseX = getMouseX(e);
      const containerWidth = sliderContainer.getBoundingClientRect().width;
      if (containerWidth > 0) {
        sliderPosition = (mouseX / containerWidth) * 100;
        updateComparisonSlider();
      }
      e.preventDefault();
    });

    sliderContainer.addEventListener('touchstart', (e) => {
      isDraggingSlider = true;
      const mouseX = getMouseX(e);
      const containerWidth = sliderContainer.getBoundingClientRect().width;
      if (containerWidth > 0) {
        sliderPosition = (mouseX / containerWidth) * 100;
        updateComparisonSlider();
      }
    });
  }

  window.addEventListener('mousemove', handleSliderMove);
  window.addEventListener('mouseup', () => { isDraggingSlider = false; });
  window.addEventListener('touchmove', handleSliderMove);
  window.addEventListener('touchend', () => { isDraggingSlider = false; });

  // --- Run Reconstruction Trigger Simulation ---
  if (btnReconstruct) {
    btnReconstruct.addEventListener('click', () => {
      if (!processingOverlay) return;
      // Show loading overlay
      processingOverlay.classList.add('visible');
      btnReconstruct.disabled = true;

      // Reset processing steps UI styling
      const steps = [
        document.getElementById('step-0'),
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3')
      ];
      
      steps.forEach(s => {
        if (s) s.classList.remove('active', 'completed');
      });

      // Step 0: Segments
      if (steps[0]) steps[0].classList.add('active');
      if (processingStatusText) processingStatusText.innerText = "Step 1/4: Cloud Mask Segment Extraction...";
      
      setTimeout(() => {
        if (steps[0]) { steps[0].classList.remove('active'); steps[0].classList.add('completed'); }
        if (steps[1]) steps[1].classList.add('active');
        if (processingStatusText) processingStatusText.innerText = "Step 2/4: Fusing Sentinel-1 SAR Polarizations...";
        
        setTimeout(() => {
          if (steps[1]) { steps[1].classList.remove('active'); steps[1].classList.add('completed'); }
          if (steps[2]) steps[2].classList.add('active');
          if (processingStatusText) processingStatusText.innerText = "Step 3/4: Fetching Multi-temporal References...";
          
          setTimeout(() => {
            if (steps[2]) { steps[2].classList.remove('active'); steps[2].classList.add('completed'); }
            if (steps[3]) steps[3].classList.add('active');
            if (processingStatusText) processingStatusText.innerText = `Step 4/4: Denoising via ${getModelFriendlyName(activeModel)}...`;
            
            setTimeout(() => {
              if (steps[3]) { steps[3].classList.remove('active'); steps[3].classList.add('completed'); }
              
              // Hide overlay
              processingOverlay.classList.remove('visible');
              btnReconstruct.disabled = false;
              
              // Re-render visuals
              renderSandboxVisuals();
              updateQuantitativeMetrics();
              
              // Slide divider automatically left to right to display reconstructed output
              animateDividerTransition();
            }, 800);
          }, 550);
        }, 650);
      }, 500);
    });
  }

  // Slider swipe animation after reconstruction run
  function animateDividerTransition() {
    sliderPosition = 100;
    updateComparisonSlider();
    
    let currentPos = 100;
    const targetPos = 40;
    
    const interval = setInterval(() => {
      if (currentPos <= targetPos) {
        clearInterval(interval);
      } else {
        currentPos -= 2.5;
        sliderPosition = currentPos;
        updateComparisonSlider();
      }
    }, 16);
  }

  function getModelFriendlyName(model) {
    if (model === 'diffusion') return "Latent Diffusion Model";
    if (model === 'transformer') return "Multi-modal Transformer";
    if (model === 'cyclegan') return "Spectral CycleGAN";
    return "";
  }

  // --- Event Listeners for UI Controllers ---
  if (regionSelector) {
    regionSelector.addEventListener('change', (e) => {
      activeRegion = e.target.value;
      if (regionCoords[activeRegion]) {
        if (infoRegionName) infoRegionName.innerText = regionCoords[activeRegion].name;
        if (infoCoords) infoCoords.innerText = regionCoords[activeRegion].coords;
      }
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  modelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeModel = btn.getAttribute('data-model');
      if (rightLabelName) rightLabelName.innerText = `RECONSTRUCTED (${activeModel.toUpperCase()})`;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  });

  if (sliderFidelity) {
    sliderFidelity.addEventListener('input', (e) => {
      reconstructionFidelity = parseInt(e.target.value);
      if (sliderFidelityVal) sliderFidelityVal.innerText = `${reconstructionFidelity}%`;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  if (sliderSar) {
    sliderSar.addEventListener('input', (e) => {
      sarWeight = parseInt(e.target.value);
      if (sliderSarVal) sliderSarVal.innerText = `${sarWeight}%`;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  if (toggleCloudMask) {
    toggleCloudMask.addEventListener('change', (e) => {
      showCloudMask = e.target.checked;
      renderSandboxVisuals();
    });
  }

  if (toggleSarGuide) {
    toggleSarGuide.addEventListener('change', (e) => {
      showSarGuidance = e.target.checked;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  // --- Update Quantitative performance Metrics Panel ---
  function updateQuantitativeMetrics() {
    if (!valSsim || !valPsnr || !valSam || !valF1) return;

    let ssim = 0.948;
    let psnr = 29.4;
    let sam = 0.052;
    let f1 = 0.965;

    if (activeModel === 'diffusion') {
      ssim = 0.948;
      psnr = 29.4;
      sam = 0.052;
      f1 = 0.965;
    } else if (activeModel === 'transformer') {
      ssim = 0.902;
      psnr = 26.8;
      sam = 0.068;
      f1 = 0.941;
    } else if (activeModel === 'cyclegan') {
      ssim = 0.801;
      psnr = 22.4;
      sam = 0.145;
      f1 = 0.884;
    }

    const fidelityScale = reconstructionFidelity / 100;
    ssim *= (0.8 + 0.2 * fidelityScale);
    psnr -= (1 - fidelityScale) * 4.0;
    sam += (1 - fidelityScale) * 0.08;

    if (!showSarGuidance) {
      ssim -= 0.12;
      psnr -= 5.2;
      sam += 0.05;
      f1 -= 0.08;
    }

    const sarWeightScale = sarWeight / 100;
    if (showSarGuidance) {
      const deviation = Math.abs(sarWeightScale - 0.75);
      ssim -= deviation * 0.05;
      psnr -= deviation * 1.5;
    }

    valSsim.innerText = ssim.toFixed(3);
    valPsnr.innerText = `${psnr.toFixed(1)} dB`;
    valSam.innerText = `${sam.toFixed(3)} rad`;
    valF1.innerText = f1.toFixed(3);

    updateSpectralBandGraph(ssim, psnr, sam);
  }

  function updateSpectralBandGraph(ssim, psnr, sam) {
    const dots = document.querySelectorAll('.spectral-dot.reconstructed');
    if (dots.length < 3) return;

    let deviation = (1 - ssim) * 100;

    dots[0].style.bottom = `${35 + (activeModel === 'cyclegan' ? 6 : 2) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;
    dots[1].style.bottom = `${25 + (activeModel === 'cyclegan' ? 8 : 1) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;
    dots[2].style.bottom = `${65 + (activeModel === 'cyclegan' ? 12 : 3) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;

    dots[0].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[0].style.bottom) / 100).toFixed(2)}`);
    dots[1].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[1].style.bottom) / 100).toFixed(2)}`);
    dots[2].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[2].style.bottom) / 100).toFixed(2)}`);
  }

  function animateLulcCharts() {
    const barsCloudy = document.querySelectorAll('.bar-item.cloudy');
    const barsRecon = document.querySelectorAll('.bar-item.reconstructed');

    const originalCloudyHeights = ['38%', '25%', '48%', '52%', '30%'];
    let originalReconHeights = ['94%', '91%', '88%', '95%', '82%'];
    if (activeModel === 'transformer') {
      originalReconHeights = ['88%', '86%', '80%', '90%', '76%'];
    } else if (activeModel === 'cyclegan') {
      originalReconHeights = ['78%', '74%', '70%', '82%', '64%'];
    }

    barsCloudy.forEach((bar, i) => {
      bar.style.height = '0%';
      setTimeout(() => {
        bar.style.height = originalCloudyHeights[i];
      }, 50);
    });

    barsRecon.forEach((bar, i) => {
      bar.style.height = '0%';
      setTimeout(() => {
        bar.style.height = originalReconHeights[i];
      }, 100);
    });
  }

  // --- 3D Tab & Terrestrial Dehazing Variables ---
  let threeDeeInitialized = false;
  let threeDeeAnimationId = null;
  let rotationX = -0.6; // Pitch angle
  let rotationY = 0.7;  // Yaw angle
  let autoRotate3d = true;
  let show3dClouds = true;
  let cloud3dAlt = 120;
  let elevationScale = 1.2;
  
  // 3D Terrain Grid heights (40x40 mesh)
  const gridPoints = 40;
  const terrainZ = [];
  
  for (let x = 0; x < gridPoints; x++) {
    terrainZ[x] = [];
    for (let y = 0; y < gridPoints; y++) {
      const dx = (x - 20) / 10;
      const dy = (y - 20) / 10;
      let z = Math.sin(dx * 0.8) * Math.cos(dy * 0.8) * 3;
      z += Math.cos(dx * 0.3) * Math.sin(dy * 0.4) * 4;
      z += Math.sin(dx * 2.2) * Math.cos(dy * 1.8) * 0.5;
      terrainZ[x][y] = z;
    }
  }

  let isDraggingDehazing = false;
  let dehazingPosition = 50;
  let dehazingImgLoaded = false;
  
  const dehazingImg = new Image();
  dehazingImg.src = 'dehazing_demo.jpg';
  dehazingImg.onload = () => {
    dehazingImgLoaded = true;
    if (activeTab === 'threedee') {
      renderDehazingCanvases();
    }
  };

  // --- Initialize 3D Surface & Dehazing Tab ---
  function initThreeDeeTab() {
    const canvas3d = document.getElementById('canvas-3d');
    const btnDecloud = document.getElementById('btn-3d-decloud');
    const btnRotate = document.getElementById('btn-3d-rotate');
    const sliderAlt = document.getElementById('slider-3d-alt');
    const sliderAltVal = document.getElementById('slider-3d-alt-val');
    const sliderHeight = document.getElementById('slider-3d-height');
    const sliderHeightVal = document.getElementById('slider-3d-height-val');

    const dehazingSliderContainer = document.getElementById('dehazing-slider-container');
    const parallaxContainer = document.getElementById('parallax-container');
    const canvasParaBg = document.getElementById('canvas-parallax-bg');
    const canvasParaFg = document.getElementById('canvas-parallax-fg');

    if (!canvas3d) return;

    const rect3d = canvas3d.parentElement ? canvas3d.parentElement.getBoundingClientRect() : { width: 600, height: 420 };
    canvas3d.width = rect3d.width || 600;
    canvas3d.height = rect3d.height || 420;

    if (dehazingSliderContainer) {
      const rectDehaze = dehazingSliderContainer.getBoundingClientRect();
      const canvasDehazeHazy = document.getElementById('canvas-dehazing-hazy');
      const canvasDehazeClear = document.getElementById('canvas-dehazing-clear');
      
      if (canvasDehazeHazy && canvasDehazeClear) {
        canvasDehazeHazy.width = rectDehaze.width || 500;
        canvasDehazeHazy.height = rectDehaze.height || 420;
        canvasDehazeClear.width = rectDehaze.width || 500;
        canvasDehazeClear.height = rectDehaze.height || 420;
      }
    }

    if (parallaxContainer && canvasParaBg && canvasParaFg) {
      const rectPara = parallaxContainer.getBoundingClientRect();
      canvasParaBg.width = rectPara.width || 400;
      canvasParaBg.height = rectPara.height || 260;
      canvasParaFg.width = rectPara.width || 400;
      canvasParaFg.height = rectPara.height || 260;
    }

    renderDehazingCanvases();

    if (!threeDeeInitialized) {
      if (btnDecloud) {
        btnDecloud.addEventListener('click', () => {
          show3dClouds = !show3dClouds;
          btnDecloud.style.background = show3dClouds ? '' : 'rgba(245, 158, 11, 0.15)';
          btnDecloud.style.borderColor = show3dClouds ? '' : 'rgba(245, 158, 11, 0.3)';
          const labelSpan = btnDecloud.querySelector('span');
          if (labelSpan) labelSpan.innerText = show3dClouds ? "Hide Cloud Layer" : "Reconstruct Surface (De-cloud)";
        });
      }

      if (btnRotate) {
        btnRotate.addEventListener('click', () => {
          autoRotate3d = !autoRotate3d;
          const labelSpan = btnRotate.querySelector('span');
          if (labelSpan) labelSpan.innerText = `Auto Rotate: ${autoRotate3d ? "ON" : "OFF"}`;
          btnRotate.style.borderColor = autoRotate3d ? 'var(--border-color)' : 'rgba(6, 182, 212, 0.4)';
        });
      }

      if (sliderAlt) {
        sliderAlt.addEventListener('input', (e) => {
          cloud3dAlt = parseInt(e.target.value);
          if (sliderAltVal) sliderAltVal.innerText = `${cloud3dAlt}m`;
        });
      }

      if (sliderHeight) {
        sliderHeight.addEventListener('input', (e) => {
          elevationScale = parseInt(e.target.value) / 10;
          if (sliderHeightVal) sliderHeightVal.innerText = `${elevationScale.toFixed(1)}x`;
        });
      }

      let isDragging3d = false;
      let prevMouseX = 0;
      let prevMouseY = 0;

      canvas3d.addEventListener('mousedown', (e) => {
        isDragging3d = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        autoRotate3d = false;
        if (btnRotate) {
          const labelSpan = btnRotate.querySelector('span');
          if (labelSpan) labelSpan.innerText = "Auto Rotate: OFF";
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging3d) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        rotationY += deltaX * 0.007;
        rotationX += deltaY * 0.007;
        rotationX = Math.max(-1.3, Math.min(-0.15, rotationX));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      });

      window.addEventListener('mouseup', () => {
        isDragging3d = false;
      });

      if (dehazingSliderContainer) {
        function getDehazeMouseX(e) {
          const rect = dehazingSliderContainer.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          return clientX - rect.left;
        }

        dehazingSliderContainer.addEventListener('mousedown', (e) => {
          isDraggingDehazing = true;
          const mouseX = getDehazeMouseX(e);
          const w = dehazingSliderContainer.getBoundingClientRect().width;
          if (w > 0) dehazingPosition = (mouseX / w) * 100;
          updateDehazingSlider();
          e.preventDefault();
        });

        dehazingSliderContainer.addEventListener('touchstart', (e) => {
          isDraggingDehazing = true;
          const mouseX = getDehazeMouseX(e);
          const w = dehazingSliderContainer.getBoundingClientRect().width;
          if (w > 0) dehazingPosition = (mouseX / w) * 100;
          updateDehazingSlider();
        });
      }

      window.addEventListener('mousemove', (e) => {
        if (!isDraggingDehazing || !dehazingSliderContainer) return;
        const rect = dehazingSliderContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const mouseX = clientX - rect.left;
        const w = rect.width;
        if (w > 0) dehazingPosition = (mouseX / w) * 100;
        updateDehazingSlider();
      });

      window.addEventListener('mouseup', () => {
        isDraggingDehazing = false;
      });
      window.addEventListener('touchend', () => {
        isDraggingDehazing = false;
      });

      if (parallaxContainer && canvasParaBg && canvasParaFg) {
        parallaxContainer.addEventListener('mousemove', (e) => {
          const rect = parallaxContainer.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
          const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
          
          canvasParaBg.style.transform = `translate(${mouseX * -10}px, ${mouseY * -10}px) scale(1.08)`;
          canvasParaFg.style.transform = `translate(${mouseX * 18}px, ${mouseY * 18}px) scale(1.12)`;
        });

        parallaxContainer.addEventListener('mouseleave', () => {
          canvasParaBg.style.transform = 'translate(0px, 0px) scale(1.08)';
          canvasParaFg.style.transform = 'translate(0px, 0px) scale(1.12)';
        });
      }

      threeDeeInitialized = true;
    }

    if (threeDeeAnimationId) {
      cancelAnimationFrame(threeDeeAnimationId);
    }
    
    function animate3d() {
      if (activeTab !== 'threedee') return;
      
      if (autoRotate3d) {
        rotationY += 0.003;
      }

      draw3dTerrainMesh(canvas3d);
      threeDeeAnimationId = requestAnimationFrame(animate3d);
    }

    animate3d();
    updateDehazingSlider();
  }

  // --- Procedural 3D Mesh Draw logic ---
  function draw3dTerrainMesh(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';

    const centerX = w / 2;
    const centerY = h / 2;

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    const screenCoords = [];

    // 1. Calculate projected positions of mountain terrain points
    for (let x = 0; x < gridPoints; x++) {
      screenCoords[x] = [];
      for (let y = 0; y < gridPoints; y++) {
        const gx = (x - 20) * 11.5;
        const gy = (y - 20) * 11.5;
        const gz = terrainZ[x][y] * elevationScale * 2.5;

        const rx = gx * cosY - gy * sinY;
        const ry = gx * sinY + gy * cosY;

        const px = rx;
        const py = ry * cosX - gz * sinX;

        screenCoords[x][y] = {
          x: centerX + px,
          y: centerY + py - 35,
          z: gz
        };
      }
    }

    // 2. Draw Cloud Shadows onto terrain (if toggled)
    if (show3dClouds) {
      const sdx = 15;
      const sdy = 20;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      
      const shadowCenters = [
        {x: -70, y: -50, r: 85},
        {x: 60, y: 70, r: 100},
        {x: -40, y: 90, r: 75}
      ];

      shadowCenters.forEach(c => {
        const rx = c.x * cosY - c.y * sinY;
        const ry = c.x * sinY + c.y * cosY;
        const px = rx + sdx;
        const py = ry * cosX + sdy;
        
        ctx.beginPath();
        ctx.ellipse(centerX + px, centerY + py - 35, c.r * 0.9, c.r * 0.45 * cosX, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. Draw Wireframe Grid Lines
    for (let x = 0; x < gridPoints; x++) {
      for (let y = 0; y < gridPoints; y++) {
        const A = screenCoords[x][y];
        
        if (A.z > 10.5) {
          ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)'; // Snow peaks
        } else if (A.z > 2.5) {
          ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';   // Mountain slopes
        } else {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';    // Valleys
        }

        ctx.lineWidth = A.z > 10.5 ? 1.5 : 0.8;

        if (x < gridPoints - 1) {
          const B = screenCoords[x+1][y];
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
        }

        if (y < gridPoints - 1) {
          const C = screenCoords[x][y+1];
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(C.x, C.y);
          ctx.stroke();
        }
      }
    }

    // 4. Draw Floating Clouds
    if (show3dClouds) {
      const cz = cloud3dAlt * 0.65;
      const cloudPuffs = [
        {x: -70, y: -50, r: 85},
        {x: 60, y: 70, r: 100},
        {x: -40, y: 90, r: 75}
      ];

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.2;

      cloudPuffs.forEach(c => {
        const rx = c.x * cosY - c.y * sinY;
        const ry = c.x * sinY + c.y * cosY;
        const px = rx;
        const py = ry * cosX - cz * sinX;

        ctx.beginPath();
        ctx.ellipse(centerX + px, centerY + py - 35, c.r, c.r * 0.5 * cosX, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(centerX + px - 10, centerY + py - 40, c.r * 0.6, c.r * 0.3 * cosX, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      });
    }
  }

  // --- Crop Dehazing Images & Parallax layers ---
  function renderDehazingCanvases() {
    if (!dehazingImgLoaded) return;

    const canvasHazy = document.getElementById('canvas-dehazing-hazy');
    const canvasClear = document.getElementById('canvas-dehazing-clear');
    const canvasParaBg = document.getElementById('canvas-parallax-bg');
    const canvasParaFg = document.getElementById('canvas-parallax-fg');

    if (!canvasHazy || !canvasClear || !canvasParaBg || !canvasParaFg) return;

    const ctxHazy = canvasHazy.getContext('2d');
    const ctxClear = canvasClear.getContext('2d');
    const ctxParaBg = canvasParaBg.getContext('2d');
    const ctxParaFg = canvasParaFg.getContext('2d');

    const wSrc = dehazingImg.width;
    const hSrc = dehazingImg.height;

    [ctxHazy, ctxClear, ctxParaBg, ctxParaFg].forEach(ctx => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });

    ctxHazy.drawImage(
      dehazingImg, 
      0, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasHazy.width, canvasHazy.height
    );

    ctxClear.drawImage(
      dehazingImg, 
      wSrc / 2, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasClear.width, canvasClear.height
    );

    ctxParaBg.drawImage(
      dehazingImg, 
      wSrc / 2, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasParaBg.width, canvasParaBg.height
    );

    const wDest = canvasParaFg.width;
    const hDest = canvasParaFg.height;

    ctxParaFg.strokeStyle = '#052e16';
    ctxParaFg.lineWidth = 5;
    ctxParaFg.lineCap = 'round';
    
    ctxParaFg.beginPath();
    ctxParaFg.moveTo(0, hDest * 0.15);
    ctxParaFg.quadraticCurveTo(wDest * 0.28, hDest * 0.28, wDest * 0.18, hDest * 0.7);
    ctxParaFg.stroke();

    ctxParaFg.lineWidth = 3.5;
    ctxParaFg.beginPath();
    ctxParaFg.moveTo(0, hDest * 0.45);
    ctxParaFg.quadraticCurveTo(wDest * 0.16, hDest * 0.52, wDest * 0.32, hDest * 0.56);
    ctxParaFg.stroke();

    const foliageCluster = [
      {x: wDest * 0.12, y: hDest * 0.2, r: 20},
      {x: wDest * 0.22, y: hDest * 0.29, r: 26},
      {x: wDest * 0.18, y: hDest * 0.42, r: 22},
      {x: wDest * 0.14, y: hDest * 0.62, r: 28},
      {x: wDest * 0.24, y: hDest * 0.52, r: 18},
      {x: wDest * 0.31, y: hDest * 0.56, r: 20},
      {x: wDest * 0.05, y: hDest * 0.32, r: 24},
      {x: wDest * 0.42, y: hDest * 0.08, r: 16},
      {x: wDest * 0.55, y: hDest * 0.05, r: 22},
      {x: wDest * 0.68, y: hDest * 0.14, r: 18}
    ];

    foliageCluster.forEach(l => {
      ctxParaFg.fillStyle = '#14532d';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctxParaFg.fill();

      ctxParaFg.fillStyle = '#22c55e';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x - l.r * 0.2, l.y - l.r * 0.2, l.r * 0.65, 0, Math.PI * 2);
      ctxParaFg.fill();
      
      ctxParaFg.fillStyle = '#4ade80';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x - l.r * 0.35, l.y - l.r * 0.35, l.r * 0.3, 0, Math.PI * 2);
      ctxParaFg.fill();
    });
  }

  function updateDehazingSlider() {
    const divider = document.getElementById('dehazing-slider-divider');
    const overlay = document.getElementById('dehazing-slider-overlay');
    if (!divider || !overlay) return;
    
    divider.style.left = `${dehazingPosition}%`;
    overlay.style.clipPath = `polygon(${dehazingPosition}% 0, 100% 0, 100% 100%, ${dehazingPosition}% 100%)`;
  }

  // --- Initial Setup Execution ---
  setTimeout(() => {
    switchTab('overview');
    resizeCanvases();
    updateQuantitativeMetrics();
  }, 100);

});
