# Project Report - Internship

[[Datasets]](datasets.md)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[[Codes]](codes.md)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[[ToDo]]()

<Description>

## November

### Week 1 & 2

#### Two tracks for the project

1. Generating Face Depth Images from IR dot patterns image [Read More].
2. Face analysis from raw data [Read More].

<br>

- <span style="color: #00000; font-family: Babas; font-size: 1.5em;">Retrained on binarized IR images</span>
	
	**<pre>Non-binarized IR input		 		            Training loss</pre>**

	<pre><img src="img/old_ir.png" alt="drawing" width="250"/>		<img src="img/old_loss.png" alt="drawing" width="400"/></pre>

	[[Test output results (link)]](results/v1/index.html)

	**<pre>Binarized IR input		 		                 Training loss</pre>**

	<pre><img src="img/new_ir.png" alt="drawing" width="250"/>		<img src="img/new_loss.png" alt="drawing" width="450"/></pre>

	[[Test output results (link)]](results/v3/index.html)

	**<pre>Trained on binarized IR images with varying distance from camera</pre>**

	<pre><img src="results/v2/images/100_real_A.png" alt="drawing" width="220"/> <img src="results/v2/images/101_real_A.png" alt="drawing" width="220"/> <img src="results/v2/images/102_real_A.png" alt="drawing" width="220"/></pre>

	[[Test output results (link)]](results/v2/index.html)

	**<pre>Tested on unseen pose and orientation </pre>**

	<pre><img src="img/new_ir_new.png" alt="drawing" width="600"/></pre>

<br>

