# Nobreak Labs - Visualizers

브라우저에서 실행하는 교육용 시각화 도구 모음입니다.

## 시각화 도구

- [Load Balancer](load-balancer/) — 로드밸런싱 알고리즘과 요청 흐름 시뮬레이터

## 공통 스타일 관리

`assets/css/common.css`에 색상, 글꼴, 기본 규칙을 모읍니다. 각 페이지는 공통 CSS를 먼저 불러오고, 해당 도구의 전용 CSS를 뒤에 불러옵니다.

```html
<link rel="stylesheet" href="../assets/css/common.css" />
<link rel="stylesheet" href="style.css" />
```

위 경로는 루트 아래 도구 디렉터리의 `index.html`을 기준으로 합니다. 루트 페이지는 `assets/css/common.css`를 사용합니다. 공통으로 재사용하는 JavaScript가 생기면 `assets/js/`에 두고, 각 도구의 동작 코드는 도구 디렉터리에 유지하면 됩니다.
