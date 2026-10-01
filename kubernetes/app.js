const definitions = [
  { key: "overview", category: "OVERVIEW", title: "Kubernetes cluster", icon: "K8s", description: "컨트롤 플레인은 API와 클러스터 상태를 관리하고, 워커 노드는 Pod를 실행합니다. 마지막 두 화면에서 etcd를 함께 두는 방식과 분리하는 방식을 비교합니다.", relation: "컨트롤 플레인: 상태 관리 · 워커 노드: Pod 실행" },
  { key: "control-plane-group", category: "CLUSTER AREA", title: "Control plane", icon: "CP", description: "API 서버가 요청을 받고 etcd에 상태를 저장합니다. 스케줄러는 Pod의 노드를 정하고 컨트롤러는 실제 상태를 원하는 상태에 맞춥니다. 클라우드 연동 시 cloud-controller-manager가 추가됩니다.", relation: "API server ↔ etcd · 스케줄러와 컨트롤러 ↔ API server" },
  { key: "worker-nodes-group", category: "CLUSTER AREA", title: "Worker nodes", icon: "NODE", description: "워커 노드는 kubelet과 컨테이너 런타임을 실행해 Pod를 유지합니다. CRI는 kubelet과 런타임의 통신 규격이고, CNI 플러그인은 Pod 네트워크를 구성합니다.", relation: "kubelet → CRI → 런타임 → 컨테이너 · 런타임 → CNI → Pod 네트워크" },
  { key: "kubectl", category: "EXTERNAL CLIENT", title: "kubectl", icon: "CLI", description: "Kubernetes API를 호출해 클러스터 리소스를 조회·생성·수정하는 명령줄 도구입니다.", relation: "kubectl → kube-apiserver" },
  { key: "apiserver", category: "CONTROL PLANE", title: "kube-apiserver", icon: "API", description: "Kubernetes API의 진입점입니다. 요청을 검증하고 클러스터 상태를 etcd에 저장하며, 다른 구성요소가 API를 통해 상태를 읽고 변경하도록 합니다.", relation: "클라이언트 · 스케줄러 · 컨트롤러 · kubelet ↔ API server ↔ etcd" },
  { key: "etcd", category: "CONTROL PLANE", title: "etcd", icon: "DB", description: "API 서버가 사용하는 일관성 있는 키 값 저장소로, 클러스터의 설정과 상태를 보관합니다. HA 구성에서는 멤버 과반의 동의가 필요합니다.", relation: "kube-apiserver ↔ etcd" },
  { key: "scheduler", category: "CONTROL PLANE", title: "kube-scheduler", icon: "↳", description: "API에서 아직 노드가 정해지지 않은 Pod를 찾아 적합한 노드를 선택하고, 그 결과를 API에 기록합니다.", relation: "미배정 Pod 조회 → 노드 선택 → API에 바인딩 기록" },
  { key: "controller", category: "CONTROL PLANE", title: "kube-controller-manager", icon: "◎", description: "여러 컨트롤러를 실행합니다. API의 현재 상태를 관찰하고 원하는 상태에 가까워지도록 변경을 요청합니다.", relation: "API 상태 관찰 → 차이 조정 → API에 반영" },
  { key: "cloud", category: "OPTIONAL · CONTROL PLANE", title: "cloud-controller-manager", icon: "CCM", description: "클라우드 공급자와 연동할 때 클러스터 안에서 실행합니다. 노드·라우트·로드밸런서 관련 정보를 공급자 API와 동기화하며, 클라우드 연동이 없으면 필요하지 않습니다.", relation: "cloud-controller-manager ↔ 외부 cloud provider API" },
  { key: "provider", category: "EXTERNAL", title: "Cloud provider API", icon: "API", description: "클라우드 공급자가 제공하는 외부 API입니다. cloud-controller-manager가 가상 머신·네트워크 경로·로드밸런서 자원을 조회하거나 변경할 때 호출합니다.", relation: "클러스터 내부 cloud-controller-manager ↔ 외부 공급자 API" },
  { key: "kubelet", category: "WORKER NODE", title: "kubelet", icon: "KL", description: "각 노드에서 할당된 Pod 명세를 확인하고 CRI로 런타임에 실행을 요청합니다. Pod 실행 상태도 API 서버에 보고합니다.", relation: "API server ↔ kubelet → CRI → container runtime" },
  { key: "cri", category: "NODE INTERFACE", title: "CRI", icon: "CRI", description: "kubelet과 컨테이너 런타임이 통신하는 표준 gRPC 인터페이스입니다. 그림의 CRI 박스는 별도 데몬이 아닌 두 구성요소 사이의 규격을 뜻합니다.", relation: "kubelet → CRI → container runtime" },
  { key: "runtime", category: "WORKER NODE", title: "Container runtime", icon: "RT", description: "containerd나 CRI-O 같은 런타임은 CRI 요청을 받아 Pod의 컨테이너를 시작·중지하고 상태를 관리합니다. Pod 네트워크 설정에는 CNI 플러그인을 사용합니다.", relation: "kubelet → CRI → runtime → 컨테이너 · runtime → CNI" },
  { key: "cni", category: "NODE INTERFACE", title: "CNI plugin", icon: "CNI", description: "컨테이너 런타임이 호출하는 네트워크 플러그인 규격입니다. 구현체가 Pod의 네트워크 인터페이스와 IP를 설정해 Pod 간 통신을 가능하게 합니다.", relation: "container runtime → CNI plugin → Pod 네트워크" },
  { key: "proxy", category: "OPTIONAL · WORKER NODE", title: "kube-proxy", icon: "PROXY", description: "Service와 EndpointSlice 변경을 감시해 Service 트래픽을 전달할 노드 규칙을 관리합니다. Cilium 같은 CNI가 Service 프록시 대체 기능을 제공하고 이를 활성화한 경우 생략할 수 있습니다. Cilium 설치만으로 자동 생략되지는 않습니다.", relation: "API의 Service·EndpointSlice → kube-proxy → 노드 전달 규칙" },
  { key: "pod", category: "WORKLOAD", title: "Pod", icon: "POD", description: "Kubernetes가 관리하는 가장 작은 배포 단위입니다. 하나 이상의 컨테이너가 네트워크를 공유하고, 설정된 볼륨을 함께 사용할 수 있습니다.", relation: "스케줄러가 노드 지정 → kubelet·런타임이 실행 → CNI가 네트워크 구성" },
  { key: "api-lb", topology: "ha-stacked", category: "HA ENTRY POINT", title: "API load balancer", icon: "LB", description: "세 API 서버 앞에 두는 공통 접속 주소입니다. 클라이언트 연결을 정상인 API 서버 한 곳으로 전달해 인스턴스 하나가 중단돼도 API 접속을 유지합니다.", relation: "kubectl → API load balancer → 정상 kube-apiserver 1개" },
  { key: "ha-stacked", topology: "ha-stacked", category: "HA TOPOLOGY · STACKED ETCD", title: "고가용성 컨트롤 플레인 · 내부 etcd", icon: "HA", description: "API 서버와 etcd 멤버를 같은 노드에 배치해 호스트 수를 줄입니다. 노드 하나가 고장 나면 두 구성요소를 동시에 잃습니다. etcd 3멤버 중 2개가 정족수입니다.", relation: "각 API server ↔ 같은 노드의 etcd · 3멤버 중 2개 정족수" },
  { key: "ha-external", topology: "ha-external", category: "HA TOPOLOGY · EXTERNAL ETCD", title: "고가용성 컨트롤 플레인 · 외부 etcd", icon: "HA", description: "etcd를 별도 노드에 두면 컨트롤 플레인 장애와 자원 경합을 분리하고 전용 디스크를 구성할 수 있습니다. 빠른 디스크 I/O는 두 배치 모두에 중요하며, 노드 3개가 더 필요합니다. 각 API 서버는 etcd 클러스터의 세 엔드포인트에 접근하며, 그림의 1:1 선은 대표 경로입니다.", relation: "API server × 3 ↔ etcd 클러스터의 3개 엔드포인트 · 정족수 2/3" }
];

