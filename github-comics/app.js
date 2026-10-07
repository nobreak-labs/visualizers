(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
  var fig = function (cls, sym) { return '<svg class="fig ' + cls + '" viewBox="0 0 100 120" aria-hidden="true"><use href="#' + sym + '"/></svg>'; };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 내비 ---------- */
  var eps = [['ep1', '1화 왜 필요해?'], ['ep2', '2화 저장·커밋'], ['ep3', '3화 브랜치'], ['ep4', '4화 협업 흐름'], ['ep5', '5화 충돌'], ['ep6', '6화 AI와 함께'], ['ep7', '용어 정리']];
  var nav = $('#nav');
  nav.innerHTML = eps.map(function (e) { return '<button type="button" data-t="' + e[0] + '">' + e[1] + '</button>'; }).join('');
  nav.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var el = document.getElementById(b.dataset.t);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (en) {
        if (en.isIntersecting) {
          $$('button', nav).forEach(function (b) { b.classList.toggle('on', b.dataset.t === en.target.id); });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    eps.forEach(function (e) { var el = document.getElementById(e[0]); if (el) io.observe(el); });
  }

  /* ---------- 1화: 덮어쓰기 vs 깃 ---------- */
  (function () {
    var mode = 'old', done = false;
    var base = ['const serviceName = "team-app";', 'const welcomeMessage = "Helo";', 'const retryCount = 3;', 'const logLevel = "info";'];
    var minji = { 1: 'const welcomeMessage = "Hello";' };
    var junho = { 3: 'const logLevel = "debug";' };
    function li(t, cls, tag) { return '<li' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(t) + (tag ? '<em>' + tag + '</em>' : '') + '</li>'; }
    function render() {
      $('#d1a').innerHTML = base.map(function (t, i) { return minji[i] ? li(minji[i], 'blue', '민지가 고침') : li(t); }).join('');
      $('#d1b').innerHTML = base.map(function (t, i) { return junho[i] ? li(junho[i], 'coral', '준호가 고침') : li(t); }).join('');
      var rows;
      if (!done) rows = base.map(function (t) { return li(t); });
      else if (mode === 'old') rows = base.map(function (t, i) {
        if (i === 1) return li(t, 'lost', '민지의 수정이 사라짐');
        if (i === 3) return li(junho[3], 'coral', '준호 파일이 통째로 덮어씀');
        return li(t);
      });
      else rows = base.map(function (t, i) {
        if (i === 1) return li(minji[1], 'blue', '민지 · 커밋 a1f3c9e');
        if (i === 3) return li(junho[3], 'coral', '준호 · 커밋 7be42d0');
        return li(t);
      });
      $('#d1r').innerHTML = rows.join('');
      $('#d1rt').textContent = mode === 'old' ? '메신저로 공유한 최종 파일' : '깃허브의 main';
      var m = $('#d1msg');
      if (!done) m.innerHTML = mode === 'old' ? '준비됐어요. 민지는 2번째 줄, 준호는 4번째 줄을 고칠 거예요. 버튼을 눌러 보세요.' : '깃허브 모드예요. 같은 상황을 다시 해 볼까요? 버튼을 눌러 보세요.';
      else if (mode === 'old') m.innerHTML = '<b>앗!</b> 준호가 나중에 올린 파일이 통째로 덮어써서 민지의 수정이 사라졌어요. 아무도 눈치채지 못해요.';
      else m.innerHTML = '<b>성공!</b> 깃은 줄 단위로 비교해요. 서로 다른 곳을 고치면 자동으로 합쳐 주고, 누가 뭘 고쳤는지 기록도 남겨요.';
    }
    $$('#d1 .seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.dataset.m; done = false;
        $$('#d1 .seg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
    $('#d1go').addEventListener('click', function () { done = true; render(); });
    $('#d1re').addEventListener('click', function () { done = false; render(); });
    render();
  })();

  /* ---------- 2화: 커밋 타임라인 ---------- */
  (function () {
    var snaps = [
      { h: 'a1f3c9e', m: '프로젝트 초기 구성', d: ['README.md · 프로젝트 소개'] },
      { h: '7be42d0', m: '앱 실행 코드 추가', d: ['README.md · 프로젝트 소개', 'app.js · 앱 실행 코드'] },
      { h: 'c09d5a1', m: '환경 설정 추가', d: ['README.md · 프로젝트 소개', 'app.js · 앱 실행 코드', 'config.js · 환경 설정'] },
      { h: '3f8e7b2', m: '테스트 코드 추가', d: ['README.md · 프로젝트 소개', 'app.js · 앱 실행 코드', 'config.js · 환경 설정', 'app.test.js · 테스트 코드'] },
      { h: 'e51a04c', m: '(실수) 파일 내용 전부 지움', d: [], bad: true }
    ];
    var n = 3, sel = 2;
    function render() {
      $('#d2tl').innerHTML = snaps.slice(0, n).map(function (s, i) {
        return '<button type="button" class="node' + (s.bad ? ' bad' : '') + '" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span class="h">' + s.h + '</span><span class="t">' + esc(s.m) + '</span></button>';
      }).join('');
      var s = snaps[sel];
      $('#d2pt').textContent = '"' + s.m + '" 시점의 프로젝트';
      $('#d2pl').innerHTML = s.d.length ? s.d.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li class="empty">텅 비어 있어요!</li>';
      $('#d2add').disabled = n >= snaps.length;
      $('#d2add').textContent = n >= snaps.length ? '세이브를 다 눌렀어요' : (n === 3 ? '커밋(세이브) 하기: 테스트 추가' : '커밋(세이브) 하기: 실수로 다 지움');
      var msg;
      if (sel === snaps.length - 1 && n === snaps.length) msg = '<b>큰일!</b> 내용이 전부 사라졌어요. 걱정 마세요. 위쪽 세이브 카드를 눌러 보세요. 옛날 상태가 그대로 있어요.';
      else if (n === snaps.length) msg = '<b>시간여행 성공!</b> 깃에서는 이 시점의 내용을 새 커밋으로 되살려요(revert). 기록은 지워지지 않아서, 나중에 "누가 왜 되돌렸는지"도 볼 수 있어요.';
      else msg = '커밋 하나가 세이브 하나예요. 카드를 눌러 그때의 파일을 볼 수 있어요. 버튼을 한 번 더 눌러 보세요.';
      $('#d2msg').innerHTML = msg;
    }
    $('#d2tl').addEventListener('click', function (e) { var b = e.target.closest('.node'); if (!b) return; sel = +b.dataset.i; render(); });
    $('#d2add').addEventListener('click', function () { if (n < snaps.length) { n++; sel = n - 1; render(); var tl = $('#d2tl'); tl.scrollLeft = tl.scrollWidth; } });
    $('#d2re').addEventListener('click', function () { n = 3; sel = 2; render(); });
    render();
  })();

  /* ---------- 3화: 브랜치 그래프 ---------- */
  (function () {
    var STEP = 60, X0 = 84, Y = [50, 118], MAX = 12;
    var commits, open, mainLast, bLast, bFrom, state;
    function init() {
      commits = [{ id: 'm1', lane: 0, p: [] }, { id: 'm2', lane: 0, p: ['m1'] }];
      mainLast = commits[1]; bLast = null; bFrom = null; open = false; state = 'start'; render();
    }
    function xOf(i) { return X0 + i * STEP; }
    function find(id) { for (var i = 0; i < commits.length; i++) if (commits[i].id === id) return i; }
    function branchCommits() { return commits.filter(function (c) { return c.lane === 1; }).length; }
    function tag(x, y, text, color) {
      var w = text.length * 7.6 + 16;
      return '<g><rect x="' + (x - w / 2) + '" y="' + (y - 11) + '" width="' + w + '" height="22" rx="6" fill="' + color + '" stroke="var(--ink)" stroke-width="2.5"/><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" style="fill:var(--on-accent)">' + text + '</text></g>';
    }
    function render() {
      var svg = $('#d3svg'), W = xOf(MAX) + 40;
      svg.setAttribute('viewBox', '0 0 ' + W + ' 170'); svg.style.width = W + 'px';
      var s = '<text class="lane" x="10" y="' + (Y[0] + 4) + '">main</text><text class="lane" x="10" y="' + (Y[1] + 4) + '">branch</text>';
      commits.forEach(function (c, i) {
        c.p.forEach(function (pid) {
          var pi = find(pid), pc = commits[pi], x1 = xOf(pi), y1 = Y[pc.lane], x2 = xOf(i), y2 = Y[c.lane];
          if (pc.lane === c.lane) s += '<path class="ln" d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '"/>';
          else { var mx = (x1 + x2) / 2; s += '<path class="ln" d="M' + x1 + ' ' + y1 + 'C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>'; }
        });
      });
      if (open && !bLast) {
        var fi = find(bFrom.id), gx = xOf(commits.length), x1 = xOf(fi), mx = (x1 + gx) / 2;
        s += '<path class="ln dash" d="M' + x1 + ' ' + Y[0] + 'C' + mx + ' ' + Y[0] + ' ' + mx + ' ' + Y[1] + ' ' + gx + ' ' + Y[1] + '"/><circle class="nd ghost" cx="' + gx + '" cy="' + Y[1] + '" r="11"/>';
      }
      commits.forEach(function (c, i) {
        var cls = c.merge ? 'mg' : (c.lane ? 'br' : 'main');
        s += '<circle class="nd ' + cls + '" cx="' + xOf(i) + '" cy="' + Y[c.lane] + '" r="' + (c.merge ? 14 : 11) + '"/>';
      });
      s += tag(xOf(find(mainLast.id)), Y[0] - 26, 'main', 'var(--blue)');
      if (open) {
        var bx = bLast ? xOf(find(bLast.id)) : xOf(commits.length);
        s += tag(bx, Y[1] + 28, 'fix/readme', 'var(--coral)');
      }
      svg.innerHTML = s;
      var msgs = {
        start: '<b>main</b>은 모두가 보는 완성본이에요. 여기엔 함부로 실험하지 않아요. 먼저 "브랜치 만들기"를 눌러 보세요.',
        branch: '<b>브랜치가 생겼어요!</b> 점선은 "여기서 갈라졌다"는 뜻이에요. 이제 이 갈래에서 마음껏 고쳐도 main은 안전해요.',
        bwork: '브랜치에만 새 커밋이 생겼어요. <b>main은 그대로</b>예요. 몇 번 더 작업해도 좋아요.',
        mwork: '그 사이 다른 사람이 main을 발전시켰어요. 서로 갈래가 달라서 <b>서로 방해하지 않아요</b>.',
        merge: '<b>합치기(merge) 완료!</b> 보라색 커밋이 두 갈래를 하나로 이었어요. 갈래의 작업이 main에 들어왔어요.'
      };
      $('#d3msg').innerHTML = msgs[state];
      var full = commits.length >= MAX;
      $('#d3br').disabled = open || full;
      $('#d3bw').disabled = !open || full;
      $('#d3mw').disabled = full;
      $('#d3mg').disabled = !open || branchCommits() === 0 || full;
    }
    function add(lane, p, extra) {
      var c = { id: 'c' + commits.length, lane: lane, p: p };
      if (extra) c.merge = true;
      commits.push(c); return c;
    }
    $('#d3br').addEventListener('click', function () { open = true; bLast = null; bFrom = mainLast; state = 'branch'; render(); });
    $('#d3bw').addEventListener('click', function () { bLast = add(1, [bLast ? bLast.id : bFrom.id]); state = 'bwork'; render(); });
    $('#d3mw').addEventListener('click', function () { mainLast = add(0, [mainLast.id]); state = 'mwork'; render(); });
    $('#d3mg').addEventListener('click', function () { mainLast = add(0, [mainLast.id, bLast.id], true); open = false; bLast = null; state = 'merge'; render(); });
    $('#d3re').addEventListener('click', init);
    init();
  })();

  /* ---------- 4화: 협업 흐름 ---------- */
  (function () {
    var cur = 0, approved = false, merged = false;
    var names = ['이슈', '브랜치', '커밋', 'PR', '리뷰', '머지'];
    var notes = [
      '이슈는 "할 일 / 문제"를 적어 두는 게시판 글이에요. 번호(#12)가 붙어서 대화와 기록이 한곳에 모여요.',
      '브랜치 이름은 보통 "무슨 일인지"를 적어요. 이슈 번호를 넣는 팀도 많아요.',
      '커밋은 의미 있는 단위로 저장하고, 메시지에 "무엇을 왜 바꿨는지" 적어요.',
      'PR 설명에 "Closes #12"라고 쓰면, 머지될 때 이슈 #12가 자동으로 닫혀요.',
      '리뷰는 검사가 아니라 함께 보는 눈이에요. 실수를 합치기 전에 잡아요.',
      '머지가 끝나면 main이 최신이 돼요. 모두가 같은 코드를 보게 돼요.'
    ];
    function bubble(who, text, right) { return '<div class="bubble' + (right ? ' r' : '') + '"><b>' + who + ':</b> ' + text + '</div>'; }
    function scene(figs, sfx) { return '<div class="scene">' + figs + (sfx ? '<span class="sfx">' + sfx + '</span>' : '') + '</div>'; }
    var S = {
      seoyeon: fig('c-seoyeon', 'p-b'), junho: fig('c-junho', 'p-c'), minji: fig('c-minji', 'p-a')
    };
    function panel() {
      var p = '<span class="cap">' + (cur + 1) + '단계 · ' + names[cur] + '</span>';
      if (cur === 0) return p + bubble('서연', 'README 실행 명령에 오타가 있어요. <b>이슈</b>로 남겨 둘게요. 준호 님이 맡아 주세요!') + scene(S.seoyeon + S.junho, '등록!');
      if (cur === 1) return p + bubble('준호', 'main은 건드리지 않고, 제 <b>브랜치</b>에서 고칠게요.', true) + scene(S.junho, '쓱!');
      if (cur === 2) return p + bubble('준호', 'README를 고치고 <b>커밋</b>(세이브)했어요.') + scene(S.junho, '저장!');
      if (cur === 3) return p + bubble('준호', '다 고쳤어요! main에 합쳐도 되는지 <b>PR</b>로 봐 주세요.') + scene(S.junho + S.minji, '요청!');
      if (cur === 4) return p + bubble('민지', approved ? '이제 완벽해요. <b>승인(Approve)</b>합니다!' : '확인했어요. Docker 실행 예시도 고쳐 주세요. 그러면 승인할게요.', true) + scene(S.minji + S.junho, approved ? '좋아요!' : '의견!');
      return p + bubble('서연', merged ? '머지 완료! 이슈도 자동으로 닫혔네요. 이제 모두 최신 코드를 봐요.' : '승인됐으니 <b>머지</b>(합치기) 버튼을 눌러 주세요.') + scene(S.seoyeon + S.minji + S.junho, merged ? '짠!' : '');
    }
    function ui() {
      if (cur === 0) return '<div class="gh-h"><span class="pill open">Open</span> 이슈 #12</div><div class="gh-b"><h4>README 실행 명령 오타</h4><div><span class="pill lab">수정 필요</span> <span class="pill neutral">담당: 준호</span></div><div class="cmt">' + S.seoyeon + '<div><small>서연 · 방금</small>실행 명령이 "npm strat"로 적혀 있어요. 이대로 실행하면 앱이 시작되지 않아요.</div></div></div>';
      if (cur === 1) return '<div class="gh-h">저장소: team-app</div><div class="gh-b"><h4>새 브랜치 만들기</h4><div class="code" style="white-space:pre-wrap">main  ──●──●──●\n               \\\n  fix/readme-12   (새 갈래)</div><div><span class="pill neutral">기준: main</span> <span class="pill lab">fix/readme-12</span></div></div>';
      if (cur === 2) return '<div class="gh-h">fix/readme-12 · 커밋 1개</div><div class="gh-b"><h4>README 실행 명령 오타 수정 (#12)</h4><div class="diff"><div class="del">- npm strat</div><div class="add">+ npm start</div></div><span class="note">커밋 9d2c4f1 · 준호</span></div>';
      if (cur === 3) return '<div class="gh-h"><span class="pill open">Open</span> Pull request #13</div><div class="gh-b"><h4>README 실행 명령 오타 수정</h4><div class="note">fix/readme-12 → main</div><div class="cmt">' + S.junho + '<div><small>준호</small>README 실행 명령 오타를 고쳤어요.<br><b>Closes #12</b></div></div><div class="chk">✓ 충돌 없음, 합칠 수 있어요</div></div>';
      if (cur === 4) return '<div class="gh-h"><span class="pill ' + (approved ? 'merged' : 'open') + '">' + (approved ? 'Approved' : 'Review') + '</span> Pull request #13</div><div class="gh-b"><div class="cmt">' + S.minji + '<div><small>민지 · README.md 12번째 줄</small>Docker 실행 예시에도 같은 오타가 있어요!</div></div>' + (approved ? '<div class="cmt">' + S.junho + '<div><small>준호</small>고쳤어요. 커밋 e83b07a</div></div><div class="chk">✓ 민지 님이 승인했어요</div>' : '') + '<div><button type="button" class="btn blue" id="d4appr"' + (approved ? ' disabled' : '') + '>' + (approved ? '승인됨' : '준호가 고치고, 민지가 승인(Approve) 누르기') + '</button></div></div>';
      return '<div class="gh-h"><span class="pill ' + (merged ? 'merged' : 'open') + '">' + (merged ? 'Merged' : 'Open') + '</span> Pull request #13</div><div class="gh-b"><h4>README 실행 명령 오타 수정</h4>' + (merged ? '<div class="chk" style="color:var(--purple)">✓ main에 합쳐졌어요</div><div><span class="pill closed">Closed</span> 이슈 #12 가 자동으로 닫혔어요</div>' : '<div class="chk">✓ 승인 1개, 충돌 없음</div><div><button type="button" class="btn purple" id="d4merge">Merge pull request</button></div>') + '</div>';
    }
    function render() {
      $('#d4steps').innerHTML = names.map(function (n, i) {
        return '<button type="button" class="step-pill" role="tab" data-i="' + i + '"' + (i === cur ? ' aria-current="step"' : '') + '><i>' + (i + 1) + '</i>' + n + '</button>';
      }).join('');
      var p = $('#d4panel'); p.innerHTML = panel(); p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
      $('#d4ui').innerHTML = ui();
      $('#d4note').textContent = notes[cur];
      $('#d4prev').disabled = cur === 0;
      $('#d4next').disabled = cur === names.length - 1;
      var a = $('#d4appr'); if (a) a.addEventListener('click', function () { approved = true; render(); });
      var m = $('#d4merge'); if (m) m.addEventListener('click', function () { merged = true; render(); });
    }
    $('#d4steps').addEventListener('click', function (e) { var b = e.target.closest('.step-pill'); if (!b) return; cur = +b.dataset.i; render(); });
    $('#d4prev').addEventListener('click', function () { if (cur > 0) { cur--; render(); } });
    $('#d4next').addEventListener('click', function () { if (cur < names.length - 1) { cur++; render(); } });
    render();
  })();

  /* ---------- 5화: 충돌 ---------- */
  (function () {
    var A = 'const timeoutMs = 3000;', B = 'const timeoutMs = 5000;';
    var picked = null;
    function render() {
      var code;
      if (!picked) code = '<span class="m">&lt;&lt;&lt;&lt;&lt;&lt;&lt; main</span>\n' + esc(A) + '\n<span class="m">=======</span>\n' + esc(B) + '\n<span class="m">&gt;&gt;&gt;&gt;&gt;&gt;&gt; fix/timeout</span>';
      else {
        var t = picked === 'a' ? A : picked === 'b' ? B : 'const timeoutMs = 4000;';
        code = '<span class="c"># 충돌 표시를 지우고 최종 한 줄만 남겼어요</span>\n<span class="p">' + esc(t) + '</span>';
      }
      $('#d5code').innerHTML = code;
      $('#d5msg').innerHTML = !picked
        ? '깃은 두 줄 중 무엇이 맞는지 <b>스스로 판단하지 않아요</b>. 표시(&lt;&lt;&lt;&lt;&lt;&lt;&lt;, =======, &gt;&gt;&gt;&gt;&gt;&gt;&gt;)를 남겨 두고 사람에게 물어봐요. 아래 버튼으로 골라 보세요.'
        : '<b>충돌 해결!</b> 고른 내용을 저장(커밋)하면 PR을 다시 합칠 수 있어요. AI에게 "충돌 해결해 줘"라고 해도 되지만, 어느 쪽이 맞는지는 사람이 확인해요.';
    }
    $$('#d5 [data-pick]').forEach(function (b) {
      b.addEventListener('click', function () { picked = b.dataset.pick === 'x' ? null : b.dataset.pick; render(); });
    });
    render();
  })();

  /* ---------- 6화: AI 대화 ---------- */
  (function () {
    var P = [
      { q: '내 작업 저장해서 올려 줘', a: '바뀐 파일을 모아 커밋하고, 깃허브에 올릴게요.',
        c: '<span class="c"># 바뀐 파일을 담고</span>\ngit add .\n<span class="c"># 세이브 메시지와 함께 저장</span>\ngit commit -m "README 실행 명령 오타 수정"\n<span class="c"># 깃허브에 올리기</span>\ngit push',
        h: '메시지가 내가 한 일과 맞는지 읽어 보세요. 비밀번호나 개인정보 파일이 섞이지 않았는지도 확인해요.' },
      { q: 'README 오타 고칠 새 브랜치 만들어 줘', a: 'main을 최신으로 맞춘 다음, 새 브랜치를 만들어서 이동할게요.',
        c: 'git switch main\ngit pull\n<span class="c"># 새 브랜치를 만들고 바로 이동</span>\ngit switch -c fix/readme-12',
        h: '브랜치 이름이 이슈와 어울리는지 봐요. 내 작업 중인 파일이 있으면 먼저 저장(커밋)하자고 AI가 알려 줄 거예요.' },
      { q: '이 작업으로 PR 올려 줘. 이슈 #12 닫히게', a: '브랜치를 올리고 PR을 만들게요. 설명에 Closes #12를 넣어 두면 머지될 때 이슈가 자동으로 닫혀요.',
        c: 'git push -u origin fix/readme-12\ngh pr create --title "README 실행 명령 오타 수정" --body "Closes #12"',
        h: 'PR 제목과 설명을 읽고 고칠 부분이 없는지 봐요. <b>리뷰와 승인은 사람(동료)의 일</b>이에요.' },
      { q: '충돌났어. 어떻게 해?', a: '충돌한 파일을 먼저 찾아서 두 버전을 보여 드릴게요. 어느 쪽을 쓸지 정해 주시면 정리해서 마무리할게요.',
        c: 'git status\n<span class="c"># 충돌 표시(&lt;&lt;&lt;&lt;&lt;&lt;&lt; ======= &gt;&gt;&gt;&gt;&gt;&gt;&gt;)를 확인하고, 고른 내용만 남긴 뒤</span>\ngit add README.md\ngit commit',
        h: '<b>어느 내용이 맞는지는 사람이 정해요.</b> 모르겠으면 동료 엔지니어에게 물어보세요.' },
      { q: '어제 상태로 되돌리고 싶어', a: '기록을 먼저 보여 드리고, 되돌릴 커밋을 고르면 안전한 방식으로 되돌릴게요.',
        c: 'git log --oneline\n<span class="c"># 기록은 남기면서 그 커밋의 변경을 취소</span>\ngit revert 3f8e7b2',
        h: '기록을 지워 버리는 강한 명령(예: <span class="t">git push --force</span>)을 AI가 쓰자고 하면, 멈추고 팀장에게 먼저 물어보세요.' }
    ];
    var cur = 0;
    function render() {
      $('#d6p').innerHTML = P.map(function (p, i) { return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === cur) + '">"' + esc(p.q) + '"</button>'; }).join('');
      var p = P[cur];
      var c = $('#d6c');
      c.innerHTML =
        '<div class="u pop">' + fig('c-junho', 'p-c') + '<div class="txt">' + esc(p.q) + '</div></div>' +
        '<div class="a pop">' + fig('c-ai', 'p-ai') + '<div class="txt"><div>' + p.a + '</div><div class="code">' + p.c + '</div></div></div>' +
        '<div class="human pop"><b>사람이 꼭 확인할 것</b><br>' + p.h + '</div>';
    }
    $('#d6p').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cur = +b.dataset.i; render(); });
    render();
  })();
})();
