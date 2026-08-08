(function () {
  'use strict';

  const STORAGE_KEY = 'reino_diferencial_scorm_state';
  const PASSING_SCORE = 3.0;

  function findApi(startWindow) {
    let current = startWindow;
    let attempts = 0;
    while (current && attempts < 20) {
      try {
        if (current.API_1484_11) return { api: current.API_1484_11, version: '2004' };
        if (current.API) return { api: current.API, version: '1.2' };
        if (current.parent && current.parent !== current) current = current.parent;
        else break;
      } catch (_) {
        break;
      }
      attempts += 1;
    }

    try {
      if (window.opener && window.opener !== window) return findApi(window.opener);
    } catch (_) {}
    return null;
  }

  function isTrue(value) {
    return String(value).toLowerCase() === 'true';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function scorm12Time(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function scorm2004Duration(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `PT${h}H${m}M${s}S`;
  }

  const bridge = {
    api: null,
    version: null,
    initialized: false,
    terminated: false,
    startedAt: Date.now(),
    lastScore: 0,
    lastAnswered: 0,

    initialize() {
      if (this.initialized) return true;
      const found = findApi(window);
      if (!found) {
        this.restoreLocal();
        return false;
      }

      this.api = found.api;
      this.version = found.version;
      try {
        const response = this.version === '2004'
          ? this.api.Initialize('')
          : this.api.LMSInitialize('');
        this.initialized = isTrue(response);
      } catch (error) {
        console.warn('No fue posible inicializar SCORM.', error);
        this.initialized = false;
      }

      if (this.initialized) {
        this.setExit('suspend');
        const status = this.getValue(
          'cmi.core.lesson_status',
          'cmi.completion_status'
        );
        if (!status || status === 'not attempted' || status === 'unknown') {
          if (this.version === '2004') this.setValue('cmi.core.lesson_status', 'cmi.completion_status', 'incomplete');
          else this.setValue('cmi.core.lesson_status', 'cmi.completion_status', 'incomplete');
        }
        this.commit();
      }
      return this.initialized;
    },

    getValue(key12, key2004) {
      if (!this.initialized || !this.api) return '';
      try {
        return this.version === '2004'
          ? this.api.GetValue(key2004)
          : this.api.LMSGetValue(key12);
      } catch (_) {
        return '';
      }
    },

    setValue(key12, key2004, value) {
      if (!this.initialized || !this.api) return false;
      try {
        const response = this.version === '2004'
          ? this.api.SetValue(key2004, String(value))
          : this.api.LMSSetValue(key12, String(value));
        return isTrue(response);
      } catch (_) {
        return false;
      }
    },

    commit() {
      if (!this.initialized || !this.api || this.terminated) return false;
      try {
        const response = this.version === '2004'
          ? this.api.Commit('')
          : this.api.LMSCommit('');
        return isTrue(response);
      } catch (_) {
        return false;
      }
    },

    setExit(value) {
      this.setValue('cmi.core.exit', 'cmi.exit', value);
    },

    saveLocal(score, answered) {
      const state = {
        score,
        answered,
        updatedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_) {}
    },

    restoreLocal() {
      try {
        const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        this.lastScore = clamp(state.score, 0, 5);
        this.lastAnswered = Math.max(0, Number(state.answered) || 0);
      } catch (_) {}
    },

    saveScore(score, answered) {
      const normalizedScore = clamp(score, 0, 5);
      const answeredCount = Math.max(0, Number(answered) || 0);
      this.lastScore = normalizedScore;
      this.lastAnswered = answeredCount;
      this.saveLocal(normalizedScore, answeredCount);

      if (!this.initialized) this.initialize();
      if (!this.initialized) return false;

      this.setValue('cmi.core.score.raw', 'cmi.score.raw', normalizedScore.toFixed(2));
      this.setValue('cmi.core.score.min', 'cmi.score.min', '0');
      this.setValue('cmi.core.score.max', 'cmi.score.max', '5');
      if (this.version === '2004') {
        this.setValue('cmi.score.scaled', 'cmi.score.scaled', (normalizedScore / 5).toFixed(4));
      }

      const suspendData = JSON.stringify({
        score: normalizedScore,
        answered: answeredCount,
        updatedAt: new Date().toISOString()
      });
      this.setValue('cmi.suspend_data', 'cmi.suspend_data', suspendData);
      this.setExit('suspend');
      return this.commit();
    },

    saveSessionTime() {
      if (!this.initialized) return;
      const seconds = (Date.now() - this.startedAt) / 1000;
      this.setValue(
        'cmi.core.session_time',
        'cmi.session_time',
        this.version === '2004' ? scorm2004Duration(seconds) : scorm12Time(seconds)
      );
    },

    finish() {
      if (this.terminated) return true;
      if (!this.initialized) this.initialize();
      if (!this.initialized) return false;

      this.saveScore(this.lastScore, this.lastAnswered);
      this.saveSessionTime();
      const passed = this.lastScore >= PASSING_SCORE;

      if (this.version === '2004') {
        this.setValue('cmi.core.lesson_status', 'cmi.completion_status', 'completed');
        this.setValue('cmi.success_status', 'cmi.success_status', passed ? 'passed' : 'failed');
      } else {
        this.setValue('cmi.core.lesson_status', 'cmi.completion_status', passed ? 'passed' : 'failed');
      }
      this.setExit('');
      this.commit();

      try {
        const response = this.version === '2004'
          ? this.api.Terminate('')
          : this.api.LMSFinish('');
        this.terminated = isTrue(response);
      } catch (_) {
        this.terminated = false;
      }
      return this.terminated;
    }
  };

  window.SCORMBridge = bridge;

  window.addEventListener('DOMContentLoaded', function () {
    bridge.initialize();
  });

  window.addEventListener('beforeunload', function () {
    if (!bridge.initialized || bridge.terminated) return;
    bridge.saveSessionTime();
    bridge.setExit('suspend');
    bridge.commit();
  });
}());