const officialAssets = {
  overview: "kubernetes", "control-plane-group": "kubernetes",
  "ha-stacked": "kubernetes", "ha-external": "kubernetes",
  apiserver: "api", etcd: "etcd", scheduler: "scheduler",
  controller: "controller-manager", cloud: "cloud-controller-manager",
  kubelet: "kubelet", proxy: "kube-proxy", pod: "pod"
};

const stage = document.getElementById("diagramStage");
const wires = document.getElementById("wires");
const inspector = document.querySelector(".inspector-content");
const progress = document.getElementById("slideProgress");
let topology = "";
let currentSlide = 0;
let connections = [];
let focusedAnchor = null;

const edge = (from, to, kind = "secondary") => ({ from, to, kind });
const nodeEdges = [
  edge("kubelet-a", "cri-a", "primary"), edge("cri-a", "runtime-a", "primary"),
  edge("runtime-a", "cni-a", "primary"), edge("runtime-a", "pod-a1", "primary"),
  edge("runtime-a", "pod-a2"), edge("cni-a", "pod-a1"), edge("cni-a", "pod-a2"),
  edge("kubelet-b", "cri-b"), edge("cri-b", "runtime-b"),
  edge("runtime-b", "cni-b"), edge("runtime-b", "pod-b1"), edge("runtime-b", "pod-b2"),
  edge("cni-b", "pod-b1"), edge("cni-b", "pod-b2")
];

function slides() { return definitions; }
function elementFor(anchor) { return document.querySelector(`[data-anchor="${anchor}"]`); }
function roleFor(anchor) { return elementFor(anchor)?.dataset.component; }

function slideHash(slide, selectedTopology) {
  if (selectedTopology !== "single" && slide.key !== "api-lb") return `#${selectedTopology}`;
  return `#${slide.key}`;
}

function routeFromHash() {
  const parts = window.location.hash.slice(1).split("/");
  if (parts.length > 1 && ["ha-stacked", "ha-external"].includes(parts[0])) {
    const index = slides().findIndex(slide => slide.key === parts[0]);
    return { index, topology: parts[0], hash: `#${parts[0]}` };
  }
  if (parts.length === 1) {
    const index = slides().findIndex(slide => slide.key === parts[0]);
    if (index >= 0) return { index, topology: slides()[index].topology || "single", hash: `#${parts[0]}` };
  }
  return null;
}

function restoreFromHash() {
  const route = routeFromHash();
  if (!route) {
    showSlide(0, false, false, null, false);
    history.replaceState(null, "", "#overview");
    return;
  }
  if (window.location.hash !== route.hash) history.replaceState(null, "", route.hash);
  if (currentSlide === route.index && topology === route.topology && focusedAnchor === null) return;
  applyTopology(route.topology);
  showSlide(route.index, false, true, null, false);
}

function buildConnections() {
  if (topology === "single") return [
    edge("kubectl", "apiserver", "primary"), edge("apiserver", "etcd", "primary"),
    edge("apiserver", "scheduler"), edge("apiserver", "controller"), edge("apiserver", "cloud-single"),
    edge("cloud-single", "provider", "primary"),
    edge("apiserver", "kubelet-a", "primary"), edge("apiserver", "kubelet-b"),
    edge("apiserver", "proxy-a"), edge("apiserver", "proxy-b"), ...nodeEdges
  ];
  const etcdAnchor = i => topology === "ha-stacked" ? `etcd-stack-${i}` : `etcd-${i}`;
  return [
    edge("kubectl", "api-lb", "primary"),
    ...[1, 2, 3].map(i => edge("api-lb", `apiserver-${i}`, "primary")),
    ...[1, 2, 3].flatMap(i => [edge(`apiserver-${i}`, etcdAnchor(i), "primary"),
      edge(`apiserver-${i}`, `scheduler-${i}`), edge(`apiserver-${i}`, `controller-${i}`),
      edge(`apiserver-${i}`, `cloud-${i}`)]),
    edge("cloud-1", "provider", "primary"),
    edge("apiserver-1", "kubelet-a", "primary"), edge("apiserver-2", "kubelet-b"),
    edge("apiserver-1", "proxy-a"), edge("apiserver-2", "proxy-b"), ...nodeEdges,
    edge(etcdAnchor(1), etcdAnchor(2), "peer"), edge(etcdAnchor(2), etcdAnchor(3), "peer")
  ];
}

