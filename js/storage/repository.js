/* ============================================================
 * Repository — 데이터 계층
 * 저장소(JSON)와 앱 코드(클래스) 사이의 변환을 전담한다.
 *
 * Day 배정 방식:
 *  - 단어 데이터에는 Day가 없다.
 *  - Day N을 처음 시작할 때 "아직 배정 안 된 단어" 중 무작위 30개를
 *    뽑아 배정표(assignments)에 기록하고, 이후에는 고정이다.
 *    → 복습/주간시험 범위가 흔들리지 않는다.
 *  - 새 단어 팩은 미배정 풀에 섞여 이후 날짜에 자연스럽게 등장한다.
 * ============================================================ */
(function () {
  "use strict";

  const M = window.Models;
  const WORDS_PER_DAY = 30;

  const KEYS = {
    state: "vocaloop.state",
    assignments: "vocaloop.assignments", // { "1": ["base-3", ...], "2": [...] }
    wrong: "vocaloop.wrong",
    results: "vocaloop.results",
    customWords: "vocaloop.customWords",
    wordExtras: "vocaloop.wordExtras", // 기존 단어에 병합된 추가 뜻 { 단어id: { meanings: [...] } }
    library: "vocaloop.library", // 문법/토익 등 확장 콘텐츠
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

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
    /** 전체 단어 (기본 + 추가). 병합된 추가 뜻(wordExtras)을 반영한다 */
    getAllWords() {
      const extras = this.provider.get(KEYS.wordExtras) || {};
      return this._getBaseWords().concat(this._getCustomWords()).map(function (w) {
        const ex = extras[w.id];
        if (ex && Array.isArray(ex.meanings)) {
          ex.meanings.forEach(function (m) {
            if (w.meanings.indexOf(m) === -1) w.meanings.push(m);
          });
        }
        return w;
      });
    }
    /** id → WordEntry 맵 */
    getWordMap() {
      const map = {};
      this.getAllWords().forEach((w) => { map[w.id] = w; });
      return map;
    }
    /**
     * 단어 팩 추가 (중복 차단 + 뜻 병합)
     *  - 새 단어      → 추가 (미배정 풀에 들어가 이후 무작위 등장)
     *  - 이미 있는 단어 + 새로운 뜻 → 기존 단어에 뜻 보강 (병합)
     *  - 이미 있는 단어 + 같은 뜻   → 제외
     * @param {Array<Object>} items [{word, meanings|meaning, pos, phonetic, example}]
     * @returns {{added:number, merged:number, skipped:number, skippedWords:string[]}}
     */
    appendWordPack(items) {
      const arr = this.provider.get(KEYS.customWords) || [];
      const extras = this.provider.get(KEYS.wordExtras) || {};
      const stamp = Date.now();
      const norm = function (w) { return String(w).trim().toLowerCase(); };

      // 기존 단어 색인: 소문자 단어 → WordEntry (병합된 뜻 포함 상태)
      const index = {};
      this.getAllWords().forEach(function (w) { index[norm(w.word)] = w; });

      let added = 0, merged = 0;
      const skippedWords = [];

      items.forEach(function (it, i) {
        const key = norm(it.word);
        const meanings = Array.isArray(it.meanings) && it.meanings.length
          ? it.meanings.map(function (m) { return String(m).trim(); }).filter(Boolean)
          : M.parseMeanings(it.meaning);
        const found = index[key];

        if (!found) {
          // 새 단어 추가 (팩 안 중복도 색인에 넣어 차단)
          const entry = new M.WordEntry({
            id: "cust-" + stamp + "-" + i,
            word: it.word.trim(),
            meanings: meanings,
            pos: (it.pos || "").trim(),
            phonetic: (it.phonetic || "").trim(),
            example: (it.example || "").trim(),
          });
          arr.push(entry.toJSON());
          index[key] = entry;
          added += 1;
          return;
        }

        // 이미 있는 단어: 새로운 뜻만 골라내기
        const newMeanings = meanings.filter(function (m) {
          return found.meanings.indexOf(m) === -1;
        });
        if (newMeanings.length) {
          const ex = extras[found.id] || { meanings: [] };
          newMeanings.forEach(function (m) {
            if (ex.meanings.indexOf(m) === -1) ex.meanings.push(m);
          });
          extras[found.id] = ex;
          newMeanings.forEach(function (m) { found.meanings.push(m); }); // 색인도 갱신
          merged += 1;
        } else {
          skippedWords.push(it.word.trim());
        }
      });

      this.provider.set(KEYS.customWords, arr);
      this.provider.set(KEYS.wordExtras, extras);
      return { added: added, merged: merged, skipped: skippedWords.length, skippedWords: skippedWords };
    }

    /* ---------- Day 배정표 ---------- */
    _getAssignments() {
      return this.provider.get(KEYS.assignments) || {};
    }
    _saveAssignments(a) {
      this.provider.set(KEYS.assignments, a);
    }
    /** 배정된 모든 단어 id Set */
    _assignedIdSet() {
      const a = this._getAssignments();
      const set = {};
      Object.keys(a).forEach(function (day) {
        a[day].forEach(function (id) { set[id] = true; });
      });
      return set;
    }
    /** 아직 배정되지 않은 단어들 */
    getUnassignedWords() {
      const assigned = this._assignedIdSet();
      return this.getAllWords().filter(function (w) { return !assigned[w.id]; });
    }
    /**
     * Day N의 배정을 보장한다. 없으면 미배정 풀에서 무작위 30개 추출.
     * @returns {WordEntry[]} 그날의 단어 (남은 게 없으면 빈 배열)
     */
    ensureAssignment(day) {
      const a = this._getAssignments();
      if (!a[day]) {
        const pool = this.getUnassignedWords();
        if (!pool.length) return [];
        a[day] = shuffle(pool).slice(0, WORDS_PER_DAY).map(function (w) { return w.id; });
        this._saveAssignments(a);
      }
      return this.getWordsForDay(day);
    }
    /** 특정 Day에 배정된 단어 (배정 전이면 빈 배열) */
    getWordsForDay(day) {
      const ids = this._getAssignments()[day] || [];
      const map = this.getWordMap();
      return ids.map(function (id) { return map[id]; }).filter(Boolean);
    }
    /** Day 1 ~ maxDay에 배정된 모든 단어 */
    getWordsUpToDay(maxDay) {
      const a = this._getAssignments();
      const map = this.getWordMap();
      const out = [];
      Object.keys(a).forEach(function (day) {
        if (parseInt(day, 10) <= maxDay) {
          a[day].forEach(function (id) { if (map[id]) out.push(map[id]); });
        }
      });
      return out;
    }
    /** 예상 총 Day 수 = 배정된 날 수 + 남은 단어로 만들 수 있는 날 수 */
    getTotalDays() {
      const assignedDays = Object.keys(this._getAssignments()).length;
      return assignedDays + Math.ceil(this.getUnassignedWords().length / WORDS_PER_DAY);
    }
    /** 완료한 날들에 배정됐던 단어 수 (홈 통계용) */
    getLearnedWordCount(completedCount) {
      return this.getWordsUpToDay(completedCount).length;
    }

    /**
     * 구버전 마이그레이션: 배정표 없이 completedCount만 있으면
     * (예전 "순서대로 30개" 방식) 그 규칙 그대로 배정표를 만들어 준다.
     */
    migrateLegacyAssignments(state) {
      if (state.completedCount > 0 && !this.provider.get(KEYS.assignments)) {
        const a = {};
        const base = this._getBaseWords();
        for (let d = 1; d <= state.completedCount; d++) {
          a[d] = base.slice((d - 1) * WORDS_PER_DAY, d * WORDS_PER_DAY)
                     .map(function (w) { return w.id; });
        }
        this._saveAssignments(a);
      }
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
    /** 확장 콘텐츠 추가 (중복 차단: 문법=title, 토익=question 기준) */
    appendLibrary(items) {
      const arr = this.provider.get(KEYS.library) || [];
      const norm = function (s) { return String(s || "").trim().toLowerCase(); };
      const seen = {};
      arr.forEach(function (o) {
        seen[o.type + "|" + norm(o.type === "grammar" ? o.title : o.question)] = true;
      });
      let added = 0, skipped = 0;
      items.forEach(function (it) {
        const key = it.type + "|" + norm(it.type === "grammar" ? it.title : it.question);
        if (seen[key]) { skipped += 1; return; }
        seen[key] = true;
        arr.push(it.toJSON());
        added += 1;
      });
      this.provider.set(KEYS.library, arr);
      return { added: added, skipped: skipped };
    }

    /* ---------- 백업 ---------- */
    exportAll() {
      return {
        app: "vocaloop",
        version: 2,
        exportedAt: new Date().toISOString(),
        state: this.provider.get(KEYS.state),
        assignments: this.provider.get(KEYS.assignments),
        wrong: this.provider.get(KEYS.wrong),
        results: this.provider.get(KEYS.results),
        customWords: this.provider.get(KEYS.customWords),
        wordExtras: this.provider.get(KEYS.wordExtras),
        library: this.provider.get(KEYS.library),
      };
    }
    importAll(data) {
      if (!data || data.app !== "vocaloop") throw new Error("VocaLoop 백업 파일이 아닙니다.");
      if (data.state) this.provider.set(KEYS.state, data.state);
      if (data.assignments) this.provider.set(KEYS.assignments, data.assignments);
      if (data.wrong) this.provider.set(KEYS.wrong, data.wrong);
      if (data.results) this.provider.set(KEYS.results, data.results);
      if (data.customWords) this.provider.set(KEYS.customWords, data.customWords);
      if (data.wordExtras) this.provider.set(KEYS.wordExtras, data.wordExtras);
      if (data.library) this.provider.set(KEYS.library, data.library);
      // v1 백업(배정표 없음) 호환
      this.migrateLegacyAssignments(this.loadState());
    }
    resetAll() {
      Object.keys(KEYS).forEach((k) => this.provider.remove(KEYS[k]));
    }
  }

  window.Storage2.Repository = Repository;
  window.Storage2.KEYS = KEYS;
})();
