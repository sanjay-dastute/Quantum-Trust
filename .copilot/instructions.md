# QuantumTrust AI Copilot Governance

When auto-generating code within this workspace, GitHub Copilot MUST strictly adhere to the following architectural and security constraints established by the platform's Non-Functional Requirements (NFRs):

## 1. Cryptography Standards
- **Encryption**: ALWAYS default to `AES-256-GCM` for data-at-rest. Under no circumstances should DES, RC4, or AES-128 be suggested.
- **Key Transport**: ALWAYS rely on `Kyber-512` for quantum-resistant payload encapsulation.
- **Zero-Retention**: NEVER write raw plaintext arrays to memory or disk. Temporary cryptographic shards MUST be wiped via `fs.unlink` or zeroed memory arrays immediately upon execution (maximum 10-minute session window).

## 2. Telemetry & Auditing
- **Hyperledger Fabric**: EVERY security action, authentication event, or cryptographic rotation MUST be asynchronously pushed to the immutable `LedgerService`.
- **Prometheus**: Ensure `@willsoto/nestjs-prometheus` metrics increment correctly on any scaling behavior.
- **OWASP**: Ensure API controllers implicitly support `helmet` HTTP hardening and strict CORS validation. NEVER propose routes that leak internal memory states.

## 3. Scalability Boundaries
- **Kubernetes**: Treat all NestJS modules as stateless. Session affinity is strictly handled via external Redis clusters. Do NOT implement in-memory local scaling strategies. 

## 4. Test Coverage SLAs
- Copilot test generation MUST map directly to Jest, guaranteeing `>= 80%` unit coverage and `>= 60%` E2E Cypress coverage. Always mock external HSMs and Fabric chaincodes aggressively to ensure fast CI/CD builds.
