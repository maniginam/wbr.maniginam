// js/hero/roads.js
// Road network SVG data for East/West Baton Rouge Parish
// ViewBox: 900x500 (stylized, not geographically accurate)

window.HeroRoads = (function () {
  var ROADS = [
    { id: 'rd-i10', label: 'I-10 E/W', d: 'M 0 260 Q 200 250, 400 240 Q 550 235, 700 250 Q 800 258, 900 265', type: 'interstate', stroke: '#b388ff', width: 2.5, opacity: 0.6, labelOffset: '15%', fontSize: 9, fontWeight: 600, letterSpacing: 3, traffic: 'mixed', count: 25 },
    { id: 'rd-i12', label: 'I-12 E', d: 'M 480 240 Q 550 180, 650 140 Q 750 110, 900 90', type: 'interstate', stroke: '#b388ff', width: 2, opacity: 0.5, labelOffset: '35%', fontSize: 8, fontWeight: 600, letterSpacing: 2, traffic: 'flowing', count: 15 },
    { id: 'rd-i110', label: 'I-110 N/S', d: 'M 400 240 Q 395 180, 390 120 Q 388 80, 385 20', type: 'interstate', stroke: '#b388ff', width: 2, opacity: 0.5, labelOffset: '30%', fontSize: 8, fontWeight: 600, letterSpacing: 2, traffic: 'moderate', count: 12 },
    { id: 'rd-airline', label: 'Airline Hwy N/S', d: 'M 300 400 Q 370 320, 410 250 Q 450 190, 500 120', type: 'local', stroke: '#9e9e9e', width: 1.2, opacity: 0.4, labelOffset: '20%', fontSize: 7, fontWeight: 400, letterSpacing: 1.5, traffic: 'moderate', count: 10 },
    { id: 'rd-florida', label: 'Florida Blvd E/W', d: 'M 200 230 Q 350 225, 500 220 Q 650 218, 780 215', type: 'local', stroke: '#9e9e9e', width: 1.2, opacity: 0.4, labelOffset: '25%', fontSize: 7, fontWeight: 400, letterSpacing: 1.5, traffic: 'congested', count: 14 },
    { id: 'rd-perkins', label: 'Perkins Rd E/W', d: 'M 350 300 Q 500 290, 650 285 Q 750 280, 850 278', type: 'local', stroke: '#9e9e9e', width: 1, opacity: 0.3, labelOffset: '20%', fontSize: 6.5, fontWeight: 400, letterSpacing: 1, traffic: 'flowing', count: 8 },
    { id: 'rd-siegen', label: 'Siegen Ln N/S', d: 'M 600 180 Q 610 250, 620 320 Q 628 380, 635 460', type: 'local', stroke: '#9e9e9e', width: 1, opacity: 0.3, labelOffset: '15%', fontSize: 6.5, fontWeight: 400, letterSpacing: 1, traffic: 'flowing', count: 7 },
    { id: 'rd-nicholson', label: 'Nicholson Dr N/S', d: 'M 320 240 Q 335 310, 350 380 Q 360 430, 370 500', type: 'local', stroke: '#9e9e9e', width: 1, opacity: 0.3, labelOffset: '15%', fontSize: 6.5, fontWeight: 400, letterSpacing: 1, traffic: 'moderate', count: 7 },
    { id: 'rd-coursey', label: 'Coursey Blvd E/W', d: 'M 350 170 Q 500 165, 650 160 Q 750 158, 850 155', type: 'local', stroke: '#9e9e9e', width: 1, opacity: 0.3, labelOffset: '20%', fontSize: 6.5, fontWeight: 400, letterSpacing: 1, traffic: 'flowing', count: 8 },
    { id: 'rd-westbr', label: 'Port Allen', d: 'M 0 300 Q 80 290, 160 275 Q 220 265, 280 280', type: 'local', stroke: '#9e9e9e', width: 1.2, opacity: 0.3, labelOffset: '15%', fontSize: 7, fontWeight: 400, letterSpacing: 1.5, traffic: 'flowing', count: 6 },
    { id: 'rd-bridge', label: 'Huey Long E/W', d: 'M 280 280 Q 320 260, 400 240', type: 'bridge', stroke: '#9e9e9e', width: 1.5, opacity: 0.4, labelOffset: '5%', fontSize: 6, fontWeight: 400, letterSpacing: 2, labelFill: 'rgba(255,204,2,0.4)', traffic: 'congested', count: 8 }
  ];

  // Non-labeled paths (Mississippi River, connecting roads)
  var EXTRAS = [
    { d: 'M 150 500 Q 200 400, 260 310 Q 300 250, 330 180 Q 350 130, 360 20', stroke: 'rgba(255,204,2,0.3)', width: 3, opacity: 0.3, dasharray: '8 6' },
    { d: 'M 100 200 Q 150 240, 200 270 Q 240 280, 280 280', stroke: '#9e9e9e', width: 1, opacity: 0.25 }
  ];

  // Area labels
  var AREAS = [
    { text: 'WEST BR', x: 100, y: 340, fontSize: 10, fill: '#9e9e9e', opacity: 0.2, letterSpacing: 3, fontWeight: 300 },
    { text: 'EAST BR', x: 500, y: 310, fontSize: 10, fill: '#9e9e9e', opacity: 0.2, letterSpacing: 3, fontWeight: 300 },
    { text: 'MISSISSIPPI', x: 220, y: 200, fontSize: 8, fill: 'rgba(255,204,2,0.15)', letterSpacing: 6, fontWeight: 300 }
  ];

  // Control points for traffic particle interpolation (same paths as SVG but as arrays)
  var TRAFFIC_PATHS = [
    { points: [[0,260],[200,250],[400,240],[550,235],[700,250],[900,265]], traffic: 'mixed', weight: 2.5, count: 25 },
    { points: [[480,240],[550,180],[650,140],[750,110],[900,90]], traffic: 'flowing', weight: 2, count: 15 },
    { points: [[400,240],[395,180],[390,120],[388,80],[385,20]], traffic: 'moderate', weight: 2, count: 12 },
    { points: [[300,400],[370,320],[410,250],[450,190],[500,120]], traffic: 'moderate', weight: 1.5, count: 10 },
    { points: [[200,230],[350,225],[500,220],[650,218],[780,215]], traffic: 'congested', weight: 1.5, count: 14 },
    { points: [[350,300],[500,290],[650,285],[850,278]], traffic: 'flowing', weight: 1, count: 8 },
    { points: [[600,180],[610,250],[620,320],[635,460]], traffic: 'flowing', weight: 1, count: 7 },
    { points: [[320,240],[335,310],[350,380],[370,500]], traffic: 'moderate', weight: 1, count: 7 },
    { points: [[350,170],[500,165],[650,160],[850,155]], traffic: 'flowing', weight: 1, count: 8 },
    { points: [[0,300],[80,290],[160,275],[220,265],[280,280]], traffic: 'flowing', weight: 1, count: 6 },
    { points: [[280,280],[320,260],[400,240]], traffic: 'congested', weight: 1.5, count: 8 }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function buildSVG(container) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 900 500');
    svg.setAttribute('preserveAspectRatio', 'none');

    // Road paths
    ROADS.forEach(function (r) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.id = r.id;
      path.setAttribute('d', r.d);
      path.setAttribute('stroke', r.stroke);
      path.setAttribute('stroke-width', r.width);
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', r.opacity);
      svg.appendChild(path);
    });

    // Extra paths (river, connectors)
    EXTRAS.forEach(function (e) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', e.d);
      path.setAttribute('stroke', e.stroke);
      path.setAttribute('stroke-width', e.width);
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', e.opacity);
      if (e.dasharray) path.setAttribute('stroke-dasharray', e.dasharray);
      svg.appendChild(path);
    });

    // Road labels
    ROADS.forEach(function (r) {
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('font-family', 'Inter');
      text.setAttribute('font-size', r.fontSize);
      text.setAttribute('fill', r.labelFill || r.stroke);
      text.setAttribute('opacity', r.type === 'interstate' ? 0.55 : (r.type === 'bridge' ? 1 : 0.4));
      if (r.fontWeight) text.setAttribute('font-weight', r.fontWeight);
      text.setAttribute('letter-spacing', r.letterSpacing);
      var tp = document.createElementNS(SVG_NS, 'textPath');
      tp.setAttribute('href', '#' + r.id);
      tp.setAttribute('startOffset', r.labelOffset);
      tp.textContent = r.label;
      text.appendChild(tp);
      svg.appendChild(text);
    });

    // Area labels
    AREAS.forEach(function (a) {
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', a.x);
      text.setAttribute('y', a.y);
      text.setAttribute('font-family', 'Inter');
      text.setAttribute('font-size', a.fontSize);
      text.setAttribute('fill', a.fill);
      text.setAttribute('opacity', a.opacity);
      text.setAttribute('letter-spacing', a.letterSpacing);
      text.setAttribute('font-weight', a.fontWeight);
      text.textContent = a.text;
      svg.appendChild(text);
    });

    container.appendChild(svg);
  }

  // Traffic camera locations (approximate positions on the 900x500 viewbox)
  var CAMERAS = [
    { id: 'cam-la415', x: 220, y: 265, label: 'I-10 at LA 415', desc: 'Port Allen connector', stream: 'br-cam-016' },
    { id: 'cam-la1',   x: 160, y: 275, label: 'I-10 at LA 1', desc: 'Port Allen / Brusly exit', stream: 'br-cam-015' },
    { id: 'cam-essen', x: 580, y: 237, label: 'I-10 at Essen Ln', desc: 'Medical corridor', stream: 'br-cam-007' },
    { id: 'cam-bluebonnet', x: 540, y: 238, label: 'I-10 at Bluebonnet', desc: 'Towne Center area', stream: 'br-cam-006' },
    { id: 'cam-nicholson', x: 335, y: 244, label: 'I-10 at Nicholson Dr', desc: 'Near LSU', stream: 'br-cam-014' },
    { id: 'cam-i110',  x: 400, y: 240, label: 'I-10 at I-110', desc: 'Downtown BR interchange', stream: 'br-cam-013' },
    { id: 'cam-washington', x: 420, y: 239, label: 'I-10 at Washington St', desc: 'Capitol area', stream: 'br-cam-012' },
    { id: 'cam-acadian', x: 460, y: 238, label: 'I-10 at Acadian Thwy', desc: 'Mid-city BR', stream: 'br-cam-010' },
    { id: 'cam-college', x: 510, y: 237, label: 'I-10 at College Dr', desc: 'Mall of Louisiana', stream: 'br-cam-008' },
    { id: 'cam-siegen', x: 620, y: 240, label: 'I-10 at Siegen Ln', desc: 'SE Baton Rouge', stream: 'br-cam-005' }
  ];
  var CAM_BASE = 'https://ITSStreamingBR.dotd.la.gov/public/';

  // Shared popup element for camera preview
  var activeHls = null;
  var hideTimer = null;
  var popup = null;

  function getOrCreatePopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.id = 'cam-preview-popup';
    popup.style.cssText = 'position:absolute;z-index:10;display:none;background:rgba(0,0,0,0.92);border:2px solid #22c55e;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.6);width:280px;pointer-events:auto;';
    popup.innerHTML = '<video id="cam-preview-video" muted playsinline style="width:280px;aspect-ratio:16/9;display:block;background:#000;"></video>' +
      '<div id="cam-preview-label" style="padding:6px 10px;color:#fff;font-family:Inter,sans-serif;font-size:11px;"><strong id="cam-preview-title" style="color:#22c55e;"></strong><br><span id="cam-preview-desc" style="color:#aaa;font-size:10px;"></span></div>';
    // Keep popup visible when mouse is over it
    popup.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    popup.addEventListener('mouseleave', function () { hidePopup(); });
    popup.addEventListener('click', function () {
      var camId = popup.getAttribute('data-cam-id');
      hidePopup();
      window.location.href = 'articles/live-traffic-cameras-wbr.html';
    });
    // Append to hero, not SVG
    var hero = document.querySelector('.hero');
    if (hero) hero.appendChild(popup);
    return popup;
  }

  function showPopup(cam, dotEl) {
    clearTimeout(hideTimer);
    var p = getOrCreatePopup();
    var video = document.getElementById('cam-preview-video');

    // Position popup near the dot
    var hero = document.querySelector('.hero');
    var svgEl = document.querySelector('.hero-road-layer svg');
    if (!hero || !svgEl) return;
    var heroRect = hero.getBoundingClientRect();
    var svgRect = svgEl.getBoundingClientRect();
    var scX = svgRect.width / 900;
    var scY = svgRect.height / 500;
    var dotX = svgRect.left - heroRect.left + cam.x * scX;
    var dotY = svgRect.top - heroRect.top + cam.y * scY;

    // Position: prefer right of dot, flip left if near edge
    var left = dotX + 16;
    if (left + 290 > heroRect.width) left = dotX - 296;
    var top = dotY - 60;
    if (top < 0) top = dotY + 16;

    p.style.left = left + 'px';
    p.style.top = top + 'px';
    p.style.display = 'block';
    p.setAttribute('data-cam-id', cam.id);

    document.getElementById('cam-preview-title').textContent = cam.label;
    document.getElementById('cam-preview-desc').textContent = cam.desc;

    // Load HLS stream
    if (activeHls) { activeHls.destroy(); activeHls = null; }
    video.src = '';
    var url = CAM_BASE + cam.stream + '.streams/playlist.m3u8';

    if (window.Hls && Hls.isSupported()) {
      activeHls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 5, maxMaxBufferLength: 10 });
      activeHls.loadSource(url);
      activeHls.attachMedia(video);
      activeHls.on(Hls.Events.MANIFEST_PARSED, function () { video.play().catch(function(){}); });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', function () { video.play().catch(function(){}); }, { once: true });
    }
  }

  function hidePopup() {
    hideTimer = setTimeout(function () {
      if (popup) popup.style.display = 'none';
      if (activeHls) { activeHls.destroy(); activeHls = null; }
      var video = document.getElementById('cam-preview-video');
      if (video) { video.pause(); video.src = ''; }
    }, 300);
  }

  function addCameraDots(svg) {
    var defs = document.createElementNS(SVG_NS, 'defs');
    var filter = document.createElementNS(SVG_NS, 'filter');
    filter.id = 'cam-glow';
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    var blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '3');
    blur.setAttribute('result', 'glow');
    filter.appendChild(blur);
    var merge = document.createElementNS(SVG_NS, 'feMerge');
    var mn1 = document.createElementNS(SVG_NS, 'feMergeNode');
    mn1.setAttribute('in', 'glow');
    var mn2 = document.createElementNS(SVG_NS, 'feMergeNode');
    mn2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mn1);
    merge.appendChild(mn2);
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    var style = document.createElementNS(SVG_NS, 'style');
    style.textContent = '@keyframes cam-pulse { 0%,100% { r: 5; opacity: 0.9; } 50% { r: 7; opacity: 1; } }' +
      '.cam-dot { animation: cam-pulse 2s ease-in-out infinite; cursor: pointer; }' +
      '.cam-dot:hover { r: 9 !important; opacity: 1 !important; }' +
      '.cam-ring { animation: cam-pulse 2s ease-in-out infinite; pointer-events: none; }';
    svg.appendChild(style);

    CAMERAS.forEach(function (cam) {
      var g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'cam-group');

      var ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('cx', cam.x);
      ring.setAttribute('cy', cam.y);
      ring.setAttribute('r', '10');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#22c55e');
      ring.setAttribute('stroke-width', '1');
      ring.setAttribute('opacity', '0.3');
      ring.setAttribute('class', 'cam-ring');
      g.appendChild(ring);

      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', cam.x);
      dot.setAttribute('cy', cam.y);
      dot.setAttribute('r', '5');
      dot.setAttribute('fill', '#22c55e');
      dot.setAttribute('filter', 'url(#cam-glow)');
      dot.setAttribute('class', 'cam-dot');
      dot.setAttribute('data-cam', cam.id);
      g.appendChild(dot);

      dot.addEventListener('mouseenter', function () { showPopup(cam, dot); });
      dot.addEventListener('mouseleave', function () { hidePopup(); });
      dot.addEventListener('click', function () {
        window.location.href = 'articles/live-traffic-cameras-wbr.html';
      });

      svg.appendChild(g);
    });
  }

  return {
    ROADS: ROADS,
    TRAFFIC_PATHS: TRAFFIC_PATHS,
    CAMERAS: CAMERAS,
    buildSVG: buildSVG,
    addCameraDots: addCameraDots
  };
})();
