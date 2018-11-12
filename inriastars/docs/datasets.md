# Datasets

# Data Generation

# Synthetic : 

- [✓] Collect as many 3d face images (from 3d datasets) as possible maintaining annotations (gender, ethinicity, name?) along with them.
- [✓] Downloaded 2 face datasets with age, ethinicity, gender.
- [✓] pix2vertex : *Issues: model needs to be smoothened, not robust to ethnicity*.
- [✓] create image dataset with naming conventions and in separate directories
- [✓] For importance of IR patterns : [Article](https://azttm.wordpress.com/2011/04/03/kinect-pattern-uncovered/) and [Paper](https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=7328728)
- [✓] Some pix2vertex output are not correct: filter them out by size (< 5MB), and store them to re-run. Also, track missing plys.


**Host dataset on website (rgb-d, ir dot pattern and 3d model)**

- [ ] **Request other 3d face datasets** and apply Multilinear Model Learning on them.

     Read Later : [3D reconstruction with glasses](https://drive.google.com/file/d/12gR2pu8lZ7DCsBr4GV3hyh_qQdSFv6iC/view?usp=sharing) and [Adaptive 3D Face Reconstruction from Unconstrained Photo Collections](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=7780824)


- [ ] Use Diff. IR patterns
- [ ] Crop image using open CV. CromaKey for rgb images. (to be done when images are read for testing).


**FaceGen:**
- [✓] Not to be used

#### Papers that use synthetic data for Face research
1. [Empirically Analyzing the Effect of Dataset Biases on Deep Face Recognition Systems](http://openaccess.thecvf.com/content_cvpr_2018_workshops/papers/w41/Kortylewski_Empirically_Analyzing_the_CVPR_2018_paper.pdf)

2. [Training Deep Face Recognition Systems with Synthetic Data](https://arxiv.org/pdf/1802.05891.pdf)
   
   Section III and IV, contains experiments using synthetic data for training and testing on in-the-wild face dataset.
   Use some of these points for Tuesdayś presentation.

3. [Unrestricted Facial Geometry Reconstruction Using Image-to-Image Translation](https://arxiv.org/pdf/1703.10131.pdf)

4. [3D Face Reconstruction by Learning from Synthetic Data](https://arxiv.org/pdf/1609.04387.pdf)

# Real :
1. Organise and plan data collection
