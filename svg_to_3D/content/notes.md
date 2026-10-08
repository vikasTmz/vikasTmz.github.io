# Past Efforts

<br>

Operations that depend on depth, surface orientation, viewpoint, lighting, or physical spatial relationships is natural in 3D. These operations are not instrinsic to vector graphics. An SVG can imitate many 3D effects if you precompute them, but it does not possess the underlying 3D scene needed to recompute them generically. 

Let us start with a general formulation, which treats the 2D vector graphic as an **observation** of an unknown 3D parametric scene, without assuming what any 2D curve “means”:

\[
\boxed{
\text{3D scene}
\xrightarrow{\text{curve/feature generation}}
\text{3D geometric features}
\xrightarrow{\text{projection + visibility}}
\text{2D image-space geometry}
\xrightarrow{\text{stylization}}
\text{SVG}
}
\]

The SVG-to-3D lifting problem is to approximately invert this pipeline.

Let
- \(G=\{g_i\}\) is the SVG representation, consisting of paths, primitives, filled regions, groups, colors, strokes, and other vector elements.
- \(\mathcal S=\{S_k\}\) is the unknown 3D scene: parametric surfaces, B-rep faces and edges, 3D curves, analytic primitives, materials, object transforms, etc.
- \(\theta\): camera/view parameters,
- \(Z=\{z_i\}\) specifies which geometric phenomena should generate SVG elements and what their roles are. For example,

\[
z_i\in
\{
\text{boundary},
\text{silhouette},
\text{intersection},
\text{feature curve},
\ldots
\}.
\]

- \(\mathcal R(\mathcal S,\theta,Z)\): rendering operator producing 2D vector geometry,
- \(\mathcal A_\phi\): artistic/stylization operator with parameters \(\phi\).

Then the forward model is
\[
\boxed{
G \approx
\mathcal A_\phi
\left(
\mathcal R(\mathcal S,\theta,Z)
\right).
}
\]

The lifting problem is therefore

\[
\boxed{
\mathcal S^*,\theta^*,Z^*,\phi^*
=
\arg\min_{\mathcal S,\theta,Z,\phi}
D\!\left(
G,\,
\mathcal A_\phi(\mathcal R(\mathcal S,\theta,Z))
\right)
+
E_{\mathrm{prior}}(\mathcal S,Z).
}
\]

Here \(D\) measures how closely the reconstructed 3D scene reproduces the SVG, while \(E_{\mathrm{prior}}\) favors plausible or simple 3D explanations.
Note, \(Z\) is not fixed. An SVG path might correspond to a 3D boundary, silhouette, intersection curve, surface feature, texture/material boundary, or even a purely artistic stroke.

<!-- 
with the **meaning of each SVG element inferred rather than assumed**. This separates the problem nicely into **3D geometry \(X\)**, **view \(\theta\)**, **correspondence \(M\)**, and **artistic interpretation \(\Delta\)**. -->

This problem of lifting 2D vector graphics to 3D has been explored in the past, including works like [2.5D Cartoon Models](http://www.alecrivers.com/2.5dcartoonmodels/), [True2Form](https://www-sop.inria.fr/reves/Basilic/2014/XCSBMS14/), and [Adobe's Project Turntable](https://research.adobe.com/news/turntable-and-project-turn-style-a-fresh-spin-on-your-original-art/).
<!-- 
True2Form paper : mapping 2D drawings to 3D curve networks.

Kennan crane's paper on robust planar mappings. -->