function visibleConnections() {
  const key = slides()[currentSlide].key;
  if (["overview", "control-plane-group", "worker-nodes-group"].includes(key)) return [];
  if (key === "apiserver") {
    if (topology !== "single") {
      const api = focusedAnchor?.startsWith("apiserver-") ? focusedAnchor : "apiserver-1";
      const worker = api === "apiserver-1" ? "kubelet-a" : api === "apiserver-2" ? "kubelet-b" : null;
      const proxy = api === "apiserver-1" ? "proxy-a" : api === "apiserver-2" ? "proxy-b" : null;
      return connections.filter(connection => connection.from === "api-lb" && connection.to === api
        || connection.from === api && (/^(etcd|scheduler|controller|cloud)/.test(connection.to)
          || connection.to === worker || connection.to === proxy));
    }
    return connections.filter(connection => connection.from === "kubectl"
      || connection.from === "apiserver" && (/^(etcd|scheduler|controller|cloud)/.test(connection.to)
        || /^(kubelet|proxy)-/.test(connection.to)));
  }
  if (key === "api-lb") return connections.filter(connection =>
    connection.from === "kubectl" || connection.from === "api-lb");
  if (key === "ha-stacked" || key === "ha-external") return connections.filter(connection =>
    /^apiserver-/.test(connection.from) && /^etcd/.test(connection.to)
    || connection.kind === "peer");
  return connections.filter(connection => roleFor(connection.from) === key || roleFor(connection.to) === key);
}

function highlightConnections() {
  const key = slides()[currentSlide].key;
  wires.querySelectorAll(".wire").forEach(wire => {
    wire.classList.toggle("active", key !== "overview");
    wire.classList.toggle("dimmed", false);
  });
}

function alignEntry() {
  const entry = document.querySelector(".entry-area");
  if (window.innerWidth <= 899) {
    entry.style.transform = "";
    entry.dataset.routeShift = "0";
    return;
  }
  const kubectl = elementFor("kubectl").getBoundingClientRect();
  const apiEntry = elementFor(topology === "single" ? "apiserver" : "api-lb").getBoundingClientRect();
  const previous = Number(entry.dataset.routeShift || 0);
  const shift = previous + apiEntry.top + apiEntry.height / 2 - kubectl.top - kubectl.height / 2;
  if (Math.abs(shift - previous) > .5) {
    entry.style.transform = `translateY(${shift}px)`;
    entry.dataset.routeShift = String(shift);
  }
}

function alignCloudProvider() {
  const cloudArea = document.querySelector(".external-cloud");
  if (topology !== "single" || window.innerWidth <= 899) {
    cloudArea.style.transform = "";
    cloudArea.dataset.routeShift = "0";
    return;
  }
  const cloud = elementFor("cloud-single").getBoundingClientRect();
  const provider = elementFor("provider").getBoundingClientRect();
  const previous = Number(cloudArea.dataset.routeShift || 0);
  const shift = previous + cloud.top + cloud.height / 2 - provider.top - provider.height / 2;
  if (Math.abs(shift - previous) > .5) {
    cloudArea.style.transform = `translateY(${shift}px)`;
    cloudArea.dataset.routeShift = String(shift);
  }
}

function ports(rect) {
  const middleX = rect.left + rect.width / 2;
  const middleY = rect.top + rect.height / 2;
  const offset = 10;
  return [
    { side: "top", point: { x: middleX, y: rect.top }, exit: { x: middleX, y: rect.top - offset } },
    { side: "right", point: { x: rect.right, y: middleY }, exit: { x: rect.right + offset, y: middleY } },
    { side: "bottom", point: { x: middleX, y: rect.bottom }, exit: { x: middleX, y: rect.bottom + offset } },
    { side: "left", point: { x: rect.left, y: middleY }, exit: { x: rect.left - offset, y: middleY } }
  ];
}

function segmentClear(a, b, obstacles) {
  if (a.x === b.x) return obstacles.every(box =>
    a.x <= box.left || a.x >= box.right || Math.max(a.y, b.y) <= box.top || Math.min(a.y, b.y) >= box.bottom);
  if (a.y === b.y) return obstacles.every(box =>
    a.y <= box.top || a.y >= box.bottom || Math.max(a.x, b.x) <= box.left || Math.min(a.x, b.x) >= box.right);
  return false;
}

function compactRoute(points) {
  const route = [];
  for (const point of points) {
    if (route.length && route.at(-1).x === point.x && route.at(-1).y === point.y) continue;
    route.push(point);
    while (route.length > 2) {
      const [a, b, c] = route.slice(-3);
      if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) route.splice(-2, 1);
      else break;
    }
  }
  return route;
}

function routeComfortCost(route, obstacles) {
  let cost = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i];
    for (const box of obstacles) {
      const vertical = a.x === b.x;
      const overlap = vertical
        ? Math.max(0, Math.min(Math.max(a.y, b.y), box.bottom) - Math.max(Math.min(a.y, b.y), box.top))
        : Math.max(0, Math.min(Math.max(a.x, b.x), box.right) - Math.max(Math.min(a.x, b.x), box.left));
      if (!overlap) continue;
      const gap = vertical
        ? Math.max(box.left - a.x, 0, a.x - box.right)
        : Math.max(box.top - a.y, 0, a.y - box.bottom);
      if (gap < 60) cost += overlap * ((60 - gap) / 60) ** 2 * 1.5;
    }
  }
  return cost;
}

function crossingCount(route, existingRoutes) {
  let count = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i];
    for (const existing of existingRoutes) for (let j = 1; j < existing.length; j++) {
      const c = existing[j - 1], d = existing[j];
      if ((a.x === b.x) === (c.x === d.x)) continue;
      const vertical = a.x === b.x ? [a, b] : [c, d];
      const horizontal = a.y === b.y ? [a, b] : [c, d];
      const x = vertical[0].x, y = horizontal[0].y;
      if (x > Math.min(horizontal[0].x, horizontal[1].x) + 1
        && x < Math.max(horizontal[0].x, horizontal[1].x) - 1
        && y > Math.min(vertical[0].y, vertical[1].y) + 1
        && y < Math.max(vertical[0].y, vertical[1].y) - 1) count++;
    }
  }
  return count;
}

