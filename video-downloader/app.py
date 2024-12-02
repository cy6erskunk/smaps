import os
import shutil
from flask import Flask, render_template, request, send_file, redirect, url_for
import yt_dlp

app = Flask(__name__)

# Ensure downloads directory exists
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def get_video_files():
    """Get a list of video files in the downloads directory."""
    video_extensions = [".mp4", ".mkv", ".avi", ".webm"]
    return [
        {
            "filename": file,
            "size": f"{os.path.getsize(os.path.join(DOWNLOAD_DIR, file)) / (1024*1024):.2f} MB",
            "path": os.path.join(DOWNLOAD_DIR, file),
        }
        for file in os.listdir(DOWNLOAD_DIR)
        if os.path.isfile(os.path.join(DOWNLOAD_DIR, file))
        and os.path.splitext(file)[1].lower() in video_extensions
    ]


@app.route("/", methods=["GET", "POST"])
def download_video():
    message = None

    if request.method == "POST":
        url = request.form.get("url")

        # Configure yt-dlp options
        ydl_opts = {
            "outtmpl": os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s"),
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extract video information
                info_dict = ydl.extract_info(url, download=True)
                video_title = info_dict.get("title", None)

                # Find the downloaded file
                for file in os.listdir(DOWNLOAD_DIR):
                    if video_title and video_title in file:
                        message = f'Video "{video_title}" downloaded successfully!'
                        break

        except Exception as e:
            message = f"Error downloading video: {str(e)}"

    # Get list of downloaded videos
    videos = get_video_files()

    return render_template("index.html", message=message, videos=videos)


@app.route("/download/<filename>")
def download_file(filename):
    """Serve a file for download."""
    try:
        return send_file(os.path.join(DOWNLOAD_DIR, filename), as_attachment=True)
    except Exception as e:
        return str(e), 404


@app.route("/delete/<filename>")
def delete_file(filename):
    """Delete a specific file."""
    try:
        file_path = os.path.join(DOWNLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return redirect(url_for("download_video"))
        return "File not found", 404
    except Exception as e:
        return str(e), 500


if __name__ == "__main__":
    app.run(debug=True)
