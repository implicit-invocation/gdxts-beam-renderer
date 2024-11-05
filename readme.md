# gdxts-beam-renderer

A simple beam renderer for [gdxts](https://github.com/implicit-invocation/gdxts).

## Installation

```bash
npm install gdxts-beam-renderer
```

## Usage

```ts
import { BeamRenderer } from "gdxts-beam-renderer";

const renderer = new BeamRenderer(gl, screenWidth, screenHeight);
renderer.setStyle(0.002, 0.002, 0.01); // coreThickness, beamThickness, glowThickness
renderer.setTimings(0.2, 0.5, 0.3); // growDuration, lingerDuration, fadeDuration

// in the render loop
renderer.setProjection(camera.combined);
renderer.begin();
renderer.draw(startX, startY, endX, endY, time); // time is in seconds
renderer.end();
```
