window.KedrixOnePracticeOpenEdit = (() => {
  'use strict';

  function flashNodes(nodes = []) {
    nodes.filter(Boolean).forEach((node) => {
      node.classList.add('flash-focus');
      window.setTimeout(() => node.classList.remove('flash-focus'), 1600);
    });
  }

  function focusEditor(options = {}) {
    const {
      main = document,
      source = 'manual',
      practiceId = ''
    } = options;

    const run = () => {
      const editorSection = document.getElementById('practiceEditorSection') || document.getElementById('practiceForm');
      const editBanner = document.getElementById('practiceEditBanner');
      const verificationBanner = document.getElementById('practiceVerificationBanner');
      const activeTab = document.querySelector('[data-practice-tab].active')?.dataset?.practiceTab || '';
      const activeDynamicField = document.querySelector('#practiceDynamicFields input, #practiceDynamicFields select, #practiceDynamicFields textarea');
      const primaryField = source === 'save'
        ? (activeDynamicField || document.getElementById('clientName') || document.getElementById('practiceType'))
        : activeTab && activeTab !== 'start'
          ? (activeDynamicField || document.getElementById('clientName') || document.getElementById('practiceType'))
          : (document.getElementById('clientName') || activeDynamicField || document.getElementById('practiceType'));

      flashNodes([editorSection, editBanner, verificationBanner]);

      if (editorSection) {
        const topbar = document.querySelector('.topbar');
        const topOffset = (topbar ? topbar.offsetHeight : 0) + 18;
        const targetTop = Math.max(0, window.pageYOffset + editorSection.getBoundingClientRect().top - topOffset);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
        window.setTimeout(() => window.scrollTo({ top: targetTop, behavior: 'smooth' }), 220);
      }

      if (primaryField && typeof primaryField.focus === 'function') {
        primaryField.focus({ preventScroll: true });
      }

      const tableRow = practiceId ? main.querySelector(`tr[data-practice-id="${practiceId}"]`) : null;
      if (tableRow) {
        tableRow.classList.add('flash-row');
        window.setTimeout(() => tableRow.classList.remove('flash-row'), 1600);
      }

      if (source === 'search') {
        const previewCard = document.getElementById('practiceSearchPreview');
        const activeResult = practiceId ? main.querySelector(`.practice-search-result[data-practice-id="${practiceId}"]`) : null;
        flashNodes([previewCard, activeResult]);
      }
    };

    window.requestAnimationFrame(() => {
      run();
      window.requestAnimationFrame(run);
    });
  }

  function openForEditing(practiceId, options = {}) {
    if (!practiceId) return;
    const {
      source = 'manual',
      state,
      main = document,
      save,
      render,
      loadPracticeIntoDraft
    } = options;

    if (!state || typeof save !== 'function' || typeof render !== 'function' || typeof loadPracticeIntoDraft !== 'function') return;

    loadPracticeIntoDraft(practiceId);
    state._practiceValidationErrors = [];
    state.practiceSearchPreviewId = source === 'search' ? practiceId : '';
    state.practiceOpenSource = source;
    save();
    render();
    focusEditor({ main, source, practiceId });
  }


  function bindOpenTriggers(options = {}) {
    const { main = document, openPracticeForEditing } = options;
    if (!main || typeof openPracticeForEditing !== 'function') return;

    main.querySelectorAll('[data-practice-id]').forEach((node) => {
      if (node.dataset.boundOpenTrigger === '1') return;
      node.dataset.boundOpenTrigger = '1';
      node.addEventListener('click', () => {
        const practiceId = node.dataset.practiceId;
        const source = node.classList.contains('practice-search-result') ? 'search' : 'list';
        openPracticeForEditing(practiceId, { source });
      });
    });

    main.querySelectorAll('[data-open-practice-id]').forEach((node) => {
      if (node.dataset.boundOpenTrigger === '1') return;
      node.dataset.boundOpenTrigger = '1';
      node.addEventListener('click', (event) => {
        event.stopPropagation();
        const practiceId = node.dataset.openPracticeId;
        openPracticeForEditing(practiceId, { source: 'search' });
      });
    });
  }

  return {
    bindOpenTriggers,
    focusEditor,
    openForEditing
  };
})();
