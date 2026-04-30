from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import Enum


class IntegrationStatus(str, Enum):
    ENABLED = "enabled"
    REVIEW_ONLY = "review_only"
    DISABLED = "disabled"


@dataclass(frozen=True)
class ToolIntegration:
    key: str
    name: str
    url: str
    role: str
    status: IntegrationStatus
    adapter: str | None
    install_hint: str
    policy_note: str

    def to_dict(self) -> dict[str, str | None]:
        payload = asdict(self)
        payload["status"] = self.status.value
        return payload


TOOL_REGISTRY: dict[str, ToolIntegration] = {
    "openmontage": ToolIntegration(
        key="openmontage",
        name="OpenMontage",
        url="https://github.com/calesthio/OpenMontage",
        role="Original AI video generation and production planning.",
        status=IntegrationStatus.ENABLED,
        adapter="viral_pipeline.orchestration.openmontage.OpenMontageClient",
        install_hint="git clone https://github.com/calesthio/OpenMontage.git external/OpenMontage",
        policy_note="Allowed for original or licensed productions only.",
    ),
    "tiktok_ai_video_generator": ToolIntegration(
        key="tiktok_ai_video_generator",
        name="TikTokAIVideoGenerator",
        url="https://github.com/GabrielLaxy/TikTokAIVideoGenerator",
        role="Optional local command hook for original vertical AI videos.",
        status=IntegrationStatus.REVIEW_ONLY,
        adapter="viral_pipeline.ingestion.external_json.ExternalJsonIngestor",
        install_hint="Clone manually, inspect dependencies, then expose a JSON-producing command.",
        policy_note="Allowed only when it generates original media with documented model/provider rights.",
    ),
    "dify": ToolIntegration(
        key="dify",
        name="Dify",
        url="https://github.com/langgenius/dify",
        role="LLM workflow and agent orchestration.",
        status=IntegrationStatus.ENABLED,
        adapter="viral_pipeline.orchestration.dify.DifyWorkflowClient",
        install_hint="Run Dify via Docker Compose or Dify Cloud, then set DIFY_API_URL and DIFY_API_KEY.",
        policy_note="Allowed for captioning, review, routing, and original-content workflows.",
    ),
    "xactions": ToolIntegration(
        key="xactions",
        name="XActions",
        url="https://github.com/nirholas/XActions",
        role="X/Twitter scraping and account automation toolkit.",
        status=IntegrationStatus.DISABLED,
        adapter=None,
        install_hint="Not installed by this scaffold.",
        policy_note="Disabled because the requested use relies on no-API-key browser automation and account actions.",
    ),
    "social_scraper": ToolIntegration(
        key="social_scraper",
        name="Social-Scraper",
        url="https://github.com/drowsy-coder/Social-Scraper",
        role="External Reddit trend discovery command.",
        status=IntegrationStatus.REVIEW_ONLY,
        adapter="viral_pipeline.ingestion.external_json.ExternalJsonIngestor",
        install_hint="Clone manually, inspect output format, then configure SOCIAL_SCRAPER_COMMAND.",
        policy_note="Allowed for trend metadata. Download/repost still requires rights approval.",
    ),
    "yt_dlp": ToolIntegration(
        key="yt_dlp",
        name="yt-dlp",
        url="https://github.com/yt-dlp/yt-dlp",
        role="Authorized media extraction and download.",
        status=IntegrationStatus.ENABLED,
        adapter="viral_pipeline.ingestion.ytdlp.YtDlpClient",
        install_hint="pip install yt-dlp or install a platform binary on PATH.",
        policy_note="Allowed only for URLs you own, licensed URLs, or sources you are permitted to download.",
    ),
    "n8n_apify": ToolIntegration(
        key="n8n_apify",
        name="n8n + Apify trend workflow",
        url="https://n8n.io/workflows/8450-monitor-social-media-trends-across-reddit-instagram-and-tiktok-with-apify/",
        role="Multi-platform trend monitoring handoff.",
        status=IntegrationStatus.ENABLED,
        adapter="viral_pipeline.orchestration.n8n.N8nWebhookClient",
        install_hint="Import or recreate the n8n workflow, then set N8N_WEBHOOK_URL.",
        policy_note="Allowed for analytics and discovery; content reuse still requires source rights.",
    ),
    "tiktok_auto_uploader": ToolIntegration(
        key="tiktok_auto_uploader",
        name="TikTokAutoUploader",
        url="https://github.com/haziq-exe/TikTokAutoUploader",
        role="Headless TikTok uploader.",
        status=IntegrationStatus.DISABLED,
        adapter=None,
        install_hint="Use Postiz or official platform APIs instead.",
        policy_note="Disabled because stealth browser uploading and mimicked human sessions are not supported.",
    ),
    "true_tiktok_uploader": ToolIntegration(
        key="true_tiktok_uploader",
        name="True-Tiktok-Uploader",
        url="https://pypi.org/project/True-Tiktok-Uploader/",
        role="Selenium TikTok uploader using browser cookies.",
        status=IntegrationStatus.DISABLED,
        adapter=None,
        install_hint="Use Postiz or official platform APIs instead.",
        policy_note="Disabled because private cookie-based authentication bypass is not supported.",
    ),
    "postiz": ToolIntegration(
        key="postiz",
        name="Postiz Agents CLI",
        url="https://github.com/gitroomhq/postiz-agent",
        role="Approved social scheduling and media handoff.",
        status=IntegrationStatus.ENABLED,
        adapter="viral_pipeline.publishing.postiz.PostizPublisher",
        install_hint="npm install -g postiz; postiz auth:login",
        policy_note="Allowed as an authenticated scheduler with connected accounts.",
    ),
    "instagrapi": ToolIntegration(
        key="instagrapi",
        name="instagrapi",
        url="https://github.com/adw0rd/instagrapi",
        role="Instagram private API wrapper.",
        status=IntegrationStatus.DISABLED,
        adapter=None,
        install_hint="Use Postiz or Meta-approved APIs instead.",
        policy_note="Disabled because private Instagram API automation is not supported.",
    ),
    "shadowhash": ToolIntegration(
        key="shadowhash",
        name="ShadowHash",
        url="https://github.com/NosferaLuk/ShadowHash",
        role="Metadata/hash mutation for reused-content evasion.",
        status=IntegrationStatus.DISABLED,
        adapter=None,
        install_hint="Not installed by this scaffold.",
        policy_note="Disabled because classifier evasion and reused-content disguise are not supported.",
    ),
    "taktik_bot": ToolIntegration(
        key="taktik_bot",
        name="taktik-bot",
        url="https://github.com/masterFuf/taktik-bot",
        role="Physical-device engagement automation.",
        status=IntegrationStatus.DISABLED,
        adapter=None,
        install_hint="Not installed by this scaffold.",
        policy_note="Disabled because automated engagement and account-safety evasion are not supported.",
    ),
    "instagram_auto_outreach": ToolIntegration(
        key="instagram_auto_outreach",
        name="Instagram-Auto-Outreach-Engine",
        url="https://github.com/Daniyal-Rashid-00/Instagram-Auto-Outreach-Engine",
        role="Instagram browser outreach automation.",
        status=IntegrationStatus.DISABLED,
        adapter=None,
        install_hint="Use approved CRM or platform APIs for outreach.",
        policy_note="Disabled because simulated human browsing and unsolicited outreach automation are not supported.",
    ),
    "n8n": ToolIntegration(
        key="n8n",
        name="n8n",
        url="https://github.com/n8n-io/n8n",
        role="Low-code orchestration and webhook glue.",
        status=IntegrationStatus.ENABLED,
        adapter="viral_pipeline.orchestration.n8n.N8nWebhookClient",
        install_hint="Run n8n Cloud or self-host n8n, then set N8N_WEBHOOK_URL.",
        policy_note="Allowed for orchestrating compliant stages.",
    ),
}


def list_integrations() -> list[dict[str, str | None]]:
    return [tool.to_dict() for tool in TOOL_REGISTRY.values()]


def get_integration(key: str) -> ToolIntegration:
    return TOOL_REGISTRY[key]
