# Video downloader

## Run in Docker

Use `dockerfile` to build an image and run a container.
The container uses `./downloads` folder as volume to save videos.

```
docker build . -t video-downloader
docker run -p 8080:8080 -v ./downloads:/app/downloads video-downloader
```

## Run locally

Requires `ffmpeg` locally.

Example with [`uv`](https://docs.astral.sh/uv/):

```
uv venv
uv pip sync requirements.txt
uv run ./app.py
```