function routeBetween(source, target, obstacles, xChannels, yChannels, existingRoutes) {
  let best = null;
  let bestScore = Infinity;
  const otherCards = obstacles.filter(box => box.anchor !== source.anchor && box.anchor !== target.anchor);
  for (const start of ports(source.rect)) for (const end of ports(target.rect)) {
    if (!segmentClear(start.point, start.exit, otherCards) || !segmentClear(end.exit, end.point, otherCards)) continue;
    const a = start.exit, b = end.exit;
    const midpointX = (a.x + b.x) / 2;
    const midpointY = (a.y + b.y) / 2;
    const horizontalGap = start.side === "right" && end.side === "left" && source.rect.right < target.rect.left
      || start.side === "left" && end.side === "right" && target.rect.right < source.rect.left;
    const verticalGap = start.side === "bottom" && end.side === "top" && source.rect.bottom < target.rect.top
      || start.side === "top" && end.side === "bottom" && target.rect.bottom < source.rect.top;
    const xChoices = [...new Set([.2, .35, .5, .65, .8].map(fraction => a.x + (b.x - a.x) * fraction)
      .concat(start.side === "right" ? [30, 60, 90, 150, 240, 320].map(step => a.x + step)
        : start.side === "left" ? [30, 60, 90, 150, 240, 320].map(step => a.x - step) : []))];
    const yChoices = [...new Set([.35, .5, .6, .7, .8].map(fraction => a.y + (b.y - a.y) * fraction)
      .concat(yChannels.filter(y => y > Math.min(a.y, b.y) && y < Math.max(a.y, b.y))
        .sort((first, second) => Math.abs(first - midpointY) - Math.abs(second - midpointY)).slice(0, 4)))];
    const candidates = [
      { kind: "straight", points: [a, b] },
      ...(horizontalGap ? [{ kind: "centered", points: [a, { x: midpointX, y: a.y }, { x: midpointX, y: b.y }, b] }] : []),
      ...(verticalGap ? [{ kind: "centered", points: [a, { x: a.x, y: midpointY }, { x: b.x, y: midpointY }, b] }] : []),
      { kind: "fallback", points: [a, { x: a.x, y: b.y }, b] },
      { kind: "fallback", points: [a, { x: b.x, y: a.y }, b] },
      ...xChannels.map(x => ({ kind: "fallback", points: [a, { x, y: a.y }, { x, y: b.y }, b] })),
      ...yChannels.map(y => ({ kind: "fallback", points: [a, { x: a.x, y }, { x: b.x, y }, b] })),
      ...(Math.abs(a.y - b.y) > 100 && ["left", "right"].includes(start.side)
        ? xChoices.flatMap(x => yChoices.map(y => ({ kind: "fallback", points: [a, { x, y: a.y }, { x, y }, { x: b.x, y }, b] }))) : [])
    ];
    for (const candidate of candidates) {
      const { kind, points } = candidate;
      const route = compactRoute(points);
      if (kind === "straight" && route.length !== 2) continue;
      if (!route.every((point, i) => i === 0 || segmentClear(route[i - 1], point, obstacles))) continue;
      const distance = route.reduce((sum, point, i) => i === 0 ? 0 : sum + Math.abs(point.x - route[i - 1].x) + Math.abs(point.y - route[i - 1].y), 0);
      const bendPenalty = route.slice(1, -1).reduce((sum, point) => {
        const clearance = Math.min(...otherCards.map(box => Math.hypot(
          Math.max(box.left - point.x, 0, point.x - box.right),
          Math.max(box.top - point.y, 0, point.y - box.bottom))));
        return sum + Math.max(0, 30 - clearance) * 2;
      }, 0);
      const preference = kind === "straight" ? -30 : kind === "centered" ? -25 : 0;
      const complete = compactRoute([start.point, ...route, end.point]);
      const score = distance + (route.length - 2) * 14 + bendPenalty + routeComfortCost(route, otherCards)
        + crossingCount(complete, existingRoutes) * 650 + preference;
      if (score < bestScore) { bestScore = score; best = complete; }
    }
  }
  return best;
}

function routeChannels(values) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  return [...sorted.slice(1).map((value, i) => (sorted[i] + value) / 2), ...sorted];
}

function fixedRoute(points, source, target, obstacles) {
  const route = compactRoute(points);
  const otherCards = obstacles.filter(box => box.anchor !== source.anchor && box.anchor !== target.anchor);
  return route.every((point, i) => i === 0 || segmentClear(route[i - 1], point,
    i === 1 || i === route.length - 1 ? otherCards : obstacles)) ? route : null;
}

function relativeBounds(element, frame) {
  const rect = element.getBoundingClientRect();
  return { left: rect.left - frame.left, right: rect.right - frame.left,
    top: rect.top - frame.top, bottom: rect.bottom - frame.top };
}

function cloudProviderRoute(source, target, obstacles, frame) {
  if (target.anchor !== "provider" || roleFor(source.anchor) !== "cloud") return null;
  const start = ports(source.rect)[3], end = ports(target.rect)[1];
  if (topology === "single" && Math.abs(start.point.y - end.point.y) <= .5)
    return fixedRoute([start.point, end.point], source, target, obstacles);
  const cluster = relativeBounds(document.querySelector(".cluster-boundary"), frame);
  const gapX = (cluster.left + target.rect.right) / 2;
  if (topology !== "single") return fixedRoute([start.point, start.exit,
    { x: gapX, y: start.exit.y }, { x: gapX, y: end.exit.y }, end.exit, end.point],
  source, target, obstacles);
  const control = relativeBounds(document.getElementById("singleControlPlane"), frame);
  const workers = relativeBounds(document.querySelector(".node-section-heading"), frame);
  const laneY = (control.bottom + workers.top) / 2;
  return fixedRoute([start.point, start.exit, { x: start.exit.x, y: laneY },
    { x: gapX, y: laneY }, { x: gapX, y: end.exit.y }, end.exit, end.point],
  source, target, obstacles);
}

function haLoadBalancerRoute(source, target, obstacles, frame) {
  if (source.anchor !== "api-lb" || !/^apiserver-[123]$/.test(target.anchor)) return null;
  const members = relativeBounds(document.querySelector(".ha-members"), frame);
  const laneY = (source.rect.bottom + members.top) / 2;
  const start = ports(source.rect)[2], end = ports(target.rect)[0];
  return fixedRoute([start.point, start.exit, { x: start.exit.x, y: laneY },
    { x: end.exit.x, y: laneY }, end.exit, end.point], source, target, obstacles);
}

