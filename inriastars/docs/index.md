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

- <span style="color: #00000; font-family: Babas; font-size: 1.5em;">Retrained on binarized IR images</span>
	
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

- <span style="color: #00000; font-family: Babas; font-size: 1.5em;">Evaluation metrics</span>

	- **RMSE**:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="img/rmse.png" alt="drawing" width="250"/>

	- **log<sub>10</sub>error**:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="img/log10.png" alt="drawing" width="330"/>

	- **Structural similarity index (SSIM)** <sup>[[10]](#references)</sup>: *While metrics such as MSE estimate absolute errors, SSIM is a perceptionbased metric that considers image degradation as perceived change in structural information, while also incorporating important perceptual phenomena, including both luminance masking and contrast masking terms. Structural information is the idea that the pixels have strong inter-dependencies especially when they are spatially close. These dependencies carry important information about the structure of the objects in a visual rendering of a scene. Using this metric, we retain the original 2D structure of the image (as opposed to using a vector notation) since SSIM is computed on windows of images.*<sup>[[9]](#references)</sup>

	| Real| Fake|SSIM error|log<sub>10</sub>error|RMSE|
	| ------------- |:-------------:| -----:|-----:|-----:|
	|<img src="img/irv2/1_real_B.png" alt="drawing" width="110"/>|<img src="img/irv2/1_fake_B.png" alt="drawing" width="110"/>|0.98 <br> <img src="img/irv2/1_error.png" alt="drawing" width="110"/>|0.0174|9.0051|
	|<img src="img/irv2/110_real_B.png" alt="drawing" width="110"/>|<img src="img/irv2/110_fake_B.png" alt="drawing" width="110"/>|0.973 <br> <img src="img/irv2/110_error.png" alt="drawing" width="110"/>|0.0205|9.5557|
	|<img src="img/irv3/1_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/1_fake_B.png" alt="drawing" width="110"/>|0.978 <br> <img src="img/irv3/1_error.png" alt="drawing" width="110"/>|0.0103|5.1186|
	|<img src="img/irv3/101_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/101_fake_B.png" alt="drawing" width="110"/>|0.983 <br> <img src="img/irv3/101_error.png" alt="drawing" width="110"/>|0.0122|3.9700|
	|<img src="img/irv3/110_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/110_fake_B.png" alt="drawing" width="110"/>|0.986 <br> <img src="img/irv3/110_error.png" alt="drawing" width="110"/>|0.0100|3.0364|
	|<img src="img/irv3/141_real_B.png" alt="drawing" width="110"/>|<img src="img/irv3/141_fake_B.png" alt="drawing" width="110"/>|0.991 <br> <img src="img/irv3/141_error.png" alt="drawing" width="110"/>|0.0043|5.7457|
	|<img src="img/irv4/1_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/1_fake_B.png" alt="drawing" width="110"/>|0.972 <br> <img src="img/irv4/1_error.png" alt="drawing" width="110"/>|0.0152|8.3283|
	|<img src="img/irv4/110_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/110_fake_B.png" alt="drawing" width="110"/>|0.968 <br> <img src="img/irv4/110_error.png" alt="drawing" width="110"/>|0.0181|9.3406|
	|<img src="img/irv4/133_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/133_fake_B.png" alt="drawing" width="110"/>|0.906 <br> <img src="img/irv4/133_error.png" alt="drawing" width="110"/>|0.0856|30.3137|
	|<img src="img/irv4/134_real_B.png" alt="drawing" width="110"/>|<img src="img/irv4/134_fake_B.png" alt="drawing" width="110"/>|0.854 <br> <img src="img/irv4/134_error.png" alt="drawing" width="110"/>|0.1186|30.8789|

	- **RANSAC**: *For a quantitative comparison, we used the first 200 subjects from the BU-3DFE dataset, which contains facial images aligned with ground truth depth images. Each method provides its own estimation for the depth image alongside a binary mask, representing the valid pixels to be taken into account in the evaluation. Obviously, since the problem of reconstructing depth from a single image is ill-posed, the estimation needs to be judged up to global scaling and transition along the depth axis. Thus, we compute these paramters using the Random Sample Concensus (RANSAC) approach, for normalizing the estimation according to the ground truth depth. This significantly reduces the absolute error of each method as the global parameter estimation is robust to outliers. The parameters of the RANSAC were identical for all the methods and samples.*<sup>[[2]](#references)</sup>
	<img src="img/ransac.png" alt="drawing" width="500"/>

<br>

- <span style="color: #00000; font-family: Babas; font-size: 1.25em;">Cascaded model refinement</span><sup>[[9]](#references)</sup>:

*Additional GANs can be further utilized to refine the outputs in a staged manner. Using the single RGB frame formulation as an example, a GAN is trained to map an RGB frame to a depth map. Next, we introduce a secondary GAN that maps the concatenation of the RGB frame and depth map estimate to a more refined depth map. In other words, the secondary GAN is trained on the concatenation of the inputs and the outputs from the primary GAN.*
<img src="img/cmr_gan.png" alt="drawing" width="400"/>

*Issues: Paper does not demonstrate effectiveness of the above architecture*.

<br>

- ["Learning to be a Depth Camera for Close-Range Human Capture and Interaction", Microsoft Research](http://delivery.acm.org/10.1145/2610000/2601223/a86-fanello.pdf?ip=138.96.200.116&id=2601223&acc=ACTIVE%20SERVICE&key=7EBF6E77E86B478F%2EC083A567C83E14C8%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35&__acm__=1541768143_4cc7e69e959933f30c3480cf0ac37ef3)

	<pre><img src="img/paper1_1.png" alt="drawing" width="400"/><img src="img/paper1_2.png" alt="drawing" width="300"/></pre>

	*We present a machine learning technique for estimating absolute, per-pixel depth using any conventional monocular 2D camera, with minor hardware modifications.  Our approach targets close-range human capture and interaction where dense 3D estimation of hands and faces is desired. We use hybrid classification-regression forests to learn how to map from near infrared intensity images to absolute, metric  depth  in  real-time.   We  demonstrate  a  variety  of  human-computer interaction and capture scenarios. Experiments show an accuracy that outperforms a conventional light fall-off baseline, and is comparable to high-quality consumer depth cameras, but with a dramatically reduced cost, power consumption, and form-factor.*

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

[2] [Unrestricted Facial Geometry Reconstruction Using Image-to-Image Translation, Sela et al.](https://arxiv.org/pdf/1703.10131.pdf)

[9] [Generative adversarial networks for depth map estimation from RGB video, Kin Gwn Lore et al.](http://openaccess.thecvf.com/content_cvpr_2018_workshops/papers/w21/Lore_Generative_Adversarial_Networks_CVPR_2018_paper.pdf)

[10] [Image Quality Assessment: From Error Visibility to Structural Similarity, Zhou Wang et al.](http://www.cns.nyu.edu/pub/lcv/wang03-preprint.pdf)
