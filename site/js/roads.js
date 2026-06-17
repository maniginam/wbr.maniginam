// js/hero/roads.js
// Geographic road network for the West Baton Rouge / Baton Rouge hero map.
// Source data is real [lon, lat]. A single projection maps it into the
// 900x500 viewBox so roads, camera dots, and traffic particles all share
// one coordinate space — dots stay locked to roads AND land in
// geographically-correct positions.

window.HeroRoads = (function () {
  // Projection bounding box, sized to a 900:500 (1.8) aspect with a
  // longitude cos(lat) correction so shapes are not skewed.
  var LON0 = -91.30, LON1 = -90.85;          // west .. east
  var LAT0 = 30.342, LAT1 = 30.558;          // south .. north
  var VW = 900, VH = 500;

  function project(lon, lat) {
    return {
      x: ((lon - LON0) / (LON1 - LON0)) * VW,
      y: ((LAT1 - lat) / (LAT1 - LAT0)) * VH   // north = top
    };
  }

  function projectPts(geo) {
    return geo.map(function (p) { var q = project(p[0], p[1]); return [q.x, q.y]; });
  }

  // Real-world waypoints (lon, lat). Interstates carry the camera dots;
  // Airline/Florida + the river add recognizable BR context.
  var ROAD_DATA = [
    { id: 'rd-i10', label: 'I-10 E/W', type: 'interstate', stroke: '#b388ff', width: 2.5, opacity: 0.6, labelOffset: '12%', fontSize: 9, fontWeight: 600, letterSpacing: 3, traffic: 'mixed', count: 25,
      geo: [[-91.263,30.452],[-91.224,30.452],[-91.205,30.447],[-91.190,30.443],[-91.180,30.447],[-91.165,30.433],[-91.155,30.427],[-91.133,30.420],[-91.103,30.406],[-91.083,30.394],[-91.052,30.383],[-91.020,30.379],[-90.992,30.360]] },
    { id: 'rd-i12', label: 'I-12 E', type: 'interstate', stroke: '#b388ff', width: 2, opacity: 0.5, labelOffset: '45%', fontSize: 8, fontWeight: 600, letterSpacing: 2, traffic: 'flowing', count: 15,
      geo: [[-91.020,30.379],[-90.998,30.405],[-90.978,30.418],[-90.955,30.430],[-90.925,30.445],[-90.885,30.460],[-90.860,30.468]] },
    { id: 'rd-i110', label: 'I-110 N/S', type: 'interstate', stroke: '#b388ff', width: 2, opacity: 0.5, labelOffset: '40%', fontSize: 8, fontWeight: 600, letterSpacing: 2, traffic: 'moderate', count: 12,
      geo: [[-91.180,30.447],[-91.183,30.480],[-91.182,30.515],[-91.180,30.550]] },
    { id: 'rd-airline', label: 'Airline Hwy', type: 'local', stroke: '#9e9e9e', width: 1.2, opacity: 0.4, labelOffset: '30%', fontSize: 7, fontWeight: 400, letterSpacing: 1.5, traffic: 'moderate', count: 10,
      geo: [[-91.160,30.520],[-91.120,30.470],[-91.080,30.430],[-91.040,30.395],[-91.010,30.385]] },
    { id: 'rd-florida', label: 'Florida Blvd E/W', type: 'local', stroke: '#9e9e9e', width: 1.2, opacity: 0.4, labelOffset: '35%', fontSize: 7, fontWeight: 400, letterSpacing: 1.5, traffic: 'congested', count: 14,
      geo: [[-91.180,30.452],[-91.120,30.450],[-91.040,30.448],[-90.960,30.446]] }
  ];

  // Mississippi River, drawn but unlabeled.
  var EXTRA_DATA = [
    { stroke: 'rgba(255,204,2,0.3)', width: 3, opacity: 0.3, dasharray: '8 6',
      geo: [[-91.210,30.558],[-91.195,30.520],[-91.205,30.488],[-91.190,30.458],[-91.200,30.440],[-91.235,30.408],[-91.212,30.372],[-91.200,30.342]] }
  ];

  // Area labels at real positions.
  var AREA_DATA = [
    { text: 'WEST BR', lon: -91.255, lat: 30.430, fontSize: 10, fill: '#9e9e9e', opacity: 0.2, letterSpacing: 3, fontWeight: 300 },
    { text: 'BATON ROUGE', lon: -91.090, lat: 30.425, fontSize: 10, fill: '#9e9e9e', opacity: 0.2, letterSpacing: 3, fontWeight: 300 },
    { text: 'MISSISSIPPI', lon: -91.245, lat: 30.470, fontSize: 8, fill: 'rgba(255,204,2,0.15)', letterSpacing: 6, fontWeight: 300 }
  ];

  // Camera definitions at real interchange [lon, lat]; exposed projected.
  var CAMERA_DATA = [
    { cam: 'I-10 at LA 1',          stream: 'br-cam-015', desc: 'Port Allen / Brusly exit', lon: -91.224, lat: 30.452 },
    { cam: 'I-10 at LA 415',        stream: 'br-cam-016', desc: 'Port Allen connector',     lon: -91.263, lat: 30.452 },
    { cam: 'I-10 at Nicholson Dr',  stream: 'br-cam-014', desc: 'Near LSU',                 lon: -91.186, lat: 30.434 },
    { cam: 'I-10 at I-110',         stream: 'br-cam-013', desc: 'Downtown BR interchange',  lon: -91.180, lat: 30.447 },
    { cam: 'I-10 at Washington St', stream: 'br-cam-012', desc: 'Capitol area',             lon: -91.165, lat: 30.433 },
    { cam: 'I-10 at Acadian Thwy',  stream: 'br-cam-010', desc: 'Mid-city Baton Rouge',     lon: -91.155, lat: 30.427 },
    { cam: 'I-10 at College Dr',    stream: 'br-cam-008', desc: 'Mall of Louisiana area',   lon: -91.133, lat: 30.420 },
    { cam: 'I-10 at Essen Ln',      stream: 'br-cam-007', desc: 'Medical corridor',         lon: -91.103, lat: 30.406 },
    { cam: 'I-10 at Bluebonnet',    stream: 'br-cam-006', desc: 'Towne Center area',        lon: -91.083, lat: 30.394 },
    { cam: 'I-10 at Siegen Ln',     stream: 'br-cam-005', desc: 'SE Baton Rouge',           lon: -91.052, lat: 30.383 },
    { cam: 'I-12 at I-10 Split',    stream: 'br-cam-025', desc: 'I-10/I-12 interchange',    lon: -91.020, lat: 30.379 },
    { cam: 'I-12 at Airline Hwy',   stream: 'br-cam-026', desc: 'Airline Hwy exit',         lon: -90.998, lat: 30.405 },
    { cam: 'I-12 at Jefferson Hwy', stream: 'br-cam-027', desc: 'Jefferson Hwy area',       lon: -90.978, lat: 30.418 },
    { cam: 'I-12 at Sherwood Forest', stream: 'br-cam-028', desc: 'Sherwood Forest exit',   lon: -90.955, lat: 30.430 },
    { cam: 'I-12 at O\'Neal Ln',    stream: 'br-cam-029', desc: 'O\'Neal Ln exit',          lon: -90.925, lat: 30.445 },
    { cam: 'I-12 at Denham Springs', stream: 'br-cam-030', desc: 'Toward Denham Springs',   lon: -90.885, lat: 30.460 }
  ];

  // Catmull-Rom spline through points -> smooth SVG cubic path.
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M ' + r2(pts[0][0]) + ' ' + r2(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || pts[i + 1];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C ' + r2(c1x) + ' ' + r2(c1y) + ', ' + r2(c2x) + ' ' + r2(c2y) + ', ' + r2(p2[0]) + ' ' + r2(p2[1]);
    }
    return d;
  }

  function r2(n) { return Math.round(n * 100) / 100; }

  // Projected, render-ready structures.
  var ROADS = ROAD_DATA.map(function (r) {
    return { id: r.id, label: r.label, type: r.type, stroke: r.stroke, width: r.width,
             opacity: r.opacity, labelOffset: r.labelOffset, fontSize: r.fontSize,
             fontWeight: r.fontWeight, letterSpacing: r.letterSpacing, labelFill: r.labelFill,
             d: smoothPath(projectPts(r.geo)) };
  });

  var EXTRAS = EXTRA_DATA.map(function (e) {
    return { stroke: e.stroke, width: e.width, opacity: e.opacity, dasharray: e.dasharray, d: smoothPath(projectPts(e.geo)) };
  });

  var AREAS = AREA_DATA.map(function (a) {
    var q = project(a.lon, a.lat);
    return { text: a.text, x: q.x, y: q.y, fontSize: a.fontSize, fill: a.fill, opacity: a.opacity, letterSpacing: a.letterSpacing, fontWeight: a.fontWeight };
  });

  var CAMERAS = CAMERA_DATA.map(function (c) {
    var q = project(c.lon, c.lat);
    return { cam: c.cam, stream: c.stream, desc: c.desc, x: q.x, y: q.y };
  });

  // Traffic particle paths reuse the projected road waypoints.
  var TRAFFIC_PATHS = ROAD_DATA.map(function (r) {
    return { points: projectPts(r.geo), traffic: r.traffic, weight: r.width, count: r.count };
  });

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function buildSVG(container) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
    svg.setAttribute('preserveAspectRatio', 'none');

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

    ROADS.forEach(function (r) {
      var text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('font-family', 'Inter');
      text.setAttribute('font-size', r.fontSize);
      text.setAttribute('fill', r.labelFill || r.stroke);
      text.setAttribute('opacity', r.type === 'interstate' ? 0.55 : 0.4);
      if (r.fontWeight) text.setAttribute('font-weight', r.fontWeight);
      text.setAttribute('letter-spacing', r.letterSpacing);
      var tp = document.createElementNS(SVG_NS, 'textPath');
      tp.setAttribute('href', '#' + r.id);
      tp.setAttribute('startOffset', r.labelOffset);
      tp.textContent = r.label;
      text.appendChild(tp);
      svg.appendChild(text);
    });

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

  return {
    project: project,
    ROADS: ROADS,
    CAMERAS: CAMERAS,
    TRAFFIC_PATHS: TRAFFIC_PATHS,
    buildSVG: buildSVG
  };
})();
