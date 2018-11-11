Our approach targets close-range human capture and interaction where dense 3D estimation of hands and faces is desired. We use hybrid classification-regression forests to learn how to map from near infrared intensity images to absolute, metric  depth  in  real-time. 

We recall that active sensors flood the scenes with texture and the intensity of the received signal follows the inverse square law I ∝ 1/Z^2 , where Z is the distance from the camera. In practice this creates an explicit dependency between the intensity and the distance (i.e. brighter pixels are closer).

A second issue, that is also present in RGB images, is that the difference between two bright pixels is likely to have a bigger residual when compared to the difference between two dark pixels

Depth cues are essential to achieving high-level scene understanding, and in particular to determining geometric relations between objects. The ability to reason about depth information in scene analysis tasks can often result in improved decision-making capabilities.Unfortunately, depth-capable sensors are not as ubiquitous as traditional RGB cameras, which limits the availability of depth-related cues.