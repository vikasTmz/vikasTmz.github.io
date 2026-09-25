/* A progressively enhanced biography and a local, focused command input. */
(() => {
  'use strict';

  function initTerminal() {
    const root = document.getElementById('termDiv');
    if (!root || root.dataset.initialized) return;
    root.dataset.initialized = 'true';

    const bio = root.querySelector('.term-bio');
    const greeting = root.querySelector('.term-greeting');
    const controls = root.querySelector('.term-controls');
    const activate = root.querySelector('.term-activate');
    const skip = root.querySelector('.term-skip');
    const session = root.querySelector('.term-session');
    const output = root.querySelector('.term-output');
    const form = root.querySelector('.term-form');
    const input = root.querySelector('input');
    const close = root.querySelector('.term-close');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const greetingText = Array.from(greeting.childNodes, node =>
      node.nodeName === 'BR' ? '\n' : node.textContent.replace(/\s+/g, ' ')
    ).join('').replace(/ *\n */g, '\n').trim();
    // Keep the complete greeting in the layout and type over it.
    // Its natural height follows wrapping, resizing, and font changes.
    const greetingSlot = document.createElement('div');
    greetingSlot.className = 'term-greeting-slot';
    greeting.before(greetingSlot);
    greetingSlot.append(greeting);
    const history = [];
    let historyIndex = 0;
    let draft = '';
    let frame = null;
    let animatedGreeting = null;

    function finishGreeting() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (animatedGreeting) animatedGreeting.remove();
      animatedGreeting = null;
      greeting.classList.remove('term-reserved');
      skip.textContent = 'replay';
      skip.hidden = false;
    }

    function animateGreeting(explicitReplay = false) {
      finishGreeting();
      // Reduced motion skips autoplay; an explicit replay still works.
      if (motion.matches && !explicitReplay) return;
      animatedGreeting = document.createElement('p');
      animatedGreeting.className = 'term-greeting term-typing';
      animatedGreeting.setAttribute('aria-hidden', 'true');
      greeting.after(animatedGreeting);
      greeting.classList.add('term-reserved');
      skip.textContent = 'skip';
      skip.hidden = false;
      // Pace individual characters instead of fitting the entire bio into
      // a fixed duration. These values are delays in milliseconds.
      // const typing = { character: 32, variation: 8, comma: 110, sentence: 260, paragraph: 420 };
      const typing = { character: 24, variation: 5, comma: 80, sentence: 140, paragraph: 260 };
      const characters = Array.from(greetingText);
      const text = document.createTextNode('');
      animatedGreeting.append(text);
      let index = 0;
      let nextCharacterAt = performance.now() + 180;

      function pauseAfter(character, next) {
        if (character === '\n') return next === '\n' ? 0 : typing.paragraph;
        if (/[.!?]/.test(character) && (!next || /\s/.test(next))) return typing.sentence;
        if (/[,;:]/.test(character)) return typing.comma;
        return 0;
      }

      function tick(now) {
        if (document.hidden) {
          nextCharacterAt = now + typing.character;
        } else if (now >= nextCharacterAt) {
          if (index === characters.length) {
            finishGreeting();
            return;
          }
          const character = characters[index++];
          text.appendData(character);
          const variation = (Math.random() * 2 - 1) * typing.variation;
          // At most one character per frame: never rush to catch up after
          // a slow frame or returning from a background tab.
          nextCharacterAt = now + typing.character + variation + pauseAfter(character, characters[index]);
        }
        frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }

    function writeResponse(command, text, link) {
      const entry = document.createElement('div');
      entry.className = 'term-entry';
      const echo = document.createElement('p');
      echo.className = 'term-echo';
      echo.textContent = '> ' + command;
      const response = document.createElement('p');
      response.textContent = text;
      entry.append(echo, response);
      if (link) {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.label;
        entry.append(anchor);
      }
      output.append(entry);
      // Bound the transcript while retaining a scrollable recent history.
      if (output.children.length > 30) output.firstElementChild.remove();
      output.scrollTop = output.scrollHeight;
    }

    function closeTerminal() {
      finishGreeting();
      session.hidden = true;
      activate.hidden = false;
      activate.textContent = 'Reopen terminal';
      input.value = '';
      activate.focus();
    }

    const helpText = [
      'help / man / vikas — Show commands',
      'about — Read the biography',
      'about -i — Read interests',
      'projects / publications — Link to projects and publications',
      'resume — Link to the résumé PDF',
      'clear — Clear command history from the screen',
      'exit — Close the terminal'
    ].join('\n');

    const commands = {
      help: () => ({ text: helpText }),
      about: () => ({ text: Array.from(bio.querySelectorAll('p:not([aria-hidden])'), p => p.textContent).join('\n\n') }),
      projects: () => ({ text: 'Browse my projects and publications:', link: { href: '#projects', label: 'Projects and publications' } }),
      resume: () => ({ text: 'Read my résumé:', link: { href: 'resume/resume_vikas_thamizharasan.pdf', label: 'Résumé (PDF)' } }),
      clear: () => { output.replaceChildren(); },
      exit: closeTerminal
    };
    const aliases = { man: 'help', vikas: 'help', publications: 'projects' };

    form.addEventListener('submit', event => {
      event.preventDefault();
      finishGreeting();
      const command = input.value.trim();
      input.value = '';
      // Empty input never changes the input's enabled state.
      if (!command) return;
      if (history[history.length - 1] !== command) history.push(command);
      if (history.length > 50) history.shift();
      historyIndex = history.length;
      draft = '';
      const [rawName, ...args] = command.toLowerCase().split(/\s+/);
      const name = Object.prototype.hasOwnProperty.call(aliases, rawName) ? aliases[rawName] : rawName;
      let result;
      if (!Object.prototype.hasOwnProperty.call(commands, name)) {
        result = { text: 'Unknown command. Type "help" to see available commands.' };
      } else if (name === 'about' && args.length === 1 && args[0] === '-i') {
        result = { text: root.querySelector('.term-interests').textContent };
      } else if (args.length) {
        result = { text: name === 'about' ? 'Usage: about or about -i' : 'Usage: ' + rawName };
      } else {
        result = commands[name]();
      }
      if (result) writeResponse(command, result.text, result.link);
      if (!session.hidden) input.focus();
    });

    input.addEventListener('keydown', event => {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTerminal();
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex === history.length) draft = input.value;
        historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
        input.value = historyIndex === history.length ? draft : history[historyIndex];
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    activate?.addEventListener('click', () => {
      finishGreeting();
      activate.hidden = true;
      session.hidden = false;
      historyIndex = history.length;
      draft = '';
      input.focus();
    });
    close.addEventListener('click', closeTerminal);
    skip.addEventListener('click', () => {
      if (animatedGreeting) finishGreeting();
      else animateGreeting(true);
    });
    motion.addEventListener('change', () => { if (motion.matches) finishGreeting(); });
    window.addEventListener('pagehide', finishGreeting);
    controls.hidden = false;
    animateGreeting();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTerminal, { once: true });
  else initTerminal();
})();
