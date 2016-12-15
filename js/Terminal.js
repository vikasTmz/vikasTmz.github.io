var term;

var help = [
  ' * type "colors"    to see the default internal colors.',
  ' * type "webcolors" to see the standard VGA and web safe colors.',
  ' * type "nscolors"  to see the VGA and netscape colors by name.',
  ' * type "help"      to see this page.',
  ' * type "exit"      to quit.',
  ' '
];

var colorTable = [
  'termlib.js internal color table:',
  ' %+i%+ucolor name   code        sample       comment%-i                                %-u',
  ' default        0     %c(default)normal %+rreverse%-r%c0   "default" refers always to config color',
  ' black          1     %c(black)normal %+rreverse%-r%c0',
  ' red            2     %c(red)normal %+rreverse%-r%c0',
  ' green          3     %c(green)normal %+rreverse%-r%c0',
  ' yellow         4     %c(yellow)normal %+rreverse%-r%c0',
  ' blue           5     %c(blue)normal %+rreverse%-r%c0',
  ' magenta        6     %c(magenta)normal %+rreverse%-r%c0',
  ' cyan           7     %c(cyan)normal %+rreverse%-r%c0',
  ' white          8     %c(white)normal %+rreverse%-r%c0',
  ' grey           9     %c(grey)normal %+rreverse%-r%c0',
  ' darkred        A     %c(darkred)normal %+rreverse%-r%c0   hex 10',
  ' darkgreen      B     %c(darkgreen)normal %+rreverse%-r%c0   hex 11',
  ' darkyellow     C     %c(darkyellow)normal %+rreverse%-r%c0   hex 12',
  ' darkblue       D     %c(darkblue)normal %+rreverse%-r%c0   hex 13',
  ' darkmagenta    E     %c(darkmagenta)normal %+rreverse%-r%c0   hex 14',
  ' darkcyan       F     %c(darkcyan)normal %+rreverse%-r%c0   hex 15',
  ' ',
  '%+i(type "nscolors" or "webcolors" for some more supported color sets.)%-i'
];

function listNetsacpeColors() {
  var t=new Array();
  for (var k in TermGlobals.nsColors) t.push(k);
  t.sort();
  var s='%+usupported Netscape colors by name:%-u\n\n';
  var l=0;
  for (var i=0; i<t.length; i++) {
    var c=t[i];
    if (l+c.length>78) {
      s+='\n';
      l=0;
    }
    else if (l>0) {
      s+=' ';
      l++;
    }
    s+= '%c(@'+c+')'+c;
    l+=c.length;
  }
  return s+'%c0\n ';
}

function listWebColors() {
  var t=new Array();
  for (var k=1; k<TermGlobals.webColorCodes.length; k++) {
    t.push(TermGlobals.webColorCodes[k]);
  }
  var s='%+usupported 216 web colors:%-u (you may use 3 digit codes also)\n\n';
  var l=0;
  for (var i=0; i<t.length; i++) {
    var c=t[i];
    if (l+c.length>78) {
      s+='\n';
      l=0;
    }
    else if (l>0) {
      s+=' ';
      l++;
    }
    s+= '%c(#'+c+')'+c;
    l+=c.length;
  }
  return s+'%c0\n ';
}

function termOpen() {
  if ((!term) || (term.closed)) {
    term = new Terminal(
      {
        rows: 19,
        cols: 100,
        // crsrBlinkMode: true,
         handler: termHandler,
         ps: '>',
         text: null,
        termDiv: 'termDiv',
        bgColor: '#232e45',
        initHandler: termInitHandler,
        handler: termHandler,
        exitHandler: termExitHandler
      }
    );
    term.open();
    // dimm UI text
    var mainPane = (document.getElementById)?
      document.getElementById('mainPane') : document.all.mainPane;
    if (mainPane) mainPane.className = 'lh15 dimmed';
  }
}

function termExitHandler() {
  // reset the UI
  var mainPane = (document.getElementById)?
    document.getElementById('mainPane') : document.all.mainPane;
  if (mainPane) mainPane.className = 'lh15';
}

function termInitHandler() {
  // output a start up screen
  this.write(
    [
      '                         Terminal          ',
      '            ----- type "colors" for color table, "exit" to quit. -----',
      '%c()%n'
    ]
  );
  this.write(help);
  // and leave with prompt
  this.prompt();
}

function termHandler() {
  // default handler + exit
  this.newLine();
  var args = this.lineBuffer.split(' ');
  var cmd = args[0];


  if (this.lineBuffer.search(/^\s*exit\s*$/i) == 0) {
    this.close();
    return;
  }
  else if (this.lineBuffer.search(/^\s*colors\s*$/i) == 0) {
    this.clear();
    this.write(colorTable);
  }
  else if (this.lineBuffer.search(/^\s*nscolors\s*$/i) == 0) {
    this.clear();
    this.write(listNetsacpeColors());
  }
  else if (this.lineBuffer.search(/^\s*clear\s*$/i) == 0) {
    this.clear();
    // this.write(listWebColors());
  }
  else if (this.lineBuffer.search(/^\s*help\s*$/i) == 0) {
    this.clear();
    this.write(help);
  }
  else if (this.lineBuffer != '') {
    this.type('You typed: '+this.lineBuffer);
    this.newLine();
  }
  this.prompt();
}
