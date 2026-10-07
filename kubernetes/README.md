# Kubernetes Architecture

쿠버네티스 컨트롤 플레인과 워커 노드의 관계를 살펴보는 정적 시각화 페이지입니다.

- 첫 화면에 전체 구성도를 표시합니다.
- 우상단 토글로 다크·라이트 모드를 전환합니다. 선택은 다른 시각화 페이지에도 적용됩니다.
- 설명 화면은 클러스터 전체 → 컨트롤 플레인 → 워커 노드 → kubectl 순서로 시작합니다.
- ↑/←는 이전 화면, ↓/→는 다음 화면으로 이동합니다. 화면의 이전/다음 버튼도 사용할 수 있습니다.
- 클러스터 전체, 컨트롤 플레인, 워커 노드 박스의 제목이나 빈 공간을 클릭하면 해당 영역의 설명으로 이동합니다. 영역 제목은 Tab으로 이동한 뒤 Enter 또는 Space로도 선택할 수 있습니다.
- 단일 구성에서 구성요소를 클릭하면 해당 설명 화면으로 바로 이동합니다. HA 구성의 컴포넌트 카드는 선택할 수 없으며, 컨트롤 플레인과 etcd 클러스터의 전체 구조를 보여줍니다.
- 단일 컨트롤 플레인의 설명 화면은 URL의 `#`에 기록됩니다. 예를 들어 `#apiserver` 주소를 직접 열거나 공유할 수 있으며, 새로고침과 브라우저 뒤로/앞으로 이동에도 선택 상태가 복원됩니다. HA 구성은 `#ha-stacked`, `#ha-external` 두 주소만 사용하며, 기존 하위 주소를 열면 해당 HA 기본 화면으로 정리됩니다.
- 각 노드에 kubelet, 선택적 kube-proxy, CRI, 컨테이너 런타임, CNI 플러그인, Pod를 표시합니다. kube-proxy는 CNI 종류만으로 빠지는 것이 아니라 Service 프록시 대체 기능을 활성화했을 때 생략할 수 있습니다.
- 기본 구성요소를 살펴본 뒤 마지막 세 화면에서 API 로드밸런서와 고가용성(HA) 컨트롤 플레인 구성을 설명합니다. HA 구성은 각 컨트롤 플레인 안에 etcd 멤버를 배치하는 형태와 독립된 외부 etcd 클러스터를 두는 형태를 차례로 보여줍니다. 외부 etcd는 장애 영향과 자원 경합을 분리할 수 있지만 추가 노드가 필요하며, 빠른 디스크 I/O는 두 배치 모두에 중요합니다.
- HA 구성의 각 컨트롤 플레인 안에 선택적 cloud-controller-manager를 배치합니다. etcd는 두 형태 모두 3멤버이며 정족수는 2/3입니다.
- 클러스터 바깥의 Cloud provider API와 컨트롤 플레인 안의 cloud-controller-manager를 연결합니다.
- 클러스터 전체, 컨트롤 플레인, 워커 노드 화면에서는 해당 영역의 테두리를 강조하고 통신선은 숨깁니다. 단일 구성의 개별 구성요소 화면에서만 필요한 통신 경로를 표시합니다. kube-apiserver 화면은 대표 관계로 줄입니다.
- 경로는 카드와 제목의 실제 위치를 기준으로 다시 계산하고, 선끼리 교차하거나 카드에 너무 붙는 경로를 피합니다. 단일 구성의 API 서버에서 kubelet과 kube-proxy로 가는 선은 공통 경로에서 갈라져 각 카드 위쪽에 연결됩니다. 각 노드의 두 Pod를 모두 런타임과 CNI 경로에 포함합니다. 외부 etcd 화면에서는 세 API 서버의 대표 선이 각 etcd 카드 오른쪽에 연결되고, etcd 멤버 간 선은 카드 아래로 모읍니다. 실제로는 각 API 서버가 etcd 클러스터의 세 엔드포인트에 접근합니다. 토폴로지 화면에는 API 로드밸런서의 요청 경로 대신 API 서버와 etcd의 대표 연결을 표시합니다.
- 화면 크기, 브라우저 줌, 글꼴 및 카드 크기가 바뀌면 통신선을 다시 계산합니다. 899px 이하에서는 구성도를 세로로 배치하고 통신선은 숨깁니다.
- 좁은 화면에서는 설명 패널이 구성도 아래로 이동합니다.

## 자료 출처

- 아키텍처: [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/), [Cluster Architecture](https://kubernetes.io/docs/concepts/architecture/), [Creating Highly Available Clusters with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/)
- HA 배치와 etcd 성능: [Options for Highly Available Topology](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/), [etcd Hardware recommendations](https://etcd.io/docs/v3.5/op-guide/hardware/)
- Service 프록시: [Virtual IPs and Service Proxies](https://kubernetes.io/docs/reference/networking/virtual-ips/), [Cilium Kubernetes Without kube-proxy](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- 구성요소 SVG: [Kubernetes Community Icons Set](https://github.com/kubernetes/community/tree/main/icons), Apache-2.0 또는 CC-BY-4.0 중 Apache-2.0 조건으로 사용
- Kubernetes 로고 SVG: [CNCF artwork](https://github.com/cncf/artwork/tree/master/projects/kubernetes). Kubernetes 명칭과 로고는 Linux Foundation의 상표입니다.
