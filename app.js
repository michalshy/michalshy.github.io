import { h, render, Fragment } from 'https://esm.sh/preact@10';
import { useState, useEffect, useRef } from 'https://esm.sh/preact@10/hooks';
import htm from 'https://esm.sh/htm@3';
import { marked } from 'https://esm.sh/marked@9';

const html = htm.bind(h);

// ---- UTILS ----

function stripFrontmatter(md) {
  const m = md.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : md;
}

function formatDate(str) {
  return new Date(str + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

let hljsReady = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureHljs() {
  if (hljsReady) return;
  const base = 'https://cdn.jsdelivr.net/npm/highlight.js@11/lib';
  await loadScript(`${base}/core.min.js`);
  const langs = ['javascript', 'typescript', 'python', 'rust', 'bash', 'css', 'json', 'go', 'cpp', 'c'];
  await Promise.all(langs.map(l => loadScript(`${base}/languages/${l}.min.js`)));
  hljsReady = true;
}

// ---- HOOKS ----

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return hash;
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}

function useReveal(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('visible');
        obs.disconnect();
      }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
}

// ---- NAV ----

function Nav({ hash }) {
  const scrolled = useScrolled();
  const links = [
    { href: '#about',    label: 'about'    },
    { href: '#projects', label: 'projects' },
    { href: '#articles', label: 'articles' },
  ];
  return html`
    <nav id="nav" class=${scrolled ? 'scrolled' : ''}>
      <div class="container nav-inner">
        <a href="#" class="nav-logo">brodziak.dev</a>
        <ul class="nav-links">
          ${links.map(({ href, label }) => html`
            <li><a href=${href} class=${hash === href ? 'active' : ''}>${label}</a></li>
          `)}
        </ul>
      </div>
    </nav>
  `;
}

// ---- FOOTER ----

function Footer() {
  return html`
    <footer id="footer">
      <div class="container footer-inner">
        <span class="footer-mono">michal brodziak © 2026</span>
        <div class="footer-links">
          <a href="https://github.com/michalshy" target="_blank" rel="noopener">github</a>
          <a href="https://linkedin.com/in/brodziak" target="_blank" rel="noopener">linkedin</a>
          <a href="mailto:michal.brodziakw@gmail.com">email</a>
        </div>
      </div>
    </footer>
  `;
}

// ---- HERO ----

