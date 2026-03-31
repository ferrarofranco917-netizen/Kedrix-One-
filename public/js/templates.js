
window.KedrixOneTemplates = (() => {
  'use strict';
  const U = window.KedrixOneUtils;

  function dashboard(state){
    const alerts = window.KedrixOneWiseMind.alerts(state.practices);
    return `
      <section class="hero">
        <h2>Kedrix One</h2>
        <p>STEP 3 fix tecnico: struttura modulare caricata correttamente e senza 404.</p>
      </section>

      <section class="kpi-grid">
        <article class="panel kpi">
          <div class="kpi-label">Pratiche</div>
          <div class="kpi-value">${state.practices.length}</div>
        </article>
        <article class="panel kpi">
          <div class="kpi-label">Alert</div>
          <div class="kpi-value">${alerts.length}</div>
        </article>
        <article class="panel kpi">
          <div class="kpi-label">Modulo JS</div>
          <div class="kpi-value">6</div>
        </article>
      </section>

      <section class="table-panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tipo</th><th>Messaggio</th></tr></thead>
            <tbody>
              ${alerts.map(a => `<tr><td><span class="badge ${a.severity}">${a.severity.toUpperCase()}</span></td><td>${U.escapeHtml(a.title)} · ${U.escapeHtml(a.text)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function practices(state){
    return `
      <section class="panel" style="padding:18px">
        <div class="action-row" style="margin-bottom:14px">
          <button class="btn" id="demoSaveBtn" type="button">Salva backup locale</button>
          <button class="btn secondary" id="demoResetBtn" type="button">Reset demo</button>
        </div>

        <form id="practiceForm">
          <div class="form-grid">
            <div class="field">
              <label>Riferimento</label>
              <input name="reference" placeholder="Es. KX-IMP-0004" required>
            </div>
            <div class="field">
              <label>Cliente</label>
              <input name="client" placeholder="Es. Cliente S.r.l." required>
            </div>
            <div class="field">
              <label>Tipo</label>
              <select name="type"><option>Import</option><option>Export</option></select>
            </div>
            <div class="field">
              <label>Porto</label>
              <input name="port" placeholder="Es. Genova" required>
            </div>
            <div class="field">
              <label>ETA</label>
              <input name="eta" type="date" required>
            </div>
            <div class="field">
              <label>Stato</label>
              <select name="status"><option>In attesa documenti</option><option>Operativa</option><option>Sdoganamento</option></select>
            </div>
          </div>
          <div class="action-row" style="margin-top:14px">
            <button class="btn" type="submit">Salva pratica</button>
          </div>
        </form>
      </section>

      <section class="table-panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Rif.</th><th>Cliente</th><th>Tipo</th><th>Porto</th><th>ETA</th><th>Stato</th></tr></thead>
            <tbody>
              ${state.practices.map(p => `
                <tr>
                  <td>${U.escapeHtml(p.id)}</td>
                  <td>${U.escapeHtml(p.reference)}</td>
                  <td>${U.escapeHtml(p.client)}</td>
                  <td>${U.escapeHtml(p.type)}</td>
                  <td>${U.escapeHtml(p.port)}</td>
                  <td>${U.formatDate(p.eta)}</td>
                  <td><span class="badge ${p.status === 'In attesa documenti' ? 'warning' : 'info'}">${U.escapeHtml(p.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  return { dashboard, practices };
})();
