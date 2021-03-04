precision mediump float;

/* Rendu du jeu */
uniform sampler2D uSampler;

/* Texture de déformation en rouge et vert */
uniform sampler2D uDeformation;

/* Texture pour contrôler l'intensité de la déformation */
uniform sampler2D uIntensity;

/* Interval de temps multiplié par la vitesse depuis l'activation du composant */
uniform float uTime;

/* Échelle de la déformation */
uniform float uScale;

/* Coordonnées UV du fragment */
varying vec2 vTextureCoord;

void main(void) {
    vec2 coord = vec2(uTime,0.5);
    vec4 Intensity = texture2D(uIntensity, coord);
    Intensity = Intensity * uScale;

    vec2 vTextureCoordMod = vTextureCoord + sin(uTime);
    vec4 deformation = texture2D(uDeformation,vTextureCoordMod);
    deformation = (deformation - 0.5) * Intensity;
    
    vec2 res = vTextureCoord + deformation.xy;
    gl_FragColor = texture2D(uSampler, res);
}