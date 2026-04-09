window.KedrixOneLicensing = (() => {
  'use strict';

  const PLAN_BUNDLES = {
    base: ['dashboard', 'practices', 'quotations', 'master-data', 'documents', 'settings'],
    pro: ['transports', 'warehouse', 'tracking'],
    enterprise: ['crm', 'administration', 'bi', 'customs', 'groupware', 'workflow', 'admin']
  };

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function bundleForPlan(plan) {
    const result = new Set(PLAN_BUNDLES.base);
    if (plan === 'pro' || plan === 'enterprise') {
      PLAN_BUNDLES.pro.forEach((key) => result.add(key));
    }
    if (plan === 'enterprise') {
      PLAN_BUNDLES.enterprise.forEach((key) => result.add(key));
    }
    return result;
  }

  function getActiveUser(state) {
    return asArray(state.users).find((user) => user.id === state.activeUserId) || null;
  }

  function getCompanyEntitlements(state) {
    const company = state.companyConfig || {};
    const entitlements = bundleForPlan(company.plan || 'base');
    asArray(company.purchasedModules).forEach((key) => entitlements.add(key));
    asArray(company.disabledModules).forEach((key) => entitlements.delete(key));
    return entitlements;
  }

  function getUserEntitlements(state) {
    const entitlements = new Set(getCompanyEntitlements(state));
    const user = getActiveUser(state);
    if (!user) return entitlements;

    const companySet = getCompanyEntitlements(state);
    const baseSet = bundleForPlan(state.companyConfig.plan || 'base');

    Array.from(entitlements).forEach((key) => {
      if (!baseSet.has(key) && !asArray(user.extraModules).includes(key) && companySet.has(key)) {
        entitlements.delete(key);
      }
    });

    asArray(user.extraModules).forEach((key) => {
      if (companySet.has(key)) entitlements.add(key);
    });

    asArray(user.disabledModules).forEach((key) => entitlements.delete(key));
    return entitlements;
  }

  function moduleAllowed(moduleKey, state) {
    return moduleKey === 'dashboard' || getUserEntitlements(state).has(moduleKey);
  }

  function getCompanySubmoduleEntitlements(module, state) {
    const company = state.companyConfig || {};
    const allSubmodules = asArray(module.submodules);
    if (!moduleAllowed(module.key, { ...state, users: [{ id:'_company', extraModules: Array.from(getCompanyEntitlements(state)), disabledModules: [] }], activeUserId:'_company' })) {
      return new Set();
    }

    const allByDefault = bundleForPlan(company.plan || 'base').has(module.key) || getCompanyEntitlements(state).has(module.key);
    const result = new Set();

    if (allByDefault) {
      allSubmodules.forEach((submodule) => result.add(submodule.route));
    }

    asArray(company.purchasedSubmodules).forEach((route) => {
      if (allSubmodules.some((submodule) => submodule.route === route)) result.add(route);
    });

    asArray(company.disabledSubmodules).forEach((route) => result.delete(route));
    return result;
  }

  function getUserSubmoduleEntitlements(module, state) {
    if (!moduleAllowed(module.key, state)) return new Set();

    const result = new Set(getCompanySubmoduleEntitlements(module, state));
    const user = getActiveUser(state);
    if (!user) return result;

    const allSubmodules = asArray(module.submodules);
    const companySubmodules = getCompanySubmoduleEntitlements(module, state);

    allSubmodules.forEach((submodule) => {
      if (!companySubmodules.has(submodule.route) && !asArray(user.extraSubmodules).includes(submodule.route)) {
        result.delete(submodule.route);
      }
    });

    asArray(user.extraSubmodules).forEach((route) => {
      if (allSubmodules.some((submodule) => submodule.route === route)) result.add(route);
    });

    asArray(user.disabledSubmodules).forEach((route) => result.delete(route));
    return result;
  }

  function visibleModules(modules, state) {
    return modules
      .filter((module) => moduleAllowed(module.key, state))
      .map((module) => {
        const visibleSubmodules = getUserSubmoduleEntitlements(module, state);
        return {
          ...module,
          submodules: module.submodules.filter((submodule) => visibleSubmodules.has(submodule.route))
        };
      });
  }

  function routeAllowed(route, modulesApi, state) {
    const meta = modulesApi.getRouteMeta(modulesApi.normalizeRoute(route));
    if (!meta) return false;
    if (meta.type === 'module') return moduleAllowed(meta.moduleKey, state);
    if (meta.route === 'practices/workspace') return moduleAllowed(meta.moduleKey, state);
    const module = modulesApi.getModule(meta.moduleKey);
    if (!module) return false;
    return getUserSubmoduleEntitlements(module, state).has(meta.route);
  }

  function moduleStatus(module, state) {
    const company = state.companyConfig || {};
    const user = getActiveUser(state) || {};
    const baseSet = bundleForPlan(company.plan || 'base');
    const companySet = getCompanyEntitlements(state);
    const userSet = getUserEntitlements(state);

    return {
      isBaseIncluded: baseSet.has(module.key),
      isCompanyPurchased: asArray(company.purchasedModules).includes(module.key),
      isCompanyVisible: companySet.has(module.key),
      isUserEnabled: userSet.has(module.key),
      isExplicitUserExtra: asArray(user.extraModules).includes(module.key),
      isExplicitUserBlocked: asArray(user.disabledModules).includes(module.key)
    };
  }

  function submoduleStatus(module, submodule, state) {
    const company = state.companyConfig || {};
    const user = getActiveUser(state) || {};
    const allByDefault = moduleStatus(module, state).isCompanyVisible;
    const companySet = getCompanySubmoduleEntitlements(module, state);
    const userSet = getUserSubmoduleEntitlements(module, state);

    return {
      isModuleEnabled: moduleAllowed(module.key, state),
      isCompanyIncluded: allByDefault,
      isCompanyPurchased: asArray(company.purchasedSubmodules).includes(submodule.route),
      isCompanyVisible: companySet.has(submodule.route),
      isUserEnabled: userSet.has(submodule.route),
      isExplicitUserExtra: asArray(user.extraSubmodules).includes(submodule.route),
      isExplicitUserBlocked: asArray(user.disabledSubmodules).includes(submodule.route)
    };
  }

  function toggleCompanyModule(state, moduleKey) {
    const company = state.companyConfig || {};
    company.purchasedModules = asArray(company.purchasedModules);
    if (bundleForPlan(company.plan || 'base').has(moduleKey)) return;
    if (company.purchasedModules.includes(moduleKey)) {
      company.purchasedModules = company.purchasedModules.filter((key) => key !== moduleKey);
    } else {
      company.purchasedModules = [...company.purchasedModules, moduleKey];
    }
  }

  function toggleUserModule(state, moduleKey) {
    const user = getActiveUser(state);
    if (!user) return;

    user.extraModules = asArray(user.extraModules);
    user.disabledModules = asArray(user.disabledModules);
    const baseIncluded = bundleForPlan(state.companyConfig.plan || 'base').has(moduleKey);
    const companyEntitlements = getCompanyEntitlements(state);

    if (baseIncluded) {
      if (user.disabledModules.includes(moduleKey)) {
        user.disabledModules = user.disabledModules.filter((key) => key !== moduleKey);
      } else {
        user.disabledModules = [...user.disabledModules, moduleKey];
      }
      return;
    }

    if (!companyEntitlements.has(moduleKey)) return;

    if (user.extraModules.includes(moduleKey)) {
      user.extraModules = user.extraModules.filter((key) => key !== moduleKey);
    } else {
      user.extraModules = [...user.extraModules, moduleKey];
    }
  }

  function toggleCompanySubmodule(state, module, route) {
    const company = state.companyConfig || {};
    company.purchasedSubmodules = asArray(company.purchasedSubmodules);
    company.disabledSubmodules = asArray(company.disabledSubmodules);
    const allByDefault = moduleStatus(module, state).isCompanyVisible;

    if (allByDefault) {
      if (company.disabledSubmodules.includes(route)) {
        company.disabledSubmodules = company.disabledSubmodules.filter((item) => item !== route);
      } else {
        company.disabledSubmodules = [...company.disabledSubmodules, route];
      }
      return;
    }

    if (company.purchasedSubmodules.includes(route)) {
      company.purchasedSubmodules = company.purchasedSubmodules.filter((item) => item !== route);
    } else {
      company.purchasedSubmodules = [...company.purchasedSubmodules, route];
    }
  }

  function toggleUserSubmodule(state, module, route) {
    const user = getActiveUser(state);
    if (!user) return;

    user.extraSubmodules = asArray(user.extraSubmodules);
    user.disabledSubmodules = asArray(user.disabledSubmodules);

    const companyVisible = getCompanySubmoduleEntitlements(module, state).has(route);

    if (companyVisible) {
      if (user.disabledSubmodules.includes(route)) {
        user.disabledSubmodules = user.disabledSubmodules.filter((item) => item !== route);
      } else {
        user.disabledSubmodules = [...user.disabledSubmodules, route];
      }
      return;
    }

    if (user.extraSubmodules.includes(route)) {
      user.extraSubmodules = user.extraSubmodules.filter((item) => item !== route);
    } else {
      user.extraSubmodules = [...user.extraSubmodules, route];
    }
  }

  function setActiveUser(state, userId) {
    if (asArray(state.users).some((user) => user.id === userId)) state.activeUserId = userId;
  }

  function setCompanyPlan(state, plan) {
    if (['base', 'pro', 'enterprise'].includes(plan)) state.companyConfig.plan = plan;
  }

  return {
    PLAN_BUNDLES,
    getActiveUser,
    getCompanyEntitlements,
    getUserEntitlements,
    getCompanySubmoduleEntitlements,
    getUserSubmoduleEntitlements,
    visibleModules,
    routeAllowed,
    moduleStatus,
    submoduleStatus,
    moduleAllowed,
    toggleCompanyModule,
    toggleUserModule,
    toggleCompanySubmodule,
    toggleUserSubmodule,
    setActiveUser,
    setCompanyPlan
  };
})();