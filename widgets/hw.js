// ══════════════════════════════════════════════════
//  HARDWARE MONITOR WIDGET
// ══════════════════════════════════════════════════
let lastHW = null;
let hwAlerted = false;

function barColor(pct) {
  if (pct > 85) return '#ff5555';
  if (pct > 70) return '#ffcc44';
  return '#d966ff';
}

function setBar(barId, valId, pct, label) {
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  if (!bar || !val) return;
  bar.style.width = Math.min(pct, 100) + '%';
  bar.style.background = barColor(pct);
  val.textContent = label;
}

function renderHardware(hw) {
  const panel = document.getElementById('hw-panel');
  if (!panel) return;
  panel.classList.add('visible');

  setBar('hw-cpu-bar', 'hw-cpu-val', hw.cpu.load,
    hw.cpu.temp != null ? `${hw.cpu.load}%  ${hw.cpu.temp}°C` : `${hw.cpu.load}%`);

  setBar('hw-ram-bar', 'hw-ram-val', hw.ram.percent,
    `${hw.ram.used}/${hw.ram.total} GB`);

  const gpuRow = document.getElementById('hw-gpu-row');
  if (hw.gpu && hw.gpu.length > 0 && hw.gpu[0].load != null) {
    gpuRow.style.display = 'flex';
    const g = hw.gpu[0];
    setBar('hw-gpu-bar', 'hw-gpu-val', g.load,
      g.temp != null ? `${g.load}%  ${g.temp}°C` : `${g.load}%`);
  } else {
    gpuRow.style.display = 'none';
  }

  if (hw.disk) {
    setBar('hw-disk-bar', 'hw-disk-val', hw.disk.percent,
      `${hw.disk.used}/${hw.disk.total} GB`);
  }
}

function checkHWAlerts(hw) {
  if (hwAlerted) return;
  if (hw.cpu.load > 90) {
    showBubble('Whoa! CPU is maxed out! 🔥 Close some apps?', 4500);
    setMood('surprised', 3500); hwAlerted = true;
    setTimeout(() => hwAlerted = false, 60000);
  } else if (hw.ram.percent > 90) {
    showBubble('RAM is almost full! 😮 Maybe close some tabs?', 4500);
    setMood('surprised', 3500); hwAlerted = true;
    setTimeout(() => hwAlerted = false, 60000);
  } else if (hw.gpu && hw.gpu[0] && hw.gpu[0].temp > 85) {
    showBubble(`GPU is running HOT at ${hw.gpu[0].temp}°C! 🌡️`, 4500);
    setMood('surprised', 3500); hwAlerted = true;
    setTimeout(() => hwAlerted = false, 60000);
  }
}

async function fetchHardware() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${BRIDGE_URL}/hardware`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const hw = await res.json();
      lastHW = hw;
      renderHardware(hw);
      checkHWAlerts(hw);
    }
  } catch { /* bridge not running — panel stays hidden */ }
}

function formatHWMessage(hw) {
  const lines = [`🖥️ Here's your system right now:`];
  lines.push(`CPU: ${hw.cpu.load}%${hw.cpu.temp != null ? ' @ ' + hw.cpu.temp + '°C' : ''}`);
  lines.push(`RAM: ${hw.ram.used} / ${hw.ram.total} GB (${hw.ram.percent}%)`);
  if (hw.gpu && hw.gpu[0]) {
    const g = hw.gpu[0];
    lines.push(`GPU: ${g.name}${g.load != null ? ' — ' + g.load + '%' : ''}${g.temp != null ? ' @ ' + g.temp + '°C' : ''}`);
  }
  if (hw.disk) lines.push(`Disk: ${hw.disk.used} / ${hw.disk.total} GB (${hw.disk.percent}%)`);
  return lines.join('\n');
}

async function handlePCPill() {
  addMessage('user', 'What are my PC stats?');
  sendBtn.disabled = true; setMood('thinking'); showTyping();
  await fetchHardware();
  if (lastHW) {
    const msg = formatHWMessage(lastHW);
    showBubble('Here are your live stats! 🖥️', 4000);
    addMessage('pet', msg);
    setMood('thinking', 4000);
  } else {
    const msg = "I can't see your hardware right now! Start the bridge to enable PC monitoring 🔌";
    showBubble(msg, 4000);
    addMessage('pet', msg);
    setMood('thinking', 3000);
  }
  sendBtn.disabled = false;
}
