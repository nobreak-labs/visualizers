(() => {
  'use strict';

  const algorithms = {
    roundrobin: {
      title: 'Round Robin',
      description: '정상 서버를 순서대로 선택합니다. 서버의 현재 부하나 처리 시간은 고려하지 않습니다.'
    },
    weighted: {
      title: 'Weighted Round Robin',
      description: '서버별 Weight 비율을 반영하여 요청을 분산합니다. 성능이 좋은 서버에 더 큰 Weight를 줄 수 있습니다.'
    },
    leastconn: {
      title: 'Least Connections',
      description: '현재 처리 중인 연결이 가장 적은 정상 서버를 선택합니다. 요청 처리 시간이 서로 다를 때 차이가 잘 보입니다.'
    },
    hash: {
      title: 'Client Hash',
      description: '클라이언트 식별값을 해시하여 서버를 선택합니다. 서버 구성이 같으면 같은 클라이언트가 같은 서버로 전달됩니다.'
    }
  };

  const state = {
    algorithm: 'roundrobin',
    selectedClient: 'A',
    autoRunning: false,
    autoTimer: null,
    requestSequence: 0,
    rrIndex: 0,
    leastTieIndex: 0,
    failed: 0,
    epoch: 0,
    servers: [
      { id: 1, name: 'Server 1', address: '10.0.1.11:80', up: true, weight: 1, active: 0, completed: 0, smoothCurrent: 0 },
      { id: 2, name: 'Server 2', address: '10.0.1.12:80', up: true, weight: 1, active: 0, completed: 0, smoothCurrent: 0 },
      { id: 3, name: 'Server 3', address: '10.0.1.13:80', up: true, weight: 1, active: 0, completed: 0, smoothCurrent: 0 }
    ]
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const stage = $('#stage');
  const packetLayer = $('#packetLayer');
  const loadBalancer = $('#loadBalancer');
  const serverList = $('#serverList');
  const connections = $('#connections');
  const speed = $('#speed');
  const speedLabel = $('#speedLabel');
  const autoBtn = $('#autoBtn');
  const sendBtn = $('#sendBtn');
  const resetBtn = $('#resetBtn');

  function renderServers() {
    serverList.innerHTML = state.servers.map(server => `
      <article class="server-card ${server.up ? '' : 'down'}" data-server-id="${server.id}">
        <div class="server-top">
          <div class="server-name">
            <span class="server-icon">S${server.id}</span>
            <div><strong>${server.name}</strong><span class="sr-only">${server.address}</span></div>
          </div>
          <button class="status-btn" type="button" data-action="toggle-server" data-server-id="${server.id}" aria-pressed="${!server.up}">${server.up ? 'UP' : 'DOWN'}</button>
        </div>
        <div class="server-metrics">
          <div><span>Active</span><strong>${server.active}</strong></div>
          <div><span>Completed</span><strong>${server.completed}</strong></div>
        </div>
        <div class="weight-row">
          <label for="weight-${server.id}">Weight</label>
          <input id="weight-${server.id}" data-action="weight" data-server-id="${server.id}" type="range" min="1" max="5" step="1" value="${server.weight}" ${server.up ? '' : 'disabled'}>
          <span class="weight-value">${server.weight}</span>
        </div>
      </article>
    `).join('');

    serverList.querySelectorAll('[data-action="toggle-server"]').forEach(btn => {
      btn.addEventListener('click', () => toggleServer(Number(btn.dataset.serverId)));
    });
    serverList.querySelectorAll('[data-action="weight"]').forEach(input => {
      input.addEventListener('input', () => {
        const server = getServer(Number(input.dataset.serverId));
        server.weight = Number(input.value);
        server.smoothCurrent = 0;
        renderServers();
        renderStats();
        renderConfig();
        requestAnimationFrame(drawConnections);
      });
    });
  }

  function getServer(id) { return state.servers.find(s => s.id === id); }
  function healthyServers() { return state.servers.filter(s => s.up); }

  function toggleServer(id) {
    const server = getServer(id);
    server.up = !server.up;
    server.smoothCurrent = 0;
    renderServers();
    renderStats();
    renderConfig();
    requestAnimationFrame(drawConnections);
  }

  function hashString(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function chooseServer(clientId) {
    const healthy = healthyServers();
    if (!healthy.length) return null;

    if (state.algorithm === 'roundrobin') {
      const server = healthy[state.rrIndex % healthy.length];
      state.rrIndex = (state.rrIndex + 1) % Math.max(healthy.length, 1);
      return server;
    }

    if (state.algorithm === 'weighted') {
      const totalWeight = healthy.reduce((sum, s) => sum + s.weight, 0);
      let best = null;
      for (const server of healthy) {
        server.smoothCurrent += server.weight;
        if (!best || server.smoothCurrent > best.smoothCurrent) best = server;
      }
      best.smoothCurrent -= totalWeight;
      return best;
    }

    if (state.algorithm === 'leastconn') {
      const minActive = Math.min(...healthy.map(s => s.active / Math.max(s.weight, 1)));
      const tied = healthy.filter(s => Math.abs((s.active / Math.max(s.weight, 1)) - minActive) < 1e-9);
      const server = tied[state.leastTieIndex % tied.length];
      state.leastTieIndex++;
      return server;
    }

    if (state.algorithm === 'hash') {
      const index = hashString(clientId) % healthy.length;
      return healthy[index];
    }

    return healthy[0];
  }

  function pointFor(el, parentRect) {
    const r = el.getBoundingClientRect();
    return { x: r.left - parentRect.left + r.width / 2, y: r.top - parentRect.top + r.height / 2 };
  }

  function pathPointFromClient(clientId) {
    const client = document.querySelector(`.client-card[data-client="${clientId}"]`);
    const rect = stage.getBoundingClientRect();
    const r = client.getBoundingClientRect();
    return { x: r.right - rect.left, y: r.top - rect.top + r.height / 2 };
  }

  function lbPoints() {
    const rect = stage.getBoundingClientRect();
    const r = loadBalancer.getBoundingClientRect();
    return {
      left: { x: r.left - rect.left, y: r.top - rect.top + r.height / 2 },
      right: { x: r.right - rect.left, y: r.top - rect.top + r.height / 2 },
      center: pointFor(loadBalancer, rect)
    };
  }

  function serverPoint(id) {
    const server = document.querySelector(`.server-card[data-server-id="${id}"]`);
    const rect = stage.getBoundingClientRect();
    const r = server.getBoundingClientRect();
    return { x: r.left - rect.left, y: r.top - rect.top + r.height / 2 };
  }

  function drawConnections() {
    if (window.innerWidth <= 650) return;
    const rect = stage.getBoundingClientRect();
    const lb = lbPoints();
    connections.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    connections.innerHTML = '';

    $$('.client-card').forEach(client => {
      const p = pathPointFromClient(client.dataset.client);
      addLine(p.x, p.y, lb.left.x, lb.left.y, false);
    });
    state.servers.forEach(server => {
      const p = serverPoint(server.id);
      addLine(lb.right.x, lb.right.y, p.x, p.y, !server.up);
    });
  }

  function addLine(x1, y1, x2, y2, down) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', `connection-line${down ? ' down' : ''}`);
    connections.appendChild(line);
  }

  function animatePacket(points, duration, response = false) {
    if (window.innerWidth <= 650 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const packet = document.createElement('span');
      packet.className = `packet${response ? ' response' : ''}`;
      packetLayer.appendChild(packet);
      let index = 0;
      const segmentDuration = duration / Math.max(points.length - 1, 1);

      function move() {
        const p = points[index];
        packet.style.transitionDuration = index === 0 ? '0ms' : `${segmentDuration}ms`;
        packet.style.left = `${p.x}px`;
        packet.style.top = `${p.y}px`;
        if (index === 0) {
          requestAnimationFrame(() => { index++; move(); });
          return;
        }
        if (index < points.length - 1) {
          setTimeout(() => { index++; move(); }, segmentDuration);
        } else {
          setTimeout(() => {
            packet.style.opacity = '0';
            setTimeout(() => { packet.remove(); resolve(); }, 120);
          }, segmentDuration);
        }
      }
      move();
    });
  }

  async function sendRequest() {
    const epoch = state.epoch;
    const clientId = state.selectedClient;
    const server = chooseServer(clientId);
    state.requestSequence++;

    if (!server) {
      state.failed++;
      $('#lbStatus').textContent = 'No healthy backend';
      loadBalancer.classList.add('receiving');
      setTimeout(() => loadBalancer.classList.remove('receiving'), 340);
      renderStats();
      return;
    }

    server.active++;
    renderServers();
    renderStats();
    requestAnimationFrame(drawConnections);

    const targetCard = document.querySelector(`.server-card[data-server-id="${server.id}"]`);
    targetCard?.classList.add('target');
    loadBalancer.classList.add('receiving');
    $('#lbStatus').textContent = `Routing → ${server.name}`;
    setTimeout(() => loadBalancer.classList.remove('receiving'), 340);

    if (window.innerWidth > 650) {
      const from = pathPointFromClient(clientId);
      const lb = lbPoints();
      const to = serverPoint(server.id);
      await animatePacket([from, lb.center, to], 760);
    }

    const processingMs = 1100 + ((state.requestSequence * 977 + server.id * 613) % 3600);
    setTimeout(async () => {
      if (epoch !== state.epoch) return;
      if (server.active > 0) server.active--;
      server.completed++;
      renderServers();
      renderStats();
      requestAnimationFrame(drawConnections);
      const currentCard = document.querySelector(`.server-card[data-server-id="${server.id}"]`);
      currentCard?.classList.remove('target');
      $('#lbStatus').textContent = state.autoRunning ? 'Distributing traffic' : 'Ready';

      if (window.innerWidth > 650 && server.up) {
        const lb = lbPoints();
        const fromServer = serverPoint(server.id);
        const toClient = pathPointFromClient(clientId);
        await animatePacket([fromServer, lb.center, toClient], 620, true);
      }
    }, processingMs);
  }

  function renderStats() {
    const completed = state.servers.reduce((sum, s) => sum + s.completed, 0);
    const active = state.servers.reduce((sum, s) => sum + s.active, 0);
    $('#totalRequests').textContent = completed;
    $('#activeConnections').textContent = active;
    $('#failedRequests').textContent = state.failed;

    const max = Math.max(1, ...state.servers.map(s => s.completed));
    $('#bars').innerHTML = state.servers.map(s => `
      <div class="bar-row">
        <span>${s.name}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(s.completed / max) * 100}%"></div></div>
        <strong>${s.completed}</strong>
      </div>
    `).join('');
  }

  function renderConfig() {
    const balanceLine = {
      roundrobin: 'balance roundrobin',
      weighted: 'balance roundrobin',
      leastconn: 'balance leastconn',
      hash: 'balance source'
    }[state.algorithm];

    const servers = state.servers.map(s => {
      const weight = (state.algorithm === 'weighted' || state.algorithm === 'leastconn') ? ` weight ${s.weight}` : '';
      const disabled = s.up ? '' : '  # simulator: DOWN';
      return `    server web${String(s.id).padStart(2, '0')} ${s.address} check${weight}${disabled}`;
    }).join('\n');

    $('#haproxyConfig').textContent = `backend web\n    ${balanceLine}\n\n${servers}`;
  }

  function setAlgorithm(name) {
    state.algorithm = name;
    state.rrIndex = 0;
    state.leastTieIndex = 0;
    state.servers.forEach(s => { s.smoothCurrent = 0; });
    $$('.algo-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.algorithm === name));
    $('#algorithmTitle').textContent = algorithms[name].title;
    $('#algorithmDescription').textContent = algorithms[name].description;
    renderConfig();
  }

  function autoDelay() { return Math.round(1000 / Number(speed.value)); }

  function startAuto() {
    if (state.autoRunning) return;
    state.autoRunning = true;
    autoBtn.textContent = '■ Stop traffic';
    autoBtn.setAttribute('aria-pressed', 'true');
    $('#lbStatus').textContent = 'Distributing traffic';
    const tick = () => {
      if (!state.autoRunning) return;
      sendRequest();
      state.autoTimer = setTimeout(tick, autoDelay());
    };
    tick();
  }

  function stopAuto() {
    state.autoRunning = false;
    clearTimeout(state.autoTimer);
    state.autoTimer = null;
    autoBtn.textContent = '▶ Start traffic';
    autoBtn.setAttribute('aria-pressed', 'false');
    $('#lbStatus').textContent = 'Ready';
  }

  function reset() {
    stopAuto();
    state.epoch++;
    state.requestSequence = 0;
    state.rrIndex = 0;
    state.leastTieIndex = 0;
    state.failed = 0;
    state.servers.forEach(s => {
      s.up = true; s.weight = 1; s.active = 0; s.completed = 0; s.smoothCurrent = 0;
    });
    packetLayer.innerHTML = '';
    renderServers();
    renderStats();
    renderConfig();
    requestAnimationFrame(drawConnections);
  }

  $$('.algo-btn').forEach(btn => btn.addEventListener('click', () => setAlgorithm(btn.dataset.algorithm)));
  $$('.client-card').forEach(btn => btn.addEventListener('click', () => {
    state.selectedClient = btn.dataset.client;
    $$('.client-card').forEach(x => x.classList.toggle('active', x === btn));
  }));

  speed.addEventListener('input', () => {
    speedLabel.textContent = `${Number(speed.value).toFixed(1)} req/s`;
    if (state.autoRunning) {
      clearTimeout(state.autoTimer);
      state.autoTimer = setTimeout(() => {
        if (state.autoRunning) {
          stopAuto();
          startAuto();
        }
      }, 10);
    }
  });

  sendBtn.addEventListener('click', sendRequest);
  autoBtn.addEventListener('click', () => state.autoRunning ? stopAuto() : startAuto());
  resetBtn.addEventListener('click', reset);
  window.addEventListener('resize', () => requestAnimationFrame(drawConnections));

  renderServers();
  renderStats();
  renderConfig();
  requestAnimationFrame(drawConnections);
})();
