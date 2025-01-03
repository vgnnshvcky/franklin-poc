import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const heroSection = main.querySelector('.hero');
  if (!heroSection) return;

  const container = document.createElement('div');
  container.className = 'hero-container';

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-wrapper';

  const picture = heroSection.querySelector('picture');
  const h1 = heroSection.querySelector('h1');
  const subheading = heroSection.querySelector('h2');
  const description = heroSection.querySelector('p');
  const button = heroSection.querySelector('a');
  const form = heroSection.querySelector('form'); // For input-based sections

  // Add Picture
  if (picture) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'hero-image';
    imageWrapper.appendChild(picture.cloneNode(true));
    container.appendChild(imageWrapper);
  }

  // Add Content
  const content = document.createElement('div');
  content.className = 'hero-content';

  if (h1) content.appendChild(h1.cloneNode(true));
  if (subheading) content.appendChild(subheading.cloneNode(true));
  if (description) content.appendChild(description.cloneNode(true));
  if (button) {
    const clonedButton = button.cloneNode(true);
    clonedButton.classList.add('hero-button');
    content.appendChild(clonedButton);
  }
  if (form) content.appendChild(form.cloneNode(true));

  wrapper.appendChild(content);
  container.appendChild(wrapper);

  // Prepend the hero block to the main content
  heroSection.textContent = '';
  heroSection.appendChild(container);
}


/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
