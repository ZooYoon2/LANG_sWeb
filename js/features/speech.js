/* ============================================================
 * Speech — 발음 듣기 (Web Speech API)
 * 브라우저/기기에 내장된 영어 음성으로 단어를 읽어 준다.
 * 별도 서버·비용 없음. 미지원 브라우저에서는 버튼이 안 보인다.
 *
 * 사용법:
 *   html += Speech.buttonHTML(word);   // 🔊 버튼 HTML 조각
 *   Speech.bindAll(rootElement);       // 렌더 후 한 번 호출
 * ============================================================ */
(function () {
  "use strict";

  let voice = null;

  function pickVoice() {
    if (!window.speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    // 미국 영어 우선, 없으면 아무 영어 음성
    voice =
      voices.find(function (v) { return v.lang === "en-US"; }) ||
      voices.find(function (v) { return v.lang && v.lang.indexOf("en") === 0; }) ||
      null;
  }

  function init() {
    if (!window.speechSynthesis) return;
    pickVoice();
    // 일부 브라우저(iOS 등)는 음성 목록이 비동기로 로드됨
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = pickVoice;
    }
  }

  function isSupported() {
    return !!window.speechSynthesis;
  }

  /** 영단어를 읽어 준다 */
  function speak(text) {
    if (!isSupported() || !text) return;
    if (!voice) pickVoice();
    speechSynthesis.cancel(); // 이전 재생 중단
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    if (voice) u.voice = voice;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  function escAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  /** 🔊 버튼 HTML 조각. 미지원 브라우저면 빈 문자열 */
  function buttonHTML(text) {
    if (!isSupported()) return "";
    return '<button type="button" class="speak-btn" data-speak="' + escAttr(text) +
           '" aria-label="발음 듣기">\uD83D\uDD0A</button>';
  }

  /** 렌더된 화면 안의 모든 🔊 버튼에 클릭 리스너 연결 */
  function bindAll(root) {
    if (!isSupported() || !root) return;
    root.querySelectorAll("[data-speak]").forEach(function (btn) {
      if (btn._speakBound) return;
      btn._speakBound = true;
      btn.addEventListener("click", function (e) {
        e.stopPropagation(); // 카드 뒤집기 등 부모 클릭 방지
        speak(btn.getAttribute("data-speak"));
      });
    });
  }

  init();

  window.Features = window.Features || {};
  window.Features.Speech = {
    isSupported: isSupported,
    speak: speak,
    buttonHTML: buttonHTML,
    bindAll: bindAll,
  };
})();
