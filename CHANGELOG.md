# ChromaForge Changelog

Changes to the public package follow Semantic Versioning once the first public
release is authorized.

## Unreleased — initial 1.0.0 preparation (not published)

- The selected public package identity is `chromaforge@1.0.0`, authored by
  Daniel Nnam Chidozie and licensed under MIT.
- The package has been prepared as a framework-independent ESM artifact with
  declarations; it has not been published to npm.
- The REST API is deployed at `https://color-api-9qdz.onrender.com` for
  verification; its v1 contract remains pre-release until the owner releases it.
- npm name availability, publisher permissions, and the provenance route must
  be checked at the time of publication. Registry non-resolution is not a
  reservation guarantee.

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
