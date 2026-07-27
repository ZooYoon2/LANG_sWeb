/* ============================================================
 * WordEntry — 영단어 콘텐츠 (ContentItem 상속)
 * 뜻은 배열(meanings)로 관리하며 [0]이 주요 뜻이다.
 * 구버전 데이터/팩의 meaning 문자열도 자동 변환해 호환한다.
 * ============================================================ */
(function () {
  "use strict";

  const ContentItem = window.Models.ContentItem;

  /** 품사 코드 → 한글 표기 (표시 계층 전용, 데이터는 코드 유지) */
  const POS_LABELS = {
    n: "명사", v: "동사", adj: "형용사", adv: "부사",
    prep: "전치사", conj: "접속사", pron: "대명사",
    int: "감탄사", phr: "숙어", aux: "조동사",
  };

  /** "요금; 청구하다, 책임" → ["요금","청구하다","책임"] (괄호 안 보호) */
  function parseMeanings(str) {
    const out = []; let cur = ""; let depth = 0;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "(") { depth++; cur += ch; }
      else if (ch === ")") { depth--; cur += ch; }
      else if ((ch === "," || ch === ";") && depth === 0) {
        if (cur.trim()) out.push(cur.trim()); cur = "";
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.length ? out : [s.trim()];
  }

  class WordEntry extends ContentItem {
    /**
     * @param {Object} p
     * @param {string} p.word        영단어
     * @param {string[]} [p.meanings] 뜻 배열 ([0]이 주요 뜻)
     * @param {string} [p.meaning]   구버전 뜻 문자열 (자동 변환)
     * @param {string} [p.pos]       품사 코드 (n, v, adj ...)
     * @param {string} [p.phonetic]  발음 기호 (선택)
     * @param {string} [p.example]   예문 (선택)
     */
    constructor(p) {
      super({ id: p.id, type: "word", tags: p.tags, createdAt: p.createdAt });
      this.word = p.word;
      this.meanings = Array.isArray(p.meanings) && p.meanings.length
        ? p.meanings.map(function (m) { return String(m).trim(); }).filter(Boolean)
        : parseMeanings(p.meaning);
      this.pos = p.pos || "";
      this.phonetic = p.phonetic || "";
      this.example = p.example || "";
    }

    /** 주요 뜻 */
    get primaryMeaning() { return this.meanings[0] || ""; }

    /** 모든 뜻을 이어 붙인 표시용 문자열 (카드/목록/오답노트) */
    get meaning() { return this.meanings.join(", "); }

    /** 품사 한글 표기. 모르는 코드는 원문 그대로 노출 */
    get posLabel() { return POS_LABELS[this.pos] || this.pos; }

    /** 기본 데이터 파일의 JSON 객체 → 클래스 (id는 배열 순번 기반) */
    static fromRaw(obj, index) {
      return new WordEntry(Object.assign({ id: "base-" + index }, obj));
    }

    /** 저장소/콘텐츠 팩의 JSON 객체 → 클래스 */
    static fromJSON(obj) {
      return new WordEntry(obj);
    }

    toJSON() {
      return Object.assign(super.toJSON(), {
        word: this.word,
        meanings: this.meanings,
        pos: this.pos,
        phonetic: this.phonetic,
        example: this.example,
      });
    }

    /** 콘텐츠 팩 항목 유효성 검사. meanings 배열 또는 meaning 문자열 허용 */
    static validatePackItem(obj, idx) {
      if (!obj || typeof obj !== "object") return idx + "번 항목이 객체가 아닙니다.";
      if (typeof obj.word !== "string" || !obj.word.trim()) return idx + "번 항목: word가 없습니다.";
      const hasArr = Array.isArray(obj.meanings) && obj.meanings.length &&
        obj.meanings.every(function (m) { return typeof m === "string" && m.trim(); });
      const hasStr = typeof obj.meaning === "string" && obj.meaning.trim();
      if (!hasArr && !hasStr) return idx + "번 항목: meanings 배열(또는 meaning)이 없습니다.";
      return null;
    }
  }

  window.Models.WordEntry = WordEntry;
  window.Models.POS_LABELS = POS_LABELS;
  window.Models.parseMeanings = parseMeanings;
})();
