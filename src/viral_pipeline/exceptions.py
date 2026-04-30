from __future__ import annotations


class PipelineError(Exception):
    """Base exception for pipeline failures."""


class ExternalToolError(PipelineError):
    """Raised when a configured external tool cannot complete a request."""


class ComplianceBlockedError(PipelineError):
    """Raised when an integration would violate configured safety policy."""
