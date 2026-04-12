window.KedrixOneDepartureNoticeModule = (() => {
  'use strict';

  const U = window.KedrixOneUtils || { escapeHtml: (value) => String(value || '') };
  const Workspace = window.KedrixOneDepartureNoticeWorkspace || null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function ensureState(state) {
    if (!Workspace || typeof Workspace.ensureState !== 'function') return null;
    Workspace.ensureState(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!Array.isArray(state.departureNoticeRecords)) state.departureNoticeRecords = [];
    return state.departureNoticeWorkspace;
  }

  function currentOperatorName(state) {
    const activeUserId = String(state?.activeUserId || '').trim();
    const user = (state?.users || []).find((entry) => String(entry?.id || '').trim() === activeUserId) || null;
    return String(user?.name || '').trim();
  }

  function inferTripType(practice) {
    const type = String(practice?.practiceType || '').toLowerCase();
    if (type.includes('air')) return 'AEREO';
    if (type.includes('road') || type.includes('terra')) return 'TERRA';
    return 'MARE';
  }

  function createEmptyDraft(state, overrides = {}) {
    return Workspace.cloneDraft({
      editingRecordId: '',
      practiceId: '',
      practiceReference: '',
      practiceType: '',
      status: 'draft',
      client: '',
      sender: '',
      destinationDepot: '',
      importer: '',
      consignee: '',
      notifyParty: '',
      reference: '',
      attentionTo: '',
      tripType: 'MARE',
      compileLocation: '',
      documentDate: today(),
      loadingPort: '',
      atd: '',
      unloadingPort: '',
      supplierInvoice: '',
      amount: '',
      goodsType: '',
      voyage: '',
      vessel: '',
      deliveryConditions: '',
      originGoods: '',
      bookingReference: '',
      policyReference: '',
      originalNo: '',
      originalCopyCount: '',
      operatorName: currentOperatorName(state),
      documentReceiptDate: '',
      customsSection: '',
      emptyingAppointmentDate: '',
      internalText: '',
      customerText: '',
      sourcePracticeSnapshot: {},
      lineItems: [Workspace.defaultLineItem()],
      ...overrides
    });
  }

  function buildDraftFromPractice(state, practice) {
    const dynamic = practice?.dynamicData || {};
    const booking = String(practice?.booking || dynamic.booking || '').trim();
    const containerCode = String(practice?.containerCode || dynamic.containerCode || '').trim();
    const description = String(practice?.goodsDescription || dynamic.goodsDescription || '').trim();
    return createEmptyDraft(state, {
      practiceId: String(practice?.id || '').trim(),
      practiceReference: String(practice?.reference || '').trim(),
      practiceType: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
      status: String(practice?.status || 'draft').trim() || 'draft',
      client: String(practice?.clientName || practice?.client || '').trim(),
      sender: String(dynamic.senderParty || dynamic.exporter || dynamic.shipper || '').trim(),
      destinationDepot: String(dynamic.destinationDepot || dynamic.depot || '').trim(),
      importer: String(dynamic.importer || '').trim(),
      consignee: String(dynamic.consignee || dynamic.receiverParty || '').trim(),
      notifyParty: String(dynamic.notifyParty || '').trim(),
      reference: String(dynamic.mainReference || practice?.reference || '').trim(),
      attentionTo: String(dynamic.attentionTo || dynamic.contactAttention || '').trim(),
      tripType: inferTripType(practice),
      compileLocation: String(dynamic.compileLocation || dynamic.loadingPlace || '').trim(),
      documentDate: String(practice?.practiceDate || today()).trim() || today(),
      loadingPort: String(dynamic.loadingPort || dynamic.originPort || dynamic.originNode || '').trim(),
      atd: String(dynamic.atd || dynamic.actualDepartureTime || dynamic.etdEta || dynamic.etd || '').trim(),
      unloadingPort: String(dynamic.unloadingPort || dynamic.destinationPort || dynamic.destinationNode || '').trim(),
      supplierInvoice: String(dynamic.foreignInvoice || dynamic.supplierInvoice || '').trim(),
      amount: String(dynamic.invoiceAmount || dynamic.amount || '').trim(),
      goodsType: String(dynamic.goodsType || dynamic.packageType || '').trim(),
      voyage: String(dynamic.voyage || '').trim(),
      vessel: String(dynamic.vessel || '').trim(),
      deliveryConditions: String(dynamic.deliveryConditions || dynamic.incoterm || '').trim(),
      originGoods: String(dynamic.originGoods || dynamic.origin || '').trim(),
      bookingReference: booking,
      policyReference: String(dynamic.policyNumber || dynamic.policyReference || '').trim(),
      originalNo: String(dynamic.originalNo || dynamic.originals || '').trim(),
      originalCopyCount: String(dynamic.copies || dynamic.originalCopies || '').trim(),
      operatorName: currentOperatorName(state),
      documentReceiptDate: String(dynamic.documentReceiptDate || '').trim(),
      customsSection: String(dynamic.customsSection || dynamic.customsOffice || '').trim(),
      emptyingAppointmentDate: String(dynamic.emptyingAppointmentDate || dynamic.emptyingDate || '').trim(),
      sourcePracticeSnapshot: {
        id: String(practice?.id || '').trim(),
        reference: String(practice?.reference || '').trim(),
        type: String(practice?.practiceTypeLabel || practice?.practiceType || '').trim(),
        status: String(practice?.status || '').trim()
      },
      lineItems: [Workspace.defaultLineItem({
        containerCode,
        containerType: String(dynamic.transportUnitType || '').trim(),
        description,
        seals: String(dynamic.seals || '').trim(),
        packageCount: String(dynamic.packageCount || '').trim(),
        packaging: String(dynamic.packaging || '').trim(),
        grossWeight: String(practice?.grossWeight || dynamic.grossWeight || '').trim(),
        netWeight: String(practice?.netWeight || dynamic.netWeight || '').trim(),
        cbm: String(practice?.volume || dynamic.cbm || dynamic.volume || '').trim(),
        supplementaryUnits: String(dynamic.supplementaryUnits || '').trim(),
        articleCode: String(dynamic.articleCode || '').trim()
      })]
    });
  }

  function seaPractices(state) {
    return (state?.practices || []).filter((practice) => String(practice?.practiceType || '').includes('sea'));
  }

  function buildKpis(state) {
    const records = Array.isArray(state?.departureNoticeRecords) ? state.departureNoticeRecords : [];
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const linkedPractices = new Set(records.map((record) => String(record?.practiceId || '').trim()).filter(Boolean));
    return {
      records: records.length,
      openMasks: sessions.length,
      linkedPractices: linkedPractices.size
    };
  }

  function renderField(label, name, value, options = {}) {
    const type = options.type || 'text';
    const rows = Number(options.rows || 4);
    const items = Array.isArray(options.items) ? options.items : [];
    const fullClass = options.full ? ' full' : '';
    const disabled = options.disabled ? ' disabled' : '';
    const placeholder = U.escapeHtml(options.placeholder || '');
    const baseAttrs = `id="dn-${U.escapeHtml(name)}" data-departure-notice-field="${U.escapeHtml(name)}"${disabled}`;
    if (type === 'textarea') {
      return `<div class="field${fullClass}"><label for="dn-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><textarea ${baseAttrs} rows="${rows}" placeholder="${placeholder}">${U.escapeHtml(value || '')}</textarea></div>`;
    }
    if (type === 'select') {
      return `<div class="field${fullClass}"><label for="dn-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><select ${baseAttrs}>${items.map((item) => {
        const itemValue = String(item?.value ?? '');
        const selected = itemValue === String(value ?? '') ? ' selected' : '';
        return `<option value="${U.escapeHtml(itemValue)}"${selected}>${U.escapeHtml(item?.label ?? itemValue)}</option>`;
      }).join('')}</select></div>`;
    }
    return `<div class="field${fullClass}"><label for="dn-${U.escapeHtml(name)}">${U.escapeHtml(label)}</label><input ${baseAttrs} type="${U.escapeHtml(type)}" value="${U.escapeHtml(value || '')}" placeholder="${placeholder}"></div>`;
  }


  function buildPrintTitle(draft, i18n) {
    const reference = String(draft?.practiceReference || '').trim();
    const base = i18n?.t('practices/notifica-partenza-merce', 'Notifica partenza merce') || 'Notifica partenza merce';
    return reference ? `${base} · ${reference}` : base;
  }

  function escapeForMail(value) {
    return String(value || '').replace(/\r?\n/g, ' ').trim();
  }

  function buildPrintHtml(draft, i18n) {
    const title = buildPrintTitle(draft, i18n);
    const sections = [
      [i18n?.t('ui.clientRequired', 'Cliente'), draft.client],
      [i18n?.t('ui.sender', 'Mittente'), draft.sender],
      [i18n?.t('ui.importer', 'Importatore'), draft.importer],
      [i18n?.t('ui.consignee', 'Consignee'), draft.consignee],
      [i18n?.t('ui.notify', 'Notify'), draft.notifyParty],
      [i18n?.t('ui.generatedNumber', 'Pratica'), draft.practiceReference],
      [i18n?.t('ui.reference', 'Riferimento'), draft.reference],
      [i18n?.t('ui.departureNoticeCompileLocation', 'Luogo compilazione'), draft.compileLocation],
      [i18n?.t('ui.date', 'Data'), draft.documentDate],
      [i18n?.t('ui.departureNoticeLoadingPort', 'Porto imbarco'), draft.loadingPort],
      [i18n?.t('ui.departureNoticeEtdEta', 'ETD/ETA'), draft.etdEta],
      [i18n?.t('ui.departureNoticeUnloadingPort', 'Porto sbarco'), draft.unloadingPort],
      [i18n?.t('ui.bookingWord', 'Booking'), draft.bookingReference],
      [i18n?.t('ui.policyNumber', 'Polizza'), draft.policyReference],
      [i18n?.t('ui.operator', 'Operatore'), draft.operatorName]
    ].filter(([, value]) => String(value || '').trim());
    const rows = Array.isArray(draft?.lineItems) ? draft.lineItems : [];
    return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>${U.escapeHtml(title)}</title><style>
      body{font-family:Arial,sans-serif;margin:24px;color:#111;} h1{font-size:22px;margin:0 0 8px;} p.meta{color:#555;margin:0 0 18px;}
      .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;margin-bottom:18px;} .item{padding:8px;border:1px solid #ddd;border-radius:6px;}
      .item strong{display:block;font-size:12px;color:#555;margin-bottom:4px;} table{width:100%;border-collapse:collapse;margin-top:12px;} th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left;vertical-align:top;} th{background:#f3f3f3;} .section{margin-top:18px;} .text-box{white-space:pre-wrap;border:1px solid #ddd;border-radius:6px;padding:10px;min-height:72px;}
    </style></head><body><h1>${U.escapeHtml(title)}</h1><p class="meta">${U.escapeHtml(i18n?.t('ui.departureNoticeEditorHint', 'Documento operativo collegato alla pratica madre.'))}</p>
      <div class="grid">${sections.map(([label, value]) => `<div class="item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value || '—')}</span></div>`).join('')}</div>
      <div class="section"><h2>${U.escapeHtml(i18n?.t('ui.detail', 'Dettagli'))}</h2><table><thead><tr><th>${U.escapeHtml(i18n?.t('ui.container', 'Container'))}</th><th>${U.escapeHtml(i18n?.t('ui.transportUnitType', 'Tipologia'))}</th><th>${U.escapeHtml(i18n?.t('ui.description', 'Descrizione'))}</th><th>${U.escapeHtml(i18n?.t('ui.packageCount', 'Colli'))}</th><th>${U.escapeHtml(i18n?.t('ui.grossWeight', 'Peso lordo'))}</th><th>${U.escapeHtml(i18n?.t('ui.netWeight', 'Peso netto'))}</th><th>${U.escapeHtml(i18n?.t('ui.volume', 'CBM'))}</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${U.escapeHtml(row.containerCode || '')}</td><td>${U.escapeHtml(row.containerType || '')}</td><td>${U.escapeHtml(row.description || '')}</td><td>${U.escapeHtml(row.packageCount || '')}</td><td>${U.escapeHtml(row.grossWeight || '')}</td><td>${U.escapeHtml(row.netWeight || '')}</td><td>${U.escapeHtml(row.cbm || '')}</td></tr>`).join('') || `<tr><td colspan="7">—</td></tr>`}</tbody></table></div>
      <div class="section"><h2>${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</h2><div class="text-box">${U.escapeHtml(draft.customerText || draft.internalText || '')}</div></div></body></html>`;
  }

  function triggerPrint(draft, i18n, toast) {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!popup) {
      toast?.(i18n?.t('ui.popupBlocked', 'Popup bloccato dal browser'), 'warning');
      return;
    }
    popup.document.open();
    popup.document.write(buildPrintHtml(draft, i18n));
    popup.document.close();
    popup.focus();
    window.setTimeout(() => {
      popup.print();
    }, 250);
  }

  function buildEmailPayload(draft, i18n) {
    const subject = buildPrintTitle(draft, i18n);
    const lines = [
      subject,
      '',
      `${i18n?.t('ui.generatedNumber', 'Pratica')}: ${escapeForMail(draft.practiceReference || '—')}`,
      `${i18n?.t('ui.clientRequired', 'Cliente')}: ${escapeForMail(draft.client || '—')}`,
      `${i18n?.t('ui.bookingWord', 'Booking')}: ${escapeForMail(draft.bookingReference || '—')}`,
      `${i18n?.t('ui.policyNumber', 'Polizza')}: ${escapeForMail(draft.policyReference || '—')}`,
      `${i18n?.t('ui.departureNoticeLoadingPort', 'Porto imbarco')}: ${escapeForMail(draft.loadingPort || '—')}`,
      `${i18n?.t('ui.departureNoticeUnloadingPort', 'Porto sbarco')}: ${escapeForMail(draft.unloadingPort || '—')}`,
      `${i18n?.t('ui.departureNoticeEtdEta', 'ETD/ETA')}: ${escapeForMail(draft.etdEta || '—')}`,
      '',
      i18n?.t('ui.departureNoticeCustomerText', 'Testo cliente') || 'Testo cliente',
      escapeForMail(draft.customerText || draft.internalText || '')
    ];
    return {
      subject,
      body: lines.join('\n')
    };
  }

  function triggerEmail(draft, i18n, toast) {
    const payload = buildEmailPayload(draft, i18n);
    const href = `mailto:?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.body)}`;
    const opener = window.open(href, '_self');
    if (!opener) {
      window.location.href = href;
    }
    toast?.(i18n?.t('ui.emailComposerOpened', 'Compositore email aperto'), 'success');
  }

  function renderSessionStrip(state, i18n) {
    const sessions = Workspace?.listSessions(state, { createEmptyDraft: () => createEmptyDraft(state) }) || [];
    const activeId = String(state?.departureNoticeWorkspace?.activeSessionId || '').trim();
    if (!sessions.length) return '';
    return `
      <section class="panel practice-workspace-panel arrival-notice-workspace-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.departureNoticeMasksHint', 'Più notifiche partenza merce possono restare aperte contemporaneamente.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-departure-notice-new-session>${U.escapeHtml(i18n?.t('ui.newMask', 'Nuova maschera'))}</button></div>
        </div>
        <div class="practice-session-strip">
          ${sessions.map((session) => {
            const draft = session?.draft || {};
            const title = String(draft.practiceReference || i18n?.t('ui.departureNoticeUntitled', 'Nuova notifica partenza merce') || 'Nuova notifica partenza merce').trim();
            const meta = [draft.client, draft.bookingReference].filter(Boolean).join(' · ');
            const active = session.id === activeId;
            return `
              <div class="practice-session-chip-wrap${active ? ' active' : ''}">
                <button class="practice-session-chip${active ? ' active' : ''}" type="button" data-departure-notice-session-switch="${U.escapeHtml(session.id)}">
                  <strong>${U.escapeHtml(title)}</strong>
                  <span>${U.escapeHtml(meta || '—')}</span>
                  ${session.isDirty ? '<em>•</em>' : ''}
                </button>
                <button class="practice-session-chip-close" type="button" aria-label="${U.escapeHtml(i18n?.t('ui.closeMask', 'Chiudi maschera'))}" title="${U.escapeHtml(i18n?.t('ui.closeMask', 'Chiudi maschera'))}" data-departure-notice-session-close="${U.escapeHtml(session.id)}">×</button>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  function renderLauncher(state, i18n, selectedPractice) {
    const available = seaPractices(state);
    const selectedSea = selectedPractice && String(selectedPractice.practiceType || '').includes('sea') ? selectedPractice : null;
    return `
      <section class="panel arrival-notice-launcher-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.departureNoticeLauncherTitle', 'Apri o crea notifica partenza merce'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.departureNoticeLauncherHint', 'Apri il documento dalla pratica mare attiva o scegli una pratica dall’elenco.'))}</p>
          </div>
          <div class="action-row">
            ${selectedSea ? `<button class="btn" type="button" data-departure-notice-open-active>${U.escapeHtml(i18n?.t('ui.useCurrentPractice', 'Usa pratica attiva'))}</button>` : ''}
            <button class="btn secondary" type="button" data-departure-notice-new-session>${U.escapeHtml(i18n?.t('ui.newBlankDocument', 'Nuovo documento vuoto'))}</button>
          </div>
        </div>
        <div class="form-grid three arrival-notice-practice-grid">
          ${available.slice(0, 18).map((practice) => `
            <button class="stack-item arrival-notice-practice-chip" type="button" data-departure-notice-open-practice="${U.escapeHtml(practice.id)}">
              <strong>${U.escapeHtml(practice.reference || '—')}</strong>
              <span>${U.escapeHtml(practice.clientName || practice.client || '')}</span>
              <span>${U.escapeHtml(practice.practiceTypeLabel || practice.practiceType || '')}</span>
            </button>`).join('')}
        </div>
      </section>`;
  }

  function renderSummaryPills(draft, i18n) {
    const items = [
      [i18n?.t('ui.generatedNumber', 'Numero pratica'), draft.practiceReference || '—'],
      [i18n?.t('ui.clientRequired', 'Cliente'), draft.client || '—'],
      [i18n?.t('ui.bookingWord', 'Booking'), draft.bookingReference || '—'],
      [i18n?.t('ui.policyNumber', 'Polizza / BL / AWB'), draft.policyReference || '—']
    ];
    return `<div class="tag-grid arrival-notice-summary-pills">${items.map(([label, value]) => `<div class="stack-item"><strong>${U.escapeHtml(label)}</strong><span>${U.escapeHtml(value)}</span></div>`).join('')}</div>`;
  }

  function renderLineTable(draft, i18n) {
    const rows = Array.isArray(draft.lineItems) ? draft.lineItems : [];
    return `
      <section class="table-panel arrival-notice-lines-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.detail', 'Dettagli'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.departureNoticeDetailHint', 'Container, tipologia, colli, pesi e riferimenti articolo.'))}</p>
          </div>
          <div class="action-row"><button class="btn secondary" type="button" data-departure-notice-add-line>${U.escapeHtml(i18n?.t('ui.addLine', 'Aggiungi riga'))}</button></div>
        </div>
        <div class="table-wrap">
          <table class="table arrival-notice-lines-table">
            <thead>
              <tr>
                <th>${U.escapeHtml(i18n?.t('ui.container', 'Container'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.transportUnitType', 'Tipologia'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.description', 'Descrizione'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.bookingEmbarkationSeals', 'Sigilli'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.packageCount', 'Colli'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.packaging', 'Imballi'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.grossWeight', 'Peso lordo'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.netWeight', 'Peso netto'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.volume', 'CBM'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.departureNoticeSupplementaryUnits', 'Unità suppl.'))}</th>
                <th>${U.escapeHtml(i18n?.t('ui.articleCode', 'Cod. art.'))}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr>
                  <td><input type="text" value="${U.escapeHtml(row.containerCode || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="containerCode"></td>
                  <td><input type="text" value="${U.escapeHtml(row.containerType || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="containerType"></td>
                  <td><input type="text" value="${U.escapeHtml(row.description || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="description"></td>
                  <td><input type="text" value="${U.escapeHtml(row.seals || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="seals"></td>
                  <td><input type="text" value="${U.escapeHtml(row.packageCount || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="packageCount"></td>
                  <td><input type="text" value="${U.escapeHtml(row.packaging || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="packaging"></td>
                  <td><input type="text" value="${U.escapeHtml(row.grossWeight || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="grossWeight"></td>
                  <td><input type="text" value="${U.escapeHtml(row.netWeight || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="netWeight"></td>
                  <td><input type="text" value="${U.escapeHtml(row.cbm || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="cbm"></td>
                  <td><input type="text" value="${U.escapeHtml(row.supplementaryUnits || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="supplementaryUnits"></td>
                  <td><input type="text" value="${U.escapeHtml(row.articleCode || '')}" data-departure-notice-line-index="${index}" data-departure-notice-line-field="articleCode"></td>
                  <td><button class="btn secondary" type="button" data-departure-notice-remove-line="${index}">${U.escapeHtml(i18n?.t('ui.remove', 'Rimuovi'))}</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function renderGeneralTab(draft, i18n) {
    return `
      ${renderSummaryPills(draft, i18n)}
      <div class="form-grid three arrival-notice-form-grid">
        ${renderField(i18n?.t('ui.clientRequired', 'Cliente'), 'client', draft.client)}
        ${renderField(i18n?.t('ui.sender', 'Mittente'), 'sender', draft.sender)}
        ${renderField(i18n?.t('ui.departureNoticeDestinationDepot', 'Deposito di destinazione'), 'destinationDepot', draft.destinationDepot)}
        ${renderField(i18n?.t('ui.importer', 'Importatore'), 'importer', draft.importer)}
        ${renderField(i18n?.t('ui.consignee', 'Consignee'), 'consignee', draft.consignee)}
        ${renderField(i18n?.t('ui.notify', 'Notify'), 'notifyParty', draft.notifyParty)}
        ${renderField(i18n?.t('ui.generatedNumber', 'Pratica'), 'practiceReference', draft.practiceReference, { disabled: true })}
        ${renderField(i18n?.t('ui.departureNoticeTripType', 'Tipo viaggio'), 'tripType', draft.tripType, { type: 'select', items: [{ value: 'MARE', label: 'MARE' }, { value: 'AEREO', label: 'AEREO' }, { value: 'TERRA', label: 'TERRA' }] })}
        ${renderField(i18n?.t('ui.departureNoticeCompileLocation', 'Luogo compilazione'), 'compileLocation', draft.compileLocation)}
        ${renderField(i18n?.t('ui.reference', 'Riferimento'), 'reference', draft.reference)}
        ${renderField(i18n?.t('ui.departureNoticeAttentionTo', 'All’attenzione di'), 'attentionTo', draft.attentionTo)}
        ${renderField(i18n?.t('ui.date', 'Data'), 'documentDate', draft.documentDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.departureNoticeLoadingPort', 'Porto imbarco'), 'loadingPort', draft.loadingPort)}
        ${renderField(i18n?.t('ui.departureNoticeEtdEta', 'ETD/ETA'), 'etdEta', draft.etdEta)}
        ${renderField(i18n?.t('ui.departureNoticeUnloadingPort', 'Porto sbarco'), 'unloadingPort', draft.unloadingPort)}
        ${renderField(i18n?.t('ui.departureNoticeSupplierInvoice', 'Fattura fornitore'), 'supplierInvoice', draft.supplierInvoice)}
        ${renderField(i18n?.t('ui.amount', 'Importo'), 'amount', draft.amount)}
        ${renderField(i18n?.t('ui.departureNoticeGoodsType', 'Tipo merce'), 'goodsType', draft.goodsType)}
        ${renderField(i18n?.t('ui.voyage', 'Viaggio'), 'voyage', draft.voyage)}
        ${renderField(i18n?.t('ui.vessel', 'Nave'), 'vessel', draft.vessel)}
        ${renderField(i18n?.t('ui.departureNoticeDeliveryConditions', 'Condizioni di consegna'), 'deliveryConditions', draft.deliveryConditions)}
        ${renderField(i18n?.t('ui.departureNoticeOriginGoods', 'Origine merce'), 'originGoods', draft.originGoods)}
        ${renderField(i18n?.t('ui.bookingWord', 'Booking'), 'bookingReference', draft.bookingReference)}
        ${renderField(i18n?.t('ui.policyNumber', 'Polizza'), 'policyReference', draft.policyReference)}
        ${renderField(i18n?.t('ui.departureNoticeOriginalNo', 'Original NO.'), 'originalNo', draft.originalNo)}
        ${renderField(i18n?.t('ui.departureNoticeOriginalCopies', 'Original copie'), 'originalCopyCount', draft.originalCopyCount)}
        ${renderField(i18n?.t('ui.operator', 'Operatore'), 'operatorName', draft.operatorName)}
        ${renderField(i18n?.t('ui.departureNoticeDocumentReceiptDate', 'Data ricezione documenti'), 'documentReceiptDate', draft.documentReceiptDate, { type: 'date' })}
        ${renderField(i18n?.t('ui.customsSection', 'Sez. doganale'), 'customsSection', draft.customsSection)}
        ${renderField(i18n?.t('ui.departureNoticeEmptyingDate', 'Data pres. svuotamento'), 'emptyingAppointmentDate', draft.emptyingAppointmentDate, { type: 'date' })}
      </div>
      ${renderLineTable(draft, i18n)}`;
  }

  function renderTextsTab(draft, i18n) {
    return `
      <div class="form-grid two arrival-notice-form-grid">
        ${renderField(i18n?.t('ui.departureNoticeInternalText', 'Testo interno'), 'internalText', draft.internalText, { type: 'textarea', rows: 12, full: true })}
        ${renderField(i18n?.t('ui.departureNoticeCustomerText', 'Testo cliente'), 'customerText', draft.customerText, { type: 'textarea', rows: 12, full: true })}
      </div>`;
  }

  function renderEditor(state, i18n) {
    const session = Workspace?.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) }) || null;
    if (!session) return '';
    const draft = session.draft || createEmptyDraft(state);
    const activeTab = String(session?.uiState?.tab || 'general').trim() || 'general';
    return `
      <section class="panel arrival-notice-editor-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('practices/notifica-partenza-merce', 'Notifica partenza merce'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.departureNoticeEditorHint', 'Documento operativo collegato alla pratica madre, con dati generali, dettagli merce e testi pronti per invio o stampa della partenza.'))}</p>
          </div>
          <div class="action-row">
            <button class="btn secondary" type="button" data-departure-notice-print>${U.escapeHtml(i18n?.t('ui.print', 'Stampa'))}</button>
            <button class="btn secondary" type="button" data-departure-notice-email>${U.escapeHtml(i18n?.t('ui.sendEmail', 'Invia email'))}</button>
            <button class="btn secondary" type="button" data-departure-notice-save-continue>${U.escapeHtml(i18n?.t('ui.saveAndContinue', 'Salva e continua'))}</button>
            <button class="btn" type="button" data-departure-notice-save-close>${U.escapeHtml(i18n?.t('ui.saveAndClose', 'Salva e chiudi'))}</button>
          </div>
        </div>
        <div class="tab-row arrival-notice-tabs">
          <button class="tab-chip${activeTab === 'general' ? ' active' : ''}" type="button" data-departure-notice-tab="general">${U.escapeHtml(i18n?.t('ui.general', 'Generale'))}</button>
          <button class="tab-chip${activeTab === 'texts' ? ' active' : ''}" type="button" data-departure-notice-tab="texts">${U.escapeHtml(i18n?.t('ui.texts', 'Testi'))}</button>
        </div>
        ${activeTab === 'texts' ? renderTextsTab(draft, i18n) : renderGeneralTab(draft, i18n)}
      </section>`;
  }

  function renderSavedRecords(state, i18n) {
    const records = Array.isArray(state?.departureNoticeRecords) ? state.departureNoticeRecords : [];
    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</h3>
            <p class="panel-subtitle">${U.escapeHtml(i18n?.t('ui.departureNoticeSavedHint', 'Riapri rapidamente le notifiche arrivo merce già generate.'))}</p>
          </div>
        </div>
        <div class="module-card-grid arrival-notice-records-grid">
          ${records.length ? records.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).map((record) => `
            <button class="module-card arrival-notice-record-card" type="button" data-departure-notice-open-record="${U.escapeHtml(record.id)}">
              <div><strong>${U.escapeHtml(record.practiceReference || '—')}</strong><div class="module-card-meta">${U.escapeHtml(record.client || '—')}</div></div>
              <div class="module-card-meta">${U.escapeHtml(record.bookingReference || '—')}</div>
              <div class="module-card-meta">${U.escapeHtml(record.unloadingPort || '—')}</div>
            </button>`).join('') : `<div class="empty-text">${U.escapeHtml(i18n?.t('ui.noSavedDocuments', 'Nessun documento salvato.'))}</div>`}
        </div>
      </section>`;
  }

  function render(state, options = {}) {
    const { i18n } = options;
    ensureState(state);
    const kpis = buildKpis(state);
    const selectedPractice = typeof options.getSelectedPractice === 'function' ? options.getSelectedPractice() : null;
    return `
      <section class="hero">
        <div class="hero-meta">${U.escapeHtml(i18n?.t('ui.departureNoticeEyebrow', 'PRATICHE · NOTIFICA ARRIVO MERCE'))}</div>
        <h2>${U.escapeHtml(i18n?.t('practices/notifica-partenza-merce', 'Notifica partenza merce'))}</h2>
        <p>${U.escapeHtml(i18n?.t('ui.departureNoticeIntro', 'Sottomodulo operativo dedicato alle notifiche di partenza merce collegate alla pratica madre.'))}</p>
      </section>
      <section class="three-col">
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.savedDocuments', 'Documenti salvati'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.records))}</div></div>
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.openMasks', 'Maschere aperte'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.openMasks))}</div></div>
        <div class="stack-item"><span>${U.escapeHtml(i18n?.t('ui.linkedPractices', 'Pratiche collegate'))}</span><div class="summary-value">${U.escapeHtml(String(kpis.linkedPractices))}</div></div>
      </section>
      ${renderLauncher(state, i18n, selectedPractice)}
      ${renderSessionStrip(state, i18n)}
      ${renderEditor(state, i18n)}
      ${renderSavedRecords(state, i18n)}
    `;
  }

  function upsertRecord(state, session) {
    if (!session || !session.draft) return null;
    if (!Array.isArray(state.departureNoticeRecords)) state.departureNoticeRecords = [];
    const draft = Workspace.cloneDraft(session.draft);
    const now = new Date().toISOString();
    const next = {
      id: String(draft.editingRecordId || '').trim() || `dn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ...draft,
      editingRecordId: String(draft.editingRecordId || '').trim() || '',
      createdAt: String(draft.createdAt || now),
      updatedAt: now
    };
    next.editingRecordId = next.id;
    const index = state.departureNoticeRecords.findIndex((record) => String(record?.id || '').trim() === next.id);
    if (index === -1) state.departureNoticeRecords.unshift(next);
    else state.departureNoticeRecords.splice(index, 1, next);
    session.draft = Workspace.cloneDraft(next);
    Workspace.markSessionSaved(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
    return next;
  }

  function findRecord(state, recordId) {
    return (state?.departureNoticeRecords || []).find((record) => String(record?.id || '').trim() === String(recordId || '').trim()) || null;
  }

  function updateActiveLineItem(state, index, fieldName, value) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => {
      const nextItems = Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : [];
      if (!nextItems[index]) return draft;
      nextItems[index] = Workspace.defaultLineItem({ ...nextItems[index], [fieldName]: value });
      return { ...draft, lineItems: nextItems };
    }, { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function addLineItem(state) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => ({
      ...draft,
      lineItems: [...(Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : []), Workspace.defaultLineItem()]
    }), { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function removeLineItem(state, index) {
    const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
    if (!session) return null;
    return Workspace.updateSessionDraft(state, session.id, (draft) => {
      const current = Array.isArray(draft.lineItems) ? draft.lineItems.map((item) => Workspace.defaultLineItem(item)) : [];
      if (current.length <= 1) return { ...draft, lineItems: [Workspace.defaultLineItem()] };
      current.splice(index, 1);
      return { ...draft, lineItems: current.length ? current : [Workspace.defaultLineItem()] };
    }, { createEmptyDraft: () => createEmptyDraft(state) });
  }

  function bind(context = {}) {
    const { root, state, save, render, toast, i18n, getSelectedPractice, confirmClose } = context;
    if (!root || !state || !Workspace) return;

    root.querySelectorAll('[data-departure-notice-new-session]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureState(state);
        Workspace.openDraftSession(state, { createEmptyDraft: () => createEmptyDraft(state), draft: createEmptyDraft(state), source: 'manual', isDirty: true });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-open-active]').forEach((button) => {
      button.addEventListener('click', () => {
        const practice = typeof getSelectedPractice === 'function' ? getSelectedPractice() : null;
        if (!practice) return;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: buildDraftFromPractice(state, practice),
          source: 'practice',
          isDirty: true
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-open-practice]').forEach((button) => {
      button.addEventListener('click', () => {
        const practiceId = button.dataset.departureNoticeOpenPractice;
        const practice = (state.practices || []).find((entry) => String(entry?.id || '').trim() === String(practiceId || '').trim()) || null;
        if (!practice) return;
        Workspace.openDraftSession(state, {
          createEmptyDraft: () => createEmptyDraft(state),
          draft: buildDraftFromPractice(state, practice),
          source: 'practice',
          isDirty: true
        });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-open-record]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = findRecord(state, button.dataset.departureNoticeOpenRecord);
        if (!record) return;
        Workspace.openRecordSession(state, record, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-session-switch]').forEach((button) => {
      button.addEventListener('click', () => {
        Workspace.switchSession(state, button.dataset.departureNoticeSessionSwitch, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-session-close]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const sessionId = button.dataset.departureNoticeSessionClose;
        const allowClose = typeof confirmClose === 'function' ? await confirmClose(sessionId) : true;
        if (!allowClose) return;
        Workspace.closeSession(state, sessionId, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionTab(state, session.id, button.dataset.departureNoticeTab, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-field]').forEach((field) => {
      const handler = () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        Workspace.setSessionField(state, session.id, field.dataset.departureNoticeField, field.value, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
      };
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', handler);
    });

    root.querySelectorAll('[data-departure-notice-line-field]').forEach((field) => {
      const handler = () => {
        const index = Number(field.dataset.departureNoticeLineIndex || -1);
        if (index < 0) return;
        updateActiveLineItem(state, index, field.dataset.departureNoticeLineField, field.value);
        save?.();
      };
      field.addEventListener('input', handler);
    });

    root.querySelectorAll('[data-departure-notice-add-line]').forEach((button) => {
      button.addEventListener('click', () => {
        addLineItem(state);
        save?.();
        render?.();
      });
    });

    root.querySelectorAll('[data-departure-notice-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.departureNoticeRemoveLine || -1);
        if (index < 0) return;
        removeLineItem(state, index);
        save?.();
        render?.();
      });
    });


    root.querySelectorAll('[data-departure-notice-print]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        triggerPrint(session.draft || createEmptyDraft(state), i18n, toast);
      });
    });

    root.querySelectorAll('[data-departure-notice-email]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        triggerEmail(session.draft || createEmptyDraft(state), i18n, toast);
      });
    });

    root.querySelectorAll('[data-departure-notice-save-continue]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        save?.();
        render?.();
        toast?.(i18n?.t('ui.departureNoticeSaved', 'Notifica partenza merce salvata'), 'success');
      });
    });

    root.querySelectorAll('[data-departure-notice-save-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = Workspace.getActiveSession(state, { createEmptyDraft: () => createEmptyDraft(state) });
        if (!session) return;
        upsertRecord(state, session);
        Workspace.closeSession(state, session.id, { createEmptyDraft: () => createEmptyDraft(state) });
        save?.();
        render?.();
        toast?.(i18n?.t('ui.departureNoticeSaved', 'Notifica partenza merce salvata'), 'success');
      });
    });
  }

  return {
    ensureState,
    createEmptyDraft,
    render,
    bind
  };
})();
