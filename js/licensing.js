window.KedrixOneLicensing = (() => {
  'use strict';

  const PLAN_BUNDLES = {
    base: ['dashboard', 'practices', 'quotations', 'master-data', 'documents', 'settings'],
    pro: ['transports', 'warehouse', 'tracking'],
    enterprise: ['crm', 'administration', 'bi', 'customs', 'groupware', 'workflow', 'admin']
  };

  function bundleForPlan(plan) {
    const result = new Set(PLAN_BUNDLES.base);
    if (plan === 'pro' || plan === 'enterprise') PLAN_BUNDLES.pro.forEach((key) => result.add(key));
    if (plan === 'enterprise') PLAN_BUNDLES.enterprise.forEach((key) => result.add(key));
    return result;
  }

  function getActiveUser(state) {
    return (state.users || []).find((user) => user.id === state.activeUserId) || null;
  }

  function getCompanyEntitlements(state) {
    const company = state.companyConfig || {};
    const entitlements = bundleForPlan(company.plan || 'base');
    (company.purchasedModules || []).forEach((key) => entitlements.add(key));
    (company.disabledModules || []).forEach((key) => entitlements.delete(key));
    return entitlements;
  }

  function getUserEntitlements(state) {
    const entitlements = new Set(getCompanyEntitlements(state));
    const user = getActiveUser(state);
    if (!user) return entitlements;
    const baseSet = bundleForPlan(state.companyConfig.plan || 'base');
    Array.from(entitlements).forEach((key) => {
      if (!baseSet.has(key) && !(user.extraModules || []).includes(key)) entitlements.delete(key);
    });
    (user.extraModules || []).forEach((key) => entitlements.add(key));
    (user.disabledModules || []).forEach((key) => entitlements.delete(key));
    return entitlements;
  }

  function visibleModules(modules, state) {
    const visible = getUserEntitlements(state);
    return modules.filter((module) => visible.has(module.key) || module.key === 'dashboard').map((module) => ({...module, submodules: module.submodules.map((s) => ({...s}))}));
  }

  function routeAllowed(route, modulesApi, state) {
    const meta = modulesApi.getRouteMeta(modulesApi.normalizeRoute(route));
    if (!meta) return false
    const entitlements = getUserEntitlements(state);
    return entitlements.has(meta.moduleKey) || meta.moduleKey === 'dashboard';
  }

  function moduleStatus(module, state) {
    const company = state.companyConfig || {};
    const user = getActiveUser(state) || { extraModules: [], disabledModules: [] };
    const companySet = getCompanyEntitlements(state);
    const userSet = getUserEntitlements(state);
    const baseSet = bundleForPlan(company.plan || 'base');
    return {
      isBaseIncluded: baseSet.has(module.key),
      isCompanyPurchased: (company.purchasedModules || []).includes(module.key),
      isCompanyVisible: companySet.has(module.key),
      isUserEnabled: userSet.has(module.key),
      isExplicitUserExtra: (user.extraModules || []).includes(module.key),
      isExplicitUserBlocked: (user.disabledModules || []).includes(module.key)
    };
  }

  function toggleCompanyModule(state, moduleKey) {
    const company = state.companyConfig;
    company.purchasedModules = Array.isArray(company.purchasedModules) ? company.purchasedModules : [];
    if (bundleForPlan(company.plan).has(moduleKey)) return;
    if (company.purchasedModules.includes(moduleKey)) company.purchasedModules = company.purchasedModules.filter((key) => key !== moduleKey);
    else company.purchasedModules = [...company.purchasedModules, moduleKey];
  }

  function toggleUserModule(state, moduleKey) {
    const user = getActiveUser(state);
    if (!user) return;
    user.extraModules = Array.isArray(user.extraModules) ? user.extraModules : [];
    user.disabledModules = Array.isArray(user.disabledModules) ? user.disabledModules : [];
    const companyEntitlements = getCompanyEntitlements(state);
    const baseIncluded = bundleForPlan(state.companyConfig.plan || 'base').has(moduleKey);
    if (baseIncluded) {
      if (user.disabledModules.includes(moduleKey)) user.disabledModules = user.disabledModules.filter((key) => key !== moduleKey);
      else user.disabledModules = [...user.disabledModules, moduleKey];
      return;
    }
    if (!companyEntitlements.has(moduleKey)) return;
    if (user.extraModules.includes(moduleKey)) user.extraModules = user.extraModules.filter((key) => key !== moduleKey);
    else user.extraModules = [...user.extraModules, moduleKey];
  }

  function setActiveUser(state, userId) { if ((state.users || []).some((user) => user.id === userId)) state.activeUserId = userId; }
  function setCompanyPlan(state, plan) { if (['base', 'pro', 'enterprise'].includes(plan)) state.companyConfig.plan = plan; }

  return { PLAN_BUNDLES, getActiveUser, getCompanyEntitlements, getUserEntitlements, visibleModules, routeAllowed, moduleStatus, toggleCompanyModule, toggleUserModule, setActiveUser, setCompanyPlan };
})();