/* ==========================================================================
   CLEAR_SEE - Interactive Frontend Controller & Simulation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- State Variables ---
  let activeTab = 'threedee';
  let activeRegion = 'shillong';
  let activeModel = 'diffusion';
  let reconstructionFidelity = 90;
  let sarWeight = 75;
  let showCloudMask = false;
  let showSarGuidance = true;
  let isDraggingSlider = false;
  let sliderPosition = 50; // percentage from left (0 to 100)

  // --- Civic Companion Chat State & Translations ---
  let chatIsOpen = false;
  let chatLanguage = 'en'; // 'en', 'hi', 'ta'
  const chatMessages = []; // { sender: 'bot'|'user', text: string }

  const chatTranslations = {
    en: {
      title: "Civic Companion AI",
      status: "Active",
      placeholder: "Ask a civic question or report an issue...",
      welcome: "Hello! I am your Civic Companion. Ask me anything about the city, satellite analysis, or click a 3D building to query it.",
      send: "Send",
      thinking: "Thinking...",
      errorEmpty: "Please enter a message.",
      defaultReply: "Thank you for your message. As your Civic Companion, I have logged this concern. Our satellite imagery helps us verify local conditions.",
      buildingReplies: {
        "City Hall": "You can report civic issues like potholes, street lighting, or public disturbances to the City Hall portal. Would you like me to open the ticket form?",
        "Power Station": "The municipal Power Station is currently operating at 87% capacity. The solar grid integration is fully functional.",
        "Water Treatment Facility": "Water quality levels are normal (TDS: 150 mg/L). Turbidity is low after filtration."
      }
    },
    hi: {
      title: "नागरिक साथी एआई",
      status: "सक्रिय",
      placeholder: "नागरिक प्रश्न पूछें या समस्या की रिपोर्ट करें...",
      welcome: "नमस्ते! मैं आपका नागरिक साथी हूँ। शहर, उपग्रह विश्लेषण के बारे में कुछ भी पूछें, या पूछताछ के लिए किसी 3D इमारत पर क्लिक करें।",
      send: "भेजें",
      thinking: "सोच रहा हूँ...",
      errorEmpty: "कृपया एक संदेश दर्ज करें।",
      defaultReply: "आपके संदेश के लिए धन्यवाद। आपके नागरिक साथी के रूप में, मैंने इस चिंता को दर्ज कर लिया है। उपग्रह चित्र हमें स्थानीय स्थितियों को सत्यापित करने में मदद करते हैं।",
      buildingReplies: {
        "City Hall": "आप सिटी हॉल पोर्टल पर गड्ढों, स्ट्रीट लाइटिंग या सार्वजनिक अशांति जैसी नागरिक समस्याओं की रिपोर्ट कर सकते हैं। क्या आप चाहते हैं कि मैं टिकट फॉर्म खोलूं?",
        "Power Station": "नगर निगम बिजली घर वर्तमान में 87% क्षमता पर काम कर रहा है। सौर ग्रिड एकीकरण पूरी तरह कार्यात्मक है।",
        "Water Treatment Facility": "जल गुणवत्ता का स्तर सामान्य है (TDS: 150 mg/L)। निस्पंदन (फ़िल्टरेशन) के बाद मैलापन कम है।"
      }
    },
    ta: {
      title: "குடிமைத் தோழன் AI",
      status: "செயலில் உள்ளது",
      placeholder: "குடிமை வினாவைக் கேட்கவும் அல்லது புகாரைப் பதிவு செய்யவும்...",
      welcome: "வணக்கம்! நான் உங்கள் குடிமைத் தோழன். நகரம், செயற்கைக்கோள் பகுப்பாய்வு பற்றி ஏதேனும் கேட்கலாம், அல்லது வினவ 3D கட்டிடத்தை கிளிக் செய்யவும்.",
      send: "அனுப்பு",
      thinking: "யோசிக்கிறது...",
      errorEmpty: "தயவுசெய்து ஒரு செய்தியை உள்ளிடவும்.",
      defaultReply: "உங்கள் செய்திக்கு நன்றி. உங்கள் குடிமைத் தோழனாக, நான் இந்த கவலையைப் பதிவு செய்துள்ளேன். உள்ளூர் நிலைமைகளை சரிபார்க்க செயற்கைக்கோள் படங்கள் எங்களுக்கு உதவுகின்றன.",
      buildingReplies: {
        "City Hall": "நெடுஞ்சாலை குழிகள், தெரு விளக்குகள் அல்லது பொது இடையூறுகள் போன்ற குடிமைப் பிரச்சனைகளை நீங்கள் நகர மண்டப போர்ட்டலில் புகாரளிக்கலாம். நான் உங்களுக்காகப் படிவத்தைத் திறக்கவா?",
        "Power Station": "நகராட்சி மின் நிலையம் தற்போது 87% திறனில் இயங்குகிறது. சூரிய மின்சக்தி கட்டமைப்பு முழுமையாக செயல்படுகிறது.",
        "Water Treatment Facility": "நீரின் தரம் சாதாரணமாக உள்ளது (TDS: 150 mg/L). வடிகட்டலுக்குப் பிறகு கலங்கல் அளவு குறைவாக உள்ளது."
      }
    }
  };

  const buildings = [
    {
      id: "city-hall",
      name: { en: "City Hall", hi: "नगर निगम", ta: "நகர மண்டபம்" },
      gridX: 14,
      gridY: 14,
      width: 4,
      depth: 4,
      height: 35,
      color: "rgba(6, 182, 212, 0.8)", // Cyan
      queries: {
        en: "How can I report a civic issue at City Hall?",
        hi: "मैं नगर निगम में नागरिक समस्या की रिपोर्ट कैसे कर सकता हूँ?",
        ta: "நகர மண்டபத்தில் ஒரு குடிமைப் புகாரை நான் எவ்வாறு பதிவு செய்வது?"
      }
    },
    {
      id: "power-station",
      name: { en: "Power Station", hi: "बिजली घर", ta: "மின் நிலையம்" },
      gridX: 26,
      gridY: 24,
      width: 3.5,
      depth: 3.5,
      height: 45,
      color: "rgba(245, 158, 11, 0.8)", // Amber
      queries: {
        en: "What is the solar energy output of the Power Station?",
        hi: "बिजली घर का सौर ऊर्जा उत्पादन कितना है?",
        ta: "மின் நிலையத்தின் சூரிய சக்தி உற்பத்தி எவ்வளவு?"
      }
    },
    {
      id: "water-treatment",
      name: { en: "Water Treatment Facility", hi: "जल उपचार केंद्र", ta: "நீர் சுத்திகரிப்பு நிலையம்" },
      gridX: 12,
      gridY: 26,
      width: 4,
      depth: 3,
      height: 25,
      color: "rgba(16, 185, 129, 0.8)", // Emerald Green
      queries: {
        en: "How clean is the water from the Water Treatment Facility?",
        hi: "जल उपचार केंद्र से पानी कितना साफ है?",
        ta: "நீர் சுத்திகரிப்பு நிலையத்திலிருந்து வரும் நீர் எவ்வளவு சுத்தமானது?"
      }
    }
  ];

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

  // --- Tab Navigation Logic ---
  window.switchTab = function(tabId) {
    activeTab = tabId;
    
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
      dynamicPageTitle.innerText = pageTitles[tabId].title;
      dynamicPageDesc.innerText = pageTitles[tabId].desc;
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
    const rect = sliderContainer.getBoundingClientRect();
    
    // Adjust canvas elements size to match CSS container
    [canvasCloudy, canvasReconstructed].forEach(canvas => {
      canvas.width = rect.width;
      canvas.height = rect.height;
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
    if (sliderPosition < 0) sliderPosition = 0;
    if (sliderPosition > 100) sliderPosition = 100;
    
    // Move divider bar
    sliderDivider.style.left = `${sliderPosition}%`;
    
    // Crop overlay width (Reconstructed side is right side)
    sliderOverlay.style.clipPath = `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`;
  }

  // Handle Dragging Events
  function getMouseX(e) {
    const rect = sliderContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return clientX - rect.left;
  }

  function handleSliderMove(e) {
    if (!isDraggingSlider) return;
    const mouseX = getMouseX(e);
    const containerWidth = sliderContainer.getBoundingClientRect().width;
    sliderPosition = (mouseX / containerWidth) * 100;
    updateComparisonSlider();
  }

  sliderContainer.addEventListener('mousedown', (e) => {
    isDraggingSlider = true;
    const mouseX = getMouseX(e);
    const containerWidth = sliderContainer.getBoundingClientRect().width;
    sliderPosition = (mouseX / containerWidth) * 100;
    updateComparisonSlider();
    e.preventDefault();
  });

  window.addEventListener('mousemove', handleSliderMove);
  window.addEventListener('mouseup', () => { isDraggingSlider = false; });

  // Touch support for mobiles/tablets
  sliderContainer.addEventListener('touchstart', (e) => {
    isDraggingSlider = true;
    const mouseX = getMouseX(e);
    const containerWidth = sliderContainer.getBoundingClientRect().width;
    sliderPosition = (mouseX / containerWidth) * 100;
    updateComparisonSlider();
  });
  window.addEventListener('touchmove', handleSliderMove);
  window.addEventListener('touchend', () => { isDraggingSlider = false; });


  // --- Run Reconstruction Trigger Simulation ---
  btnReconstruct.addEventListener('click', () => {
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
      s.classList.remove('active', 'completed');
    });

    // Step 0: Segments
    steps[0].classList.add('active');
    processingStatusText.innerText = "Step 1/4: Cloud Mask Segment Extraction...";
    
    setTimeout(() => {
      steps[0].classList.remove('active');
      steps[0].classList.add('completed');
      steps[1].classList.add('active');
      processingStatusText.innerText = "Step 2/4: Fusing Sentinel-1 SAR Polarizations...";
      
      setTimeout(() => {
        steps[1].classList.remove('active');
        steps[1].classList.add('completed');
        steps[2].classList.add('active');
        processingStatusText.innerText = "Step 3/4: Fetching Multi-temporal References...";
        
        setTimeout(() => {
          steps[2].classList.remove('active');
          steps[2].classList.add('completed');
          steps[3].classList.add('active');
          processingStatusText.innerText = `Step 4/4: Denoising via ${getModelFriendlyName(activeModel)}...`;
          
          setTimeout(() => {
            steps[3].classList.remove('active');
            steps[3].classList.add('completed');
            
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
  
  // Region Selector
  regionSelector.addEventListener('change', (e) => {
    activeRegion = e.target.value;
    
    // Update labels and coordinates
    if (regionCoords[activeRegion]) {
      infoRegionName.innerText = regionCoords[activeRegion].name;
      infoCoords.innerText = regionCoords[activeRegion].coords;
    }
    
    renderSandboxVisuals();
    updateQuantitativeMetrics();
  });

  // Generative AI Model Button group
  modelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeModel = btn.getAttribute('data-model');
      
      // Update label in slider overlay
      rightLabelName.innerText = `RECONSTRUCTED (${activeModel.toUpperCase()})`;
      
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  });

  // Sliders
  sliderFidelity.addEventListener('input', (e) => {
    reconstructionFidelity = parseInt(e.target.value);
    sliderFidelityVal.innerText = `${reconstructionFidelity}%`;
    renderSandboxVisuals();
    updateQuantitativeMetrics();
  });

  sliderSar.addEventListener('input', (e) => {
    sarWeight = parseInt(e.target.value);
    sliderSarVal.innerText = `${sarWeight}%`;
    
    // If SAR weight drops to 0, warning should show in validation
    renderSandboxVisuals();
    updateQuantitativeMetrics();
  });

  // Checkbox toggles
  toggleCloudMask.addEventListener('change', (e) => {
    showCloudMask = e.target.checked;
    renderSandboxVisuals();
  });

  toggleSarGuide.addEventListener('change', (e) => {
    showSarGuidance = e.target.checked;
    renderSandboxVisuals();
    updateQuantitativeMetrics();
  });


  // --- Update Quantitative performance Metrics Panel ---
  function updateQuantitativeMetrics() {
    let ssim = 0.948;
    let psnr = 29.4;
    let sam = 0.052;
    let f1 = 0.965;

    // Adjust bases by chosen generative model
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

    // Impact of LISS-IV Reconstruction Fidelity Slider
    const fidelityScale = reconstructionFidelity / 100;
    ssim *= (0.8 + 0.2 * fidelityScale);
    psnr -= (1 - fidelityScale) * 4.0;
    sam += (1 - fidelityScale) * 0.08;

    // Impact of Sentinel-1 SAR Guidance toggle
    if (!showSarGuidance) {
      // Without SAR guidance, spatial metrics degrade dramatically, especially in cloudy regions
      ssim -= 0.12;
      psnr -= 5.2;
      sam += 0.05;
      f1 -= 0.08;
    }

    // Impact of SAR Weight Slider
    const sarWeightScale = sarWeight / 100;
    if (showSarGuidance) {
      // Optimal weight is around 70-80%
      const deviation = Math.abs(sarWeightScale - 0.75);
      ssim -= deviation * 0.05;
      psnr -= deviation * 1.5;
    }

    // Set values to DOM elements
    valSsim.innerText = ssim.toFixed(3);
    valPsnr.innerText = `${psnr.toFixed(1)} dB`;
    valSam.innerText = `${sam.toFixed(3)} rad`;
    valF1.innerText = f1.toFixed(3);

    // Update lines/dots in quantitative tab
    updateSpectralBandGraph(ssim, psnr, sam);
  }

  // --- Dynamic Spectral Line Chart Update ---
  function updateSpectralBandGraph(ssim, psnr, sam) {
    const dots = document.querySelectorAll('.spectral-dot.reconstructed');
    const cloudyDots = document.querySelectorAll('.spectral-dot.cloudy');
    const gtDots = document.querySelectorAll('.spectral-dot.ground-truth');

    if (dots.length < 3) return;

    // Base reflectances:
    // Green (Index 0): GT = 35%
    // Red (Index 1): GT = 25%
    // NIR (Index 2): GT = 65%
    
    // Reconstructed reflects how close we are to Ground Truth
    // Diffusion aligns closest, CycleGAN deviates, no SAR degrades
    let deviation = (1 - ssim) * 100; // percent offset

    // Apply height offsets dynamically
    dots[0].style.bottom = `${35 + (activeModel === 'cyclegan' ? 6 : 2) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;
    dots[1].style.bottom = `${25 + (activeModel === 'cyclegan' ? 8 : 1) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;
    dots[2].style.bottom = `${65 + (activeModel === 'cyclegan' ? 12 : 3) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;

    // update tooltips values
    dots[0].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[0].style.bottom) / 100).toFixed(2)}`);
    dots[1].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[1].style.bottom) / 100).toFixed(2)}`);
    dots[2].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[2].style.bottom) / 100).toFixed(2)}`);
  }

  // --- Animate LULC charts on tab select ---
  function animateLulcCharts() {
    const barsCloudy = document.querySelectorAll('.bar-item.cloudy');
    const barsRecon = document.querySelectorAll('.bar-item.reconstructed');

    // Reset heights to 0 first, then animate
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
  
  // Generate terrain height matrix
  for (let x = 0; x < gridPoints; x++) {
    terrainZ[x] = [];
    for (let y = 0; y < gridPoints; y++) {
      const dx = (x - 20) / 10;
      const dy = (y - 20) / 10;
      let z = Math.sin(dx * 0.8) * Math.cos(dy * 0.8) * 3;
      z += Math.cos(dx * 0.3) * Math.sin(dy * 0.4) * 4;
      z += Math.sin(dx * 2.2) * Math.cos(dy * 1.8) * 0.5; // Fine resolution roughness
      terrainZ[x][y] = z;
    }
  }

  let isDraggingDehazing = false;
  let dehazingPosition = 50; // split percent
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
    const dehazingSliderOverlay = document.getElementById('dehazing-slider-overlay');
    const dehazingSliderDivider = document.getElementById('dehazing-slider-divider');

    const parallaxContainer = document.getElementById('parallax-container');
    const canvasParaBg = document.getElementById('canvas-parallax-bg');
    const canvasParaFg = document.getElementById('canvas-parallax-fg');

    if (!canvas3d) return;

    // Set sizes of canvases
    const rect3d = canvas3d.parentElement.getBoundingClientRect();
    canvas3d.width = rect3d.width;
    canvas3d.height = rect3d.height;

    const rectDehaze = dehazingSliderContainer.getBoundingClientRect();
    const canvasDehazeHazy = document.getElementById('canvas-dehazing-hazy');
    const canvasDehazeClear = document.getElementById('canvas-dehazing-clear');
    
    if (canvasDehazeHazy && canvasDehazeClear) {
      canvasDehazeHazy.width = rectDehaze.width;
      canvasDehazeHazy.height = rectDehaze.height;
      canvasDehazeClear.width = rectDehaze.width;
      canvasDehazeClear.height = rectDehaze.height;
    }

    if (canvasParaBg && canvasParaFg) {
      const rectPara = parallaxContainer.getBoundingClientRect();
      canvasParaBg.width = rectPara.width;
      canvasParaBg.height = rectPara.height;
      canvasParaFg.width = rectPara.width;
      canvasParaFg.height = rectPara.height;
    }

    // Render static image crops
    renderDehazingCanvases();

    // Event listener configurations (Only bind once)
    if (!threeDeeInitialized) {
      // 3D control hooks
      btnDecloud.addEventListener('click', () => {
        show3dClouds = !show3dClouds;
        btnDecloud.style.background = show3dClouds ? '' : 'rgba(245, 158, 11, 0.15)';
        btnDecloud.style.borderColor = show3dClouds ? '' : 'rgba(245, 158, 11, 0.3)';
        btnDecloud.querySelector('span').innerText = show3dClouds ? "Hide Cloud Layer" : "Reconstruct Surface (De-cloud)";
      });

      btnRotate.addEventListener('click', () => {
        autoRotate3d = !autoRotate3d;
        btnRotate.querySelector('span').innerText = `Auto Rotate: ${autoRotate3d ? "ON" : "OFF"}`;
        btnRotate.style.borderColor = autoRotate3d ? 'var(--border-color)' : 'rgba(6, 182, 212, 0.4)';
      });

      sliderAlt.addEventListener('input', (e) => {
        cloud3dAlt = parseInt(e.target.value);
        sliderAltVal.innerText = `${cloud3dAlt}m`;
      });

      sliderHeight.addEventListener('input', (e) => {
        elevationScale = parseInt(e.target.value) / 10;
        sliderHeightVal.innerText = `${elevationScale.toFixed(1)}x`;
      });

      // Mouse drag rotation & Click selection on 3D canvas
      let isDragging3d = false;
      let wasDragging3d = false;
      let prevMouseX = 0;
      let prevMouseY = 0;

      canvas3d.addEventListener('mousedown', (e) => {
        isDragging3d = true;
        wasDragging3d = false;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        autoRotate3d = false;
        btnRotate.querySelector('span').innerText = "Auto Rotate: OFF";
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging3d) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          wasDragging3d = true;
        }
        rotationY += deltaX * 0.007; // Yaw
        rotationX += deltaY * 0.007; // Pitch
        rotationX = Math.max(-1.3, Math.min(-0.15, rotationX)); // Clamp vertical rotation
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      });

      window.addEventListener('mouseup', () => {
        isDragging3d = false;
      });

      canvas3d.addEventListener('click', (e) => {
        if (wasDragging3d) {
          wasDragging3d = false;
          return;
        }

        const rect = canvas3d.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check if hit any building projected bounding box
        let hitB = null;
        for (const b of buildings) {
          if (b.projected &&
              mouseX >= b.projected.minX && mouseX <= b.projected.maxX &&
              mouseY >= b.projected.minY && mouseY <= b.projected.maxY) {
            hitB = b;
            break;
          }
        }

        if (hitB) {
          triggerBuildingFlash(hitB);
          const query = hitB.queries[chatLanguage] || hitB.queries.en;
          
          // Open Chat UI
          openChat();
          
          // Autofill and focus
          civicChatInput.value = query;
          civicChatInput.focus();
        }
      });

      // Dehazing split screen events
      function getDehazeMouseX(e) {
        const rect = dehazingSliderContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return clientX - rect.left;
      }

      dehazingSliderContainer.addEventListener('mousedown', (e) => {
        isDraggingDehazing = true;
        const mouseX = getDehazeMouseX(e);
        const w = dehazingSliderContainer.getBoundingClientRect().width;
        dehazingPosition = (mouseX / w) * 100;
        updateDehazingSlider();
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDraggingDehazing) return;
        const mouseX = getDehazeMouseX(e);
        const w = dehazingSliderContainer.getBoundingClientRect().width;
        dehazingPosition = (mouseX / w) * 100;
        updateDehazingSlider();
      });

      window.addEventListener('mouseup', () => {
        isDraggingDehazing = false;
      });

      // Touch events for Dehazing Split
      dehazingSliderContainer.addEventListener('touchstart', (e) => {
        isDraggingDehazing = true;
        const mouseX = getDehazeMouseX(e);
        const w = dehazingSliderContainer.getBoundingClientRect().width;
        dehazingPosition = (mouseX / w) * 100;
        updateDehazingSlider();
      });
      window.addEventListener('touchmove', (e) => {
        if (!isDraggingDehazing) return;
        const mouseX = getDehazeMouseX(e);
        const w = dehazingSliderContainer.getBoundingClientRect().width;
        dehazingPosition = (mouseX / w) * 100;
        updateDehazingSlider();
      });
      window.addEventListener('touchend', () => {
        isDraggingDehazing = false;
      });

      // Parallax mouse movements
      parallaxContainer.addEventListener('mousemove', (e) => {
        const rect = parallaxContainer.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to +0.5
        const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
        
        canvasParaBg.style.transform = `translate(${mouseX * -10}px, ${mouseY * -10}px) scale(1.08)`;
        canvasParaFg.style.transform = `translate(${mouseX * 18}px, ${mouseY * 18}px) scale(1.12)`;
      });

      parallaxContainer.addEventListener('mouseleave', () => {
        canvasParaBg.style.transform = 'translate(0px, 0px) scale(1.08)';
        canvasParaFg.style.transform = 'translate(0px, 0px) scale(1.12)';
      });

      threeDeeInitialized = true;
    }

    // Start 3D rendering loop
    if (threeDeeAnimationId) {
      cancelAnimationFrame(threeDeeAnimationId);
    }
    
    function animate3d() {
      if (activeTab !== 'threedee') return;
      
      if (autoRotate3d) {
        rotationY += 0.003; // Rotate yaw slowly
      }

      draw3dTerrainMesh(canvas3d);
      threeDeeAnimationId = requestAnimationFrame(animate3d);
    }

    animate3d();
    updateDehazingSlider();
  }

  // --- Procedural 3D Mesh Draw logic ---
  function draw3dTerrainMesh(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';

    const centerX = w / 2;
    const centerY = h / 2;

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    // Grid screen coordinate cache
    const screenCoords = [];

    // 1. Calculate projected positions of all mountain points
    for (let x = 0; x < gridPoints; x++) {
      screenCoords[x] = [];
      for (let y = 0; y < gridPoints; y++) {
        // Center-relative coordinates
        const gx = (x - 20) * 11.5;
        const gy = (y - 20) * 11.5;
        const gz = terrainZ[x][y] * elevationScale * 2.5;

        // Yaw transformation
        const rx = gx * cosY - gy * sinY;
        const ry = gx * sinY + gy * cosY;

        // Pitch transformation
        const px = rx;
        const py = ry * cosX - gz * sinX;

        screenCoords[x][y] = {
          x: centerX + px,
          y: centerY + py - 35,
          z: gz
        };
      }
    }

    // 2. Draw Cloud Shadows onto the terrain points (if toggled)
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

    // 3. Draw Grid Lines connecting points (wireframe)
    for (let x = 0; x < gridPoints; x++) {
      for (let y = 0; y < gridPoints; y++) {
        const A = screenCoords[x][y];
        
        // Color height coding
        if (A.z > 10.5) {
          ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)'; // Snow peaks (White)
        } else if (A.z > 2.5) {
          ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';   // Mountain slopes (Lime Green)
        } else {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';    // Valleys / Rivers (Cyan)
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

    // 3.5 Draw 3D Buildings
    buildings.forEach(b => {
      // Base center calculations
      const gx1 = (b.gridX - 20) * 11.5;
      const gy1 = (b.gridY - 20) * 11.5;
      const gx2 = gx1 + b.width * 11.5;
      const gy2 = gy1 + b.depth * 11.5;
      
      const baseZ = terrainZ[b.gridX][b.gridY] * elevationScale * 2.5;
      const buildH = b.height * elevationScale; // scale height with terrain scale
      
      const s0 = project3d(gx1, gy1, baseZ);
      const s1 = project3d(gx2, gy1, baseZ);
      const s2 = project3d(gx2, gy2, baseZ);
      const s3 = project3d(gx1, gy2, baseZ);
      
      const s4 = project3d(gx1, gy1, baseZ + buildH);
      const s5 = project3d(gx2, gy1, baseZ + buildH);
      const s6 = project3d(gx2, gy2, baseZ + buildH);
      const s7 = project3d(gx1, gy2, baseZ + buildH);
      
      // Bounding box for clicks
      const allX = [s0.x, s1.x, s2.x, s3.x, s4.x, s5.x, s6.x, s7.x];
      const allY = [s0.y, s1.y, s2.y, s3.y, s4.y, s5.y, s6.y, s7.y];
      b.projected = {
        minX: Math.min(...allX),
        maxX: Math.max(...allX),
        minY: Math.min(...allY),
        maxY: Math.max(...allY)
      };
      
      // Flash animation frame decrementation
      let fillOpacity = 0.15;
      if (b.flashFrame && b.flashFrame > 0) {
        fillOpacity += (b.flashFrame / 15) * 0.45;
        b.flashFrame--;
      }
      
      const sideFill = b.color.replace('0.8', fillOpacity.toFixed(2));
      const topFill = b.color.replace('0.8', (fillOpacity + 0.15).toFixed(2));
      const strokeColor = b.color;
      
      const drawFace = (pts, fill, stroke) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      };
      
      // Draw side faces
      drawFace([s0, s1, s5, s4], sideFill, strokeColor);
      drawFace([s1, s2, s6, s5], sideFill, strokeColor);
      drawFace([s2, s3, s7, s6], sideFill, strokeColor);
      drawFace([s3, s0, s4, s7], sideFill, strokeColor);
      
      // Draw top face
      drawFace([s4, s5, s6, s7], topFill, strokeColor);
      
      // Label positioning (top center)
      const labelX = (s4.x + s5.x + s6.x + s7.x) / 4;
      const labelY = (s4.y + s5.y + s6.y + s7.y) / 4 - 15;
      
      // Draw anchor pin line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(labelX, labelY + 10);
      ctx.lineTo(labelX, labelY + 18);
      ctx.stroke();
      
      // Draw text bubble
      const labelText = b.name[chatLanguage] || b.name.en;
      ctx.font = "bold 9px Inter, system-ui, sans-serif";
      const textWidth = ctx.measureText(labelText).width;
      
      const padX = 6;
      const padY = 4;
      const capW = textWidth + padX * 2;
      const capH = 12 + padY * 2;
      const capX = labelX - capW / 2;
      const capY = labelY - capH / 2;
      
      ctx.fillStyle = "rgba(10, 15, 30, 0.9)";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(capX, capY, capW, capH, 4);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, labelX, labelY + 1);
    });

    // 4. Draw Floating Cloud wireframes above the mountain terrain
    if (show3dClouds) {
      const cz = cloud3dAlt * 0.65; // Altitude scale
      
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

        // Draw cloud circle projected elliptically due to angle
        ctx.beginPath();
        ctx.ellipse(centerX + px, centerY + py - 35, c.r, c.r * 0.5 * cosX, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw an inner volume circle
        ctx.beginPath();
        ctx.ellipse(centerX + px - 10, centerY + py - 40, c.r * 0.6, c.r * 0.3 * cosX, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      });
    }
  }

  // --- Crop Dehazing Images & Parallax layers from single JPG ---
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

    // Clear canvases
    [ctxHazy, ctxClear, ctxParaBg, ctxParaFg].forEach(ctx => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });

    // 1. Draw Hazy Input canvas (left half of dehazing_demo.jpg)
    ctxHazy.drawImage(
      dehazingImg, 
      0, 0, wSrc / 2, hSrc - 60, // Crop out subfigure bottom label coordinates
      0, 0, canvasHazy.width, canvasHazy.height
    );

    // 2. Draw Dehazed Recovery canvas (right half of dehazing_demo.jpg)
    ctxClear.drawImage(
      dehazingImg, 
      wSrc / 2, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasClear.width, canvasClear.height
    );

    // 3. Draw Parallax Background canvas (Dehazed building, right half)
    ctxParaBg.drawImage(
      dehazingImg, 
      wSrc / 2, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasParaBg.width, canvasParaBg.height
    );

    // 4. Draw Parallax Foreground canvas (Procedural branches & foliage overlay)
    const wDest = canvasParaFg.width;
    const hDest = canvasParaFg.height;

    // Draw main foliage branches in front of the building
    ctxParaFg.strokeStyle = '#052e16'; // Deep bark green
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

    // Draw leaf groupings (similar green clusters)
    const foliageCluster = [
      {x: wDest * 0.12, y: hDest * 0.2, r: 20},
      {x: wDest * 0.22, y: hDest * 0.29, r: 26},
      {x: wDest * 0.18, y: hDest * 0.42, r: 22},
      {x: wDest * 0.14, y: hDest * 0.62, r: 28},
      {x: wDest * 0.24, y: hDest * 0.52, r: 18},
      {x: wDest * 0.31, y: hDest * 0.56, r: 20},
      {x: wDest * 0.05, y: hDest * 0.32, r: 24},
      // Hanging branch from top
      {x: wDest * 0.42, y: hDest * 0.08, r: 16},
      {x: wDest * 0.55, y: hDest * 0.05, r: 22},
      {x: wDest * 0.68, y: hDest * 0.14, r: 18}
    ];

    foliageCluster.forEach(l => {
      // Dark base leaf shadow
      ctxParaFg.fillStyle = '#14532d';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctxParaFg.fill();

      // Bright leaf highlight overlay
      ctxParaFg.fillStyle = '#22c55e';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x - l.r * 0.2, l.y - l.r * 0.2, l.r * 0.65, 0, Math.PI * 2);
      ctxParaFg.fill();
      
      // Top leaf details
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

  // ==========================================================================
  // Civic Companion Chat Logic & Event Handlers
  // ==========================================================================

  // DOM Elements for Civic Chat
  const civicChatFab = document.getElementById('civic-chat-fab');
  const civicChatWindow = document.getElementById('civic-chat-window');
  const civicChatClose = document.getElementById('civic-chat-close');
  const civicChatMessages = document.getElementById('civic-chat-messages');
  const civicChatInput = document.getElementById('civic-chat-input');
  const civicChatForm = document.getElementById('civic-chat-form');
  const civicChatTyping = document.getElementById('civic-chat-typing');
  const civicTypingText = document.getElementById('civic-typing-text');
  const civicCompanionTitle = document.getElementById('civic-companion-title');
  const civicStatus = document.getElementById('civic-status');

  const langBtnEn = document.getElementById('lang-btn-en');
  const langBtnHi = document.getElementById('lang-btn-hi');
  const langBtnTa = document.getElementById('lang-btn-ta');

  // Toggle Panel Open/Close
  function openChat() {
    chatIsOpen = true;
    if (civicChatWindow) {
      civicChatWindow.classList.remove('hidden');
      // Force reflow for transition
      civicChatWindow.offsetHeight;
      civicChatWindow.classList.remove('scale-95', 'opacity-0');
      civicChatWindow.classList.add('scale-100', 'opacity-100');
    }
  }

  function closeChat() {
    chatIsOpen = false;
    if (civicChatWindow) {
      civicChatWindow.classList.remove('scale-100', 'opacity-100');
      civicChatWindow.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => {
      if (!chatIsOpen && civicChatWindow) {
        civicChatWindow.classList.add('hidden');
      }
    }, 300);
  }

  if (civicChatFab) {
    civicChatFab.addEventListener('click', () => {
      if (chatIsOpen) closeChat();
      else openChat();
    });
  }

  if (civicChatClose) {
    civicChatClose.addEventListener('click', closeChat);
  }

  // Set Language UI Updates
  function setLanguage(lang) {
    chatLanguage = lang;
    
    // Highlight active button
    if (langBtnEn && langBtnHi && langBtnTa) {
      [langBtnEn, langBtnHi, langBtnTa].forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
          btn.className = "px-2 py-1 rounded-md transition-all duration-200 cursor-pointer bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold";
        } else {
          btn.className = "px-2 py-1 rounded-md transition-all duration-200 cursor-pointer hover:text-slate-200 font-bold";
        }
      });
    }

    // Update static labels
    const t = chatTranslations[lang];
    if (civicCompanionTitle) civicCompanionTitle.innerText = t.title;
    if (civicStatus) civicStatus.innerText = t.status;
    if (civicChatInput) civicChatInput.placeholder = t.placeholder;
    if (civicTypingText) civicTypingText.innerText = t.thinking;

    // Reset conversation history with welcome message in chosen language
    chatMessages.length = 0;
    if (civicChatMessages) {
      civicChatMessages.innerHTML = '';
      addBotMessage(t.welcome);
    }
  }

  if (langBtnEn) langBtnEn.addEventListener('click', (e) => { e.stopPropagation(); setLanguage('en'); });
  if (langBtnHi) langBtnHi.addEventListener('click', (e) => { e.stopPropagation(); setLanguage('hi'); });
  if (langBtnTa) langBtnTa.addEventListener('click', (e) => { e.stopPropagation(); setLanguage('ta'); });

  // Message adding helpers
  function addUserMessage(text) {
    chatMessages.push({ sender: 'user', text });
    
    if (civicChatMessages) {
      const msgDiv = document.createElement('div');
      msgDiv.className = "flex items-start justify-end space-x-2.5 max-w-[85%] ml-auto";
      msgDiv.innerHTML = `
        <div class="bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-[11px] text-slate-100 leading-relaxed shadow-md break-words">
          ${text}
        </div>
      `;
      civicChatMessages.appendChild(msgDiv);
      civicChatMessages.scrollTop = civicChatMessages.scrollHeight;
    }
  }

  // Make addBotMessage global so it can be called from outside
  window.addBotMessage = function(text) {
    chatMessages.push({ sender: 'bot', text });
    
    if (civicChatMessages) {
      const msgDiv = document.createElement('div');
      msgDiv.className = "flex items-start space-x-2.5 max-w-[85%] animate-fade-in";
      msgDiv.innerHTML = `
        <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25"></path>
          </svg>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-[11px] text-slate-200 leading-relaxed shadow-md break-words">
          ${text}
        </div>
      `;
      civicChatMessages.appendChild(msgDiv);
      civicChatMessages.scrollTop = civicChatMessages.scrollHeight;
    }
  }
  
  const addBotMessage = window.addBotMessage;

  // Submit form handler
  if (civicChatForm) {
    civicChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!civicChatInput) return;
      const query = civicChatInput.value.trim();
      if (!query) return;

      addUserMessage(query);
      civicChatInput.value = '';

      // Trigger typing / loading state
      if (civicChatTyping) {
        civicChatTyping.classList.remove('hidden');
      }
      if (civicChatMessages) {
        civicChatMessages.scrollTop = civicChatMessages.scrollHeight;
      }

      setTimeout(() => {
        if (civicChatTyping) {
          civicChatTyping.classList.add('hidden');
        }
        
        // Determine reply
        let reply = '';
        const t = chatTranslations[chatLanguage];
        
        // Simple logic to match buildings in active query
        let matchedBuilding = null;
        const qLower = query.toLowerCase();
        
        if (qLower.includes('hall') || query.includes('नगर') || query.includes('மண்டபம்')) {
          matchedBuilding = "City Hall";
        } else if (qLower.includes('power') || query.includes('बिजली') || query.includes('மின்')) {
          matchedBuilding = "Power Station";
        } else if (qLower.includes('water') || query.includes('जल') || query.includes('நீர்')) {
          matchedBuilding = "Water Treatment Facility";
        }

        if (matchedBuilding) {
          reply = t.buildingReplies[matchedBuilding];
        } else {
          reply = t.defaultReply;
        }

        addBotMessage(reply);
      }, 1200);
    });
  }

  // Init welcome message on load
  setLanguage('en');

  // Trigger visual flash for a building on canvas
  function triggerBuildingFlash(b) {
    b.flashFrame = 15; // Set flash animation duration in frames
  }

  // --- Initial Setup Execution ---
  // Run on start
  setTimeout(() => {
    resizeCanvases();
    updateQuantitativeMetrics();
    initThreeDeeTab();
    openChat();
  }, 200);

});
