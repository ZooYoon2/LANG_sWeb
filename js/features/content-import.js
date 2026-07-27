/* ============================================================
 * ContentImport — 콘텐츠 팩 가져오기 (Claude 연동 통로)
 * Claude 채팅에서 생성한 JSON 팩을 붙여넣어 등록한다.
 * packType: "words" | "grammar" | "toeic"
 * 새 타입 추가 시 VALIDATORS / HANDLERS에 등록하면 된다.
 * ============================================================ */
(function () {
  "use strict";

  const M = window.Models;

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  const CLAUDE_PROMPT =
    "VocaLoop 콘텐츠 팩을 만들어줘.\n" +
    "- packType: words (또는 grammar / toeic)\n" +
    "- 토익/토플 빈출 단어 30개, 이미 준 단어와 중복 없이\n" +
    "- 아래 JSON 형식 그대로, 다른 텍스트 없이 출력\n\n" +
    '{\n  "packType": "words",\n  "title": "추가 단어 팩",\n  "items": [\n' +
    '    { "word": "negotiate", "meaning": "협상하다", "pos": "v", "example": "We negotiated a better price." }\n' +
    "  ]\n}";

  const SPEC_TEXT =
    '// 단어 팩\n{ "packType": "words", "title": "...",\n  "items": [ { "word": "...", "meaning": "...", "pos": "v", "example": "..." } ] }\n\n' +
    '// 문법 팩\n{ "packType": "grammar", "title": "...",\n  "items": [ { "title": "...", "explanation": "...", "examples": ["..."] } ] }\n\n' +
    '// 토익 문제 팩\n{ "packType": "toeic", "title": "...",\n  "items": [ { "question": "...", "choices": ["A","B","C","D"], "answer": 0, "explanation": "..." } ] }';

  /* packType별 검증기 — 새 타입은 여기에 추가 */
  const VALIDATORS = {
    words: M.WordEntry.validatePackItem,
    grammar: M.GrammarItem.validatePackItem,
    toeic: M.ToeicQuestion.validatePackItem,
  };

  function importPack(repo, text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false, msg: "JSON 형식이 아닙니다. 붙여넣은 내용을 확인해 주세요." };
    }
    if (!data || !VALIDATORS[data.packType]) {
      return { ok: false, msg: 'packType이 없거나 지원하지 않는 타입입니다. (words / grammar / toeic)' };
    }
    if (!Array.isArray(data.items) || !data.items.length) {
      return { ok: false, msg: "items 배열이 비어 있습니다." };
    }
    // 항목 검증
    for (let i = 0; i < data.items.length; i++) {
      const err = VALIDATORS[data.packType](data.items[i], i + 1);
      if (err) return { ok: false, msg: err };
    }
    // 타입별 저장
    if (data.packType === "words") {
      const r = repo.appendWordPack(data.items);
      return { ok: true, msg: "단어 " + r.added + "개 추가 완료 (Day " + r.fromDay + "~" + r.toDay + "에 배정)" };
    }
    const stamp = Date.now();
    const items = data.items.map(function (it, i) {
      const base = Object.assign({ id: data.packType + "-" + stamp + "-" + i }, it);
      return data.packType === "grammar" ? new M.GrammarItem(base) : new M.ToeicQuestion(base);
    });
    repo.appendLibrary(items);
    return {
      ok: true,
      msg: (data.packType === "grammar" ? "문법" : "토익 문제") + " " + items.length + "개 추가 완료. 라이브러리에서 볼 수 있어요.",
    };
  }

  function render(app) {
    const repo = app.repo;
    app.el.innerHTML =
      app.topbarHTML("홈") +
      '<h1 class="screen-title">콘텐츠 추가</h1>' +
      '<p class="screen-sub">Claude에게 아래 프롬프트로 팩을 만들어 달라고 한 뒤, 받은 JSON을 붙여넣으세요.</p>' +
      '<div class="card">' +
        '<p class="muted" style="margin-bottom:6px">Claude에게 보낼 요청 (복사해서 사용)</p>' +
        '<pre class="spec" id="prompt-box">' + esc(CLAUDE_PROMPT) + "</pre>" +
        '<button class="btn secondary small" id="copy-prompt" style="margin-top:8px">요청문 복사</button>' +
      "</div>" +
      '<div class="card">' +
        '<p class="muted" style="margin-bottom:6px">받은 JSON 붙여넣기</p>' +
        '<textarea id="pack-input" placeholder=\'{"packType": "words", ...}\'></textarea>' +
        '<button class="btn" id="do-import" style="margin-top:10px">가져오기</button>' +
        '<div id="import-msg"></div>' +
      "</div>" +
      '<div class="card">' +
        '<p class="muted" style="margin-bottom:6px">팩 규격 (참고)</p>' +
        '<pre class="spec">' + esc(SPEC_TEXT) + "</pre>" +
      "</div>" +
      '<button class="btn secondary" id="go-library">라이브러리 보기 (문법 · 토익)</button>';
    app.bindBack("home");

    app.el.querySelector("#copy-prompt").addEventListener("click", function () {
      const btn = this;
      navigator.clipboard.writeText(CLAUDE_PROMPT).then(function () {
        btn.textContent = "복사됨!";
        setTimeout(function () { btn.textContent = "요청문 복사"; }, 1500);
      }).catch(function () {
        alert("복사에 실패했습니다. 직접 드래그해서 복사해 주세요.");
      });
    });

    app.el.querySelector("#do-import").addEventListener("click", function () {
      const text = app.el.querySelector("#pack-input").value.trim();
      const msgEl = app.el.querySelector("#import-msg");
      if (!text) { msgEl.innerHTML = '<p class="msg no">붙여넣은 내용이 없습니다.</p>'; return; }
      const r = importPack(repo, text);
      msgEl.innerHTML = '<p class="msg ' + (r.ok ? "ok" : "no") + '">' + esc(r.msg) + "</p>";
      if (r.ok) app.el.querySelector("#pack-input").value = "";
    });

    app.el.querySelector("#go-library").addEventListener("click", function () {
      app.navigate("library");
    });
  }

  /* ---------- 라이브러리 (문법/토익 열람) ---------- */
  function renderLibrary(app) {
    const items = app.repo.loadLibrary();
    const grammar = items.filter(function (i) { return i.type === "grammar"; });
    const toeic = items.filter(function (i) { return i.type === "toeic"; });

    app.el.innerHTML =
      app.topbarHTML("콘텐츠 추가") +
      '<h1 class="screen-title">라이브러리</h1>' +
      '<p class="screen-sub">추가한 문법 · 토익 문제 콘텐츠</p>' +
      '<div class="card"><p class="muted" style="margin-bottom:6px">문법 (' + grammar.length + ")</p>" +
        (grammar.length
          ? grammar.map(function (g) {
              return '<div class="lib-item"><div class="t">' + esc(g.title) + "</div>" +
                '<div class="body">' + esc(g.explanation) +
                (g.examples.length ? "\n\n예문:\n" + g.examples.map(esc).join("\n") : "") +
                "</div></div>";
            }).join("")
          : '<p class="muted">아직 없습니다.</p>') +
      "</div>" +
      '<div class="card"><p class="muted" style="margin-bottom:6px">토익 문제 (' + toeic.length + ")</p>" +
        (toeic.length
          ? toeic.map(function (q, qi) {
              return '<div class="lib-item">' +
                '<div class="t">Q' + (qi + 1) + ". " + esc(q.question) + "</div>" +
                '<ul class="choices" data-q="' + qi + '">' +
                  q.choices.map(function (c, ci) {
                    return '<li><button data-ci="' + ci + '">' + esc(c) + "</button></li>";
                  }).join("") +
                "</ul>" +
                '<div class="body exp" style="display:none">' +
                  (q.explanation ? esc(q.explanation) : "해설 없음") + "</div>" +
              "</div>";
            }).join("")
          : '<p class="muted">아직 없습니다.</p>') +
      "</div>";
    app.bindBack("import");

    // 토익 문제 즉석 풀기
    app.el.querySelectorAll(".choices[data-q]").forEach(function (ul) {
      const q = toeic[parseInt(ul.dataset.q, 10)];
      ul.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const ci = parseInt(btn.dataset.ci, 10);
          ul.querySelectorAll("button").forEach(function (b, i) {
            b.disabled = true;
            if (i === q.answer) b.classList.add("correct");
          });
          if (ci !== q.answer) btn.classList.add("wrong");
          const exp = ul.parentElement.querySelector(".exp");
          if (exp) exp.style.display = "block";
        });
      });
    });
  }

  window.Features.ContentImport = { render: render, renderLibrary: renderLibrary };
})();
