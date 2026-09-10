/* Printable hiring portfolio. All facts come from portfolio-content.js. */
(function () {
  "use strict";
  const PUBLIC_ROOT = "https://hyunaeee.github.io/aengdo-portfolio/";
  const LOCAL_ROOT = document.currentScript && document.currentScript.src
    ? new URL("../", document.currentScript.src).href
    : new URL(document.body.dataset.siteRoot || "./", document.baseURI).href;
  const BUTTONS = "[data-print-portfolio], [data-export-pdf]";
  const FOCUS = {
    general: { order: ["med-rag", "terracotta", "meeting"], label: { ko: "AI 엔지니어 포트폴리오", en: "AI engineering portfolio" } },
    toss: { order: ["med-rag", "terracotta", "meeting"], label: { ko: "서빙 · 성능 · 운영", en: "Serving · Performance · Operations" } },
    motif: { order: ["terracotta", "med-rag", "meeting"], label: { ko: "제품 구현 · 배포", en: "Product Engineering · Delivery" } },
    cohere: { order: ["med-rag", "meeting", "terracotta"], label: { ko: "엔터프라이즈 AI · RAG · 워크플로", en: "Enterprise AI · RAG · Workflows" } }
  };
  const COPY = {
    ko: {
      portfolio: "PORTFOLIO", selected: "대표 사례", role: "담당 역할", status: "현재 상태", period: "기간", stack: "기술",
      decisions: "설계 판단", limits: "현재 한계와 검증 범위", evidence: "검증과 실험", implementation: "설계와 구현",
      sources: "직접 확인할 수 있는 근거", metric: "항목", result: "결과", context: "측정 조건 / 해석",
      experience: "경력과 구현 경험", technicalProduct: "인터랙티브 제품", contact: "연락처", archive: "프로젝트 아카이브",
      more: "전체 사례와 라이브 데모", continued: "계속", preparing: "사례와 근거를 A4 문서로 정리하고 있어요.",
      ready: "쪽 준비 완료. 인쇄 창에서 ‘PDF로 저장’을 선택하세요.", missingImage: " 불러오지 못한 이미지는 생략했어요.",
      failed: "PDF 문서를 준비하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
      briefNote: "담당 역할, 구현 내용, 측정 조건과 공개 근거를 함께 정리했습니다.",
      archiveNote: "전체 프로젝트 목록입니다. 공개 데모·실험·운영 상태는 각 항목에 표시했습니다.", updated: "내용 기준", link: "바로 보기"
    },
    en: {
      portfolio: "PORTFOLIO", selected: "Selected cases", role: "My role", status: "Current status", period: "Period", stack: "Stack",
      decisions: "Engineering decisions", limits: "Limitations and scope", evidence: "Evaluation and experiments", implementation: "Design and implementation",
      sources: "Evidence and source material", metric: "Measure", result: "Result", context: "Conditions / interpretation",
      experience: "Experience and engineering craft", technicalProduct: "Interactive product", contact: "Contact", archive: "Project archive",
      more: "Full cases and live demos", continued: "continued", preparing: "Preparing the cases and evidence for A4 pages.",
      ready: " pages ready. Choose ‘Save as PDF’ in the print dialog.", missingImage: " Unavailable images were omitted.",
      failed: "The PDF could not be prepared. Refresh the page and try again.",
      briefNote: "Responsibilities, implementation, measurement conditions and public evidence, in one document.",
      archiveNote: "Full project index. Public demos, experiments and operational status are labelled individually.", updated: "Content as of", link: "Open"
    }
  };
  let busy = false, printing = false, originalTitle = null, preparedForPrint = false;
  let activeOptions = null, buildSequence = 0, lastReport = null;
  const buttonStates = new Map();

  function options(input) {
    const query = new URLSearchParams(window.location.search);
    const source = input || {};
    const lang = String(source.lang || document.documentElement.lang || query.get("lang") || "ko").toLowerCase().startsWith("en") ? "en" : "ko";
    const requestedFocus = source.focus || query.get("focus") || "general";
    const focus = Object.hasOwn(FOCUS, requestedFocus) ? requestedFocus : "general";
    const requestedArchive = source.archive !== undefined ? source.archive : query.get("archive");
    return { lang, focus, archive: requestedArchive === true || requestedArchive === "true" || requestedArchive === "1" };
  }
  function localize(value, lang) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return String(value[lang] || value.ko || value.en || "");
  }
  function node(tag, className, value) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (value !== undefined && value !== null) result.textContent = String(value);
    return result;
  }
  function url(raw) {
    if (!raw || raw === "#") return null;
    try {
      const result = new URL(raw, PUBLIC_ROOT);
      if (!["https:", "http:", "mailto:"].includes(result.protocol)) return null;
      if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(result.hostname)) {
        return new URL(result.pathname.replace(/^\//, "") + result.search + result.hash, PUBLIC_ROOT).href;
      }
      return result.href;
    } catch (_) { return null; }
  }
  function anchor(label, raw, className) {
    const href = url(raw);
    if (!href) return null;
    const result = node("a", className, label);
    result.href = href;
    return result;
  }
  function image(value, lang, className) {
    if (!value || !value.src) return null;
    const result = node("img", className);
    result.src = new URL(value.src, LOCAL_ROOT).href;
    result.alt = localize(value.alt, lang);
    result.loading = "eager";
    result.decoding = "sync";
    result.addEventListener("error", () => { result.hidden = true; result.style.display = "none"; });
    return result;
  }
  function append(parent, child) { if (child) parent.append(child); return child; }
  function list(value) { return Array.isArray(value) ? value : []; }
  function publicPage(lang, focus) {
    const result = new URL(lang === "en" ? "en.html" : "portfolio.html", PUBLIC_ROOT);
    if (focus !== "general") result.searchParams.set("focus", focus);
    return result.href;
  }
  function createPage(title, eyebrow, context, className) {
    const sheet = node("section", "pf-page " + (className || ""));
    const heading = node("header", "pf-page-head");
    heading.append(node("h2", "pf-page-title", title), node("span", "pf-eyebrow", eyebrow));
    const body = node("div", "pf-page-body");
    const footer = node("footer", "pf-page-footer");
    append(footer, anchor(context.data.person.name + " / PORTFOLIO", publicPage(context.lang, context.focus)));
    footer.append(node("span", "pf-page-number"));
    sheet.append(heading, body, footer);
    sheet.dataset.pageTitle = title;
    return { sheet, body };
  }
  function block(title, context, className) {
    const result = node("section", "pf-block " + (className || ""));
    if (title) result.append(node("h3", "pf-section-title", title));
    return result;
  }
  function addParagraphs(parent, values, context) {
    list(values).forEach(value => {
      const content = localize(value, context.lang);
      if (content) parent.append(node("p", "pf-copy", content));
    });
  }
  function addBullets(parent, values, context) {
    const items = list(values).map(value => localize(value, context.lang)).filter(Boolean);
    if (!items.length) return;
    const ul = node("ul", "pf-bullets");
    items.forEach(value => ul.append(node("li", "", value)));
    parent.append(ul);
  }
  function sourceBlock(links, context, heading) {
    const sources = list(links).filter(item => url(item.url));
    if (!sources.length) return null;
    const result = block(heading === false ? "" : context.copy.sources, context, "pf-sources");
    sources.forEach(item => {
      const link = anchor("", item.url, "pf-source-link");
      link.append(node("strong", "", localize(item.label, context.lang) || context.copy.link), node("span", "", url(item.url)));
      result.append(link);
    });
    return result;
  }
  function sectionBlock(section, context, settings) {
    const mode = settings || {};
    const result = block(mode.proseOnly ? "" : localize(section.title, context.lang), context, "pf-case-section");
    if (section.eyebrow && !mode.proseOnly) result.prepend(node("p", "pf-eyebrow", localize(section.eyebrow, context.lang)));
    addParagraphs(result, section.body, context);
    addBullets(result, section.bullets, context);
    if (list(section.diagram).length && !mode.omitDiagram) {
      const diagram = node("ol", "pf-diagram");
      section.diagram.forEach((step, index) => {
        const item = node("li", "pf-diagram-step");
        item.append(node("span", "pf-step-number", String(index + 1).padStart(2, "0")), node("strong", "", localize(step.label, context.lang)));
        if (step.detail) item.append(node("p", "", localize(step.detail, context.lang)));
        diagram.append(item);
      });
      result.append(diagram);
    }
    if (section.table) result.append(table(section.table.headers, section.table.rows, context));
    result.dataset.section = section.id || "";
    return result;
  }
  function table(headers, rows, context) {
    const result = node("table", "pf-table"), head = node("thead"), heading = node("tr"), body = node("tbody");
    list(headers).forEach(value => { const cell = node("th", "", localize(value, context.lang)); cell.scope = "col"; heading.append(cell); });
    head.append(heading);
    list(rows).forEach(values => { const row = node("tr"); list(values).forEach(value => row.append(node("td", "", localize(value, context.lang)))); body.append(row); });
    result.append(head, body);
    return result;
  }
  function metricBlock(project, context) {
    if (!list(project.metrics).length) return null;
    const result = block(context.copy.evidence, context, "pf-metrics");
    result.append(table([context.copy.metric, context.copy.result, context.copy.context], project.metrics.map(metric => [metric.label, metric.value, metric.note]), context));
    return result;
  }
  function decisionBlocks(project, context) {
    return list(project.decisions).map((decision, index) => {
      const result = block(localize(decision.title, context.lang), context, "pf-decision");
      result.prepend(node("p", "pf-eyebrow", context.copy.decisions + " / " + String(index + 1).padStart(2, "0")));
      result.append(node("p", "pf-copy", localize(decision.body, context.lang)));
      return result;
    });
  }
  function limitBlock(project, context) {
    if (!list(project.limitations).length) return null;
    const result = block(context.copy.limits, context, "pf-limitations");
    addBullets(result, project.limitations, context);
    return result;
  }
  function projectIntro(project, context, compact) {
    const result = block("", context, "pf-project-intro" + (compact ? " pf-compact-intro" : ""));
    result.dataset.project = project.id;
    const top = node("div", "pf-project-top"), text = node("div", "pf-project-heading");
    const casePosition = FOCUS[context.focus].order.indexOf(project.id) + 1;
    const caseNumber = casePosition || project.number;
    text.append(node("p", "pf-eyebrow", caseNumber ? String(caseNumber).padStart(2, "0") + " / CASE STUDY" : "CASE STUDY"));
    text.append(node("h3", "pf-project-title", project.title));
    text.append(node("p", "pf-project-subtitle", project.period));
    top.append(text);
    if (!compact) append(top, image(project.image, context.lang, "pf-project-image"));
    result.append(top);
    // MED-RAG's context paragraphs immediately follow; its overview is already on the cover.
    if (!compact && project.summary && project.id !== "med-rag") result.append(node("p", "pf-summary", localize(project.summary, context.lang)));
    if (!compact) {
      const facts = node("dl", "pf-facts");
      [[context.copy.role, project.role], [context.copy.status, project.status], [context.copy.period, project.period]].forEach(([label, value]) => {
        if (!value) return;
        const pair = node("div"); pair.append(node("dt", "", label), node("dd", "", localize(value, context.lang))); facts.append(pair);
      });
      if (list(project.stack).length) {
        const pair = node("div"); pair.append(node("dt", "", context.copy.stack), node("dd", "pf-stack", project.stack.join(" · "))); facts.append(pair);
      }
      result.append(facts);
    }
    return result;
  }
  function cover(context, orderedProjects) {
    const { data, lang, copy } = context;
    const { sheet, body } = createPage(copy.portfolio, localize(FOCUS[context.focus].label, lang), context, "pf-cover");
    const identity = block("", context, "pf-identity");
    identity.append(node("p", "pf-eyebrow", localize(data.person.location, lang)), node("h1", "pf-name", data.person.name));
    identity.append(node("p", "pf-position", localize(data.person.role, lang)));
    const contacts = node("div", "pf-cover-contacts");
    append(contacts, anchor(data.person.email, "mailto:" + data.person.email));
    append(contacts, anchor("GITHUB / " + String(data.person.github || "").replace(/^https?:\/\//, ""), data.person.github));
    identity.append(contacts); body.append(identity);
    const cases = block(copy.selected, context, "pf-case-index");
    orderedProjects.forEach((project, index) => {
      const item = node("article", "pf-index-case"), details = node("div");
      item.append(node("span", "pf-index-number", String(index + 1).padStart(2, "0")));
      details.append(node("h3", "", project.title), node("p", "pf-index-status", project.period));
      item.append(details); cases.append(item);
    });
    body.append(cases);
    const note = block("", context, "pf-cover-note");
    if (data.updatedAt) note.append(node("p", "pf-small", copy.updated + " " + data.updatedAt));
    append(note, anchor(copy.more + " ↗", publicPage(lang, context.focus))); body.append(note);
    return sheet;
  }
  function projectPages(project, context) {
    if (project.id !== "med-rag") {
      const { sheet, body } = createPage(project.title, context.copy.implementation, context, "pf-case-page");
      body.append(projectIntro(project, context, false));
      const isMeeting = project.id === "meeting";
      if (!isMeeting) append(body, metricBlock(project, context));
      list(project.sections).filter(section => !isMeeting || !["context", "access"].includes(section.id)).forEach(section => body.append(sectionBlock(section, context)));
      decisionBlocks(project, context).filter((_, index) => !isMeeting || index === 1).forEach(item => body.append(item));
      append(body, limitBlock(project, context)); append(body, sourceBlock(project.links, context));
      return [sheet];
    }
    const design = createPage(project.title, context.copy.implementation, context, "pf-case-page");
    const evidence = createPage(project.title, context.copy.evidence, context, "pf-case-page");
    design.body.append(projectIntro(project, context, false)); evidence.body.append(projectIntro(project, context, true));
    const sections = list(project.sections);
    let implementation = sections.filter(section => !/eval|tune|bench|measur|evidence|experiment|validation|iteration/i.test(section.id || ""));
    let evaluation = sections.filter(section => /eval|tune|bench|measur|evidence|experiment|validation|iteration/i.test(section.id || ""));
    if (!evaluation.length && sections.length > 1) {
      const cut = Math.ceil(sections.length / 2); implementation = sections.slice(0, cut); evaluation = sections.slice(cut);
    }
    if (context.focus === "toss") {
      const order = ["context", "operations", "architecture"];
      implementation.sort((a, b) => {
        const aIndex = order.indexOf(a.id), bIndex = order.indexOf(b.id);
        return (aIndex < 0 ? order.length : aIndex) - (bIndex < 0 ? order.length : bIndex);
      });
    }
    implementation.forEach(section => design.body.append(sectionBlock(section, context, { proseOnly: section.id === "context", omitDiagram: section.id === "operations" })));
    // The evaluation and tuning sections already explain decisions 2 and 3 in detail.
    append(design.body, decisionBlocks(project, context)[0]);
    append(design.body, sourceBlock(list(project.links).filter(item => item.kind === "code" || item.kind === "demo"), context, false));
    evaluation.forEach(section => evidence.body.append(sectionBlock(section, context)));
    append(evidence.body, limitBlock(project, context)); append(evidence.body, sourceBlock(list(project.links).filter(item => item.kind !== "code" && item.kind !== "demo"), context));
    return [design.sheet, evidence.sheet];
  }
  function experiencePage(context) {
    const { data, copy, lang } = context;
    const { sheet, body } = createPage(copy.experience, "BACKGROUND / PRODUCT / CONTACT", context, "pf-experience-page");
    const experience = block("", context, "pf-experience");
    list(data.experience).forEach(item => {
      const row = node("article", "pf-experience-row"), description = node("div");
      row.append(node("p", "pf-experience-period", item.period));
      description.append(node("h3", "", localize(item.org, lang)), node("p", "pf-experience-role", localize(item.role, lang)));
      if (item.description) description.append(node("p", "pf-copy", localize(item.description, lang)));
      row.append(description); experience.append(row);
    });
    append(experience, anchor(lang === "ko" ? "전체 이력 · 2017–2026 ↗" : "Full history · 2017–2026 ↗", PUBLIC_ROOT + (lang === "ko" ? "history.html" : "history-en.html"), "pf-small"));
    body.append(experience);
    const anatomy = list(data.projects).find(project => project.id === "anatomy");
    if (anatomy) {
      const item = block(copy.technicalProduct + " / " + anatomy.title, context, "pf-anatomy"), layout = node("div", "pf-anatomy-layout"), description = node("div");
      append(layout, image(anatomy.image, lang, "pf-anatomy-image"));
      description.append(node("p", "pf-copy", localize(anatomy.summary, lang)), node("p", "pf-small", localize(anatomy.status, lang)));
      if (anatomy.role) description.append(node("p", "pf-small", copy.role + ": " + localize(anatomy.role, lang)));
      addBullets(description, anatomy.limitations, context); layout.append(description); item.append(layout);
      append(item, sourceBlock(anatomy.links, context, false)); body.append(item);
    }
    const contact = block(copy.contact, context, "pf-contact");
    append(contact, anchor(data.person.email, "mailto:" + data.person.email, "pf-email"));
    append(contact, sourceBlock([{ label: "GitHub", url: data.person.github }, { label: copy.more, url: publicPage(lang, context.focus) }], context, false));
    body.append(contact);
    return sheet;
  }
  function archivePages(context) {
    const items = list(context.data.archive);
    if (!items.length) return [];
    const { sheet, body } = createPage(context.copy.archive, "FULL PROJECT INDEX", context, "pf-archive-page");
    const note = block("", context); note.append(node("p", "pf-copy", context.copy.archiveNote)); body.append(note);
    items.forEach(project => {
      const item = block(project.title, context, "pf-archive-item"); item.dataset.archiveProject = project.id;
      item.append(node("p", "pf-eyebrow", [project.category, localize(project.status, context.lang)].filter(Boolean).join(" / ")), node("p", "pf-copy", localize(project.summary, context.lang)));
      if (list(project.stack).length) item.append(node("p", "pf-stack", project.stack.join(" · ")));
      append(item, sourceBlock(project.links, context, false)); body.append(item);
    });
    return [sheet];
  }
  function naturalHeight(body) {
    const old = body.style.flex; body.style.flex = "0 0 auto";
    const height = body.getBoundingClientRect().height; body.style.flex = old; return height;
  }
  function paginate(root, context) {
    const mm = 96 / 25.4, all = [...root.querySelectorAll(".pf-page")];
    for (let index = 0; index < all.length; index++) {
      const sheet = all[index], body = sheet.querySelector(".pf-page-body"), head = sheet.querySelector(".pf-page-head"), footer = sheet.querySelector(".pf-page-footer");
      const available = 270 * mm - head.getBoundingClientRect().height - footer.getBoundingClientRect().height - 10 * mm;
      if (naturalHeight(body) <= available + 1) continue;
      const moved = [];
      while (body.children.length > 1 && naturalHeight(body) > available + 1) { moved.unshift(body.lastElementChild); body.lastElementChild.remove(); }
      if (!moved.length) continue;
      const next = createPage(sheet.dataset.pageTitle, context.copy.continued, context, "pf-continuation");
      next.body.append(...moved); sheet.after(next.sheet); all.splice(index + 1, 0, next.sheet);
    }
    const pages = [...root.querySelectorAll(".pf-page")];
    pages.forEach((sheet, index) => { sheet.querySelector(".pf-page-number").textContent = String(index + 1).padStart(2, "0") + " / " + String(pages.length).padStart(2, "0"); });
    return pages.length;
  }
  function build(input) {
    const settings = options(input), data = window.HYUNAE_PORTFOLIO;
    if (!data || !data.person || !Array.isArray(data.projects)) throw new Error("Portfolio shared content is not loaded.");
    const context = { ...settings, data, copy: COPY[settings.lang] };
    const previous = document.getElementById("portfolio-print"); if (previous) previous.remove();
    const root = node("main"); root.id = "portfolio-print"; root.lang = settings.lang;
    root.dataset.focus = settings.focus; root.dataset.archive = String(settings.archive);
    root.setAttribute("aria-hidden", "true"); root.setAttribute("inert", "");
    const orderedProjects = FOCUS[settings.focus].order.map(id => data.projects.find(project => project.id === id)).filter(Boolean);
    root.append(cover(context, orderedProjects)); orderedProjects.forEach(project => root.append(...projectPages(project, context)));
    root.append(experiencePage(context)); if (settings.archive) root.append(...archivePages(context)); document.body.append(root);
    return { root, context, projects: orderedProjects.length, sequence: ++buildSequence };
  }
  function waitForImage(img) {
    if (img.complete) return Promise.resolve(img.naturalWidth > 0);
    return new Promise(resolve => {
      let timer;
      const finish = success => { clearTimeout(timer); img.removeEventListener("load", loaded); img.removeEventListener("error", failed); if (!success) { img.hidden = true; img.style.display = "none"; } resolve(success); };
      const loaded = () => finish(true), failed = () => finish(false);
      img.addEventListener("load", loaded, { once: true }); img.addEventListener("error", failed, { once: true }); timer = setTimeout(failed, 7000);
    });
  }
  async function prepare(input) {
    const built = build(input), fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const [, images] = await Promise.all([Promise.race([fonts, new Promise(resolve => setTimeout(resolve, 5000))]), Promise.all([...built.root.querySelectorAll("img")].map(waitForImage))]);
    if (built.sequence !== buildSequence) return { cancelled: true };
    const pages = paginate(built.root, built.context); activeOptions = options(input);
    lastReport = { ...activeOptions, pages, projects: built.projects, archiveProjects: built.root.querySelectorAll("[data-archive-project]").length, imagesFailed: images.filter(loaded => !loaded).length, filename: filename(activeOptions), oversizedPages: [...built.root.querySelectorAll(".pf-page")].map((page, index) => page.getBoundingClientRect().height > 272 * 96 / 25.4 ? index + 1 : null).filter(Boolean) };
    return { ...lastReport };
  }
  function filename(settings) { return "Hyunae_Park_Portfolio_" + settings.lang.toUpperCase() + (settings.focus === "general" ? "" : "_" + settings.focus) + (settings.archive ? "_Archive" : ""); }
  function status(message) {
    document.querySelectorAll("[data-export-status], [data-print-status]").forEach(item => { if (!item.hasAttribute("role")) item.setAttribute("role", "status"); if (!item.hasAttribute("aria-live")) item.setAttribute("aria-live", "polite"); item.textContent = message; });
  }
  function finishPrint() {
    if (originalTitle !== null) document.title = originalTitle;
    originalTitle = null; busy = false; printing = false; preparedForPrint = false;
    for (const [button, state] of buttonStates) { if (!state.disabled) button.removeAttribute("disabled"); if (state.busy === null) button.removeAttribute("aria-busy"); else button.setAttribute("aria-busy", state.busy); }
    buttonStates.clear(); const root = document.getElementById("portfolio-print"); if (root) { root.setAttribute("inert", ""); root.setAttribute("aria-hidden", "true"); }
  }
  function beginPrint() {
    const dialog = document.getElementById("export-dialog");
    if (dialog && dialog.open && typeof dialog.close === "function") dialog.close();
    if (!preparedForPrint) { const built = build(options()); paginate(built.root, built.context); activeOptions = options(); }
    printing = true; if (originalTitle === null) originalTitle = document.title; document.title = filename(activeOptions || options());
    const root = document.getElementById("portfolio-print"); if (root) { root.removeAttribute("inert"); root.removeAttribute("aria-hidden"); }
  }
  async function exportPDF(input) {
    if (busy) return;
    busy = true; const settings = options(input), copy = COPY[settings.lang];
    document.querySelectorAll(BUTTONS).forEach(button => { buttonStates.set(button, { disabled: button.hasAttribute("disabled"), busy: button.getAttribute("aria-busy") }); button.setAttribute("disabled", ""); button.setAttribute("aria-busy", "true"); });
    status(copy.preparing);
    const dialog = document.getElementById("export-dialog");
    if (dialog && dialog.open && typeof dialog.close === "function") dialog.close();
    try {
      const report = await prepare(settings); if (report.cancelled) throw new Error("Print preparation superseded.");
      preparedForPrint = true; status(report.pages + copy.ready + (report.imagesFailed ? copy.missingImage : "")); beginPrint(); window.print(); return report;
    } catch (_) { status(copy.failed); finishPrint(); return null; }
  }
  document.addEventListener("click", event => { const button = event.target.closest(BUTTONS); if (!button) return; event.preventDefault(); exportPDF({ lang: button.dataset.lang, focus: button.dataset.focus, archive: button.dataset.archive }); });
  window.addEventListener("beforeprint", () => { try { beginPrint(); } catch (_) { status(COPY[options().lang].failed); } });
  window.addEventListener("afterprint", finishPrint);
  function warm() { if (!busy && !printing && window.HYUNAE_PORTFOLIO) prepare().catch(() => {}); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", warm, { once: true }); else warm();
  window.PortfolioExport = { prepare, exportPDF, publicURL: PUBLIC_ROOT + "portfolio.html" };
})();
