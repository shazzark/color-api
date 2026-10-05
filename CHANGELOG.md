# ChromaForge Changelog

Changes to the public package follow Semantic Versioning from the 1.0.0 release.

## 1.0.1 — Documentation patch

- Correct the package README's release status and installation instructions.
- Documentation and release metadata only; no public API or runtime behavior
  changes.

## 1.0.0 — 2026-10-04

- First public release of the framework-independent ESM package and TypeScript
  declarations as `chromaforge@1.0.0`, authored by Daniel Nnam Chidozie and
  licensed under MIT.
- Install with `npm install chromaforge`.
- Registry metadata confirms the `latest` dist-tag points to `1.0.0`, the
  package has no dependencies, and the published tarball matches the reviewed
  artifact: SHA-1 `d6f94c034e5d9e8b584be99576d61fc70ccd3441`, SHA-512
  `Q1NEfgAo6Q0Azyl4KWRdU2PsuEbvGyJaaDTmaFreRBnjfoOgkbU3f383A0MKOYc+lXJXaavy9hDtXn+OdQRyyQ==`
  (90,400 unpacked bytes).
- The exact published version was installed and imported successfully from a
  separate consumer directory.
- The REST API remains deployed at `https://color-api-9qdz.onrender.com` for
  verification; API v1 remains pre-release and is not represented as part of
  this npm package release.

### Versioning policy

- **Patch:** backwards-compatible fixes that do not change documented output
  semantics.
- **Minor:** backwards-compatible named operations, formats, and optional
  capabilities.
- **Major:** removal or incompatible change to an exported name, type,
  serialization contract, default, or mathematical behavior.
- Seeded PRNG vectors, normalization rules, alpha behavior, and documented
  output shapes are public contracts and receive compatibility review before
  changes.
