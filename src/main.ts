import {
  Color,
  createGameLoop,
  createStage,
  createViewport,
  PolygonBatch,
  Texture,
  Vector2,
  ViewportInputHandler,
} from "gdxts";
import { BeamRenderer } from "./renderer";

const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 1000;

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();
  const viewport = createViewport(canvas, WORLD_WIDTH, WORLD_HEIGHT);
  const gl = viewport.getContext();

  const camera = viewport.getCamera();
  camera.setYDown(true);

  const batch = new PolygonBatch(gl);
  batch.setYDown(true);
  const whiteTex = Texture.createWhiteTexture(gl);

  const beamRender = new BeamRenderer(gl, WORLD_WIDTH, WORLD_HEIGHT);

  const inputHandler = new ViewportInputHandler(viewport);

  const beamTarget = new Vector2(600, 600);

  const timeOffsets: number[] = [];
  const beamTargets = Array.from({ length: 50 }, () => {
    timeOffsets.push(Math.random() * 0.5 + 1);
    return new Vector2(
      Math.random() * WORLD_WIDTH,
      Math.random() * WORLD_HEIGHT
    );
  });

  beamRender.setStyle(0.002, 0.002, 0.01);

  gl.clearColor(0, 0, 0, 1);
  let stateTime = 0;
  createGameLoop((delta) => {
    if (inputHandler.isTouched()) {
      beamTarget.setVector(inputHandler.getTouchedWorldCoord());
      stateTime = 0;
    }

    stateTime += delta;
    gl.clear(gl.COLOR_BUFFER_BIT);

    batch.setProjection(camera.combined);
    batch.begin();
    batch.setColor(Color.RED);
    batch.draw(whiteTex, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    batch.setColor(Color.WHITE);
    batch.end();

    beamRender.setProjection(camera.combined);
    beamRender.begin();
    for (let i = 0; i < beamTargets.length; i++) {
      const beam = beamTargets[i];
      const timeOffset = timeOffsets[i];

      beamRender.draw(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        beam.x,
        beam.y,
        stateTime * timeOffset
      );
    }
    // beamRender.draw(
    //   WORLD_WIDTH / 2,
    //   WORLD_HEIGHT / 2,
    //   WORLD_WIDTH / 2,
    //   WORLD_HEIGHT / 2,
    //   stateTime
    // );
    beamRender.end();
  });
};
init();