function singleSchedulerRoute(source, target, obstacles, frame) {
  if (topology !== "single" || source.anchor !== "apiserver" || target.anchor !== "scheduler") return null;
  const etcd = relativeBounds(elementFor("etcd"), frame);
  const heading = relativeBounds(document.querySelector("#singleControlPlane .area-header .area-label"), frame);
  const start = ports(source.rect)[1], end = ports(target.rect)[3];
  const leftX = (source.rect.right + etcd.left) / 2;
  const rightX = (etcd.right + target.rect.left) / 2;
  const laneY = (heading.top + heading.bottom) / 2;
  return fixedRoute([start.point, start.exit, { x: leftX, y: start.exit.y },
    { x: leftX, y: laneY }, { x: rightX, y: laneY },
    { x: rightX, y: end.exit.y }, end.exit, end.point], source, target, obstacles);
}

function haEtcdRoute(source, target, obstacles, frame) {
  if (topology === "single" || !/^apiserver-[123]$/.test(source.anchor)) return null;
  const etcdAnchor = source.anchor.replace("apiserver", topology === "ha-stacked" ? "etcd-stack" : "etcd");
  if (target.anchor !== etcdAnchor) return null;
  const memberElement = elementFor(source.anchor).closest(".ha-member");
  const member = relativeBounds(memberElement, frame);
  const start = ports(source.rect)[1];
  const end = ports(target.rect)[1];
  const laneX = Math.max(member.right - 26, source.rect.right + 14, target.rect.right + 14);
  return fixedRoute([start.point, start.exit, { x: laneX, y: start.exit.y },
    { x: laneX, y: end.exit.y }, end.exit, end.point],
  source, target, obstacles);
}

function etcdPeerRoute(source, target, obstacles, frame) {
  if (roleFor(source.anchor) !== "etcd" || roleFor(target.anchor) !== "etcd") return null;
  const container = relativeBounds(document.querySelector(topology === "ha-stacked"
    ? "#haControlPlane" : "#externalEtcdCluster"), frame);
  const cardsBottom = Math.max(source.rect.bottom, target.rect.bottom);
  const laneY = topology === "ha-external" ? cardsBottom + 14 : (cardsBottom + container.bottom) / 2;
  const start = ports(source.rect)[2], end = ports(target.rect)[2];
  return fixedRoute([start.point, start.exit, { x: start.exit.x, y: laneY },
    { x: end.exit.x, y: laneY }, end.exit, end.point], source, target, obstacles);
}

function bundledPodRoute(source, target, cards, obstacles) {
  if (!/^(runtime|cni)-[ab]$/.test(source.anchor) || !/^pod-[ab][12]$/.test(target.anchor)) return null;
  const node = source.anchor.at(-1);
  const runtime = cards.find(card => card.anchor === `runtime-${node}`);
  const cni = cards.find(card => card.anchor === `cni-${node}`);
  if (!runtime || !cni) return null;
  const channelY = (Math.max(runtime.rect.bottom, cni.rect.bottom) + target.rect.top) / 2;
  const start = ports(source.rect)[2], end = ports(target.rect)[0];
  const points = compactRoute([start.point, start.exit,
    { x: start.exit.x, y: channelY }, { x: end.exit.x, y: channelY }, end.exit, end.point]);
  return fixedRoute(points, source, target, obstacles);
}

function haWorkerRoute(source, target, obstacles, existingRoutes, frame) {
  if (topology === "single" || source.anchor !== "apiserver-2" || !["kubelet-b", "proxy-b"].includes(target.anchor)) return null;
  const bounds = selector => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return { left: rect.left - frame.left, right: rect.right - frame.left,
      top: rect.top - frame.top, bottom: rect.bottom - frame.top };
  };
  const rightMember = bounds(".ha-member:nth-child(3)");
  const etcdCluster = bounds(topology === "ha-external" ? ".etcd-cluster" : ".ha-control-plane");
  const worker = bounds(".worker-node:last-child");
  const balancer = bounds(".ha-load-balancer");
  const rightApi = bounds('[data-anchor="apiserver-3"]');
  const firstLane = (balancer.right + rightApi.left) / 2;
  const outerLane = Math.max(rightMember.right, etcdCluster.right, worker.right) + 14;
  const topLane = (balancer.bottom + rightMember.top) / 2;
  const bottomLane = (etcdCluster.bottom + worker.top) / 2;
  const start = ports(source.rect)[1], end = ports(target.rect)[3];
  const points = compactRoute([start.point, start.exit,
    { x: firstLane, y: start.exit.y }, { x: firstLane, y: topLane },
    { x: outerLane, y: topLane }, { x: outerLane, y: bottomLane },
    { x: end.exit.x, y: bottomLane }, end.exit, end.point]);
  const otherCards = obstacles.filter(box => box.anchor !== source.anchor && box.anchor !== target.anchor);
  for (let i = 1; i < points.length; i++) {
    const blockers = i === 1 || i === points.length - 1 ? otherCards : obstacles;
    if (!segmentClear(points[i - 1], points[i], blockers)) return null;
  }
  return crossingCount(points, existingRoutes) === 0 ? points : null;
}

function singleWorkerBus(edges, cards, obstacles, frame) {
  if (topology !== "single" || !edges.length) return null;
  const source = cards.find(card => card.anchor === "apiserver");
  const nextColumn = cards.find(card => card.anchor === "etcd");
  const targets = edges.map(edge => cards.find(card => card.anchor === edge.to));
  if (!source || !nextColumn || targets.some(target => !target)) return null;
  const heading = relativeBounds(document.querySelector(".node-section-heading"), frame);
  const nodes = relativeBounds(document.querySelector(".worker-node"), frame);
  const laneX = (source.rect.right + nextColumn.rect.left) / 2;
  const laneY = (heading.bottom + nodes.top) / 2;
  const sourcePoint = ports(source.rect)[1].point;
  const targetXs = targets.map(target => ports(target.rect)[0].point.x);
  const parts = [
    [sourcePoint, { x: laneX, y: sourcePoint.y }, { x: laneX, y: laneY }],
    [{ x: Math.min(laneX, ...targetXs), y: laneY }, { x: Math.max(laneX, ...targetXs), y: laneY }],
    ...targets.map(target => [{ x: ports(target.rect)[0].point.x, y: laneY }, ports(target.rect)[0].point])
  ];
  const clear = (a, b, excluded = []) => segmentClear(a, b,
    obstacles.filter(box => !excluded.includes(box.anchor)));
  if (laneY >= Math.min(...targets.map(target => target.rect.top))
    || !clear(parts[0][0], parts[0][1], [source.anchor])
    || !clear(parts[0][1], parts[0][2])
    || !clear(parts[1][0], parts[1][1])
    || targets.some((target, index) => !clear(parts[index + 2][0], parts[index + 2][1], [target.anchor]))) return null;
  return parts;
}

