## Review Philosophy

* Only comment when you have HIGH CONFIDENCE (>80%) that an issue exists
* Be concise: one sentence per comment when possible
* Focus on actionable feedback, not observations
* When reviewing text, only comment on clarity issues if the text is genuinely confusing or could lead to errors.

## Priority Areas (Review These)

### Security & Safety

* Unsafe code blocks without justification
* Command injection risks (shell commands, user input)
* Path traversal vulnerabilities
* Credential exposure or hardcoded secrets
* Missing input validation on external data
* Improper error handling that could leak sensitive info

### Correctness Issues

* Logic errors that could cause panics or incorrect behavior
* Race conditions in async code
* Resource leaks (files, connections, memory)
* Off-by-one errors or boundary conditions
* Optional types that don’t need to be optional
* Booleans that should default to false but are set as optional
* Error context that doesn’t add useful information
* Overly defensive code with unnecessary checks
* Unnecessary comments that restate obvious code behavior

### Architecture & Patterns

* Code that violates existing patterns in the codebase

## Skip These (Low Value)

Do not comment on:

* Minor naming suggestions
* Suggestions to add comments
* Refactoring unless addressing a real bug
* Logging suggestions unless security-related
* Pedantic text accuracy unless it affects meaning

## Response Format

1. State the problem (1 sentence)
2. Why it matters (1 sentence, if needed)
3. Suggested fix (snippet or specific action)