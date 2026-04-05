window.KedrixOnePracticeDocumentReadinessBoard = (() => {
  'use strict';

  function getPracticeAttachmentsModule() {
    return window.KedrixOnePracticeAttachments || null;
  }

  function t(i18n, key, fallback) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, fallback) : fallback;
  }

  function escape(utils, value) {
    return utils && typeof utils.escapeHtml === 'function'
      ? utils.escapeHtml(String(value || ''))
      : String(value || '');
  }

  function text(value, fallback = '') {
    if (value === null || value === undefined) return String(fallback || '').trim();
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
    if (Array.isArray(value)) {
      for (const item of value) {
        const resolved = text(item, '');
        if (resolved) return resolved;
      }
      return String(fallback || '').trim();
    }
    if (typeof value === 'object') {
      const candidates = [value.displayValue, value.label, value.value, value.name, value.shortName, value.code, value.id];
      for (const candidate of candidates) {
        const resolved = text(candidate, '');
        if (resolved) return resolved;
      }
    }
    return String(fallback || '').trim();
  }

  function getValue(draft, fieldName) {
    if (!draft || !fieldName) return '';
    if (fieldName === 'client') {
      return text(draft?.dynamicData?.client, '') || text(draft.clientName, '');
    }
    if (fieldName === 'clientName') return text(draft.clientName, '');
    return text(draft?.dynamicData?.[fieldName], '');
  }

  function attachmentLabel(i18n, type) {
    const map = {
      booking: ['ui.attachmentTypeBooking', 'Booking'],
      policy: ['ui.attachmentTypePolicy', 'Polizza / BL / AWB'],
      customsDocs: ['ui.attachmentTypeCustomsDocs', 'Documenti doganali'],
      invoice: ['ui.attachmentTypeInvoice', 'Invoice'],
      packingList: ['ui.attachmentTypePackingList', 'Packing list'],
      signedMandate: ['ui.attachmentTypeSignedMandate', 'Mandato firmato'],
      generic: ['ui.attachmentTypeGeneric', 'Allegato operativo'],
      other: ['ui.attachmentTypeOther', 'Altro']
    };
    const entry = map[String(type || '').trim()] || ['ui.attachmentTypeGeneric', 'Allegato operativo'];
    return t(i18n, entry[0], entry[1]);
  }

  function buildDocumentProfiles(type) {
    const normalized = String(type || '').trim();
    const sharedCommercial = {
      key: 'commercial',
      titleKey: 'ui.practiceDocReadinessCommercialTitle',
      titleFallback: 'Commerciale / supporto',
      references: [
        { labelKey: 'ui.foreignInvoice', labelFallback: 'Fattura estera', fieldNames: ['foreignInvoice'], required: false },
        { labelKey: 'ui.packingList', labelFallback: 'Packing list', fieldNames: ['packingList'], required: false }
      ],
      attachments: [
        { type: 'invoice', required: false },
        { type: 'packingList', required: false }
      ]
    };

    const map = {
      sea_import: [
        {
          key: 'transport',
          titleKey: 'ui.practiceDocReadinessTransportTitle',
          titleFallback: 'Dossier trasporto',
          references: [
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: true },
            { labelKey: 'ui.policyNumber', labelFallback: 'Polizza', fieldNames: ['policyNumber', 'hbl'], required: true }
          ],
          attachments: [
            { type: 'booking', required: true },
            { type: 'policy', required: true }
          ]
        },
        {
          key: 'customs',
          titleKey: 'ui.practiceDocReadinessCustomsTitle',
          titleFallback: 'Dogana / compliance',
          references: [
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ],
          attachments: [
            { type: 'customsDocs', required: true }
          ]
        },
        sharedCommercial
      ],
      sea_export: [
        {
          key: 'transport',
          titleKey: 'ui.practiceDocReadinessTransportTitle',
          titleFallback: 'Dossier trasporto',
          references: [
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: true },
            { labelKey: 'ui.policyNumber', labelFallback: 'Polizza', fieldNames: ['policyNumber', 'hbl'], required: true }
          ],
          attachments: [
            { type: 'booking', required: true },
            { type: 'policy', required: true }
          ]
        },
        {
          key: 'customs',
          titleKey: 'ui.practiceDocReadinessCustomsTitle',
          titleFallback: 'Dogana / compliance',
          references: [
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ],
          attachments: [
            { type: 'customsDocs', required: true }
          ]
        },
        sharedCommercial
      ],
      air_import: [
        {
          key: 'transport',
          titleKey: 'ui.practiceDocReadinessTransportTitle',
          titleFallback: 'Dossier trasporto',
          references: [
            { labelKey: 'ui.mawb', labelFallback: 'MAWB', fieldNames: ['mawb'], required: true },
            { labelKey: 'ui.hawb', labelFallback: 'HAWB', fieldNames: ['hawb'], required: true }
          ],
          attachments: [
            { type: 'policy', required: true },
            { type: 'booking', required: false }
          ]
        },
        {
          key: 'customs',
          titleKey: 'ui.practiceDocReadinessCustomsTitle',
          titleFallback: 'Dogana / compliance',
          references: [
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ],
          attachments: [
            { type: 'customsDocs', required: true }
          ]
        },
        sharedCommercial
      ],
      air_export: [
        {
          key: 'transport',
          titleKey: 'ui.practiceDocReadinessTransportTitle',
          titleFallback: 'Dossier trasporto',
          references: [
            { labelKey: 'ui.mawb', labelFallback: 'MAWB', fieldNames: ['mawb'], required: true },
            { labelKey: 'ui.hawb', labelFallback: 'HAWB', fieldNames: ['hawb'], required: true }
          ],
          attachments: [
            { type: 'policy', required: true },
            { type: 'booking', required: false }
          ]
        },
        {
          key: 'customs',
          titleKey: 'ui.practiceDocReadinessCustomsTitle',
          titleFallback: 'Dogana / compliance',
          references: [
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: true },
            { labelKey: 'ui.incoterm', labelFallback: 'Incoterm', fieldNames: ['incoterm'], required: false }
          ],
          attachments: [
            { type: 'customsDocs', required: true }
          ]
        },
        sharedCommercial
      ],
      road_import: [
        {
          key: 'transport',
          titleKey: 'ui.practiceDocReadinessTransportTitle',
          titleFallback: 'Dossier trasporto',
          references: [
            { labelKey: 'ui.cmr', labelFallback: 'CMR', fieldNames: ['cmr'], required: true },
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: false }
          ],
          attachments: [
            { type: 'policy', required: true },
            { type: 'generic', required: false }
          ]
        },
        {
          key: 'customs',
          titleKey: 'ui.practiceDocReadinessCustomsTitle',
          titleFallback: 'Dogana / compliance',
          references: [
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: false }
          ],
          attachments: [
            { type: 'customsDocs', required: false }
          ]
        },
        sharedCommercial
      ],
      road_export: [
        {
          key: 'transport',
          titleKey: 'ui.practiceDocReadinessTransportTitle',
          titleFallback: 'Dossier trasporto',
          references: [
            { labelKey: 'ui.cmr', labelFallback: 'CMR', fieldNames: ['cmr'], required: true },
            { labelKey: 'ui.booking', labelFallback: 'Booking', fieldNames: ['booking'], required: false }
          ],
          attachments: [
            { type: 'policy', required: true },
            { type: 'generic', required: false }
          ]
        },
        {
          key: 'customs',
          titleKey: 'ui.practiceDocReadinessCustomsTitle',
          titleFallback: 'Dogana / compliance',
          references: [
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: false }
          ],
          attachments: [
            { type: 'customsDocs', required: false }
          ]
        },
        sharedCommercial
      ],
      warehouse: [
        {
          key: 'flow',
          titleKey: 'ui.practiceDocReadinessFlowTitle',
          titleFallback: 'Flusso / riferimento',
          references: [
            { labelKey: 'ui.linkedTo', labelFallback: 'Collega a', fieldNames: ['linkedTo'], required: true },
            { labelKey: 'ui.baseQuotation', labelFallback: 'Quotaz. base', fieldNames: ['baseQuotation'], required: false }
          ],
          attachments: [
            { type: 'signedMandate', required: false },
            { type: 'generic', required: true }
          ]
        },
        {
          key: 'customs',
          titleKey: 'ui.practiceDocReadinessCustomsTitle',
          titleFallback: 'Dogana / compliance',
          references: [
            { labelKey: 'ui.customsOffice', labelFallback: 'Dogana', fieldNames: ['customsOffice'], required: false }
          ],
          attachments: [
            { type: 'customsDocs', required: false }
          ]
        },
        sharedCommercial
      ]
    };

    return map[normalized] || map.sea_import;
  }

  function getAttachments(state, draft) {
    const PracticeAttachments = getPracticeAttachmentsModule();
    if (!PracticeAttachments || typeof PracticeAttachments.getAttachments !== 'function') return [];
    try {
      return PracticeAttachments.getAttachments(state, draft) || [];
    } catch (error) {
      return [];
    }
  }

  function countAttachmentsByType(attachments) {
    return (attachments || []).reduce((acc, item) => {
      const key = String(item?.documentType || 'generic').trim() || 'generic';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function evaluateReference(draft, ref) {
    const fieldNames = Array.isArray(ref?.fieldNames) ? ref.fieldNames : [];
    let matchedValue = '';
    let matchedField = fieldNames[0] || '';
    for (const fieldName of fieldNames) {
      const value = getValue(draft, fieldName);
      if (value) {
        matchedValue = value;
        matchedField = fieldName;
        break;
      }
    }
    return {
      ...ref,
      matchedValue,
      matchedField,
      complete: Boolean(matchedValue)
    };
  }

  function evaluateAttachment(attachmentMeta, counts, i18n) {
    const type = String(attachmentMeta?.type || '').trim();
    const count = counts[type] || 0;
    return {
      ...attachmentMeta,
      label: attachmentLabel(i18n, type),
      count,
      complete: count > 0
    };
  }

  function computeCard(profile, attachmentsCount, draft, i18n) {
    const references = (profile.references || []).map((ref) => evaluateReference(draft, ref));
    const attachments = (profile.attachments || []).map((entry) => evaluateAttachment(entry, attachmentsCount, i18n));
    const requiredReferences = references.filter((entry) => entry.required !== false);
    const requiredAttachments = attachments.filter((entry) => entry.required !== false);
    const missingRequiredRefs = requiredReferences.filter((entry) => !entry.complete);
    const missingRequiredAttachments = requiredAttachments.filter((entry) => !entry.complete);
    const missingOptionalRefs = references.filter((entry) => entry.required === false && !entry.complete);
    const missingOptionalAttachments = attachments.filter((entry) => entry.required === false && !entry.complete);
    const referenceCoverage = `${references.filter((entry) => entry.complete).length}/${references.length || 0}`;
    const attachmentCoverage = `${attachments.filter((entry) => entry.complete).length}/${attachments.length || 0}`;

    let status = 'ready';
    if (missingRequiredRefs.length) status = 'critical';
    else if (missingRequiredAttachments.length || missingOptionalRefs.length || missingOptionalAttachments.length) status = 'attention';

    const missingLabels = [
      ...missingRequiredRefs.map((entry) => t(i18n, entry.labelKey, entry.labelFallback)),
      ...missingRequiredAttachments.map((entry) => entry.label),
      ...missingOptionalRefs.map((entry) => t(i18n, entry.labelKey, entry.labelFallback)),
      ...missingOptionalAttachments.map((entry) => entry.label)
    ].slice(0, 4);

    let helper = t(i18n, 'ui.practiceDocReadinessReadyHint', 'Riferimenti e allegati principali già leggibili per questo pacchetto.');
    if (status === 'critical') {
      helper = t(i18n, 'ui.practiceDocReadinessCriticalHint', 'Completa prima i riferimenti essenziali di questo pacchetto documentale.');
    } else if (status === 'attention') {
      helper = t(i18n, 'ui.practiceDocReadinessAttentionHint', 'Base presente, ma conviene completare allegati o riferimenti di supporto.');
    }
    if (missingLabels.length) {
      helper += ` ${t(i18n, 'ui.practiceReadinessMissingPrefix', 'Mancano')}: ${missingLabels.join(', ')}`;
    }

    let action = null;
    if (missingRequiredRefs[0]) {
      action = {
        kind: 'field',
        fieldName: missingRequiredRefs[0].matchedField || missingRequiredRefs[0].fieldNames?.[0] || '',
        label: t(i18n, 'ui.practiceDocReadinessGoToReferenceAction', 'Vai ai riferimenti')
      };
    } else if (missingRequiredAttachments.length || missingOptionalAttachments.length) {
      action = {
        kind: 'attachments',
        label: t(i18n, 'ui.practiceDocReadinessGoToAttachmentsAction', 'Vai agli allegati')
      };
    } else if (missingOptionalRefs[0]) {
      action = {
        kind: 'field',
        fieldName: missingOptionalRefs[0].matchedField || missingOptionalRefs[0].fieldNames?.[0] || '',
        label: t(i18n, 'ui.practiceDocReadinessGoToReferenceAction', 'Vai ai riferimenti')
      };
    }

    return {
      key: profile.key,
      title: t(i18n, profile.titleKey, profile.titleFallback),
      status,
      helper,
      referenceCoverage,
      attachmentCoverage,
      attachmentTotal: attachments.reduce((sum, entry) => sum + entry.count, 0),
      action,
      references,
      attachments
    };
  }

  function buildOverview(cards, totalAttachments, i18n) {
    const counts = {
      ready: cards.filter((card) => card.status === 'ready').length,
      attention: cards.filter((card) => card.status === 'attention').length,
      critical: cards.filter((card) => card.status === 'critical').length
    };
    const topCard = cards.find((card) => card.status === 'critical') || cards.find((card) => card.status === 'attention') || null;

    let tone = 'success';
    let title = t(i18n, 'ui.practiceDocReadinessOverviewReadyTitle', 'Base documentale leggibile');
    let detail = t(i18n, 'ui.practiceDocReadinessOverviewReadyDetail', 'I pacchetti essenziali risultano coperti e l’archivio allegati è già coerente.');

    if (counts.critical) {
      tone = 'danger';
      title = t(i18n, 'ui.practiceDocReadinessOverviewCriticalTitle', 'Mancano riferimenti documentali essenziali');
      detail = t(i18n, 'ui.practiceDocReadinessOverviewCriticalDetail', 'Prima completa i riferimenti chiave, poi consolida gli allegati collegati.');
    } else if (counts.attention) {
      tone = 'warning';
      title = t(i18n, 'ui.practiceDocReadinessOverviewAttentionTitle', 'Base presente, ma alcuni allegati vanno consolidati');
      detail = t(i18n, 'ui.practiceDocReadinessOverviewAttentionDetail', 'Hai già una buona base, ma conviene chiudere i pacchetti documentali ancora parziali.');
    }

    return { counts, tone, title, detail, topCard, totalAttachments };
  }

  function renderCountChip(utils, label, value, tone = 'default') {
    return `
      <span class="count-chip ${tone}">
        <strong>${escape(utils, value)}</strong>
        <span>${escape(utils, label)}</span>
      </span>`;
  }

  function renderAction(card, utils, i18n) {
    if (!card?.action) return '';
    if (card.action.kind === 'field' && card.action.fieldName) {
      return `<button type="button" class="linked-entity-summary-action subtle" data-focus-practice-field="${escape(utils, card.action.fieldName)}" data-focus-practice-tab="practice">${escape(utils, card.action.label)}</button>`;
    }
    if (card.action.kind === 'attachments') {
      return `<button type="button" class="linked-entity-summary-action subtle" data-focus-practice-tab-only="attachments">${escape(utils, card.action.label)}</button>`;
    }
    return '';
  }

  function renderCard(card, utils, i18n) {
    const statusMeta = {
      ready: ['ui.practiceReadinessStatusReady', 'Pronto'],
      attention: ['ui.practiceReadinessStatusAttention', 'Da rifinire'],
      critical: ['ui.practiceReadinessStatusCritical', 'Priorità alta']
    }[card.status] || ['ui.practiceReadinessStatusAttention', 'Da rifinire'];

    const missingPreview = [
      ...card.references.filter((entry) => !entry.complete).map((entry) => t(i18n, entry.labelKey, entry.labelFallback)),
      ...card.attachments.filter((entry) => !entry.complete).map((entry) => entry.label)
    ].slice(0, 3).join(' · ');

    return `
      <article class="practice-doc-readiness-card" data-status="${escape(utils, card.status)}">
        <div class="practice-readiness-card-head">
          <div class="practice-readiness-card-label">${escape(utils, card.title)}</div>
          <span class="badge ${card.status === 'critical' ? 'danger' : card.status === 'attention' ? 'warning' : 'success'}">${escape(utils, t(i18n, statusMeta[0], statusMeta[1]))}</span>
        </div>
        <div class="practice-readiness-card-meta">
          ${renderCountChip(utils, t(i18n, 'ui.practiceDocReadinessReferencesLabel', 'Riferimenti'), card.referenceCoverage, card.status === 'critical' ? 'danger' : 'success')}
          ${renderCountChip(utils, t(i18n, 'ui.practiceDocReadinessAttachmentsLabel', 'Allegati'), card.attachmentCoverage, card.attachments.filter((entry) => entry.complete).length ? 'success' : 'warning')}
          ${renderCountChip(utils, t(i18n, 'ui.practiceDocReadinessArchiveCountLabel', 'Archivio'), card.attachmentTotal, card.attachmentTotal ? 'success' : 'default')}
        </div>
        <div class="practice-readiness-card-helper">${escape(utils, card.helper)}</div>
        ${missingPreview ? `<div class="practice-doc-readiness-missing">${escape(utils, missingPreview)}</div>` : ''}
        <div class="practice-readiness-card-actions">${renderAction(card, utils, i18n)}</div>
      </article>`;
  }

  function render(options = {}) {
    const { state = null, draft = {}, type, i18n, utils } = options;
    const practiceType = String(type || draft?.practiceType || '').trim();
    if (!practiceType) return '';

    const attachments = getAttachments(state, draft);
    const attachmentCounts = countAttachmentsByType(attachments);
    const cards = buildDocumentProfiles(practiceType).map((profile) => computeCard(profile, attachmentCounts, draft, i18n));
    if (!cards.length) return '';

    const overview = buildOverview(cards, attachments.length, i18n);
    const chips = [
      renderCountChip(utils, t(i18n, 'ui.practiceDocReadinessCountReady', 'pacchetti pronti'), overview.counts.ready, overview.counts.ready ? 'success' : 'default'),
      renderCountChip(utils, t(i18n, 'ui.practiceDocReadinessCountAttention', 'da consolidare'), overview.counts.attention, overview.counts.attention ? 'warning' : 'default'),
      renderCountChip(utils, t(i18n, 'ui.practiceDocReadinessCountCritical', 'essenziali mancanti'), overview.counts.critical, overview.counts.critical ? 'danger' : 'default'),
      renderCountChip(utils, t(i18n, 'ui.practiceDocReadinessArchiveCountLabel', 'Archivio'), overview.totalAttachments, overview.totalAttachments ? 'success' : 'default')
    ].join('');

    const topAction = renderAction(overview.topCard, utils, i18n);

    return `
      <section class="practice-doc-readiness-board" data-practice-doc-readiness-board>
        <div class="practice-readiness-head">
          <div>
            <div class="practice-overview-kicker">${escape(utils, t(i18n, 'ui.practiceDocReadinessKicker', 'Completezza documentale'))}</div>
            <h4 class="practice-readiness-title">${escape(utils, t(i18n, 'ui.practiceDocReadinessTitle', 'Pacchetti documentali essenziali'))}</h4>
            <p class="practice-readiness-subtitle">${escape(utils, t(i18n, 'ui.practiceDocReadinessSubtitle', 'Controlla riferimenti chiave e allegati minimi per tipo pratica, così il fascicolo resta più pronto per documenti, tracking e fatturazione.'))}</p>
          </div>
          <div class="practice-readiness-counts">${chips}</div>
        </div>
        <div class="practice-readiness-overview ${escape(utils, overview.tone)}">
          <div>
            <div class="practice-readiness-overview-title">${escape(utils, overview.title)}</div>
            <div class="practice-readiness-overview-detail">${escape(utils, overview.detail)}</div>
          </div>
          <div class="practice-readiness-overview-side">${topAction}</div>
        </div>
        <div class="practice-doc-readiness-grid">
          ${cards.map((card) => renderCard(card, utils, i18n)).join('')}
        </div>
      </section>`;
  }

  return {
    render
  };
})();
