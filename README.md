# YouTube Replica
## Overview
- This project is a YouTube replica web application that allows users to upload, watch, like, comment, save videos, and many more features. The platform aims to provide a seamless user experience similar to YouTube, with features such as user authentication, video uploads, user interactions (likes, comments, subscribe/follow), and a responsive design.

## Distinctiveness and Complexity
### Distinctiveness

- This project is distinct from other projects, even though it contains knowledge gathered from previous projects (0,1,2,3,4), because it is unique. It is not just a standard copy of YouTube; I tried to design it in my own way.
- Features that make this project unique:
    - A feedback section with a star rating from 1-5.
    - A feature to use promo codes that grant YouTube Premium.
    - The ability to see every follower/subscriber a user has.
    - A system that allows users to choose their gender (female, male, or prefer not to say).

### Complexity
> This video involves multiple complex functionalities, including:
- Video Uploading
- User Authentication
- Like/Comment/Save/Reply infinite times
- Subscribe(Follow) and have a page with followers and following.
- Responsive UI for every display
- AJAX is used to update likes,comments,modifications,follow counter,replies and many more

## File Structure
> Backend (Django)
* manage.py -> Django entry point to run the server
- media/ -> The part where all the videos/thumbnails/reports will go
    - videos/ -> The part for videos
    - reports/ -> Images from reports
    - images/ -> Thumnails photos for videos including a default one(a placeholder for videos that don't have a thumbnail)
- youtube/
    - settings.py -> Contains all configurations
    - urls.py -> Maps URL routes to views.py
    - models.py -> Define the database models for User, Video, Report, Follower, Comment, CommentLike, WatchHistory, Feedback, ReedemCode, ReedemCodeHistory, Playlist, addPlaylist
    - views.py -> Contains logic for rendering pages and handling requests
    - admin.py -> Registers database models to django admin page
    - templates/ -> HTML templates for rendering pages

> Frontend (Templates & Static Files)
- templates/youtube/
    - video.html -> This renders the page for every video
    - history.html ->  This page shows the user every video they watched recently, from the most recent to the oldest.
    - index.html -> The main page that renders all videos
    - upload.html -> This page contains the upload form
    - trending.html -> Displays videos with at least 100 views, ordered by the highest viewed to the least
    - layout.html -> The layout template used across pages (navbar, sidebar, footer, links, scripts, fonts, icons)
    - subscriptions.html -> Shows posts from followed users (if any)
    - shows.html -> Displays all videos categorized under 'Shows'
    - gaming.html -> Displays all videos categorized under 'Gaming'
    - entertainment.html -> Displays all videos categorized under 'Entertainment'
    - music.html -> Displays all videos categorized under 'Music'
    - register.html -> Contains the registration form
    - login.html -> Contains the login form
    - comment_reply.html -> Used in the reply section of video.html, supporting recursive replies
    - playlist.html -> Renders the page for playlists
- static/ -> Contains icons, styling, and JavaScript
    - assets/
        - icon.png - The logo from the navbar
    - index.js - JavaScript functions for handling likes, comments, saves and AJAX requests.
    - styles.css - Custom styling for the project
    - migrations/ -> Contains database migrations

## How to Run the Application
1. Clone the repository:
- git clone https://github.com/Matttei/ytclone.git
- cd youtube

2. Create a virtual environment and activate it:
- python -m venv venv
- source venv/Scripts/activate

3. Install dependencies
> pip install -r requirements.txt

4. Apply database migrations
> python manage.py migrate

5. Run the server
> python manage.py runserver
6. Access the application: Open browser and visit http://127.0.0.1:8000/

## !! Aditional Information !!
1. Media storage: Uploaded videos/images are stored in the media/ folder
2. Static Files: Ensure static files are properly loaded using python manage.py collectstatic <if needed>

## Dependencies
* All the required Python packages are listed in requirements.txt. To install them run:
> pip install -r requirements.txt

## Future Enhancements
- Implement a search function
- Use YouTube API for video generation
- Add more video functions like share, premiere video, and many more
- Implement video recommendations based on user watch history
