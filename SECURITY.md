# Security Policy

## Supported Versions

This project is an early MVP. Security fixes are applied to the default branch
and the latest tagged release.

## Reporting a Vulnerability

Please report security issues through GitHub Security Advisories for this
repository when available. If advisories are unavailable, contact the maintainer
through the GitHub profile and avoid posting secrets, exploit details, private
keys, API tokens, wallet keys, or paid endpoint credentials in public issues.

## Sensitive Areas

This project handles paid API calls, x402 payment flows, local environment
variables, wallet configuration, and execution traces. Reports involving secret
handling, payment authorization, request replay, trace redaction, or unintended
live-mode execution are treated as security-sensitive.
