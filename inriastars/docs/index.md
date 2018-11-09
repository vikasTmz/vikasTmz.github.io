# Porject Report - Internship

[[Datasets]](datasets.md)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[[Codes]](codes.md)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[[ToDo]]()

<Description>

## November

### Week 1

Two tracks for the project

- Retrained on binarized IR images
	
	<pre>Non-binarized IR input		 		Training loss</pre>

	<pre><img src="img/old_ir.png" alt="drawing" width="250"/>		<img src="img/old_loss.png" alt="drawing" width="300"/></pre>

	[[Test output results (link)]](results/v1/index.html)

	<pre>Binarized IR input		 		Training loss</pre>

	<pre><img src="img/new_ir.png" alt="drawing" width="250"/>		<img src="img/new_loss.png" alt="drawing" width="400"/></pre>

	[[Test output results (link)]](results/v3/index.html)

	<pre>Trained on binarized IR images with varying distance from camera</pre>

	<pre><img src="results/v2/images/100_real_A.png" alt="drawing" width="200"/> <img src="results/v2/images/101_real_A.png" alt="drawing" width="200"/> <img src="results/v2/images/102_real_A.png" alt="drawing" width="200"/></pre>

	[[Test output results (link)]](results/v2/index.html)



- Evaluation metrics
	RANSAC, Manhatan distance .. some from active stereo nets?

- ActiveStereoNet: End-to-End Seld-supervised Learning for Active Stereo Systems

	- precise depth with subpixel precision of 1/30th of a pixel.
	- does not suffer from over-smoothing issues
	- preserves edges
	- handles occlusions
	- robust to noise and texture-less patches
	- invariant to illumination changes.
	- IR stereo camera pair is used, pseudorandom pattern projected, captures active illumination and passive light.

	- Avoid matching occluded pixels (causes oversmoothing, edge fattening)
	- New reconstruction loss based on LCN (local constrast normalization):
		- removes low frequency components from passive IR
		- re-calibrates the strength of active pattern locally to account for fading of patterns with distance.
	- Window-based loss aggregation with adaptive weights for each pixel
		- increase discriminability and reduce the effect of local minima in the stereo cost function.
	- Detect and omit occluded pixels in the images during loss computations.

	- Self-supervised vs supervised passive stereo:
		Read how self-supervised passive work.

	- Build-in stereo algorithms in cameras (Intel D400) uses a handcrafted binary descriptor (CENSUS) in combination with a semi-global matching scheme.
			- suffers from common stereo matching issues (edge fattening, quadratic error, occlusions, holes)


- Received two datasets

- LS-Net?
- Fab-net and face metrics from IJB

## Project layout

    mkdocs.yml    # The configuration file.
    docs/
        index.md  # The documentation homepage.
        ...       # Other markdown pages, images and other files.
