/* ============================================================
 * WordEntry — 영단어 콘텐츠 (ContentItem 상속)
 * 데이터 파일(배열)이나 콘텐츠 팩(JSON)을 클래스 인스턴스로
 * 변환해서 사용한다. (코드 내에서는 항상 클래스로 다룸)
 * ============================================================ */
(function () {
  "use strict";

  const ContentItem = window.Models.ContentItem;

  class WordEntry extends ContentItem {
    /**
     * @param {Object} p
     * @param {string} p.word     영단어
     * @param {string} p.meaning  한국어 뜻
     * @param {string} [p.pos]    품사 (n, v, adj, adv ...)
     * @param {string} [p.example] 예문
     * @param {number} p.day      배정된 학습 Day
     */
    constructor(p) {
      super({ id: p.id, type: "word", tags: p.tags, createdAt: p.createdAt });
      this.word = p.word;
      this.meaning = p.meaning;
      this.pos = p.pos || "";
      this.example = p.example || "";
      this.day = p.day;
    }

    /** 기본 데이터 파일의 압축 배열 [word, meaning, pos] → 클래스 */
    static fromRaw(rawArr, index) {
      return new WordEntry({
        id: "base-" + index,
        word: rawArr[0],
        meaning: rawArr[1],
        pos: rawArr[2] || "",
        day: Math.floor(index / 30) + 1,
      });
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
        example: this.example,
        day: this.day,
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
})();