function routeAroundWires(source, target, obstacles, xChannels, yChannels, existingRoutes, frame) {
  const starts = ports(source.rect), ends = ports(target.rect);
  const otherCards = obstacles.filter(box => box.anchor !== source.anchor && box.anchor !== target.anchor);
  const wirePoints = existingRoutes.flat();
  const channelValues = (channels, limit, coordinate) => [...new Set([
    12, limit - 12,
    ...channels.slice(0, (channels.length - 1) / 2),
    ...starts.map(port => port.exit[coordinate]),
    ...ends.map(port => port.exit[coordinate]),
    ...wirePoints.flatMap(point => [point[coordinate] - 12, point[coordinate] + 12])
  ])].filter(value => value >= 8 && value <= limit - 8).sort((a, b) => a - b);
  const xs = channelValues(xChannels, frame.width, "x");
  const ys = channelValues(yChannels, frame.height, "y");
  const nx = xs.length, ny = ys.length;
  const xIndex = new Map(xs.map((value, index) => [value, index]));
  const yIndex = new Map(ys.map((value, index) => [value, index]));
  const nodeAt = point => yIndex.get(point.y) * nx + xIndex.get(point.x);
  const position = node => ({ x: xs[node % nx], y: ys[Math.floor(node / nx)] });
  const clear = new Int8Array(nx * ny);
  const pointClear = node => {
    if (!clear[node]) {
      const point = position(node);
      clear[node] = obstacles.some(box => point.x > box.left && point.x < box.right
        && point.y > box.top && point.y < box.bottom) ? -1 : 1;
    }
    return clear[node] === 1;
  };
  const edgeCosts = new Map();
  const edgeCost = (from, to) => {
    const key = from < to ? `${from}:${to}` : `${to}:${from}`;
    if (edgeCosts.has(key)) return edgeCosts.get(key);
    const a = position(from), b = position(to);
    const cost = !pointClear(to) || !segmentClear(a, b, obstacles) ? Infinity
      : Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
        + routeComfortCost([a, b], otherCards)
        + crossingCount([a, b], existingRoutes) * 100000;
    edgeCosts.set(key, cost);
    return cost;
  };
  const targetPorts = new Map();
  ends.forEach((port, index) => {
    if (segmentClear(port.exit, port.point, otherCards)) targetPorts.set(nodeAt(port.exit), index);
  });
  const distances = new Float64Array(nx * ny * 2).fill(Infinity);
  const previous = new Int32Array(distances.length).fill(-1);
  const origin = new Int8Array(distances.length).fill(-1);
  const heap = [];
  const push = item => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0;) {
      const parent = Math.floor((i - 1) / 2);
      if (heap[parent].cost <= item.cost) break;
      heap[i] = heap[parent];
      i = parent;
      heap[i] = item;
    }
  };
  const pop = () => {
    const first = heap[0], last = heap.pop();
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let child = i * 2 + 1;
        if (child + 1 < heap.length && heap[child + 1].cost < heap[child].cost) child++;
        if (last.cost <= heap[child].cost) break;
        heap[i] = heap[child];
        i = child;
      }
      heap[i] = last;
    }
    return first;
  };
  starts.forEach((port, index) => {
    if (!segmentClear(port.point, port.exit, otherCards)) return;
    const node = nodeAt(port.exit);
    if (!pointClear(node)) return;
    const direction = port.side === "left" || port.side === "right" ? 0 : 1;
    const state = node * 2 + direction;
    distances[state] = 10;
    origin[state] = index;
    push({ cost: 10, state });
  });
  let finish = -1, finishPort = -1, finishCost = Infinity;
  while (heap.length) {
    const { cost, state } = pop();
    if (cost !== distances[state]) continue;
    if (cost >= finishCost) break;
    const node = Math.floor(state / 2), direction = state % 2;
    const destination = targetPorts.get(node);
    if (destination !== undefined) {
      const end = ends[destination];
      const endDirection = end.side === "left" || end.side === "right" ? 0 : 1;
      const total = cost + 10 + (direction === endDirection ? 0 : 14);
      if (total < finishCost) { finish = state; finishPort = destination; finishCost = total; }
    }
    const x = node % nx, y = Math.floor(node / nx);
    for (const [next, nextDirection] of [[x > 0 ? node - 1 : -1, 0], [x < nx - 1 ? node + 1 : -1, 0],
      [y > 0 ? node - nx : -1, 1], [y < ny - 1 ? node + nx : -1, 1]]) {
      if (next < 0) continue;
      const movement = edgeCost(node, next);
      if (!Number.isFinite(movement)) continue;
      const nextState = next * 2 + nextDirection;
      const nextCost = cost + movement + (direction === nextDirection ? 0 : 14);
      if (nextCost >= distances[nextState]) continue;
      distances[nextState] = nextCost;
      previous[nextState] = state;
      origin[nextState] = origin[state];
      push({ cost: nextCost, state: nextState });
    }
  }
  if (finish < 0) return null;
  const route = [];
  for (let state = finish; state >= 0; state = previous[state]) route.push(position(Math.floor(state / 2)));
  route.reverse();
  return compactRoute([starts[origin[finish]].point, ...route, ends[finishPort].point]);
}

