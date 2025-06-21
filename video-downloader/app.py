import os
import shutil
from datetime import datetime
from collections import defaultdict
from flask import Flask, render_template, request, send_file, redirect, url_for
import yt_dlp
import html

app = Flask(__name__)

# Ensure downloads directory exists
DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def get_video_files():
    """Get a list of video files in the downloads directory grouped by date."""
    video_extensions = [".mp4", ".mkv", ".avi", ".webm"]
    videos_by_date = defaultdict(list)
    
    for file in os.listdir(DOWNLOAD_DIR):
        file_path = os.path.join(DOWNLOAD_DIR, file)
        if os.path.isfile(file_path) and os.path.splitext(file)[1].lower() in video_extensions:
            # Get file creation time (date added) and format as date
            stat_info = os.stat(file_path)
            creation_time = stat_info.st_birthtime if hasattr(stat_info, 'st_birthtime') else stat_info.st_ctime
            date_str = datetime.fromtimestamp(creation_time).strftime("%Y-%m-%d")
            
            video_info = {
                "filename": file,
                "size": f"{os.path.getsize(file_path) / (1024*1024):.2f}",
                "path": file_path,
                "date": date_str,
                "timestamp": creation_time
            }
            videos_by_date[date_str].append(video_info)
    
    # Sort dates in descending order (newest first)
    # Sort videos within each date by timestamp (newest first)
    for date_videos in videos_by_date.values():
        date_videos.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return dict(sorted(videos_by_date.items(), reverse=True))


@app.route("/", methods=["GET", "POST"])
def download_video():
    message = None

    if request.method == "POST":
        urls_text = request.form.get("urls")
        urls = [url.strip() for url in urls_text.split('\n') if url.strip()]
        # Drop duplicates, keep first occurrence
        urls = list(dict.fromkeys(urls))

        # Configure yt-dlp options
        ydl_opts = {
            "outtmpl": os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s"),
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        }

        downloaded_videos = []
        failed_videos = []

        for url in urls:
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info_dict = ydl.extract_info(url, download=True)
                    video_title = info_dict.get("title", None)
                    # Get the actual filename yt-dlp wrote (no directory scan needed)
                    output_path = ydl.prepare_filename(info_dict)
                    filename = os.path.basename(output_path)

                    # Use title if available, otherwise use yt-dlp’s prepared filename
                    downloaded_videos.append(video_title or filename)
            except Exception as e:
                failed_videos.append(f"{url}: {str(e)}")

        # Create status message
        if downloaded_videos and not failed_videos:
            if len(downloaded_videos) == 1:
                message = f'Video "{html.escape(downloaded_videos[0])}" downloaded successfully!'
            else:
                items_html = "".join(f"<li>{html.escape(title)}</li>" for title in downloaded_videos)
                message = (
                    f"Successfully downloaded {len(downloaded_videos)} videos:"
                    f"<ul>{items_html}</ul>"
                )
        elif downloaded_videos and failed_videos:
            video_word = "video" if len(downloaded_videos) == 1 else "videos"
            failed_word = "video" if len(failed_videos) == 1 else "videos"
            if len(downloaded_videos) == 1:
                message = f'Downloaded "{downloaded_videos[0]}". Failed: {len(failed_videos)} {failed_word}'
            else:
                message = f"Downloaded {len(downloaded_videos)} {video_word}. Failed: {len(failed_videos)} {failed_word}"
        elif failed_videos:
            failed_word = "video" if len(failed_videos) == 1 else "videos"
            message = f"Failed to download {len(failed_videos)} {failed_word}. Check URLs."
        else:
            message = "No valid URLs provided."

    # Get list of downloaded videos grouped by date
    videos_by_date = get_video_files()

    return render_template("index.html", message=message, videos_by_date=videos_by_date)


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
