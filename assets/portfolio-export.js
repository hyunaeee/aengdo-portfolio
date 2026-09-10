/* A DOM-backed, searchable and link-preserving A4 edition. No canvas screenshots. */
(function () {
  "use strict";

  const PUBLIC_ROOT = "https://hyunaeee.github.io/aengdo-portfolio/";
  const PUBLIC_PORTFOLIO = PUBLIC_ROOT + "portfolio.html";
  const FILENAME = "AENGDO_Portfolio";
  const CATEGORY = { ai: "AI / AGENTS", app: "APP / MOBILE", web: "WEB / PRODUCT", play: "INTERACTIVE / 3D" };
  let busy = false;
  let printing = false;
  let originalTitle = null;
  let preparedForPrint = false;
  let report = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function textOf(node) { return node ? node.textContent.replace(/\s+/g, " ").trim() : ""; }

  // Project data contains editorial <b> and <code> markup. Keep its text only.
  function plain(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    return textOf(template.content);
  }

  function liveURL(raw) {
    if (!raw || raw === "#") return null;
    try {
      const url = new URL(raw, PUBLIC_ROOT);
      return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function link(label, raw, className) {
    const url = liveURL(raw);
    if (!url) return null;
    const anchor = element("a", className, label);
    anchor.href = url;
    return anchor;
  }

  function image(src, alt, className) {
    if (!src) return null;
    const img = element("img", className);
    img.src = new URL(src, document.baseURI).href;
    img.alt = alt || "";
    img.loading = "eager";
    img.decoding = "sync";
    // Failed remote/local thumbnails must not leave broken-image decorations in the PDF.
    img.addEventListener("error", () => { img.hidden = true; img.style.display = "none"; });
    return img;
  }

  function status(message) {
    document.querySelectorAll("[data-export-status]").forEach(node => {
      if (!node.hasAttribute("role")) node.setAttribute("role", "status");
      if (!node.hasAttribute("aria-live")) node.setAttribute("aria-live", "polite");
      node.textContent = message;
    });
  }

  function page(title, eyebrow, kind) {
    const sheet = element("section", "pf-page " + (kind || ""));
    const heading = element("div", "pf-page-head");
    heading.append(element("h2", "pf-page-title", title), element("span", "pf-eyebrow", eyebrow));
    const body = element("div", "pf-page-body");
    const footer = element("div", "pf-page-footer");
    footer.append(link("AENGDO / PORTFOLIO", PUBLIC_PORTFOLIO), element("span", "pf-page-number"));
    sheet.append(heading, body, footer);
    return { sheet, body };
  }

  function contactLinks(parent, showURL) {
    const sources = document.querySelectorAll(".wrap > footer a[href]");
    sources.forEach(source => {
      const url = liveURL(source.getAttribute("href"));
      if (!url) return;
      const label = showURL ? url.replace(/^mailto:/, "").replace(/^https?:\/\//, "") : textOf(source);
      const anchor = link(label, url);
      if (anchor) parent.append(anchor);
    });
  }

  function createCover(projectCount) {
    const { sheet, body } = page("PORTFOLIO", "AI · PRODUCT · CONTENT", "pf-cover");
    const name = element("h1", "pf-cover-name", "AENGDO");
    name.append(element("span", "", "."));
    const intro = textOf(document.querySelector(".wrap > header .tagline")) ||
      "뇌과학 × 컴퓨터과학에서 출발해 AI 에이전트를 개발하고, 서비스를 배포하고, 콘텐츠를 만듭니다.";
    body.append(name, element("p", "pf-cover-role", "AI Engineer & Content Creator"), element("p", "pf-cover-intro", intro));
    const poster = image("assets/aengdo-studio-poster.png", "AENGDO 인터랙티브 스튜디오 정지 이미지", "pf-poster");
    body.append(poster, element("p", "pf-poster-caption", "인터랙티브 스튜디오 · 라이브 포트폴리오에서 3D 장면과 프로젝트를 둘러보세요."));
    const roles = element("div", "pf-roles");
    document.querySelectorAll(".wrap > header .roles .role").forEach(source => {
      const item = element("section", "pf-role");
      item.append(element("h3", "", textOf(source.querySelector("b"))), element("p", "", textOf(source.querySelector("span"))));
      roles.append(item);
    });
    body.append(roles);
    const bottom = element("div", "pf-cover-bottom");
    bottom.append(element("p", "", "프로젝트 " + projectCount + "개 · 제작 콘텐츠 · 경력 · 기술 스택"));
    bottom.append(link("라이브 포트폴리오 ↗", PUBLIC_PORTFOLIO));
    body.append(bottom);
    return sheet;
  }

  function section(parent, label, content, className) {
    if (!content || (Array.isArray(content) && !content.length)) return;
    const row = element("div", "pf-project-section");
    row.append(element("span", "pf-label", label));
    if (Array.isArray(content)) {
      const list = element("ul", "pf-results");
      content.forEach(value => list.append(element("li", "", plain(value))));
      row.append(list);
    } else row.append(element("p", className || "", plain(content)));
    parent.append(row);
  }

  function createProject(source, index) {
    const key = source.dataset.p;
    const data = (window.PORTFOLIO_PROJECTS || {})[key] || {};
    const title = textOf(source.querySelector(".m b"));
    const project = element("article", "pf-project");
    project.dataset.project = key || String(index);
    const heading = element("div", "pf-project-heading");
    const meta = element("div");
    const category = CATEGORY[source.dataset.cat] || "PROJECT";
    meta.append(element("p", "pf-project-meta", String(index + 1).padStart(2, "0") + " / " + category));
    meta.append(element("h3", "", title));
    meta.append(element("p", "pf-project-meta", [textOf(source.querySelector(".dt")), textOf(source.querySelector(".badge"))].filter(Boolean).join(" · ")));
    heading.append(meta);
    const thumbnail = source.querySelector(".shot img");
    if (thumbnail) heading.append(image(thumbnail.getAttribute("src"), thumbnail.alt || title, "pf-project-shot"));
    project.append(heading);
    const description = textOf(source.querySelector(".m span"));
    if (description) project.append(element("p", "pf-project-desc", description));
    section(project, "핵심 성과", data.results);
    section(project, "기획 의도", data.why);
    section(project, "기술 스택", Array.isArray(data.stack) ? data.stack.join(" · ") : data.stack, "pf-stack-text");
    section(project, "현재 한계", data.limits);
    const links = element("div", "pf-project-links");
    source.querySelectorAll(".acts a[href]").forEach(sourceLink => {
      const url = liveURL(sourceLink.getAttribute("href"));
      if (!url) return;
      const anchor = link("", url);
      anchor.append(element("span", "pf-link-label", textOf(sourceLink).replace(/[↗▶]/g, "").trim()), document.createTextNode(url));
      links.append(anchor);
    });
    source.querySelectorAll(".acts .off").forEach(note => links.append(element("span", "pf-access", textOf(note))));
    if (links.childNodes.length) project.append(links);
    return project;
  }

  function createWorkAndStack() {
    const { sheet, body } = page("SELECTED WORKS & STACK", "CONTENT / CRAFT");
    const works = element("div", "pf-works");
    document.querySelectorAll(".wrap .works .work").forEach(source => {
      const item = link("", source.getAttribute("href"), "pf-work") || element("div", "pf-work");
      const img = source.querySelector("img");
      if (img) item.append(image(img.getAttribute("src"), img.alt));
      const caption = source.querySelector(".cap");
      const subtitle = textOf(caption && caption.querySelector("small"));
      const title = caption ? [...caption.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join("").trim() : (img ? img.alt : "");
      item.append(element("h3", "", title), element("p", "", subtitle));
      works.append(item);
    });
    body.append(works);
    const audio = document.querySelector(".audio-line audio");
    if (audio) {
      const audioRow = element("p", "pf-audio");
      const label = textOf(document.querySelector(".audio-line .t"));
      const audioLink = link(label + " · 음원 듣기 ↗", audio.getAttribute("src"));
      if (audioLink) audioRow.append(audioLink);
      body.append(audioRow);
    }
    body.append(element("h3", "pf-section-heading", "분야별 기술 스택"));
    const stacks = element("div", "pf-stacks");
    document.querySelectorAll(".stackgrid .stackcat").forEach(source => {
      const item = element("section", "pf-stack");
      item.append(element("h3", "", textOf(source.querySelector(".cat"))));
      item.append(element("p", "", [...source.querySelectorAll(".chip")].map(textOf).join(" · ")));
      item.append(element("small", "", textOf(source.querySelector(".lv"))));
      stacks.append(item);
    });
    body.append(stacks);
    return sheet;
  }

  function createTrackRecord() {
    const { sheet, body } = page("TRACK RECORD & CONTACT", "BACKGROUND / CONNECTIONS");
    document.querySelectorAll(".trgrid > div").forEach(source => {
      const timeline = element("section", "pf-timeline");
      timeline.append(element("h3", "", textOf(source.querySelector(".trcat"))));
      source.querySelectorAll(".tl > div").forEach(entry => {
        const date = entry.querySelector("b");
        const clone = entry.cloneNode(true);
        const cloneDate = clone.querySelector("b");
        if (cloneDate) cloneDate.remove();
        const row = element("div", "pf-timeline-row");
        row.append(element("b", "", textOf(date)), element("p", "", textOf(clone)));
        timeline.append(row);
      });
      body.append(timeline);
    });
    body.append(element("h3", "pf-section-heading", "LET’S BUILD SOMETHING."));
    const contacts = element("div", "pf-contacts");
    contactLinks(contacts, true);
    body.append(contacts);
    const online = element("p", "pf-contact-note");
    online.append(link("전체 프로젝트 상세·인터랙티브 데모: " + PUBLIC_PORTFOLIO, PUBLIC_PORTFOLIO));
    body.append(online);
    return sheet;
  }

  // Two projects normally share one sheet. If the content grows, move the second
  // one to a new sheet instead of shrinking fonts or cutting off any text.
  function paginateProjects(root) {
    const mm = 96 / 25.4;
    root.querySelectorAll(".pf-project-page").forEach(sheet => {
      const projects = sheet.querySelector(".pf-projects");
      const available = 271 * mm - sheet.querySelector(".pf-page-head").getBoundingClientRect().height -
        sheet.querySelector(".pf-page-footer").getBoundingClientRect().height - 10 * mm;
      if (projects.scrollHeight <= available + 1 || projects.children.length < 2) return;
      const extra = page("BUILT & SHIPPED", "PROJECT COLLECTION", "pf-project-page");
      extra.body.classList.add("pf-projects");
      extra.body.append(projects.lastElementChild);
      sheet.after(extra.sheet);
    });
    const pages = [...root.querySelectorAll(".pf-page")];
    pages.forEach((sheet, index) => {
      sheet.querySelector(".pf-page-number").textContent = String(index + 1).padStart(2, "0") + " / " + String(pages.length).padStart(2, "0");
    });
    return pages.length;
  }

  function buildDocument() {
    const previous = document.getElementById("portfolio-print");
    if (previous) previous.remove();
    const root = element("main");
    root.id = "portfolio-print";
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("inert", "");
    const projects = [...document.querySelectorAll(".webs .web[data-p]")];
    root.append(createCover(projects.length));
    for (let index = 0; index < projects.length; index += 2) {
      const { sheet, body } = page("BUILT & SHIPPED", "PROJECT COLLECTION", "pf-project-page");
      body.classList.add("pf-projects");
      projects.slice(index, index + 2).forEach((source, offset) => body.append(createProject(source, index + offset)));
      root.append(sheet);
    }
    root.append(createWorkAndStack(), createTrackRecord());
    document.body.append(root);
    report = { pages: paginateProjects(root), projects: projects.length, imagesFailed: 0 };
    return root;
  }

  function waitForImage(img) {
    if (img.complete) return Promise.resolve(img.naturalWidth > 0);
    return new Promise(resolve => {
      let timer;
      const finish = success => {
        clearTimeout(timer);
        img.removeEventListener("load", loaded);
        img.removeEventListener("error", failed);
        resolve(success);
      };
      const loaded = () => finish(true);
      const failed = () => { img.hidden = true; img.style.display = "none"; finish(false); };
      img.addEventListener("load", loaded, { once: true });
      img.addEventListener("error", failed, { once: true });
      timer = setTimeout(failed, 7000);
    });
  }

  async function prepare() {
    const root = buildDocument();
    const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const [, images] = await Promise.all([
      Promise.race([fontReady, new Promise(resolve => setTimeout(resolve, 5000))]),
      Promise.all([...root.querySelectorAll("img")].map(waitForImage))
    ]);
    report = { pages: paginateProjects(root), projects: root.querySelectorAll(".pf-project").length, imagesFailed: images.filter(loaded => !loaded).length };
    return { ...report };
  }

  function finishPrint() {
    if (originalTitle !== null) document.title = originalTitle;
    originalTitle = null;
    printing = false;
    busy = false;
    preparedForPrint = false;
    document.querySelectorAll("[data-export-pdf]").forEach(button => {
      button.removeAttribute("aria-busy");
      if (button.hasAttribute("data-export-was-disabled") && button.dataset.exportWasDisabled !== "true") button.removeAttribute("disabled");
      delete button.dataset.exportWasDisabled;
    });
  }

  function beginPrint() {
    if (!preparedForPrint) buildDocument();
    printing = true;
    if (originalTitle === null) originalTitle = document.title;
    document.title = FILENAME;
    const root = document.getElementById("portfolio-print");
    if (root) { root.removeAttribute("inert"); root.removeAttribute("aria-hidden"); }
  }

  async function exportPDF() {
    if (busy) return;
    busy = true;
    document.querySelectorAll("[data-export-pdf]").forEach(button => {
      button.dataset.exportWasDisabled = String(button.hasAttribute("disabled"));
      button.setAttribute("disabled", "");
      button.setAttribute("aria-busy", "true");
    });
    status("전체 프로젝트와 이미지를 PDF용 A4 문서로 정리하고 있어요.");
    try {
      const result = await prepare();
      preparedForPrint = true;
      status(result.pages + "쪽 준비 완료" + (result.imagesFailed ? " · 불러오지 못한 이미지는 생략했어요." : ".") + " 인쇄 창에서 ‘PDF로 저장’을 선택하세요.");
      beginPrint();
      window.print();
    } catch (error) {
      status("PDF 준비 중 문제가 생겼어요. 브라우저 인쇄(Ctrl+P)로 다시 시도해 주세요.");
      finishPrint();
    }
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-export-pdf]");
    if (!button) return;
    event.preventDefault();
    exportPDF();
  });
  window.addEventListener("beforeprint", beginPrint);
  window.addEventListener("afterprint", () => {
    const root = document.getElementById("portfolio-print");
    if (root) { root.setAttribute("inert", ""); root.setAttribute("aria-hidden", "true"); }
    finishPrint();
  });

  // Warm the images/fonts for native Ctrl+P, whose beforeprint event is synchronous.
  function warm() { if (!busy && !printing) prepare().catch(() => {}); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", warm, { once: true });
  else warm();

  window.PortfolioExport = { prepare, exportPDF, publicURL: PUBLIC_PORTFOLIO };
})();
