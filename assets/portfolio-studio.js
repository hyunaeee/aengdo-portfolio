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
 // Greeting intro: she types with her back turned, swivels round, waves, bows, then fades out.
 // The camera stays straight on and wide through the whole greeting, then moves in on the desk at the same height.
 const avatar = document.querySelector('#studio-avatar');
 const rest = viewer.getAttribute('camera-orbit');
 function intro() {
  if (!avatar || matchMedia('(prefers-reduced-motion: reduce)').matches) { avatar?.remove(); return; }
  const settle = () => { viewer.setAttribute('interpolation-decay', '260'); viewer.cameraOrbit = rest; };
  const sync = () => {
   const o = viewer.getCameraOrbit(), t = viewer.getCameraTarget();
   avatar.cameraTarget = `${t.x}m ${t.y}m ${t.z}m`;
   avatar.cameraOrbit = `${o.theta}rad ${o.phi}rad ${o.radius}m`;
   avatar.fieldOfView = `${viewer.getFieldOfView()}deg`;
   avatar.jumpCameraToGoal();
  };
  let ended = false;
  const done = () => {
   if (ended) return;
   ended = true;
   settle();
   stage.classList.add('avatar-done');
   setTimeout(() => {
    viewer.removeEventListener('camera-change', sync);
    viewer.removeAttribute('interpolation-decay');
    avatar.remove();
   }, 2600);
  };
  viewer.cameraOrbit = '0deg 80deg 72%';
  viewer.jumpCameraToGoal();
  avatar.addEventListener('load', () => {
   sync();
   viewer.addEventListener('camera-change', sync);
   avatar.currentTime = 0;
   avatar.play({ repetitions: 1 });
   requestAnimationFrame(() => stage.classList.add('has-avatar'));
   avatar.addEventListener('finished', done, { once: true });
   setTimeout(done, 20000);
  }, { once: true });
  avatar.addEventListener('error', () => { settle(); avatar.remove(); }, { once: true });
  avatar.src = avatar.dataset.src;
 }
 viewer.addEventListener('load', intro, { once: true });
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
