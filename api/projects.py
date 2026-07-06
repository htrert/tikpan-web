from urllib.parse import urlparse

from flask import Blueprint, jsonify, request

from core.auth import login_required
from models import (
    create_manual_project_asset,
    create_project,
    get_project,
    list_project_assets,
    list_projects,
    public_project,
)

bp = Blueprint("api_projects", __name__, url_prefix="/v1")

ALLOWED_PROJECT_TYPES = {"general", "image_campaign", "video_storyboard", "audio_album", "agent_workspace"}
ALLOWED_MIME_PREFIXES = ("image/", "video/", "audio/", "text/")
ALLOWED_MIME_TYPES = {"application/pdf"}


@bp.route("/projects", methods=["GET"])
@login_required
def projects_index():
    limit = _bounded_int(request.args.get("limit", 50), 1, 100)
    projects = [public_project(project) for project in list_projects(request.user_id, limit)]
    return jsonify({"data": projects})


@bp.route("/projects", methods=["POST"])
@login_required
def projects_create():
    data = request.get_json(force=True) or {}
    name = str(data.get("name") or "").strip()
    if not name:
        return _problem("Project name is required.", 422)

    project_type = str(data.get("type") or "general").strip()
    if project_type not in ALLOWED_PROJECT_TYPES:
        return _problem("Project type is not supported.", 422)

    project = create_project(
        request.user_id,
        name,
        project_type=project_type,
        description=data.get("description") or "",
        tags=_normalize_tags(data.get("tags")),
        settings=data.get("settings") if isinstance(data.get("settings"), dict) else {},
    )
    return jsonify({"data": public_project(project, include_detail=True)}), 201


@bp.route("/projects/<project_id>", methods=["GET"])
@login_required
def projects_show(project_id):
    project = get_project(project_id, request.user_id)
    if not project:
        return _problem("Project does not exist.", 404)
    return jsonify({"data": public_project(project, include_detail=True)})


@bp.route("/projects/<project_id>/assets", methods=["GET"])
@login_required
def project_assets_index(project_id):
    project = get_project(project_id, request.user_id)
    if not project:
        return _problem("Project does not exist.", 404)
    limit = _bounded_int(request.args.get("limit", 50), 1, 100)
    return jsonify({"data": list_project_assets(request.user_id, project_id, limit)})


@bp.route("/projects/<project_id>/assets", methods=["POST"])
@login_required
def project_assets_create(project_id):
    project = get_project(project_id, request.user_id)
    if not project:
        return _problem("Project does not exist.", 404)

    data = request.get_json(force=True) or {}
    title = str(data.get("title") or "").strip()
    source_url = str(data.get("source_url") or data.get("sourceUrl") or "").strip()
    mime_type = str(data.get("mime_type") or data.get("mimeType") or "").strip().lower()

    if not title:
        return _problem("Asset title is required.", 422)
    if not _is_http_url(source_url):
        return _problem("Asset source_url must be a valid HTTP or HTTPS URL.", 422)
    if not _is_supported_mime_type(mime_type):
        return _problem("Asset mime_type is not supported.", 422)

    asset = create_manual_project_asset(
        request.user_id,
        project_id,
        title=title,
        source_url=source_url,
        mime_type=mime_type,
        tags=_normalize_tags(data.get("tags")),
        note=data.get("note") or "",
    )
    return jsonify({"data": asset}), 201


@bp.route("/assets", methods=["GET"])
@login_required
def assets_index():
    limit = _bounded_int(request.args.get("limit", 50), 1, 100)
    project_id = request.args.get("project_id") or None
    if project_id and not get_project(project_id, request.user_id):
        return _problem("Project does not exist.", 404)
    return jsonify({"data": list_project_assets(request.user_id, project_id, limit)})


def _normalize_tags(value):
    if isinstance(value, list):
        raw = value
    else:
        raw = str(value or "").split(",")
    tags = []
    seen = set()
    for item in raw:
        tag = str(item or "").strip()[:32]
        if tag and tag not in seen:
            tags.append(tag)
            seen.add(tag)
    return tags[:12]


def _is_http_url(value):
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _is_supported_mime_type(value):
    if "/" not in value:
        return False
    return value in ALLOWED_MIME_TYPES or value.startswith(ALLOWED_MIME_PREFIXES)


def _bounded_int(value, minimum, maximum):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = minimum
    return max(minimum, min(maximum, parsed))


def _problem(message, status):
    return jsonify({"error": message, "detail": message}), status
