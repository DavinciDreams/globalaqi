export const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float time;
  uniform float hoverIndex;
  
  void main() {
    vColor = color;
    vAlpha = 1.0;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float finalSize = size;
    
    if (float(gl_VertexID) == hoverIndex) {
      finalSize *= 1.5 + sin(time * 5.0) * 0.3;
      vAlpha = 0.8 + sin(time * 5.0) * 0.2;
    }
    
    gl_PointSize = finalSize * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceFromCenter > 0.5) {
      discard;
    }
    
    vec3 color = vColor;
    float alpha = (1.0 - (distanceFromCenter * 2.0)) * vAlpha;
    
    // Add glow effect
    float glow = (0.5 - distanceFromCenter) * 0.5;
    color = mix(color, vec3(1.0), glow * 0.5);
    
    gl_FragColor = vec4(color, alpha);
  }
`