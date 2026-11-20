
The SDS loss penalizes the KL-divergence between a **unimodal Gaussian distribution** centered around the rendered image $x = g(\vartheta)$ and the **learned image distribution** parameterized by a pre-trained diffusion model $\epsilon_\phi$.

$$
\mathcal{L}_{\mathrm{SDS}}(\vartheta,c)
= \mathbb{E}_{t,z_t\mid x}\!\left[
\omega(t)\,\mathrm{KL}\!\left(
q(z_t\mid x=g(\vartheta);y,t)
\;\|\; p_\phi(z_t;y,t)
\right)\right].
$$


Differentiating with respect to the shape parameters gives

$$
\nabla_\vartheta\mathcal{L}_{\mathrm{SDS}}
= \mathbb{E}_{t,z_t\mid x}\!\left[
\omega(t)\,\nabla_\vartheta\mathrm{KL}\!\left(
q(z_t\mid x=g(\vartheta);y,t)
\;\|\;p_\phi(z_t;y,t)
\right)\right].
$$

The derivation separates two log-density gradients:

$$
\begin{aligned}
\nabla_\vartheta\mathcal{L}_{\mathrm{SDS}}
= \mathbb{E}_{t,z_t\mid x}\Bigl[\omega(t)\,\mathbb{E}_\epsilon\bigl[
&\nabla_\vartheta\log q(z_t\mid x=g(\vartheta);y,t)\\
&-\nabla_\vartheta\log p_\phi(z_t;y,t)
\bigr]\Bigr].
\end{aligned}
$$

> **Generator assumption:** the generator's output is treated as a Dirac delta. In this derivation, the generator-side term is set to zero:
>
> $$
> \nabla_\vartheta\log q(z_t\mid x=g(\vartheta);y,t)=0.
> $$

This leads to the SDS update expression:

$$
\nabla_\vartheta\mathcal{L}_{\mathrm{SDS}}
=\mathbb{E}_{t,\epsilon}\!\left[
\alpha_t\bigl(\epsilon_\phi(\alpha_t x+\epsilon;t)-\epsilon\bigr)
\right]\frac{\partial x}{\partial\vartheta},
$$

$$
t\sim\mathcal{U}(0,T),\qquad
\epsilon\sim\mathcal{N}(0,\sigma_t I).
$$



<!--
### Distillation via SDS

For each optimization iteration, the algorithm renders the current shape, samples noisy images, estimates an update using the diffusion model, and back-propagates to the shape parameters.

| Step | Operation |
| --- | --- |
| Render | Compute the current image $x^k=g(\vartheta)$. |
| Sample | Sample a diffusion time $t$ and noise $\epsilon_t$. |
| Perturb | Form the noisy image $z_t=\alpha(t)x^k+\epsilon_t$. |
| Estimate | Use the weighted difference between the predicted and sampled noise to estimate the SDS gradient. |
| Update | Average the estimates and back-propagate to update $\vartheta$. |
-->

Despite its impressive results, SDS has two limitations:

- **Instability during optimization.**
- **Over-smoothed results and high-saturation artifacts.**
