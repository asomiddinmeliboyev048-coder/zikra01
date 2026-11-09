# Zikra mascot

The learning onboarding uses the built-in animated SVG mascot in `src/app/lessons/experience-lab/ZikraMascot.tsx`.

No external 3D model or third-party model viewer is required. The mascot stays lightweight, responsive, and available even when offline assets are not present.


## Zikra AI Ustoz 3D Avatar Studio

The full-screen studio expects the original GLB files at:

- `public/models/teacher_joe.glb`
- `public/models/school_girl_v21.glb`

Keep the filenames unchanged. User orbit, pan and zoom are disabled; the model stays in a fixed camera position and only its embedded animation clips can play.

The original binary uploads are attached to the development conversation. The connected GitHub file-write action can create UTF-8 text files but cannot transfer binary GLB bytes. Upload the two GLB files into this folder through GitHub's web UI or a local git commit before the studio can display the actual models.
