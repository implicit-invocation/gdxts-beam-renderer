import { Shader } from "gdxts";

const VS = /* glsl */ `
  attribute vec4 ${Shader.POSITION};
  attribute vec2 a_start;
  attribute vec2 a_end;
  attribute float a_time;
  
  varying vec2 v_texCoord;
  varying vec2 v_start;
  varying vec2 v_end;
  varying float v_time;
  uniform mat4 ${Shader.MVP_MATRIX};
  void main() {
    v_texCoord = ${Shader.POSITION}.xy;
    gl_Position = u_projTrans * ${Shader.POSITION};
    v_start = a_start;
    v_end = a_end;
    v_time = a_time;
  }
`;

const FS = /* glsl */ `
  precision mediump float;
  varying vec2 v_texCoord;
  varying vec2 v_start;
  varying vec2 v_end;
  varying float v_time;
  uniform vec2 u_resolution;
  uniform vec3 u_timings;
  uniform vec3 u_style;
  void main() {
    // Normalize coordinates
    vec2 uv = (v_texCoord - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Get mouse position in normalized coordinates
    vec2 mouse = (v_end - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Center point (origin of the beam)
    vec2 center = (v_start - 0.5 * u_resolution.xy) / u_resolution.y;
    float iTime = v_time;
    
    // Animation parameters
    float growDuration = u_timings.x;    // Time to reach target
    float lingerDuration = u_timings.y;  // Time to stay at full intensity
    float fadeDuration = u_timings.z;    // Time to fade out
    float totalDuration = growDuration + lingerDuration + fadeDuration;
    
    // Beam thickness and glow parameters
    float coreThickness = u_style.x;    // White core
    float beamThickness = u_style.y;    // Main beam
    float glowThickness = u_style.z;    // Outer glow
    
    // Calculate beam direction and target length
    vec2 beamDir = normalize(mouse - center);
    float targetLength = length(mouse - center);
    
    float localTime = mod(iTime, totalDuration);
    
    // Calculate current beam length and fade
    float currentLength;
    float fade = 1.0;
    float rootIntensity = 1.0;
    float impactIntensity = 0.0;
    
    if (localTime < growDuration) {
      currentLength = targetLength * (localTime / growDuration);
      fade = 1.0;
      rootIntensity = 1.0;
      impactIntensity = 0.0;
    } 
    else if (localTime < growDuration + lingerDuration) {
      currentLength = targetLength;
      fade = 1.0;
      rootIntensity = 1.0;
      float lingerTime = (localTime - growDuration) / lingerDuration;
      impactIntensity = 1.0 + 0.2 * sin(lingerTime * 30.0);
    }
    else {
      currentLength = targetLength;
      float fadeTime = localTime - (growDuration + lingerDuration);
      fade = 1.0 - (fadeTime / fadeDuration);
      rootIntensity = fade;
      impactIntensity = fade * 0.5;
    }
    
    // Distance calculations
    vec2 p = uv - center;
    float h = clamp(dot(p, beamDir) / currentLength, 0.0, 1.0);
    vec2 projection = center + beamDir * h * currentLength;
    float dist = length(uv - projection);
    
    // Create the beam layers
    float core = smoothstep(coreThickness, 0.0, dist);
    float beamAlpha = smoothstep(beamThickness + glowThickness, beamThickness, dist);
    
    // Root circle parameters
    float rootRadius = 0.01;
    float rootGlow = 0.02;
    float distFromRoot = length(uv - center);
    float rootAlpha = smoothstep(rootRadius + rootGlow, rootRadius * 0.5, distFromRoot);
    float rootCore = smoothstep(rootRadius * 0.5, 0.0, distFromRoot);
    
    // Impact effect
    vec2 targetPos = center + beamDir * currentLength;
    float distFromTarget = length(uv - targetPos);
    float impactRadius = 0.01;
    float impactGlow = 0.02;
    
    float ringSize = impactRadius * (1.0 + 0.3 * sin(localTime * 10.0));
    float ringThickness = 0.005;
    float ring = smoothstep(ringSize + ringThickness, ringSize, distFromTarget) 
          - smoothstep(ringSize, ringSize - ringThickness, distFromTarget);
    
    float impactCore = smoothstep(impactRadius + impactGlow, impactRadius, distFromTarget);
    float impactAlpha = (impactCore + ring * 0.5) * impactIntensity;
    
    // Root fade effect
    float rootFade = 1.0;
    if (localTime >= growDuration + lingerDuration) {
      float fadeTime = localTime - (growDuration + lingerDuration);
      float fadeProgress = fadeTime / fadeDuration;
      rootFade = smoothstep(fadeProgress, fadeProgress + 0.2, h);
    }
    
    // Color calculations
    vec3 beamColor = mix(
      vec3(0.2, 0.6, 1.0),
      vec3(0.1, 0.3, 1.0),
      dist / (beamThickness + glowThickness)
    );
    
    // Separate color and alpha for each component
    vec3 beamFinalColor = mix(beamColor, vec3(1.0), core);
    float beamFinalAlpha = beamAlpha * fade * rootFade;
    
    vec3 rootFinalColor = mix(beamColor, vec3(1.0), rootCore);
    float rootFinalAlpha = rootAlpha * rootIntensity;
    
    vec3 impactFinalColor = mix(beamColor * 1.5, vec3(1.0), 0.5);
    
    // Combine all components
    vec3 finalColor = vec3(0.0);
    float finalAlpha = 0.0;
    
    // Add beam
    finalColor += beamFinalColor * beamFinalAlpha;
    finalAlpha += beamFinalAlpha;
    
    // Add root
    finalColor += rootFinalColor * rootFinalAlpha;
    finalAlpha += rootFinalAlpha;
    
    // Add impact
    finalColor += impactFinalColor * impactAlpha;
    finalAlpha += impactAlpha;
    
    // Normalize color if we have any alpha
    if (finalAlpha > 0.0) {
      finalColor /= finalAlpha;
    }
    
    // gl_FragColor = vec4(1.0, 1.0, 1.0, finalAlpha);
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export const createBeamShader = (gl: WebGLRenderingContext) => {
  const shader = new Shader(gl, VS, FS);
  return shader;
};
