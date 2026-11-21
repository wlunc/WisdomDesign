/* Wisdom Design PWA — hub + viewer behaviour. */
(function () {
  'use strict';

  var MODES = ['light', 'dark', 'pair'];
  var DEFAULT_DOC = 'components';
  var THEMES = { preview: 'lake', components: 'brand', advanced: 'deep', patterns: 'mid' };

  var ICON = {
    layers:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>',
    grid:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    sliders:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h8"/><path d="M17 7h3"/><circle cx="14" cy="7" r="2.2"/><path d="M4 12h3"/><path d="M12 12h8"/><circle cx="9" cy="12" r="2.2"/><path d="M4 17h10"/><path d="M19 17h1"/><circle cx="16.5" cy="17" r="2.2"/></svg>',
    blocks:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M17 13v8"/><path d="M13 17h8"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
    chevron:
      '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    back:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    share:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/></svg>',
    install:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v11"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12"/><path d="m18 6-12 12"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
  };

  var Store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {}
    },
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(
      /[&<>"']/g,
      function (character) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
      },
    );
  }

  function isIOS() {
    return (
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  var toastTimer = null;
  function showToast(message) {
    var toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  // ------------------------------------------------------------------
  // Service worker + connectivity
  // ------------------------------------------------------------------

  var swState = 'pending';

  function registerServiceWorker() {
    if (!window.isSecureContext) {
      setSwState('insecure');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      setSwState('unsupported');
      return;
    }

    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then(function (registration) {
        if (navigator.serviceWorker.controller) setSwState('ready');
        navigator.serviceWorker.ready
          .then(function () {
            setSwState('ready');
          })
          .catch(function () {
            setSwState('error');
          });

        registration.addEventListener('updatefound', function () {
          var worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('新版本已就绪，重新打开即可更新');
            }
          });
        });
      })
      .catch(function () {
        setSwState(window.isSecureContext ? 'error' : 'insecure');
      });
  }

  function setSwState(state) {
    swState = state;
    renderStatus();
  }

  function renderStatus() {
    var online = navigator.onLine;
    var statusText = $('#status-text');
    var statusDot = $('#status-dot');
    var footerDot = $('#footer-dot');
    var footerStatus = $('#footer-status');
    var offlineText = $('#offline-text');
    var offlineDot = $('#offline-dot');

    var label = '在线';
    var footer = '在线 · 首次打开后会自动缓存';
    var hero = '在线查看';
    var tone = 'muted';

    if (!online) {
      label = '离线';
      footer = '当前离线 · 已缓存的内容仍可查看';
      hero = '离线查看';
      tone = 'warn';
    } else if (swState === 'ready') {
      label = '离线就绪';
      footer = '离线缓存已就绪 · 断网也能看';
      hero = '离线可用';
      tone = 'ready';
    } else if (swState === 'insecure') {
      label = '在线';
      footer = 'HTTP 访问下无离线缓存 · 部署 HTTPS 后可用';
      hero = '在线查看';
      tone = 'warn';
    } else if (swState === 'unsupported') {
      footer = '当前浏览器不支持离线缓存';
    } else if (swState === 'error') {
      footer = '离线缓存注册失败 · 内容仍可在线查看';
    }

    if (statusText) statusText.textContent = label;
    if (statusDot) {
      statusDot.classList.toggle('is-warn', tone === 'warn');
      statusDot.classList.toggle('is-muted', tone === 'muted');
    }
    if (footerStatus) footerStatus.textContent = footer;
    if (footerDot) {
      footerDot.classList.toggle('is-warn', tone === 'warn');
      footerDot.classList.toggle('is-muted', tone === 'muted');
    }
    if (offlineText) offlineText.textContent = hero;
    if (offlineDot) {
      offlineDot.classList.toggle('is-warn', tone === 'warn');
    }
  }

  function bindConnectivity() {
    window.addEventListener('online', renderStatus);
    window.addEventListener('offline', renderStatus);
    renderStatus();
  }

  // ------------------------------------------------------------------
  // Data
  // ------------------------------------------------------------------

  function loadIndex() {
    return fetch('./data/index.json', { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    });
  }

  function setText(selector, text) {
    var node = $(selector);
    if (node) node.textContent = text;
  }

  // ------------------------------------------------------------------
  // Hub
  // ------------------------------------------------------------------

  function setupInstall() {
    var card = $('#install-card');
    if (!card) return;
    if (isStandalone()) {
      card.hidden = true;
      return;
    }
    if (Store.get('wd:install-dismissed', false)) return;

    var title = $('#install-title');
    var text = $('#install-text');
    var action = $('#install-action');
    var dismiss = $('#install-dismiss');
    var headerButton = $('#install-button');
    var deferredPrompt = null;

    function show(mode) {
      if (mode === 'prompt') {
        if (title) title.textContent = '安装到手机桌面';
        if (text) text.textContent = '安装后从桌面直接打开，断网也能查看设计稿。';
        if (action) {
          action.hidden = false;
          action.textContent = '安装';
        }
      } else if (mode === 'ios') {
        if (title) title.textContent = '添加到主屏幕';
        if (text) {
          text.textContent = '点 Safari 底部的分享按钮，再选「添加到主屏幕」，以后就能一秒打开。';
        }
        if (action) action.hidden = true;
      } else if (mode === 'insecure') {
        if (title) title.textContent = '想要离线安装？';
        if (text) {
          text.textContent =
            '当前通过 HTTP 访问，浏览器不会启用离线缓存。仍可用浏览器菜单「添加到主屏幕」做快捷方式；部署到 HTTPS 后可安装为完整 PWA。';
        }
        if (action) action.hidden = true;
      } else {
        if (title) title.textContent = '收藏这个页面';
        if (text) text.textContent = '当前浏览器不支持安装，可以把页面加入书签或主屏幕快捷方式。';
        if (action) action.hidden = true;
      }
      card.hidden = false;
    }

    function promptInstall() {
      if (!deferredPrompt) return;
      var prompt = deferredPrompt;
      deferredPrompt = null;
      if (headerButton) headerButton.hidden = true;
      prompt.prompt();
      prompt.userChoice
        .then(function (choice) {
          if (choice.outcome === 'accepted') {
            card.hidden = true;
            showToast('正在安装…');
          } else {
            showToast('已取消安装');
          }
        })
        .catch(function () {});
    }

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
      if (headerButton) headerButton.hidden = false;
      show('prompt');
    });

    window.addEventListener('appinstalled', function () {
      card.hidden = true;
      if (headerButton) headerButton.hidden = true;
      showToast('已安装到桌面');
    });

    if (action) action.addEventListener('click', promptInstall);
    if (headerButton) headerButton.addEventListener('click', promptInstall);
    if (dismiss) {
      dismiss.addEventListener('click', function () {
        card.hidden = true;
        Store.set('wd:install-dismissed', true);
      });
    }

    if (isIOS()) show('ios');
    else if (!window.isSecureContext) show('insecure');
  }

  function initHub() {
    var grid = $('#gallery-grid');
    var list = $('#spec-list');
    var filters = $('#filters');
    var input = $('#spec-search');
    var clear = $('#search-clear');
    var resultLine = $('#result-line');
    var showAll = $('#show-all');
    var errorBox = $('#load-error');
    var retry = $('#retry-button');
    if (retry) {
      retry.addEventListener('click', function () {
        window.location.reload();
      });
    }

    var state = { filter: 'all', query: '', expanded: false };

    var initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery) {
      state.query = initialQuery.trim().toLowerCase();
      if (input) input.value = initialQuery;
    }

    loadIndex()
      .then(function (index) {
        if (errorBox) errorBox.hidden = true;
        renderHub(index);
      })
      .catch(function (error) {
        console.warn('Wisdom PWA index failed to load', error);
        if (errorBox) errorBox.hidden = false;
      });

    function renderHub(index) {
      setText('#stat-galleries', index.totals.galleries);
      setText('#stat-specs', index.totals.specs);
      setText('#gallery-note', index.totals.galleries + ' 份 · ' + index.totals.specs + ' 个条目');
      setText('#spec-count', index.totals.specs + ' 个条目');
      setText('#build-version', 'build ' + index.version);

      if (grid) {
        grid.innerHTML = '';
        index.galleries.forEach(function (gallery, position) {
          var card = document.createElement('a');
          card.className = 'gallery-card is-entering';
          card.href = './viewer.html?doc=' + encodeURIComponent(gallery.id);
          card.setAttribute('aria-label', '打开' + gallery.title + '，' + gallery.meta);
          card.style.animationDelay = position * 45 + 'ms';
          var theme = gallery.theme || THEMES[gallery.id] || 'brand';
          var icon = ICON[gallery.icon] || ICON.grid;
          card.innerHTML =
            '<span class="gallery-card__icon gallery-card__icon--' +
            esc(theme) +
            '">' +
            icon +
            '</span>' +
            '<span class="gallery-card__kicker">' +
            esc(gallery.kicker) +
            '</span>' +
            '<span class="gallery-card__title">' +
            esc(gallery.title) +
            '</span>' +
            '<span class="gallery-card__desc">' +
            esc(gallery.description) +
            '</span>' +
            '<span class="gallery-card__foot"><span class="gallery-card__count">' +
            esc(gallery.meta) +
            '</span>' +
            ICON.chevron +
            '</span>';
          grid.appendChild(card);
        });
      }

      var galleryById = {};
      index.galleries.forEach(function (gallery) {
        galleryById[gallery.id] = gallery;
      });

      var filtersData = [{ id: 'all', title: '全部', count: index.totals.specs }].concat(
        index.galleries
          .filter(function (gallery) {
            return gallery.id !== 'preview' && gallery.count > 0;
          })
          .map(function (gallery) {
            return { id: gallery.id, title: gallery.title, count: gallery.count };
          }),
      );

      function renderFilters() {
        if (!filters) return;
        filters.innerHTML = '';
        filtersData.forEach(function (entry) {
          var button = document.createElement('button');
          button.type = 'button';
          button.className = 'chip';
          button.dataset.filter = entry.id;
          button.setAttribute('aria-pressed', String(state.filter === entry.id));
          button.innerHTML = esc(entry.title) + '<b>' + esc(entry.count) + '</b>';
          filters.appendChild(button);
        });
      }

      function renderSpecs() {
        if (!list) return;
        var query = state.query;
        var matches = index.specs.filter(function (spec) {
          if (state.filter !== 'all' && spec.gallery !== state.filter) return false;
          if (!query) return true;
          var gallery = galleryById[spec.gallery] || {};
          var haystack = [spec.name, spec.no, spec.tier, spec.desc, gallery.title, gallery.kicker]
            .join(' ')
            .toLowerCase();
          return haystack.indexOf(query) !== -1;
        });

        var limit = state.expanded || query ? matches.length : state.filter === 'all' ? 12 : matches.length;
        var visible = matches.slice(0, limit);
        list.innerHTML = '';

        if (!matches.length) {
          var empty = document.createElement('div');
          empty.className = 'empty';
          empty.textContent = '没有匹配的组件，换个关键词试试。';
          list.appendChild(empty);
        } else {
          visible.forEach(function (spec) {
            var gallery = galleryById[spec.gallery] || { title: spec.gallery };
            var row = document.createElement('a');
            row.className = 'spec-row';
            row.href =
              './viewer.html?doc=' +
              encodeURIComponent(spec.gallery) +
              '&spec=' +
              encodeURIComponent(spec.id);
            row.setAttribute('aria-label', spec.name + '，' + gallery.title);
            row.innerHTML =
              '<span class="spec-row__no">' +
              esc(spec.no) +
              '</span>' +
              '<span class="spec-row__body"><span class="spec-row__name">' +
              esc(spec.name) +
              (spec.tier ? '<span class="spec-row__tier">' + esc(spec.tier) + '</span>' : '') +
              '</span><span class="spec-row__desc">' +
              esc(spec.desc || gallery.title) +
              '</span></span>' +
              '<span class="spec-row__gallery">' +
              esc(gallery.title) +
              '</span>' +
              '<svg class="spec-row__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
            list.appendChild(row);
          });
        }

        if (showAll) {
          showAll.hidden = !(visible.length < matches.length);
          showAll.textContent = '查看全部 ' + matches.length + ' 个';
        }

        if (clear) clear.hidden = !input || !input.value;

        if (resultLine) {
          var summary = '';
          if (query) {
            summary = '匹配 ' + matches.length + ' 个条目';
          } else if (state.filter !== 'all') {
            var active = filtersData.filter(function (entry) {
              return entry.id === state.filter;
            })[0];
            summary = (active ? active.title + ' · ' : '') + matches.length + ' 个条目';
          } else {
            summary = '共 ' + matches.length + ' 个条目';
          }
          if (visible.length < matches.length) summary += ' · 显示 ' + visible.length;
          resultLine.textContent = summary;
        }
      }

      if (filters) {
        filters.addEventListener('click', function (event) {
          var button = event.target.closest('button[data-filter]');
          if (!button) return;
          state.filter = button.dataset.filter;
          state.expanded = false;
          renderFilters();
          renderSpecs();
        });
      }

      if (input) {
        input.addEventListener('input', function () {
          state.query = input.value.trim().toLowerCase();
          state.expanded = false;
          renderSpecs();
        });
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            input.value = '';
            state.query = '';
            state.expanded = false;
            renderSpecs();
          }
        });
      }

      if (clear) {
        clear.addEventListener('click', function () {
          if (input) input.value = '';
          state.query = '';
          state.expanded = false;
          renderSpecs();
          if (input) input.focus();
        });
      }

      if (showAll) {
        showAll.addEventListener('click', function () {
          state.expanded = true;
          renderSpecs();
        });
      }

      renderFilters();
      renderSpecs();
    }
  }

  // ------------------------------------------------------------------
  // Viewer
  // ------------------------------------------------------------------

  function initViewer() {
    var frame = $('#doc-frame');
    var loading = $('#viewer-loading');
    var errorBox = $('#viewer-error');
    var heading = $('#viewer-title');
    var subheading = $('#viewer-subtitle');
    var modeToggle = $('#mode-toggle');
    var back = $('#viewer-back');
    var share = $('#viewer-share');

    var params = new URLSearchParams(window.location.search);
    var requestedDoc = params.get('doc') || DEFAULT_DOC;
    var requestedSpec = params.get('spec') || '';
    var requestedMode = params.get('mode');

    var fallbackGallery = {
      id: DEFAULT_DOC,
      title: '基础组件',
      fullTitle: '基础组件规格画廊',
      kicker: '01–20',
      file: 'docs/wisdom-components.html',
      hasModes: true,
      meta: '20 个组件',
    };

    loadIndex()
      .then(function (index) {
        var gallery =
          index.galleries.filter(function (item) {
            return item.id === requestedDoc;
          })[0] ||
          index.galleries.filter(function (item) {
            return item.id === DEFAULT_DOC;
          })[0] ||
          index.galleries[0] ||
          fallbackGallery;
        var spec =
          index.specs.filter(function (item) {
            return item.gallery === gallery.id && item.id === requestedSpec;
          })[0] || null;
        start(index, gallery, spec);
      })
      .catch(function (error) {
        console.warn('Wisdom PWA index unavailable, using fallback', error);
        start(null, fallbackGallery, null);
      });

    function resolveMode(gallery) {
      if (!gallery.hasModes) return null;
      if (MODES.indexOf(requestedMode) !== -1) return requestedMode;
      var saved = Store.get('wd:mode', null);
      if (MODES.indexOf(saved) !== -1) return saved;
      return window.matchMedia('(max-width: 560px)').matches ? 'light' : 'pair';
    }

    function start(index, gallery, spec) {
      var currentMode = resolveMode(gallery);
      var currentSpec = spec;

      if (heading) heading.textContent = spec ? spec.name : gallery.title;
      if (subheading) {
        subheading.textContent = spec
          ? gallery.title + ' · ' + spec.no
          : gallery.fullTitle || gallery.title;
      }
      document.title =
        (spec ? spec.name + ' · ' : '') + gallery.title + ' · Wisdom Design';

      if (!gallery.hasModes) {
        if (modeToggle) modeToggle.hidden = true;
      } else {
        $$('[data-mode]', modeToggle).forEach(function (button) {
          button.setAttribute('aria-pressed', String(button.dataset.mode === currentMode));
        });
      }

      function syncMode() {
        if (!frame || !gallery.hasModes) return;
        try {
          if (frame.contentWindow && frame.contentWindow.__wdPwaSetMode) {
            frame.contentWindow.__wdPwaSetMode(currentMode);
          }
        } catch (_) {}
      }

      function updateModeButtons() {
        if (!modeToggle) return;
        $$('[data-mode]', modeToggle).forEach(function (button) {
          button.setAttribute('aria-pressed', String(button.dataset.mode === currentMode));
        });
      }

      function setMode(mode) {
        if (MODES.indexOf(mode) === -1) return;
        currentMode = mode;
        Store.set('wd:mode', mode);
        updateModeButtons();
        syncMode();
      }

      if (modeToggle && gallery.hasModes) {
        modeToggle.addEventListener('click', function (event) {
          var button = event.target.closest('button[data-mode]');
          if (!button) return;
          setMode(button.dataset.mode);
        });
      }

      window.addEventListener('message', function (event) {
        if (event.origin !== window.location.origin) return;
        var data = event.data;
        if (data && data.type === 'wd:mode' && MODES.indexOf(data.mode) !== -1) {
          currentMode = data.mode;
          Store.set('wd:mode', data.mode);
          updateModeButtons();
        }
      });

      function scrollToSpec() {
        if (!currentSpec || !frame) return;
        try {
          var doc = frame.contentDocument;
          var target = doc && doc.getElementById(currentSpec.id);
          if (target) target.scrollIntoView({ block: 'start' });
        } catch (_) {}
      }

      if (frame) {
        var query = [];
        if (gallery.hasModes && currentMode) query.push('mode=' + encodeURIComponent(currentMode));
        var hash = currentSpec ? '#' + encodeURIComponent(currentSpec.id) : '';

        frame.addEventListener('load', function () {
          if (loading) {
            loading.classList.add('is-done');
            window.setTimeout(function () {
              loading.hidden = true;
            }, 260);
          }
          syncMode();
          if (currentSpec) {
            window.setTimeout(scrollToSpec, 60);
            window.setTimeout(scrollToSpec, 360);
          }
        });

        frame.title = gallery.fullTitle || gallery.title;
        frame.src =
          './' +
          gallery.file +
          (query.length ? '?' + query.join('&') : '') +
          hash;

        window.setTimeout(function () {
          if (loading && !loading.classList.contains('is-done')) {
            loading.classList.add('is-done');
            loading.hidden = true;
            if (errorBox) errorBox.hidden = false;
          }
        }, 9000);
      }

      if (back) {
        back.addEventListener('click', function (event) {
          event.preventDefault();
          var sameOriginReferrer = false;
          try {
            sameOriginReferrer =
              !!document.referrer &&
              new URL(document.referrer).origin === window.location.origin;
          } catch (_) {}
          if (sameOriginReferrer && window.history.length > 1) window.history.back();
          else window.location.replace('./');
        });
      }

      if (share) {
        share.addEventListener('click', function () {
          var shareData = { title: document.title, url: window.location.href };
          if (navigator.share) {
            navigator.share(shareData).catch(function (error) {
              if (error && error.name === 'AbortError') return;
              copyLink();
            });
            return;
          }
          copyLink();
        });
      }

      function copyLink() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(window.location.href)
            .then(function () {
              showToast('链接已复制');
            })
            .catch(function () {
              window.prompt('复制链接', window.location.href);
            });
        } else {
          window.prompt('复制链接', window.location.href);
        }
      }

      if (errorBox) errorBox.hidden = true;
    }
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------

  function boot() {
    bindConnectivity();
    registerServiceWorker();

    if (document.body.classList.contains('viewer')) {
      initViewer();
    } else {
      setupInstall();
      initHub();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
