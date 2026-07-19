# Security

## Supported code

Security updates target the current `main` branch.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting flow from this repository's **Security** tab when available. Do not include API keys, tokens, personal data, or exploit details in a public issue.

## Credential handling

- `OPENAI_API_KEY` is read only by the server process.
- Local secrets belong in `src/.env`, which is ignored by Git.
- Browser code never receives the API key.
- Tests and CI use injected local doubles and require no OpenAI credential.
- If a credential is ever exposed, revoke it with the provider first; removing it from the latest commit is not sufficient because Git history and cached views may retain it.

## Current controls

- 16 KB JSON request limit and 1,000-character question limit.
- 1,200-token completion budget on each model request.
- Canonical validation and bounded normalization of excluded cards.
- Content Security Policy, no-sniff, referrer, permissions, and frame-ancestor restrictions.
- HTML escaping before the browser applies limited formatting to generated text.
- Generic client errors for upstream failures; logs contain only error type/status metadata.
- Dependency audit and tests in CI, plus scheduled Dependabot updates.

## Known boundaries

- There is no authentication or distributed rate limiter. A production deployment should add platform-level rate limiting and usage budgets before accepting untrusted public traffic.
- Drawn-card state is browser-owned and resets on refresh.
- Card images are fetched from `raw.githubusercontent.com`.
- Generated interpretations are untrusted output and may be inaccurate.
- The application does not persist questions or readings, but the configured AI provider may process request content under its own data policies.
