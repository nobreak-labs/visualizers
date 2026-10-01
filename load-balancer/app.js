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
      description: '정상 서버의 활성 연결 수를 Weight로 나눈 값을 비교합니다. Weight가 같다면 연결이 가장 적은 서버를 선택하며, 처리 시간이 다를 때 차이가 잘 보입니다.'
    },
    hash: {
      title: 'Client Hash',
      description: '표시된 클라이언트 IP를 해시하여 서버를 선택합니다. 서버 구성이 같으면 같은 IP가 같은 서버로 전달됩니다.'
    }
  };
  const algorithmSlugs = {
    roundrobin: 'round-robin',
    weighted: 'weighted-round-robin',
    leastconn: 'least-connections',
    hash: 'client-hash'
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
    comparisonVisible: false,
    servers: [
      { id: 1, name: 'Server 1', address: '10.0.1.11:80', up: true, weight: 1, processingMs: 1600, active: 0, completed: 0, smoothCurrent: 0 },
      { id: 2, name: 'Server 2', address: '10.0.1.12:80', up: true, weight: 1, processingMs: 1600, active: 0, completed: 0, smoothCurrent: 0 },
      { id: 3, name: 'Server 3', address: '10.0.1.13:80', up: true, weight: 1, processingMs: 1600, active: 0, completed: 0, smoothCurrent: 0 }
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
  const compareBtn = $('#compareBtn');
  const comparisonResults = $('#comparisonResults');
  const mobileFlow = $('#mobileFlow');
  let algorithmInitialized = false;

  function renderServers() {
    if (!serverList.children.length) {
      serverList.innerHTML = state.servers.map(server => `
      <article class="server-card ${server.up ? '' : 'down'} ${server.active ? 'target' : ''}" data-server-id="${server.id}">
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
        <div class="processing-row">
          <label for="processing-${server.id}">처리 시간</label>
          <input id="processing-${server.id}" data-action="processing" data-server-id="${server.id}" type="range" min="800" max="4000" step="400" value="${server.processingMs}">
          <span class="processing-value">${(server.processingMs / 1000).toFixed(1)}s</span>
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
          input.nextElementSibling.textContent = String(server.weight);
          renderConfig();
          renderComparison();
        });
      });
      serverList.querySelectorAll('[data-action="processing"]').forEach(input => {
        input.addEventListener('input', () => {
          getServer(Number(input.dataset.serverId)).processingMs = Number(input.value);
          input.nextElementSibling.textContent = `${(Number(input.value) / 1000).toFixed(1)}s`;
          renderComparison();
        });
      });
    }

    state.servers.forEach(server => {
      const card = serverList.querySelector(`[data-server-id="${server.id}"]`);
      card.classList.toggle('down', !server.up);
      card.classList.toggle('target', server.active > 0);
      const status = card.querySelector('.status-btn');
      status.textContent = server.up ? 'UP' : 'DOWN';
      status.setAttribute('aria-pressed', String(!server.up));
      const [active, completed] = card.querySelectorAll('.server-metrics strong');
      active.textContent = server.active;
      completed.textContent = server.completed;
      const weight = card.querySelector('[data-action="weight"]');
      weight.disabled = !server.up;
      if (Number(weight.value) !== server.weight) weight.value = String(server.weight);
      card.querySelector('.weight-value').textContent = server.weight;
      const processing = card.querySelector('[data-action="processing"]');
      if (Number(processing.value) !== server.processingMs) processing.value = String(server.processingMs);
      card.querySelector('.processing-value').textContent = `${(server.processingMs / 1000).toFixed(1)}s`;
    });
  }

  function getServer(id) { return state.servers.find(s => s.id === id); }
  function healthyServers(servers) { return servers.filter(s => s.up); }

  function toggleServer(id) {
    const server = getServer(id);
    server.up = !server.up;
    server.smoothCurrent = 0;
    renderServers();
    renderStats();
    renderConfig();
    renderComparison();
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

  function chooseServer(clientIp, algorithm = state.algorithm, servers = state.servers, routing = state) {
    const healthy = healthyServers(servers);
    if (!healthy.length) return null;

    if (algorithm === 'roundrobin') {
      const server = healthy[routing.rrIndex % healthy.length];
      routing.rrIndex = (routing.rrIndex + 1) % healthy.length;
      return server;
    }

    if (algorithm === 'weighted') {
      const totalWeight = healthy.reduce((sum, s) => sum + s.weight, 0);
      let best = null;
      for (const server of healthy) {
        server.smoothCurrent += server.weight;
        if (!best || server.smoothCurrent > best.smoothCurrent) best = server;
      }
      best.smoothCurrent -= totalWeight;
      return best;
    }

    if (algorithm === 'leastconn') {
      const minActive = Math.min(...healthy.map(s => s.active / Math.max(s.weight, 1)));
      const tied = healthy.filter(s => Math.abs((s.active / Math.max(s.weight, 1)) - minActive) < 1e-9);
      const server = tied[routing.leastTieIndex % tied.length];
      routing.leastTieIndex++;
      return server;
    }

    if (algorithm === 'hash') {
      const index = hashString(clientIp) % healthy.length;
      return healthy[index];
    }

    return healthy[0];
  }

  function renderComparison() {
    if (!state.comparisonVisible) return;

    const clients = $$('.client-card').map(card => ({ id: card.dataset.client, ip: card.dataset.ip }));
    const rows = Object.entries(algorithms).map(([algorithm, details]) => {
      const servers = state.servers.map(server => ({ ...server, active: 0, smoothCurrent: 0 }));
      const routing = { rrIndex: 0, leastTieIndex: 0 };
      const counts = Object.fromEntries(servers.map(server => [server.id, 0]));
      let inFlight = [];
      const routes = [];

      for (let i = 0; i < 10; i++) {
        const now = i * autoDelay();
        inFlight = inFlight.filter(({ server, finishesAt }) => {
          if (finishesAt > now) return true;
          server.active--;
          return false;
        });
        const client = clients[i % clients.length];
        const server = chooseServer(client.ip, algorithm, servers, routing);
        routes.push(`${client.id}:${server ? `S${server.id}` : '실패'}`);
        if (server) {
          server.active++;
          counts[server.id]++;
          inFlight.push({ server, finishesAt: now + server.processingMs });
        }
      }

      return `<tr><th scope="row">${details.title}</th>${servers.map(server => `<td>${counts[server.id]}</td>`).join('')}<td>${routes.join(' → ')}</td></tr>`;
    });

    comparisonResults.innerHTML = `<table><thead><tr><th scope="col">알고리즘</th>${state.servers.map(server => `<th scope="col">S${server.id}</th>`).join('')}<th scope="col">요청별 배정</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
    comparisonResults.hidden = false;
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

  function sendRequest() {
    const epoch = state.epoch;
    const clientId = state.selectedClient;
    const clientIp = document.querySelector(`.client-card[data-client="${clientId}"]`).dataset.ip;
    const server = chooseServer(clientIp);
    const requestId = ++state.requestSequence;

    if (!server) {
      state.failed++;
      $('#lbStatus').textContent = 'No healthy backend';
      mobileFlow.textContent = `Client ${clientId} → Load Balancer → 요청 실패 (정상 서버 없음)`;
      loadBalancer.classList.add('receiving');
      setTimeout(() => loadBalancer.classList.remove('receiving'), 340);
      renderStats();
      return;
    }

    server.active++;
    renderServers();
    renderStats();
    requestAnimationFrame(drawConnections);

    loadBalancer.classList.add('receiving');
    $('#lbStatus').textContent = `Routing → ${server.name}`;
    mobileFlow.textContent = `Client ${clientId} (${clientIp}) → Load Balancer → ${server.name} 처리 중`;
    setTimeout(() => loadBalancer.classList.remove('receiving'), 340);

    if (window.innerWidth > 650) {
      const from = pathPointFromClient(clientId);
      const lb = lbPoints();
      const to = serverPoint(server.id);
      animatePacket([from, lb.center, to], 600);
    }

    setTimeout(() => {
      if (epoch !== state.epoch) return;
      if (server.active > 0) server.active--;
      server.completed++;
      renderServers();
      renderStats();
      requestAnimationFrame(drawConnections);
      $('#lbStatus').textContent = state.autoRunning ? 'Distributing traffic' : (state.servers.some(s => s.active) ? 'Processing requests' : 'Ready');
      if (requestId === state.requestSequence) mobileFlow.textContent = `${server.name} → Load Balancer → Client ${clientId} 응답 완료`;

      if (window.innerWidth > 650 && server.up) {
        const lb = lbPoints();
        const fromServer = serverPoint(server.id);
        const toClient = pathPointFromClient(clientId);
        animatePacket([fromServer, lb.center, toClient], 620, true);
      }
    }, server.processingMs);
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
      const statusNote = s.up ? '' : '  # 시뮬레이터 상태: DOWN (설정 명령 아님)';
      return `    server web${String(s.id).padStart(2, '0')} ${s.address} check${weight}${statusNote}`;
    }).join('\n');

    $('#haproxyConfig').textContent = `backend web\n    ${balanceLine}\n\n${servers}`;
  }

  function setAlgorithm(name, updateHash = true) {
    if (!algorithms[name]) return;
    state.algorithm = name;
    state.rrIndex = 0;
    state.leastTieIndex = 0;
    state.servers.forEach(s => { s.smoothCurrent = 0; });
    $$('.algo-btn').forEach(btn => {
      const active = btn.dataset.algorithm === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    $('#algorithmTitle').textContent = algorithms[name].title;
    $('#algorithmDescription').textContent = algorithms[name].description;
    renderConfig();
    algorithmInitialized = true;
    if (updateHash) {
      const hash = `#${algorithmSlugs[name]}`;
      if (window.location.hash !== hash) history.pushState(null, '', hash);
    }
  }

  function restoreAlgorithmFromHash() {
    const name = Object.keys(algorithmSlugs).find(key => `#${algorithmSlugs[key]}` === window.location.hash);
    if (!name) {
      history.replaceState(null, '', '#round-robin');
      if (!algorithmInitialized || state.algorithm !== 'roundrobin') setAlgorithm('roundrobin', false);
      return;
    }
    if (!algorithmInitialized || state.algorithm !== name) setAlgorithm(name, false);
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
    state.selectedClient = 'A';
    state.comparisonVisible = false;
    speed.value = '1';
    speedLabel.textContent = '1.0 req/s';
    mobileFlow.textContent = '요청을 보내면 이동 경로가 여기에 표시됩니다.';
    comparisonResults.hidden = true;
    comparisonResults.innerHTML = '';
    $$('.client-card').forEach(btn => {
      const selected = btn.dataset.client === 'A';
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    state.servers.forEach(s => {
      s.up = true; s.weight = 1; s.processingMs = 1600; s.active = 0; s.completed = 0; s.smoothCurrent = 0;
    });
    setAlgorithm('roundrobin');
    packetLayer.innerHTML = '';
    renderServers();
    renderStats();
    renderConfig();
    requestAnimationFrame(drawConnections);
  }

  $$('.algo-btn').forEach(btn => btn.addEventListener('click', () => setAlgorithm(btn.dataset.algorithm)));
  $$('.client-card').forEach(btn => btn.addEventListener('click', () => {
    state.selectedClient = btn.dataset.client;
    $$('.client-card').forEach(x => {
      const selected = x === btn;
      x.classList.toggle('active', selected);
      x.setAttribute('aria-pressed', String(selected));
    });
  }));

  speed.addEventListener('input', () => {
    speedLabel.textContent = `${Number(speed.value).toFixed(1)} req/s`;
    renderComparison();
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
  document.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)
      || event.repeat || event.altKey || event.ctrlKey || event.metaKey
      || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)
      || event.target.isContentEditable) return;
    event.preventDefault();
    sendBtn.click();
  });
  autoBtn.addEventListener('click', () => state.autoRunning ? stopAuto() : startAuto());
  resetBtn.addEventListener('click', reset);
  compareBtn.addEventListener('click', () => {
    state.comparisonVisible = true;
    renderComparison();
  });
  window.addEventListener('resize', () => requestAnimationFrame(drawConnections));
  window.addEventListener('popstate', restoreAlgorithmFromHash);
  window.addEventListener('hashchange', restoreAlgorithmFromHash);

  restoreAlgorithmFromHash();
  renderServers();
  renderStats();
  renderConfig();
  requestAnimationFrame(drawConnections);
})();