function drawConnections() {
  wires.replaceChildren();
  alignEntry();
  alignCloudProvider();
  if (getComputedStyle(wires).display === "none") return;
  const frame = stage.getBoundingClientRect();
  wires.setAttribute("viewBox", `0 0 ${frame.width} ${frame.height}`);
  const cards = [...document.querySelectorAll(".component[data-anchor]")]
    .filter(card => card.getClientRects().length)
    .map(card => {
      const rect = card.getBoundingClientRect();
      return { anchor: card.dataset.anchor, rect: {
        left: rect.left - frame.left, right: rect.right - frame.left,
        top: rect.top - frame.top, bottom: rect.bottom - frame.top,
        width: rect.width, height: rect.height
      } };
    });
  const clearance = 9;
  const obstacles = cards.map(({ anchor, rect }) => ({ anchor,
    left: rect.left - clearance, right: rect.right + clearance,
    top: rect.top - clearance, bottom: rect.bottom + clearance
  }));
  const labels = document.querySelectorAll(".cluster-title > *, .area-header > *, .node-section-heading > *, .node-header > *, .ha-member-heading > *, .etcd-heading > *, .etcd-meta, .ha-etcd-meta");
  for (const label of labels) {
    if (!label.getClientRects().length) continue;
    const rect = label.getBoundingClientRect();
    obstacles.push({ left: rect.left - frame.left - 6, right: rect.right - frame.left + 6,
      top: rect.top - frame.top - 6, bottom: rect.bottom - frame.top + 6 });
  }
  const xChannels = routeChannels(obstacles.flatMap(box => [box.left, box.right]));
  const yChannels = routeChannels(obstacles.flatMap(box => [box.top, box.bottom]));
  const routeAll = ordered => {
    const existingRoutes = [];
    const routed = [];
    let crossings = 0, length = 0;
    for (const connection of ordered) {
      const { from, to } = connection;
      const source = cards.find(card => card.anchor === from);
      const target = cards.find(card => card.anchor === to);
      if (!source || !target) continue;
      let points = cloudProviderRoute(source, target, obstacles, frame)
        || haLoadBalancerRoute(source, target, obstacles, frame)
        || singleSchedulerRoute(source, target, obstacles, frame)
        || haEtcdRoute(source, target, obstacles, frame)
        || (connection.kind === "peer" && etcdPeerRoute(source, target, obstacles, frame))
        || bundledPodRoute(source, target, cards, obstacles)
        || haWorkerRoute(source, target, obstacles, existingRoutes, frame)
        || routeBetween(source, target, obstacles, xChannels, yChannels, existingRoutes);
      if (!points) continue;
      if (crossingCount(points, existingRoutes)) {
        const alternate = routeAroundWires(source, target, obstacles, xChannels, yChannels, existingRoutes, frame);
        if (alternate && crossingCount(alternate, existingRoutes) < crossingCount(points, existingRoutes)) points = alternate;
      }
      crossings += crossingCount(points, existingRoutes);
      length += points.slice(1).reduce((sum, point, index) => sum
        + Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y), 0);
      existingRoutes.push(points);
      routed.push({ connection, points });
    }
    return { routed, crossings, length };
  };
  const group = ({ from, to, kind }) => {
    if (from === "kubectl" || from === "api-lb") return "entry";
    if (kind === "peer") return "peer";
    if (/^(kubelet|cri|runtime|cni)-/.test(from)) return "node";
    if (/^cloud-/.test(from) || /^cloud-/.test(to)) return "cloud";
    if (/^(kubelet|proxy)-/.test(to)) return "worker";
    return "control";
  };
  const displayed = visibleConnections();
  const workerEdges = displayed.filter(({ from, to }) => from === "apiserver" && /^(kubelet|proxy)-[ab]$/.test(to));
  const workerBus = singleWorkerBus(workerEdges, cards, obstacles, frame);
  const routedEdges = workerBus ? displayed.filter(edge => !workerEdges.includes(edge)) : displayed;
  let result = routeAll(routedEdges);
  if (result.crossings) {
    const arrangements = [
      ["entry", "control", "cloud", "worker", "node", "peer"],
      ["entry", "worker", "cloud", "control", "node", "peer"],
      ["entry", "cloud", "worker", "control", "node", "peer"],
      ["entry", "control", "worker", "cloud", "node", "peer"],
      ["entry", "worker", "control", "cloud", "node", "peer"],
      ["entry", "cloud", "control", "peer", "worker", "node"],
      ["entry", "control", "peer", "cloud", "worker", "node"]
    ];
    for (const order of arrangements) {
      const ranked = [...routedEdges].sort((a, b) => order.indexOf(group(a)) - order.indexOf(group(b)));
      const candidate = routeAll(ranked);
      if (candidate.crossings < result.crossings || candidate.crossings === result.crossings && candidate.length < result.length) result = candidate;
      if (result.crossings === 0) break;
    }
  }
  for (const { connection: { from, to, kind }, points } of result.routed) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", points.map((point, i) => `${i ? "L" : "M"} ${point.x} ${point.y}`).join(" "));
    path.setAttribute("class", `wire ${kind}`);
    path.dataset.fromAnchor = from;
    path.dataset.toAnchor = to;
    path.dataset.fromRole = roleFor(from);
    path.dataset.toRole = roleFor(to);
    wires.append(path);
  }
  if (workerBus) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", workerBus.map(points => points.map((point, i) =>
      `${i ? "L" : "M"} ${point.x} ${point.y}`).join(" ")).join(" "));
    path.setAttribute("class", "wire primary worker-bus");
    path.dataset.fromAnchor = "apiserver";
    wires.append(path);
  }
  highlightConnections();
}

let redrawFrame = 0;
function scheduleConnections() {
  if (redrawFrame) return;
  redrawFrame = requestAnimationFrame(() => {
    redrawFrame = 0;
    drawConnections();
  });
}

