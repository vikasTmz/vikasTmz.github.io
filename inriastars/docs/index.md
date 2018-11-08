# Porject Report - Internship

[[Datasets]](datasets.md)  [[Codes]](codes.md)

<Description>

## November

- Requested datasets
- Retrained on binarized IR images,
	Puts pics of previous and new images
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
		Read how selff-supervised passive work.

	- Build-in stereo algorithms in cameras (Intel D400) uses a handcrafted binary descriptor (CENSUS) in combination with a semi-global matching scheme.
			- suffers  from common stereo matching issues (edge fattening, quadratic error, occlusions, holes)


- LS-Net?
- Fab-net and face metrics from IJB

## Project layout

    mkdocs.yml    # The configuration file.
    docs/
        index.md  # The documentation homepage.
        ...       # Other markdown pages, images and other files.
