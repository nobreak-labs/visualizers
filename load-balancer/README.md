# Load Balancer

강의/교육용으로 만든 정적 로드밸런서 동작 시각화 도구입니다. 브라우저에서 클라이언트 요청이 Load Balancer를 거쳐 백엔드 서버로 전달되는 과정을 확인할 수 있습니다.

## 기능

- Round Robin
- Weighted Round Robin
- Least Connections (활성 연결 수를 Weight로 나눈 값을 비교)
- Client Hash (표시된 IP 기준, HAProxy `balance source` 개념)
- 알고리즘 선택이 URL의 `#round-robin`, `#weighted-round-robin`, `#least-connections`, `#client-hash`에 반영됩니다. 주소를 직접 열거나 북마크할 수 있고, 새로고침과 브라우저 뒤로/앞으로 이동에도 선택한 알고리즘이 복원됩니다. 요청 통계와 서버 상태는 URL에 저장하지 않습니다.
- Client A/B/C 선택
- 서버별 Weight 조절
- 서버별 처리 시간 조절
- 서버 UP/DOWN 전환
- 수동 요청 / 자동 트래픽. 네 방향키를 눌러도 요청을 한 건 보낼 수 있으며, 슬라이더에 초점이 있으면 방향키는 값 조절에 사용됩니다.
- 트래픽 속도 조절
- 동일 요청 10건으로 알고리즘별 분산 결과 비교
- 요청/응답 패킷 애니메이션
- 요청 처리 시간은 화면 크기나 패킷 애니메이션 시간과 독립적으로 적용
- 모바일 화면에서 요청 경로 표시
- 완료 요청 및 Active Connections 통계
- 선택 알고리즘에 대응하는 HAProxy 설정 예시
