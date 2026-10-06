(() => {
  const print = document.getElementById('cv-print');
  if (!print) return;
  print.hidden = false;
  print.addEventListener('click', () => window.print());
})();