- <span style="color: #00000; font-family: Babas; font-size: 1.5em;">Evaluation metrics</span>

	- **RMSE**:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a href="https://www.codecogs.com/eqnedit.php?latex=RMSE&space;(y,\hat&space;y)&space;=&space;\sqrt{\dfrac&space;{1}{wh}\sum&space;^{wh}_{i=0}(\hat&space;y_{i}-y_{i})^{2}}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?RMSE&space;(y,\hat&space;y)&space;=&space;\sqrt{\dfrac&space;{1}{wh}\sum&space;^{wh}_{i=0}(\hat&space;y_{i}-y_{i})^{2}}" title="RMSE (y,\hat y) = \sqrt{\dfrac {1}{wh}\sum ^{wh}_{i=0}(\hat y_{i}-y_{i})^{2}}" /></a>
	
	
	- **log<sub>10</sub>error**:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a href="https://www.codecogs.com/eqnedit.php?latex=log_{10}&space;error(y,\hat&space;y)&space;=&space;\dfrac&space;{1}{wh}\sum&space;^{wh}_{i=1}\left&space;|log_{10}(\hat&space;y_{i})-log_{10}(y_{i})&space;\right&space;|" target="_blank"><img src="https://latex.codecogs.com/gif.latex?log_{10}&space;error(y,\hat&space;y)&space;=&space;\dfrac&space;{1}{wh}\sum&space;^{wh}_{i=1}\left&space;|log_{10}(\hat&space;y_{i})-log_{10}(y_{i})&space;\right&space;|" title="log_{10} error(y,\hat y) = \dfrac {1}{wh}\sum ^{wh}_{i=1}\left |log_{10}(\hat y_{i})-log_{10}(y_{i}) \right |" /></a>

	- **Structural similarity index (SSIM)** <sup>[[10]](#references)</sup>: *While metrics such as MSE estimate absolute errors, SSIM is a perceptionbased metric that considers image degradation as perceived change in structural information, while also incorporating important perceptual phenomena, including both luminance masking and contrast masking terms. Structural information is the idea that the pixels have strong inter-dependencies especially when they are spatially close. These dependencies carry important information about the structure of the objects in a visual rendering of a scene. Using this metric, we retain the original 2D structure of the image (as opposed to using a vector notation) since SSIM is computed on windows of images.*<sup>[[9]](#references)</sup>

	| Ground Truth| Output|SSIM error|log<sub>10</sub>error|RMSE|
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

- <span style="color: #00000; font-family: Babas; font-size: 1.25em;">"Unsupervised Adversarial Depth Estimation using Cycle Generative Networks"</span><sup>[[11]](#references)</sup>

	<img src="img/unsupervised_gan_depth.png" alt="drawing" width="700"/>

	**Evaluation Metrics (from the above paper)**: Given P the total number of pixels in the test set and <a href="https://www.codecogs.com/eqnedit.php?latex=\hat&space;d_{i}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?\hat&space;d_{i}" title="\hat d_{i}" /></a> , <a href="https://www.codecogs.com/eqnedit.php?latex=d_{i}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?d_{i}" title="d_{i}" /></a> the estimated depth and ground truth depth values for pixel i, we have:

	(i) the mean relative error (abs rel): <a href="https://www.codecogs.com/eqnedit.php?latex=\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}\dfrac&space;{\left\|&space;\hat&space;d_{i}-d_{i}\right\|&space;}{d_{i}}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}\dfrac&space;{\left\|&space;\hat&space;d_{i}-d_{i}\right\|&space;}{d_{i}}" title="\dfrac {1}{p}\sum ^{p}_{i=1}\dfrac {\left\| \hat d_{i}-d_{i}\right\| }{d_{i}}" /></a> ,

	(ii) the squared relative error (sq rel): <a href="https://www.codecogs.com/eqnedit.php?latex=\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}\dfrac&space;{\left\|&space;\hat&space;d_{i}-d_{i}\right\|^{2}}{d_{i}}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}\dfrac&space;{\left\|&space;\hat&space;d_{i}-d_{i}\right\|^{2}}{d_{i}}" title="\dfrac {1}{p}\sum ^{p}_{i=1}\dfrac {\left\| \hat d_{i}-d_{i}\right\|^{2}}{d_{i}}" /></a> ,

	(iii) the root mean squared error (rmse): <a href="https://www.codecogs.com/eqnedit.php?latex=\sqrt{\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}&space;(\hat&space;d_{i}-d_{i})^{2}}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?\sqrt{\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}&space;(\hat&space;d_{i}-d_{i})^{2}}" title="\sqrt{\dfrac {1}{p}\sum ^{p}_{i=1} (\hat d_{i}-d_{i})^{2}}" /></a>,

	(iv) the mean log 10 error (rmse log): <a href="https://www.codecogs.com/eqnedit.php?latex=\sqrt{\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}&space;\left\|&space;log(\hat&space;d_{i})-log(d_{i})\right\|^{2}}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?\sqrt{\dfrac&space;{1}{p}\sum&space;^{p}_{i=1}&space;\left\|&space;log(\hat&space;d_{i})-log(d_{i})\right\|^{2}}" title="\sqrt{\dfrac {1}{p}\sum ^{p}_{i=1} \left\| log(\hat d_{i})-log(d_{i})\right\|^{2}}" /></a>

	(v) the accuracy with threshold t, i.e.the percentage of <a href="https://www.codecogs.com/eqnedit.php?latex=\hat&space;d_{i}" target="_blank"><img src="https://latex.codecogs.com/gif.latex?\hat&space;d_{i}" title="\hat d_{i}" /></a> such that <a href="https://www.codecogs.com/eqnedit.php?latex=\delta&space;=\max&space;\left(&space;\dfrac&space;{d_{i}}{\hat&space;d_{i}},\dfrac&space;{\hat&space;d_{i}}{d_{i}}\right)&space;<&space;$&space;t$,&space;$&space;where&space;t&space;$&space;\epsilon&space;$&space;$&space;[1.25,&space;1.25^{2},&space;1.25^{3}]." target="_blank"><img src="https://latex.codecogs.com/gif.latex?\delta&space;=\max&space;\left(&space;\dfrac&space;{d_{i}}{\hat&space;d_{i}},\dfrac&space;{\hat&space;d_{i}}{d_{i}}\right)&space;<&space;$&space;t$,&space;$&space;where&space;t&space;$&space;\epsilon&space;$&space;$&space;[1.25,&space;1.25^{2},&space;1.25^{3}]." title="\delta =\max \left( \dfrac {d_{i}}{\hat d_{i}},\dfrac {\hat d_{i}}{d_{i}}\right) < $ t$, $ where t $ \epsilon $ $ [1.25, 1.25^{2}, 1.25^{3}]." /></a>

<br>

- <span style="color: #00000; font-family: Babas; font-size: 1.25em;">"Structured Attention Guided Convolutional Neural Fields for Monocular Depth Estimation"</span><sup>[[13]](#references)</sup>:

	*Recent works have shown the benefit of integrating Conditional Random Fields (CRFs) models into deep architectures for improving pixel-level prediction tasks. Following this line of research, in this paper we introduce a novel approach for monocular depth estimation. Similarly to previous works, our method employs a continuous CRF to fuse multi-scale information derived from different layers of a front-end Convolutional Neural Network (CNN). Differently from past works, our approach benefits from a structured attention model which automatically regulates the amount of information transferred between corresponding features at different scales. Importantly, the proposed attention model is seamlessly integrated into the CRF, allowing end-to-end training of the entire architecture.*

	<img src="img/san_mono_depth.png" alt="drawing" width="700"/>

<br>

- <span style="color: #00000; font-family: Babas; font-size: 1.25em;">Cascaded model refinement</span><sup>[[9]](#references)</sup>:

	*Additional GANs can be further utilized to refine the outputs in a staged manner. Using the single RGB frame formulation as an example, a GAN is trained to map an RGB frame to a depth map. Next, we introduce a secondary GAN that maps the concatenation of the RGB frame and depth map estimate to a more refined depth map. In other words, the secondary GAN is trained on the concatenation of the inputs and the outputs from the primary GAN.*

	<img src="img/cmr_gan.png" alt="drawing" width="400"/>

	*Issues: Paper does not demonstrate effectiveness of the above architecture*.

<br>

- <span style="color: #00000; font-family: Babas; font-size: 1.25em;">"Learning to be a Depth Camera for Close-Range Human Capture and Interaction", Microsoft Research</span><sup>[[12]](#references)</sup>:

	<pre><img src="img/paper1_1.png" alt="drawing" width="360"/><img src="img/paper1_2.png" alt="drawing" width="300"/></pre>

	*We present a machine learning technique for estimating absolute, per-pixel depth using any conventional monocular 2D camera, with minor hardware modifications.  Our approach targets close-range human capture and interaction where dense 3D estimation of hands and faces is desired. We use hybrid classification-regression forests to learn how to map from near infrared intensity images to absolute, metric  depth  in  real-time.   We  demonstrate  a  variety  of  human-computer interaction and capture scenarios. Experiments show an accuracy that outperforms a conventional light fall-off baseline, and is comparable to high-quality consumer depth cameras, but with a dramatically reduced cost, power consumption, and form-factor.*

<br>

- ActiveStereoNet: End-to-End Seld-supervised Learning for Active Stereo Systems

	<img src="img/activestereonet.png" alt="drawing" width="700"/>

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

<br>

- Received two datasets [Read more](datasets.md).

- LS-Net?
- Fab-net and face metrics from IJB


# References

[2] [Unrestricted Facial Geometry Reconstruction Using Image-to-Image Translation, Sela et al.](https://arxiv.org/pdf/1703.10131.pdf)

[9] [Generative adversarial networks for depth map estimation from RGB video, Kin Gwn Lore et al.](http://openaccess.thecvf.com/content_cvpr_2018_workshops/papers/w21/Lore_Generative_Adversarial_Networks_CVPR_2018_paper.pdf)

[10] [Image Quality Assessment: From Error Visibility to Structural Similarity, Zhou Wang et al.](http://www.cns.nyu.edu/pub/lcv/wang03-preprint.pdf)

[11] [Unsupervised Adversarial Depth Estimation using Cycled Generative Networks, Andrea Pilzer et al.](https://arxiv.org/pdf/1807.10915.pdf)

[12] ["Learning to be a Depth Camera for Close-Range Human Capture and Interaction", Microsoft Research](http://delivery.acm.org/10.1145/2610000/2601223/a86-fanello.pdf?ip=138.96.200.116&id=2601223&acc=ACTIVE%20SERVICE&key=7EBF6E77E86B478F%2EC083A567C83E14C8%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35&__acm__=1541768143_4cc7e69e959933f30c3480cf0ac37ef3)

[13] [Structured Attention Guided Convolutional Neural Fields for Monocular Depth Estimation, Dan Xu et al.](https://arxiv.org/pdf/1803.11029.pdf)