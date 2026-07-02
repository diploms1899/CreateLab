# CreateLab API Reference

Base URL: `http://<server>:8000/api/v1`

## Authentication

### POST /auth/register
Register a new user.

### POST /auth/login
Authenticate and receive JWT token pair.

### POST /auth/refresh
Refresh an expired access token.

## Projects

### GET /projects/templates
List all available project templates.

### GET /projects/templates/{slug}
Get a specific template with all assets.

## Workspaces

### GET /workspaces
List user's workspaces.

### POST /workspaces
Create a new workspace from a template.

### GET /workspaces/{id}/files
Get workspace file index.

### PUT /workspaces/{id}/files/{path}
Write/update a file.

## AI

### POST /ai/chat/{workspace_id}
Send a message to the AI instructor.

### POST /ai/chat/{workspace_id}/stream
Stream AI response (SSE).

## Sync

### POST /sync/push/{workspace_id}
Push local changes to server.

### POST /sync/pull/{workspace_id}
Pull server changes to local.

### GET /sync/status/{workspace_id}
Get sync status.

## Devices

### POST /devices/register
Register a new device.

### GET /devices
List all devices (admin).

### PUT /devices/{id}/approve
Approve a device (admin).
