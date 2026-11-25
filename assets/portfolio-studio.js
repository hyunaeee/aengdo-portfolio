/* The identity lives in the portable 3D screen; the still and HTML remain usable without WebGL. */
(() => {
 'use strict';
 const viewer = document.querySelector('#studio-model');
 if (!viewer) return;
 const stage = viewer.closest('.studio-stage');
 const controls = document.querySelector('.studio-controls');
 const rest = viewer.getAttribute('camera-orbit');
 function fallback() {
  stage.classList.remove('is-ready');
  controls.hidden = true;
  viewer.setAttribute('tabindex', '-1');
 }
 viewer.addEventListener('load', () => {
  stage.classList.add('is-ready');
  controls.hidden = false;
  viewer.removeAttribute('tabindex');
 });
 viewer.addEventListener('error', fallback);
 // Zoom is on buttons only, so the wheel keeps scrolling the page.
 const zoom = (factor) => {
  const o = viewer.getCameraOrbit();
  viewer.cameraOrbit = `${o.theta}rad ${o.phi}rad ${o.radius * factor}m`;
 };
 document.querySelector('#studio-zoom-in').addEventListener('click', () => zoom(0.85));
 document.querySelector('#studio-zoom-out').addEventListener('click', () => zoom(1 / 0.85));
 document.querySelector('#studio-reset').addEventListener('click', () => {
  viewer.cameraOrbit = rest;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) viewer.jumpCameraToGoal();
 });
 import('./vendor/model-viewer.min.js').then(() => {
  // Keep the small screen lettering sharp after the adaptive frame-rate check.
  customElements.get('model-viewer').minimumRenderScale = 1;
 }).catch(fallback);
})();
