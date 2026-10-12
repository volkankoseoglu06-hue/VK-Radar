# VK Radar

Mobile-first prototype for detecting vehicles through a phone camera and exploring speed estimation.

## Current stage

This repository starts with a browser-based interface and camera preview. Browser camera access requires HTTPS (or localhost) and the user's permission.

**Important:** this prototype does not yet measure validated real-world vehicle speed. Converting image movement into km/h requires camera/lane calibration and field validation. Do not use it for enforcement or safety-critical decisions.

## Run

Publish this repository with GitHub Pages, then open the HTTPS site on your phone and allow camera access. You can also run it locally through a development server.

## Planned stages

1. Mobile camera preview and accessible UI.
2. Manual calibration of a known road segment.
3. Vehicle detection and tracking.
4. Speed estimation with confidence and validation tests.
5. Local measurement history.

## Privacy

The initial prototype processes the camera stream in the browser and does not upload or store video. Measurements are not persisted in this first version.
