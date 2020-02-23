var term;

var help = [
  ' * type "clear"    Clear terminal.',
  ' * type "help"      to see this page.',
  ' * type "exit"      to quit.',
  ' '
];

var colortest = [
      '%c(@green) ',
      '%c()%n'
    ];

var man  = [
  ' %+i%+ucommand               flags                  info%-i              %-u',
  '',
  ' "about"           -a,-n,-i           displays my age, nationality,interests',
];

var aboutme = [
  '   Hi, I\'m Vikas Thamizharasan and this is my personal website.',
  '   I am currently pursuing Masters in Computer Science @ Brown University.',
  '   My research interests lie in the intersection of Computer Vision, Computer Graphics and Deep Learning.',
  ' ',
  '  * type "man"      to see list of commands to know more about me.',
  '  * type "help"      to see this page.',
  '  * type "clear"    Clear terminal.',
  '  * type "exit"      to quit.',
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
        x: 100,
        y: 120,
        rows: 22,
        cols: 90,
        crsrBlinkMode: false,
         ps: '[vikas@termial.js] > ',
         text: null,
        termDiv: 'termDiv',
        bgColor: 'rgba(5, 0, 0, 1)',
        frameColor:'#555555',
        frameWidth:1,
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
      '                                               Welcome',
      '%c()%n'
    ]
  );
  this.StartCoroutine(aboutme);
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

function termHandler() {

  this.newLine();
  var args = this.lineBuffer.split(' ');
  args = cleanArray(args);

  if (this.lineBuffer.search(/^\s*exit\s*$/i) == 0) {
    this.close();
    this.prompt();
    return;
  }
  else if (this.lineBuffer.search(/^\s*clear\s*$/i) == 0) {
    this.clear();
    this.prompt();
  }
  else if (this.lineBuffer.search(/^\s*man\s*$/i) == 0) {
    this.write(man);
    this.prompt();
  }
  else if (this.lineBuffer.search(/^\s*vikas\s*$/i) == 0) {    
    this.StartCoroutine(help);
  }
  else if (this.lineBuffer.search(/^\s*help\s*$/i) == 0) {
    this.clear();
    this.write(help);
    this.prompt();
  }
  else if (args[0] == "about") { //-a,-n,-i           displays my age, nationality,interests
    if (args[1] == "-a")
    {
      this.write("20    DOB: 13 | 12 | 1996");      
    }
    else if (args[1] == "-n")
    {
      this.write("Indian");
    }
    else if (args[1] == "-i")
    {
      this.write("Art.Music.Drums.Sculpting.Programming.CV.Gaming.ImageProcessing.AR.VR");
    }
    else{
      this.write("USAGE: \"about\"           -a,-n,-i           displays my age, nationality,interests ");}
    this.prompt();
  }
  else if (this.lineBuffer != '') {
    this.type('You typed: '+this.lineBuffer);
    this.newLine();
    this.prompt();
  }
}
