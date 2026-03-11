// ══════════════════════════════════════════════════
//  CALENDAR WIDGET
//  Shows current month with today highlighted.
//  No API needed — pure JS date math.
// ══════════════════════════════════════════════════

const CAL_DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const CAL_MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

function _buildCalendar(year, month) {
  // month is 0-indexed
  const today     = new Date();
  const isToday   = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMon = new Date(year, month + 1, 0).getDate();

  const grid = document.getElementById('cal-grid');
  const hdr  = document.getElementById('cal-month-year');
  if (!grid || !hdr) return;

  hdr.textContent = CAL_MONTHS[month] + ' ' + year;
  grid.innerHTML  = '';

  // Day-of-week header
  CAL_DAYS.forEach(d => {
    const cell = document.createElement('div');
    cell.className = 'cal-dow';
    cell.textContent = d;
    grid.appendChild(cell);
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day cal-empty';
    grid.appendChild(cell);
  }

  // Day cells
  for (let d = 1; d <= daysInMon; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day' + (isToday(d) ? ' cal-today' : '');
    cell.textContent = d;
    grid.appendChild(cell);
  }
}

function initCalendar() {
  const now = new Date();
  _buildCalendar(now.getFullYear(), now.getMonth());

  // Rebuild at midnight
  const schedMidnight = () => {
    const n = new Date();
    const msUntilMidnight = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    setTimeout(() => {
      const t = new Date();
      _buildCalendar(t.getFullYear(), t.getMonth());
      schedMidnight(); // reschedule for next midnight
    }, msUntilMidnight);
  };
  schedMidnight();
}