function Hero() {
  return html`
    <section class="hero" id="hero">
      <div class="container">
        <div class="hero-inner">
          <div class="hero-prompt">~/michal</div>
          <p class="hero-tagline">
            Software engineer. I build tools, emulators, usually things that run close to the metal or are connected to game dev. 
          </p>
          <div class="hero-actions">
            <a href="#projects" class="btn btn--accent">view projects</a>
            <a href="#articles" class="btn btn--outline">read articles</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ---- ABOUT ----

function About() {
  const gridRef = useRef(null);
  const skillsRef = useRef(null);
  useReveal(gridRef);
  useReveal(skillsRef);

  const skills = ['c++', 'rust', 'python', 'c#', 'unity', 'unreal', 'godot', 'cmake'];

  return html`
    <section class="section" id="about">
      <div class="container">
        <p class="section-label">about</p>
        <div class="about-grid reveal" ref=${gridRef}>
          <div class="about-bio">
            <p>
              Software engineer with a background spanning game tooling and embedded systems. I work across the stack but prefer the lower floors.
            </p>
            <p>
              My personal projects lean toward the system programming and low level projects — emulators, interpreters, network communication, but also machine learning and web pages (such as this one).
              I like building things that require understanding what the machine is actually doing.
            </p>
            <p>
              C++ and C for most things, although I belive language is mostly tool.
            </p>
          </div>
          <div>
            <div class="about-skills-label">things I work with</div>
            <div class="about-skills reveal-stagger" ref=${skillsRef}>
              ${skills.map(s => html`<span class="skill-tag">${s}</span>`)}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ---- PROJECTS ----

function ProjectCard({ project: p }) {
  const ref = useRef(null);
  useReveal(ref);

  return html`
    <article class=${`project-card reveal ${p.featured ? 'project-card--featured' : ''}`} ref=${ref}>
      <div class="project-screenshot">
        ${p.screenshot
          ? html`<img src=${p.screenshot} alt=${`${p.title} screenshot`} loading="lazy" />`
          : html`<div class="project-screenshot-placeholder">no preview</div>`
        }
      </div>
      <div class="project-body">
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.description}</p>
        ${p.tags?.length && html`
          <div class="project-tags">
            ${p.tags.map(t => html`<span class="project-tag">${t}</span>`)}
          </div>
        `}
        <div class="project-links">
          ${p.demo_url && html`
            <a href=${p.demo_url} target="_blank" rel="noopener" class="project-link">↗ demo</a>
          `}
          ${p.github_url && html`
            <a href=${p.github_url} target="_blank" rel="noopener" class="project-link">↗ github</a>
          `}
        </div>
      </div>
    </article>
  `;
}

function Projects({ projects }) {
  const titleRef = useRef(null);
  useReveal(titleRef);

  return html`
    <section class="section" id="projects">
      <div class="container">
        <p class="section-label">projects</p>
        <h2 class="section-title reveal" ref=${titleRef}>things I've built</h2>
        <p class="section-desc">
          A selection of projects — some finished, some ongoing.
          Source on GitHub where available.
        </p>
        <div class="projects-grid">
          ${projects.length
            ? projects.map(p => html`<${ProjectCard} key=${p.title} project=${p} />`)
            : html`<p class="text-muted text-mono" style="font-size:var(--text-sm)">projects coming soon.</p>`
          }
        </div>
      </div>
    </section>
  `;
}

// ---- ARTICLES LIST ----

function ArticleItem({ article: a }) {
  return html`
    <a class="article-item" href=${`#article/${a.slug}`}>
      <span class="article-date">${formatDate(a.date)}</span>
      <div class="article-content">
        <div class="article-title">${a.title}</div>
        ${a.description && html`<div class="article-description">${a.description}</div>`}
        ${a.tags?.length && html`
          <div class="article-tags-inline">
            ${a.tags.map(t => html`<span class="article-tag">${t}</span>`)}
          </div>
        `}
      </div>
      <span class="article-arrow">→</span>
    </a>
  `;
}

function ArticlesList({ articles }) {
  const listRef = useRef(null);
  useReveal(listRef);

  return html`
    <section class="section" id="articles">
      <div class="container">
        <p class="section-label">articles</p>
        <h2 class="section-title">writing</h2>
        <p class="section-desc">
          Notes on things I've learned, built, or found interesting.
        </p>
        <div class="articles-list reveal" ref=${listRef}>
          ${articles.length
            ? articles.map(a => html`<${ArticleItem} key=${a.slug} article=${a} />`)
            : html`<p class="text-muted text-mono" style="font-size:var(--text-sm)">articles coming soon.</p>`
          }
        </div>
      </div>
    </section>
  `;
}

// ---- ARTICLE DETAIL VIEW ----

function ArticleView({ slug, articles }) {
  const [body, setBody] = useState(null);
  const [err, setErr] = useState(null);
  const proseRef = useRef(null);

  const meta = articles.find(a => a.slug === slug) ?? { title: slug };

  useEffect(() => {
    setBody(null);
    setErr(null);
    fetch(`articles/${slug}.md`)
      .then(r => r.ok ? r.text() : Promise.reject(new Error(`${r.status}`)))
      .then(raw => setBody(marked.parse(stripFrontmatter(raw))))
      .catch(e => setErr(e.message));
  }, [slug]);

  useEffect(() => {
    if (!body) return;
    document.title = `${meta.title} — brodziak.dev`;
    window.scrollTo(0, 0);
    ensureHljs().then(() => {
      proseRef.current?.querySelectorAll('pre code').forEach(b => window.hljs?.highlightElement(b));
    });
  }, [body]);

  return html`
    <div class="article-view">
      <div class="container">
        <button class="article-back" onClick=${() => { window.location.hash = '#articles'; }}>← back</button>
        ${err
          ? html`<div class="error-state">Could not load article: <code>${slug}</code></div>`
          : !body
            ? html`<div class="loading-state">loading</div>`
            : html`
              <div class="article-header">
                ${meta.date && html`<span class="article-date">${formatDate(meta.date)}</span>`}
                <h1>${meta.title}</h1>
                ${meta.description && html`<p class="article-description">${meta.description}</p>`}
                ${meta.tags?.length && html`
                  <div class="article-header-tags">
                    ${meta.tags.map(t => html`<span class="article-header-tag">${t}</span>`)}
                  </div>
                `}
              </div>
              <div class="article-divider"></div>
              <div class="prose" ref=${proseRef} dangerouslySetInnerHTML=${{ __html: body }}></div>
            `
        }
      </div>
    </div>
  `;
}

// ---- HOME VIEW ----

function HomeView({ projects, articles }) {
  return html`
    <${Hero} />
    <${About} />
    <${Projects} projects=${projects} />
    <${ArticlesList} articles=${articles} />
  `;
}

// ---- ROOT APP ----

function App() {
  const hash = useHash();
  const [projects, setProjects] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      fetch('projects.json').then(r => r.ok ? r.json() : []),
      fetch('articles/index.json').then(r => r.ok ? r.json() : []),
    ]).then(([pr, ar]) => {
      if (pr.status === 'fulfilled') setProjects(pr.value);
      if (ar.status === 'fulfilled') setArticles(ar.value);
    });
  }, []);

  useEffect(() => {
    if (!hash.startsWith('#article/')) document.title = 'brodziak.dev';
  }, [hash]);

  const isArticle = hash.startsWith('#article/');
  const slug = isArticle ? hash.slice('#article/'.length) : null;

  return html`
    <${Fragment}>
      <${Nav} hash=${hash} />
      <main id="main">
        ${isArticle
          ? html`<${ArticleView} key=${slug} slug=${slug} articles=${articles} />`
          : html`<${HomeView} key="home" projects=${projects} articles=${articles} />`
        }
      </main>
      <${Footer} />
    <//>
  `;
}

render(html`<${App} />`, document.getElementById('app'));
