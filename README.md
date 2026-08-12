# survey-display-widget

Staffbase-Custom-Widget. Entwickelt, gebaut und released wird es aus dem
Meta-Repo [`ps-mhp/man-staffbase-cms-extensions`](https://github.com/ps-mhp/man-staffbase-cms-extensions);
dieses Repo enthält nur Quellcode und das ausgelieferte Bundle unter `dist/`.

```bash
scripts/sync.sh survey-display-widget
npm run build -- --env widget=survey-display-widget
npm test -- src/widgets/survey-display-widget
scripts/release.sh survey-display-widget
```
