# Character Asset Pipeline

## Goal

Move from CSS placeholder characters to full-body game character art while keeping gameplay stable.

## Pilot assets

- `assets/character-concepts/chef-sprite-pilot.png`
- `assets/character-concepts/child-customer-sprite-pilot.png`

These are concept sprite sheets, not final production sprites.

## Current assessment

Strengths:
- Cute chibi/mobile-game style fits the ramen shop tone.
- Chef and child customer are warm, expressive, and readable.
- Poses cover the right gameplay states.

Limitations before direct game integration:
- Background is chroma-key style, not transparent.
- Poses are not in strict equal-size grid cells.
- Pose bounding boxes and baselines vary.
- Decorative VFX are baked into some poses.
- These are pose sheets, not frame-by-frame animations.

## Recommended production steps

1. Pick style direction from the pilot sheets.
2. Remove background and crop each pose to transparent PNG.
3. Normalize all poses to equal canvas size and foot/seated anchors.
4. Integrate only chef + child customer first.
5. Test at actual game sizes on desktop/mobile.
6. Expand to other customer types after the pilot works.

## Suggested asset naming

```txt
assets/characters/chef/chef_idle.png
assets/characters/chef/chef_cooking.png
assets/characters/chef/chef_happy.png
assets/characters/chef/chef_surprised.png

assets/characters/child/child_walking.png
assets/characters/child/child_waiting.png
assets/characters/child/child_eating.png
assets/characters/child/child_paying.png
assets/characters/child/child_angry.png
```

## Prompt notes

Use consistent prompts:
- full-body 2D chibi
- children's ramen shop cooking game
- 2.5 to 3-head-tall proportions
- 3/4 front view
- thick rounded dark brown outline
- soft cel shading
- clear silhouette
- no text/logo/watermark
- flat single-color background or transparent background if supported
