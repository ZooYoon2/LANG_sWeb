/* ============================================================
 * WordEntry — 영단어 콘텐츠 (ContentItem 상속)
 * 데이터(JSON)를 클래스 인스턴스로 변환해서 사용한다.
 * Day 배정은 데이터에 없고, 배정표(repository)가 관리한다.
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

  class WordEntry extends ContentItem {
    /**
     * @param {Object} p
     * @param {string} p.word      영단어
     * @param {string} p.meaning   한국어 뜻
     * @param {string} [p.pos]     품사 코드 (n, v, adj ...)
     * @param {string} [p.phonetic] 발음 기호 (선택)
     * @param {string} [p.example] 예문 (선택)
     */
    constructor(p) {
      super({ id: p.id, type: "word", tags: p.tags, createdAt: p.createdAt });
      this.word = p.word;
      this.meaning = p.meaning;
      this.pos = p.pos || "";
      this.phonetic = p.phonetic || "";
      this.example = p.example || "";
    }

    /** 품사 한글 표기. 모르는 코드는 원문 그대로 노출 */
    get posLabel() {
      return POS_LABELS[this.pos] || this.pos;
    }

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
        meaning: this.meaning,
        pos: this.pos,
        phonetic: this.phonetic,
        example: this.example,
      });
    }

    /** 콘텐츠 팩 항목 유효성 검사. 문제 있으면 에러 메시지, 없으면 null */
    static validatePackItem(obj, idx) {
      if (!obj || typeof obj !== "object") return idx + "번 항목이 객체가 아닙니다.";
      if (typeof obj.word !== "string" || !obj.word.trim()) return idx + "번 항목: word가 없습니다.";
      if (typeof obj.meaning !== "string" || !obj.meaning.trim()) return idx + "번 항목: meaning이 없습니다.";
      return null;
    }
  }

  window.Models.WordEntry = WordEntry;
  window.Models.POS_LABELS = POS_LABELS;
})();
