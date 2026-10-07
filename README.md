# Nobreak Labs - Visualizers

브라우저에서 실행하는 교육용 시각화 도구 모음입니다.

## 시각화 도구

- [Load Balancer](load-balancer/) — 로드밸런싱 알고리즘과 요청 흐름 시뮬레이터
- [Kubernetes Architecture](kubernetes/) — 구성요소를 클릭하거나 방향키로 넘기는 아키텍처 시각화
- [Network Formats](network-formats/) — Ethernet부터 HTTP까지 프로토콜 구조와 주요 메시지 형식
- [GitHub 만화 교실](github-comics/) — 만화와 체험으로 배우는 커밋, 브랜치, PR과 충돌 해결 및 개발팀의 코드 협업 흐름

## 공통 스타일 관리

`assets/css/common.css`에 다크·라이트 색상, 글꼴, 기본 규칙을 모읍니다. 각 페이지는 공통 CSS를 먼저 불러오고, 해당 도구의 전용 CSS를 뒤에 불러옵니다. 기본값은 라이트 모드이며, 우상단 토글의 선택은 `assets/js/theme.js`가 브라우저에 저장하여 페이지 간 공유합니다.

```html
<link rel="stylesheet" href="../assets/css/common.css" />
<link rel="stylesheet" href="style.css" />
```

위 경로는 루트 아래 도구 디렉터리의 `index.html`을 기준으로 합니다. 루트 페이지는 `assets/css/common.css`를 사용합니다. 각 도구의 동작 코드는 해당 도구 디렉터리에 둡니다.
