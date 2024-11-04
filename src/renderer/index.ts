import {
  Disposable,
  Mesh,
  Position2Attribute,
  Shader,
  TexCoordAttribute,
  VertexAttribute,
  VertexAttributeType,
} from "gdxts";
import { createBeamShader } from "./shader";

export class BeamRenderer implements Disposable {
  mesh: Mesh;
  shader: Shader;

  projectionValues: Float32Array = new Float32Array(16);
  setProjection(projectionValues: Float32Array) {
    this.projectionValues = projectionValues;
  }

  growDuration = 0.2;
  lingerDuration = 0.5;
  fadeDuration = 0.3;
  setTimings(
    growDuration: number,
    lingerDuration: number,
    fadeDuration: number
  ) {
    this.growDuration = growDuration;
    this.lingerDuration = lingerDuration;
    this.fadeDuration = fadeDuration;
  }

  coreThickness = 0.003;
  beamThickness = 0.004;
  glowThickness = 0.02;
  setStyle(
    coreThickness: number,
    beamThickness: number,
    glowThickness: number
  ) {
    this.coreThickness = coreThickness;
    this.beamThickness = beamThickness;
    this.glowThickness = glowThickness;
  }

  constructor(
    private gl: WebGLRenderingContext,
    private screenWidth: number,
    private screenHeight: number
  ) {
    const maxVertices = 10920;
    this.mesh = new Mesh(
      gl,
      [
        new Position2Attribute(),
        new TexCoordAttribute(),
        new VertexAttribute("a_start", VertexAttributeType.Float, 2),
        new VertexAttribute("a_end", VertexAttributeType.Float, 2),
        new VertexAttribute("a_time", VertexAttributeType.Float, 1),
      ],
      maxVertices,
      0
    );
    this.shader = createBeamShader(gl);
  }

  isDrawing = false;
  vertexIndex = 0;
  public begin() {
    if (this.isDrawing)
      throw new Error("BeamRenderer.begin() has already been called");
    this.vertexIndex = 0;
    this.isDrawing = true;

    this.shader.bind();
    this.shader.setUniform4x4f(Shader.MVP_MATRIX, this.projectionValues);
    this.shader.setUniform2f(
      "u_resolution",
      this.screenWidth,
      this.screenHeight
    );
    this.shader.setUniform3f(
      "u_timings",
      this.growDuration,
      this.lingerDuration,
      this.fadeDuration
    );
    this.shader.setUniform3f(
      "u_style",
      this.coreThickness,
      this.beamThickness,
      this.glowThickness
    );

    let gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    );
  }
  private vertex(
    x: number,
    y: number,
    u: number,
    v: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    time: number
  ) {
    let idx = this.vertexIndex;
    let vertices = this.mesh.getVertices();
    vertices[idx++] = x;
    vertices[idx++] = y;
    vertices[idx++] = u;
    vertices[idx++] = v;
    vertices[idx++] = startX;
    vertices[idx++] = startY;
    vertices[idx++] = endX;
    vertices[idx++] = endY;
    vertices[idx++] = time;
    this.vertexIndex = idx;
    if (this.vertexIndex >= this.mesh.maxVertices()) {
      this.flush();
    }
  }

  public draw(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    time: number
  ) {
    if (!this.isDrawing)
      throw new Error("BeamRenderer.begin() has not been called");

    this.vertex(0, 0, 0, 0, startX, startY, endX, endY, time);
    this.vertex(
      this.screenWidth,
      0,
      this.screenWidth,
      0,
      startX,
      startY,
      endX,
      endY,
      time
    );
    this.vertex(
      0,
      this.screenHeight,
      0,
      this.screenHeight,
      startX,
      startY,
      endX,
      endY,
      time
    );

    this.vertex(
      this.screenWidth,
      0,
      this.screenWidth,
      0,
      startX,
      startY,
      endX,
      endY,
      time
    );
    this.vertex(
      0,
      this.screenHeight,
      0,
      this.screenHeight,
      startX,
      startY,
      endX,
      endY,
      time
    );
    this.vertex(
      this.screenWidth,
      this.screenHeight,
      this.screenWidth,
      this.screenHeight,
      startX,
      startY,
      endX,
      endY,
      time
    );
  }
  public end() {
    if (!this.isDrawing)
      throw new Error("BeamRenderer.begin() has not been called");
    this.flush();
    let gl = this.gl;
    gl.disable(gl.BLEND);
    this.isDrawing = false;
  }
  flush() {
    if (this.vertexIndex === 0) return;
    this.mesh.setVerticesLength(this.vertexIndex);
    this.mesh.draw(this.shader, this.gl.TRIANGLES);
    this.vertexIndex = 0;
  }
  dispose(): void {
    this.mesh.dispose();
    this.shader.dispose();
  }
}
