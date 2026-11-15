(async () => {
  const container = document.getElementById('slide-sections');
  if (!container) return;
  try {
    const response = await fetch('slide-sections.json', { cache: 'no-cache' });
    if (!response.ok) throw Error(`Slide configuration: HTTP ${response.status}`);
    const config = await response.json();
    if (!Array.isArray(config.sections) || config.sections.some(section =>
      !Number.isInteger(section.slide) || section.slide < 1 || typeof section.title !== 'string')) {
      throw Error('Invalid slide section configuration.');
    }
    const sections = config.sections.map(({ title, slide }, index) => {
      const section = document.createElement('section');
      section.className = 'slide-section';
      const heading = document.createElement('h2');
      heading.id = `slide-heading-${index + 1}`;
      heading.textContent = title;
      section.setAttribute('aria-labelledby', heading.id);
      const frame = document.createElement('iframe');
      frame.src = `slides/slide-${slide}.html`;
      frame.title = title || `DeckWerk slide ${slide}`;
      frame.loading = 'lazy';
      frame.allow = 'autoplay';
      section.append(heading, frame);
      return section;
    });
    container.replaceChildren(...sections);
  } catch (error) {
    console.error('Unable to load slide sections:', error);
  }
})();
