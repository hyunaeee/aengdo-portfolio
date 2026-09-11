/* The identity lives in the portable 3D screen; the still and HTML remain usable without WebGL. */
(() => {
 'use strict';
 const viewer = document.querySelector('#studio-model');
 if (!viewer) return;
 const stage = viewer.closest('.studio-stage');
 const controls = document.querySelector('.studio-controls');
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
 document.querySelector('#studio-reset').addEventListener('click', () => {
  viewer.cameraOrbit = '18deg 67deg 84%';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) viewer.jumpCameraToGoal();
 });
 import('./vendor/model-viewer.min.js').then(() => {
  // Keep the small screen lettering sharp after the adaptive frame-rate check.
  customElements.get('model-viewer').minimumRenderScale = 1;
 }).catch(fallback);
})();
