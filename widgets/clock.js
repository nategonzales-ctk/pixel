// ══════════════════════════════════════════════════
//  CLOCK WIDGET
// ══════════════════════════════════════════════════
function updateClock() {
  const n = new Date();
  const h = String(n.getHours()).padStart(2, '0');
  const m = String(n.getMinutes()).padStart(2, '0');
  document.getElementById('clock-time').textContent = h + ':' + m;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('clock-date').textContent =
    days[n.getDay()] + ' · ' + months[n.getMonth()] + ' ' + n.getDate() + ', ' + n.getFullYear();
}
updateClock();
setInterval(updateClock, 1000);
