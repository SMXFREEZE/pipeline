# External Tools

Use this directory for manually cloned upstream projects when you want to inspect and run them beside the pipeline.

Recommended layout:

```text
external/
  OpenMontage/
  Social-Scraper/
  TikTokAIVideoGenerator/
```

The Python package does not automatically clone or run third-party repositories. Wire a cloned tool into the pipeline through a webhook, API, or a JSON-producing command, then let the pipeline's rights gate decide whether any media can continue.