function showSlide(index, revealInspector = false, preserveTopology = false, anchor = null, updateHash = true) {
  const available = slides();
  currentSlide = Math.max(0, Math.min(index, available.length - 1));
  const slide = available[currentSlide];
  focusedAnchor = anchor;
  applyTopology(preserveTopology ? topology : slide.topology || "single");
  const topologySlide = slide.key === "ha-stacked" || slide.key === "ha-external";
  document.getElementById("stackedEtcdMeta").hidden = slide.key !== "ha-stacked";
  stage.classList.toggle("stacked-mode", slide.key === "ha-stacked");
  stage.classList.toggle("has-selection", slide.key !== "overview" && !topologySlide);
  stage.classList.toggle("topology-focus", topologySlide);
  document.querySelector(".cluster-boundary").classList.toggle("focused-area", slide.key === "overview");
  document.querySelectorAll(".control-plane, .ha-control-plane, .worker-node").forEach(area => {
    const group = area.matches(".worker-node") ? "worker-nodes-group" : "control-plane-group";
    area.classList.toggle("focused-area", slide.key === group || topologySlide && area.matches(".ha-control-plane"));
  });
  document.getElementById("externalEtcdCluster").classList.toggle("focused-area", slide.key === "ha-external");
  document.querySelectorAll("[data-component]").forEach(component => {
    component.disabled = topology !== "single";
    const selected = slide.key === "apiserver" && topology !== "single" && focusedAnchor
      ? component.dataset.anchor === focusedAnchor : component.dataset.component === slide.key;
    component.classList.toggle("selected", selected);
    component.setAttribute("aria-pressed", String(selected));
    const anchor = component.dataset.anchor;
    const related = connections.some(({ from, to }) => (roleFor(from) === slide.key && to === anchor) || (roleFor(to) === slide.key && from === anchor));
    const inGroup = slide.key === "control-plane-group" && !!component.closest(".control-plane, .ha-control-plane")
      || slide.key === "worker-nodes-group" && !!component.closest(".worker-node");
    component.classList.toggle("related", !selected && (related || inGroup));
  });
  document.getElementById("inspectorIndex").textContent = `${String(currentSlide + 1).padStart(2, "0")} / ${String(available.length).padStart(2, "0")}`;
  const iconContainer = document.getElementById("inspectorIcon");
  iconContainer.classList.toggle("word-icon", slide.key === "worker-nodes-group");
  if (officialAssets[slide.key]) {
    const icon = document.createElement("img");
    icon.src = `icons/${officialAssets[slide.key]}.svg`;
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    iconContainer.replaceChildren(icon);
  } else {
    iconContainer.textContent = slide.icon;
  }
  document.getElementById("inspectorCategory").textContent = slide.category;
  document.getElementById("inspector-heading").textContent = slide.title;
  let description = slide.description, relation = slide.relation;
  if (topology !== "single" && slide.key === "etcd") {
    description = topology === "ha-stacked"
      ? "각 컨트롤 플레인 노드에 etcd 멤버를 하나씩 둡니다. 노드 하나가 고장 나면 해당 API 서버와 etcd 멤버를 함께 잃지만, 3멤버 중 2개가 남으면 정족수를 유지합니다."
      : "etcd 3멤버를 컨트롤 플레인과 별도 노드에 둡니다. 두 계층의 장애 영향을 분리하며, etcd 3멤버 중 2개가 정족수입니다.";
    relation = "kube-apiserver × 3 ↔ etcd 클러스터 · 정족수 2/3";
  } else if (topology !== "single" && slide.key === "cloud") {
    description = "클라우드 연동 시 각 컨트롤 플레인에 cloud-controller-manager를 배치할 수 있습니다. 그림의 공급자 API 연결선은 이 관계를 대표해 한 번만 표시합니다.";
    relation = "cloud-controller-manager × 3 ↔ 외부 cloud provider API";
  }
  document.getElementById("inspectorDescription").textContent = description;
  document.getElementById("inspectorRelation").textContent = relation;
  document.getElementById("inspectorHint").textContent = slide.key === "overview" ? "방향키 또는 카드 클릭으로 탐색" : `${slide.title} 선택됨 · 방향키로 다음 화면`;
  inspector.style.animation = "none";
  void inspector.offsetWidth;
  inspector.style.animation = "";
  document.getElementById("prevSlide").disabled = currentSlide === 0;
  document.getElementById("nextSlide").disabled = currentSlide === available.length - 1;
  progress.replaceChildren(...available.map((_, i) => {
    const bar = document.createElement("span");
    bar.className = i === currentSlide ? "current" : i < currentSlide ? "past" : "";
    return bar;
  }));
  highlightConnections();
  scheduleConnections();
  if (updateHash) {
    const hash = slideHash(slide, topology);
    if (window.location.hash !== hash) history.pushState(null, "", hash);
  }
  if (revealInspector && window.innerWidth <= 1150) document.querySelector(".inspector").scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyTopology(next) {
  if (topology === next) return;
  topology = next;
  document.getElementById("singleControlPlane").hidden = next !== "single";
  document.getElementById("haControlPlane").hidden = next === "single";
  document.querySelectorAll(".ha-stacked-etcd").forEach(card => { card.hidden = next !== "ha-stacked"; });
  document.getElementById("externalEtcdCluster").hidden = next !== "ha-external";
  stage.classList.toggle("ha-mode", next !== "single");
  document.getElementById("clusterCount").textContent = next === "single"
    ? "1 CONTROL PLANE · 2 NODES" : "HA CONTROL PLANE · 3 INSTANCES · 3 ETCD MEMBERS";
  document.getElementById("diagramMode").textContent = next === "single" ? "단일 컨트롤 플레인"
    : next === "ha-stacked" ? "HA · 내부 etcd" : "HA · 외부 etcd";
  document.getElementById("haSubtitle").textContent = next === "ha-stacked"
    ? "각 컨트롤 플레인에 etcd 멤버 배치" : "독립 etcd 클러스터를 별도로 배치";
  connections = buildConnections();
  scheduleConnections();
}

document.querySelectorAll("[data-component]").forEach(component => component.addEventListener("click", () => {
  if (topology !== "single") return;
  showSlide(slides().findIndex(slide => slide.key === component.dataset.component), true, false, component.dataset.anchor);
}));
document.getElementById("prevSlide").addEventListener("click", () => showSlide(currentSlide - 1));
document.getElementById("nextSlide").addEventListener("click", () => showSlide(currentSlide + 1));
document.addEventListener("keydown", event => {
  if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); showSlide(currentSlide + 1, true); }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); showSlide(currentSlide - 1, true); }
});
window.addEventListener("resize", scheduleConnections);
window.visualViewport?.addEventListener("resize", scheduleConnections);
window.addEventListener("popstate", restoreFromHash);
window.addEventListener("hashchange", restoreFromHash);
const layoutObserver = new ResizeObserver(scheduleConnections);
document.querySelectorAll("#diagramStage, .component[data-anchor], .cluster-title, .area-header, .node-section-heading, .node-header, .ha-member-heading, .etcd-heading, .etcd-meta, .ha-etcd-meta, .entry-area, .external-cloud").forEach(element => layoutObserver.observe(element));
document.fonts.ready.then(scheduleConnections);
restoreFromHash();
scheduleConnections();
