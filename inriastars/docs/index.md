# Project Report - Internship

[[Datasets]](datasets.md)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[[Codes]](codes.md)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[[ToDo]]()

<Description>

## November

### Week 1

#### Two tracks for the project

1. Generating Face Depth Images given RGB and IR image:

Improving depth estimation of faces by providing both RGB and IR image to the GAN.
[Results]
This could be a Siamese network , with two channels to the generator.
Experiment with different loss function.
Introduce labels (gender, age etc.) to Discriminator in-order to *improve* results.
Experiment with different IR-patterns.
Evaluating Depth output (from RGB-DEPTH paper)
Test ir2depth, binarized IR images, varied internsity and varied depth
 Use IR-GAN as training weights for Gender_CNN : Train Generator with discriminator using only labels and not depth.
[ WISG’18  [1] [2] ]

2. Face analysis from raw data:

Add more layers to the CNN architecture / Transfer learning.
Fab-net [learn more]
Teacher student network.

<br>

- Retrained on binarized IR images
	
	**<pre>Non-binarized IR input		 		Training loss</pre>**

	<pre><img src="img/old_ir.png" alt="drawing" width="250"/>		<img src="img/old_loss.png" alt="drawing" width="300"/></pre>

	[[Test output results (link)]](results/v1/index.html)

	**<pre>Binarized IR input		 		Training loss</pre>**

	<pre><img src="img/new_ir.png" alt="drawing" width="250"/>	<img src="img/new_loss.png" alt="drawing" width="400"/></pre>

	[[Test output results (link)]](results/v3/index.html)

	**<pre>Trained on binarized IR images with varying distance from camera</pre>**

	<pre><img src="results/v2/images/100_real_A.png" alt="drawing" width="200"/> <img src="results/v2/images/101_real_A.png" alt="drawing" width="200"/> <img src="results/v2/images/102_real_A.png" alt="drawing" width="200"/></pre>

	[[Test output results (link)]](results/v2/index.html)

	**<pre>Tested on unseen pose and orientation </pre>**

	<pre><img src="img/new_ir_new.png" alt="drawing" width="550"/></pre>

<br>

- Evaluation metrics

	- **RMSE**:

	- **log<sub>10</sub>error**:

	- **Structural similarity index (SSIM)** <sup>[[10]](#references)</sup>: *While metrics such as MSE estimate absolute errors, SSIM is a perceptionbased metric that considers image degradation as perceived change in structural information, while also incorporating important perceptual phenomena, including both luminance masking and contrast masking terms. Structural information is the idea that the pixels have strong inter-dependencies especially when they are spatially close. These dependencies carry important information about the structure of the objects in a visual rendering of a scene. Using this metric, we retain the original 2D structure of the image (as opposed to using a vector notation) since SSIM is computed on windows of images.*<sup>[[9]](#references)</sup>

	| Real| Fake|SSIM error|Error Visualized|
	| ------------- |:-------------:| -----:|-----:|
	|<img src="img/irv2/1_real_B.png" alt="drawing" width="110"/>|<img src="img/irv2/1_fake_B.png" alt="drawing" width="110"/>|0.98|<img src="img/irv2/1_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv2/110_real_B.png" alt="drawing" width="110"/>|<img src="img/irv2/110_fake_B.png" alt="drawing" width="110"/>|0.973|<img src="img/irv2/110_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv3/1_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/1_fake_B.png" alt="drawing" width="110"/>|0.978|<img src="img/irv3/1_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv3/101_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/101_fake_B.png" alt="drawing" width="110"/>|0.983|<img src="img/irv3/101_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv3/110_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/110_fake_B.png" alt="drawing" width="110"/>|0.986|<img src="img/irv3/110_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv3/141_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/141_fake_B.png" alt="drawing" width="110"/>|0.991|<img src="img/irv3/141_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv4/1_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/1_fake_B.png" alt="drawing" width="110"/>|0.972|<img src="img/irv4/1_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv4/110_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/110_fake_B.png" alt="drawing" width="110"/>|0.968|<img src="img/irv4/110_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv4/133_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/133_fake_B.png" alt="drawing" width="110"/>|0.906|<img src="img/irv4/133_error.png" alt="drawing" width="110"/>|
	|<img src="img/irv4/134_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/134_fake_B.png" alt="drawing" width="110"/>|0.854|<img src="img/irv4/134_error.png" alt="drawing" width="110"/>|

	- **RANSAC**:

	- **Manhatan distance**:

	- **L2**

<br>

- ["Learning to be a Depth Camera for Close-Range Human Capture and Interaction", Microsoft Research](http://delivery.acm.org/10.1145/2610000/2601223/a86-fanello.pdf?ip=138.96.200.116&id=2601223&acc=ACTIVE%20SERVICE&key=7EBF6E77E86B478F%2EC083A567C83E14C8%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35&__acm__=1541768143_4cc7e69e959933f30c3480cf0ac37ef3)

	<pre><img src="img/paper1_1.png" alt="drawing" width="400"/><img src="img/paper1_2.png" alt="drawing" width="300"/></pre>

	*We present a machine learning technique for estimating absolute, per-pixel depth using any conventional monocular 2D camera, with minor hardware modifications.  Our approach targets close-range human capture and interaction where dense 3D estimation of hands and faces is desired. We use hybrid classification-regression forests to learn how to map from near infrared intensity images to absolute, metric  depth  in  real-time.   We  demonstrate  a  variety  of  human-computer interaction and capture scenarios. Experiments show an accuracy that outperforms a conventional light fall-off baseline, and is comparable to high-quality consumer depth cameras, but with a dramatically reduced cost, power consumption, and form-factor.*

<br>


<br>

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

	- 

<br>

- Received two datasets

- LS-Net?
- Fab-net and face metrics from IJB


# References

[9] [Generative adversarial networks for depth map estimation from RGB video, Kin Gwn Lore et al.](http://openaccess.thecvf.com/content_cvpr_2018_workshops/papers/w21/Lore_Generative_Adversarial_Networks_CVPR_2018_paper.pdf)
[10] [Image Quality Assessment: From Error Visibility to Structural Similarity, Zhou Wang et al.](http://www.cns.nyu.edu/pub/lcv/wang03-preprint.pdf)

