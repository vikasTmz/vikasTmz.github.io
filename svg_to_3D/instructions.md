# Website Instructions

I need your help in creating a webpage. I have an initial layout scheme in /Users/vthamizh/Documents/Personal_website/vikasTmz.github.io/svg_to_3D/webpage_layout.png.

It should be hosted in "/Users/vthamizh/Documents/Personal_website/vikasTmz.github.io/svg_to_3D/index.html" as a github.io page.

1. The most important feature of the website is the SVG viewer:

The viewer should have two buttons in the bottom-center.
(i) Button one, temporary named "View SVG", functionality is when it is clicked loads and displays a single svg file (the path is hard-coded). The viewer should support static and animated svgs.
(ii) Button two, temporary named "View Layers", functionality is when it is clicked loads and displays layer decomposed svg files. This is slightly more complicated. The canvas size remains the same, so to view each file, there is a slider (translucent style) that shows up on the left. Moving the slider scrolls through the layers vertically top to bottom or bottom to top. The path is also hard-coded with a for-loop as the filenames have indexing. New buttons show up on the right (on a translucent widget section) that allow to view different variants of these layer decompositions too. Each variant will have its type in the filename. There are three vairants for now. Give it a placeholder name.
Make sure all files aren't loaded at once, so that the webpage doesn't crash. You can either load it when the svg has to be displayed or figure something efficient.

2. Below the SVG viewer, is a video viewer. This is a simple mp4 (or mkv) viewer, with the video path hardcoded. Below the video should be menu options that can load different videos. Say we have 3 options in the menu for now (make it adaptive so I can add more later). The menu option should look like a mini-video preview. When clicked on loads that video on the video viewer.

3. Use this blogpost as inspiration for the style, layout, fonts, overall webpage design https://kevinxu02.github.io/real2sim-indoor-site/. Especially the video viewer layout.

4. Make sure there dark/light theme toggle button on the header of the page (top-right).

Use whatever javascript libraries you deem best.

--------------------------------------------------------------



