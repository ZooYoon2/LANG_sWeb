/* ============================================================
 * Repository — 데이터 계층
 * 저장소(JSON)와 앱 코드(클래스) 사이의 변환을 전담한다.
 * 단어 풀 = 기본 데이터(words.js) + 사용자가 추가한 단어 팩
 * ============================================================ */
(function () {
  "use strict";

  const M = window.Models;

  const KEYS = {
    state: "vocaloop.state",
    wrong: "vocaloop.wrong",
    results: "vocaloop.results",
    customWords: "vocaloop.customWords",
    library: "vocaloop.library", // 문법/토익 등 확장 콘텐츠
  };

  class Repository {
    /** @param {StorageProvider} provider */
    constructor(provider) {
      this.provider = provider;
      this._baseWords = null; // 캐시
    }

    /* ---------- 앱 상태 ---------- */
    loadState() {
      return M.AppState.fromJSON(this.provider.get(KEYS.state) || {});
    }
    saveState(state) {
      this.provider.set(KEYS.state, state.toJSON());
    }

    /* ---------- 단어 풀 ---------- */
    _getBaseWords() {
      if (!this._baseWords) {
        this._baseWords = (window.VocaData.RAW_WORDS || []).map(
          (raw, i) => M.WordEntry.fromRaw(raw, i)
        );
      }
      return this._baseWords;
    }
    _getCustomWords() {
      const arr = this.provider.get(KEYS.customWords) || [];
      return arr.map((o) => M.WordEntry.fromJSON(o));
    }
    /** 전체 단어 (기본 + 추가) */
    getAllWords() {
      return this._getBaseWords().concat(this._getCustomWords());
    }
    /** 특정 Day의 단어 30개 */
    getWordsForDay(day) {
      return this.getAllWords().filter((w) => w.day === day);
    }
    /** Day 1 ~ maxDay 까지의 단어 */
    getWordsUpToDay(maxDay) {
      return this.getAllWords().filter((w) => w.day <= maxDay);
    }
    /** 콘텐츠가 존재하는 마지막 Day */
    getTotalDays() {
      const all = this.getAllWords();
      return all.length ? Math.max.apply(null, all.map((w) => w.day)) : 0;
    }
    /** id → WordEntry 맵 */
    getWordMap() {
      const map = {};
      this.getAllWords().forEach((w) => { map[w.id] = w; });
      return map;
    }
    /**
     * 단어 팩 추가: 마지막 Day 뒤에 30개 단위로 새 Day를 만들어 배정
     * @param {Array<Object>} items [{word, meaning, pos, example}]
     * @returns {{added:number, fromDay:number, toDay:number}}
     */
    appendWordPack(items) {
      const custom = this._getCustomWords();
      let lastDay = this.getTotalDays();
      // 마지막 Day가 30개 미만이면 이어서 채운다
      let countInLastDay = this.getWordsForDay(lastDay).length;
      const stamp = Date.now();
      const newEntries = items.map((it, i) => {
        if (countInLastDay >= 30 || lastDay === 0) {
          lastDay += 1;
          countInLastDay = 0;
        }
        countInLastDay += 1;
        return new M.WordEntry({
          id: "cust-" + stamp + "-" + i,
          word: it.word.trim(),
          meaning: it.meaning.trim(),
          pos: (it.pos || "").trim(),
          example: (it.example || "").trim(),
          day: lastDay,
        });
      });
      const merged = custom.concat(newEntries).map((w) => w.toJSON());
      this.provider.set(KEYS.customWords, merged);
      return {
        added: newEntries.length,
        fromDay: newEntries.length ? newEntries[0].day : 0,
        toDay: lastDay,
      };
    }

    /* ---------- 오답노트 ---------- */
    loadWrongNotes() {
      const arr = this.provider.get(KEYS.wrong) || [];
      return arr.map((o) => M.WrongNote.fromJSON(o));
    }
    saveWrongNotes(notes) {
      this.provider.set(KEYS.wrong, notes.map((n) => n.toJSON()));
    }
    /** 오답 기록 추가 */
    recordWrong(itemIds, source) {
      const notes = this.loadWrongNotes();
      const today = new Date().toISOString().slice(0, 10);
      itemIds.forEach((id) => {
        const found = notes.find((n) => n.itemId === id);
        if (found) {
          found.wrongCount += 1;
          found.lastWrongDate = today;
          if (found.sources.indexOf(source) === -1) found.sources.push(source);
        } else {
          notes.push(new M.WrongNote({ itemId: id, sources: [source] }));
        }
      });
      this.saveWrongNotes(notes);
    }
    /** 오답 재시험에서 맞힌 단어 처리: 1회 틀림이면 제거, 아니면 카운트 감소 */
    resolveWrong(itemIds) {
      let notes = this.loadWrongNotes();
      notes = notes
        .map((n) => {
          if (itemIds.indexOf(n.itemId) !== -1) n.wrongCount -= 1;
          return n;
        })
        .filter((n) => n.wrongCount > 0);
      this.saveWrongNotes(notes);
    }

    /* ---------- 시험 결과 ---------- */
    loadResults() {
      const arr = this.provider.get(KEYS.results) || [];
      return arr.map((o) => M.QuizResult.fromJSON(o));
    }
    addResult(result) {
      const arr = this.provider.get(KEYS.results) || [];
      arr.push(result.toJSON());
      this.provider.set(KEYS.results, arr);
    }

    /* ---------- 확장 콘텐츠 (문법/토익) ---------- */
    loadLibrary() {
      const arr = this.provider.get(KEYS.library) || [];
      return arr.map((o) => {
        if (o.type === "grammar") return M.GrammarItem.fromJSON(o);
        if (o.type === "toeic") return M.ToeicQuestion.fromJSON(o);
        return null;
      }).filter(Boolean);
    }
    appendLibrary(items) {
      const arr = this.provider.get(KEYS.library) || [];
      items.forEach((it) => arr.push(it.toJSON()));
      this.provider.set(KEYS.library, arr);
    }

    /* ---------- 백업 ---------- */
    exportAll() {
      return {
        app: "vocaloop",
        version: 1,
        exportedAt: new Date().toISOString(),
        state: this.provider.get(KEYS.state),
        wrong: this.provider.get(KEYS.wrong),
        results: this.provider.get(KEYS.results),
        customWords: this.provider.get(KEYS.customWords),
        library: this.provider.get(KEYS.library),
      };
    }
    importAll(data) {
      if (!data || data.app !== "vocaloop") throw new Error("VocaLoop 백업 파일이 아닙니다.");
      if (data.state) this.provider.set(KEYS.state, data.state);
      if (data.wrong) this.provider.set(KEYS.wrong, data.wrong);
      if (data.results) this.provider.set(KEYS.results, data.results);
      if (data.customWords) this.provider.set(KEYS.customWords, data.customWords);
      if (data.library) this.provider.set(KEYS.library, data.library);
    }
    resetAll() {
      Object.keys(KEYS).forEach((k) => this.provider.remove(KEYS[k]));
    }
  }

  window.Storage2.Repository = Repository;
  window.Storage2.KEYS = KEYS;
})();
