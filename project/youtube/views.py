import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.core.paginator import Paginator
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.http import JsonResponse
from django.urls import reverse
from django.shortcuts import redirect
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from .models import User, Video, validate_video_size, Report, Follower, Like, Comment, CommentLike, WatchHistory, Feedback, RedeemCode, ReedemCodeHistory, Playlist, addPlaylist
from django.contrib import messages
import requests
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from ipware import get_client_ip
from django.core.paginator import Paginator
from django.shortcuts import render
import requests

def index(request):
    try:
        ip, is_routable = get_client_ip(request)
        token = "98d1607a25f0ca"
        url = f"https://www.ipinfo.io/{ip}?token={token}"
        response = requests.get(url)

        region = response.json().get('country', 'Unknown') if response.status_code == 200 else "Error retrieving location"

        videos = Video.objects.filter(status='public').order_by('-uploaded_at')
        p = Paginator(videos, 9)
        page_number = int(request.GET.get('page', 1))
        page_obj = p.get_page(page_number)

        fvideos = []
        if request.user.is_authenticated:
            followed_profiles = Follower.objects.filter(user=request.user).values_list('followed_user', flat=True)
            fvideos = Video.objects.filter(user__id__in=followed_profiles).order_by('-uploaded_at')

        return render(request, "youtube/index.html", {"region": region, "videos": page_obj, "fvideos": fvideos})

    except Exception as e:
        return render(request, "youtube/index.html", {"region": f"Error: {e}"})


def load_videos(request):
    try:
        start = int(request.GET.get('start', 0))
        end = int(request.GET.get('end', start + 9))

        # Extract profile_id from URL 
        profile_id = request.GET.get('profile_id')
        trending = request.GET.get('trending')
        allvideos = Video.objects.all()
        videos = []
        # Fetch videos based on the presence of profile_id
        if profile_id:
            profile = User.objects.get(pk=profile_id)
            videos = Video.objects.filter(user=profile, status='public').order_by('-uploaded_at')[start:end]
        elif trending:
            for video in allvideos:
                if video.views >= 100:
                    videos.append(video)
        else:
            videos = Video.objects.filter(status='public').order_by('-uploaded_at')[start:end]
        video_list = [
            {
                "id": video.id,
                "title": video.title,
                "description": video.description,
                "image_file": video.image_file.url if video.image_file else "",
                "views": video.views,
                "uploaded_at": video.uploaded_at.strftime("%Y-%m-%d"),
                "user": video.user.serialize(),
            }
            for video in videos
        ]

        return JsonResponse({"videos": video_list})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    
def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        next_url = request.POST.get('next') or "/"
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        # Check if authentication successful
        if user is not None:
            login(request, user)
            return redirect(next_url)
        else:
            return render(request, "youtube/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "youtube/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "youtube/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "youtube/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "youtube/register.html")
    

@login_required
def upload(request):
    if request.method == "POST":
        title = request.POST.get('title')
        status = request.POST.get('status')
        category = request.POST.get('category')
        description = request.POST.get('description')
        video_file = request.FILES.get('video_file')
        image_file = request.FILES.get('image_file')

        if not video_file or not title or not category or not status:
            return render(request, "youtube/upload.html", {
                "message": "Please provide the necessary fields!"
            })

        try:
            validate_video_size(video_file)
        except ValidationError as e:
            messages.error(request, e.message)
            return redirect('upload')

        # If no image_file is provided, use the default one
        if not image_file:
            image_file = 'images/default/default.png' 

        # Create the video entry
        video = Video.objects.create(
            title=title,
            description=description,
            category=category,
            status=status,
            video_file=video_file,
            image_file=image_file,
            user=request.user
        )

        return JsonResponse({"success": True, "message": "Video uploaded successfully!"})

    return render(request, "youtube/upload.html")

@login_required
def subscriptions(request):
    if request.method == 'GET':
        videos = Video.objects.filter(category='entertainment', status='public')
        followed_profiles = Follower.objects.filter(user=request.user).values_list('followed_user', flat=True)
        fvideos = Video.objects.filter(user__id__in=followed_profiles).order_by('-uploaded_at')
        return render(request, "youtube/subscriptions.html",{
            "videos": fvideos
        })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)


def profile(request, profile_id):
    if request.method == "GET":
        try:
            profile = User.objects.get(pk=profile_id)
            videos = Video.objects.filter(user=profile, status = 'public').order_by('-uploaded_at')
            p = Paginator(videos, 9)
            page_number = int(request.GET.get('page', 1))
            page_obj = p.get_page(page_number)
            # Get the user's playlists (if he has)
            playlists = Playlist.objects.filter(user=profile)
            followed = []
            if request.user.is_authenticated:
                followed = Follower.objects.filter(user=request.user).values_list('followed_user', flat=True)  
            return render(request, "youtube/profile.html", {
                "profile": profile,
                "videos": page_obj,
                "playlists": playlists,
                "followed": followed,
                "followers": Follower.objects.filter(followed_user=profile),
                "following": Follower.objects.filter(user=profile),
                })
        except User.DoesNotExist:
            return render(request, "youtube/index.html",{
                "message": "User doesn't exist!"
            })
    return HttpResponseRedirect(reverse('index'))



def view_video(request, video_id):
    if request.method == "GET":
        try:
            video = Video.objects.get(pk=video_id)
            user = User(pk=request.user.id)
            if not request.user == user and video.status == 'private':
                return render(request, "youtube/index.html",{
                "message": "Video is private!"
            })
            video.views += 1
            video.save()
            liked = []
            playlists = []
            liked_comments = []
            parent_comments = Comment.objects.filter(video=video, parent_comment__isnull=True).values_list('id', flat=True)
            if request.user.is_authenticated:
                playlists = Playlist.objects.filter(user=user)
                liked = Like.objects.filter(user=request.user).values_list('video__id', flat=True)
                liked_comments = CommentLike.objects.filter(user=request.user).values_list('comment__id', flat=True)
                WatchHistory.objects.update_or_create(user=user, video=video, defaults={"watched_at": now()})
            return render(request, "youtube/video.html",{
            "video": video,
            "liked": liked,
            "liked_comments": liked_comments,
            "playlists": playlists,
            "comments": Comment.objects.filter(video=video, parent_comment=None).order_by('-isPinned', '-like_counter'),
            "parent_comments": parent_comments,
            "comment_count": Comment.objects.filter(video=video).count()
        })
        except Video.DoesNotExist:
            return render(request, "youtube/index.html",{
                "message": "Video doesn't exist!"
            })
    return HttpResponseRedirect(reverse('index'))


@login_required
def report_video(request, video_id):
    if request.method == 'POST':
        try:
            video = Video.objects.get(pk=video_id)
            user = request.user  
        except Video.DoesNotExist:
            return render(request, "youtube/index.html", {
                "message": "Video doesn't exist!"
            })
        
        # Getting form data
        issue_minute = request.POST.get('issueMinute')
        description = request.POST.get('description')
        uploaded_file = request.FILES.get('uploadFile')

        if not issue_minute or not description:
            return render(request, "youtube/video.html", {
                "video": video,
                "error_message": "Please provide the required details."
            })
        
        
        report = Report.objects.create(
            video=video,
            user=user,  
            issue_minute=issue_minute,
            description=description,
            uploaded_file=uploaded_file
        )
        
        messages.success(request, f'New report on video {video.id}!')
        return redirect('view_video', video_id=video_id)

    return redirect('view_video', video_id=video_id)


@login_required
def follow_profile(request, profile_id):
    if request.method == 'POST':
        try:
            profile = User.objects.get(pk=profile_id)
            user = User.objects.get(pk=request.user.id)
            follow, created = Follower.objects.get_or_create(user=request.user, followed_user=profile)

            if created:
                profile.followers_count += 1
                user.following_count += 1
                user.save()
                profile.save()
                return JsonResponse({
                    "success": True,
                    "profile": profile.serialize(),
                    "follow": follow.serialize(),
                })
            else:
                return JsonResponse({
                    "success": False,
                    "error": f"User '{user.username}' has already followed '{profile.username}.'"
                }, status=400)
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found."}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)


@login_required
def unfollow_profile(request, profile_id):
    if request.method == 'POST':
        try:
            profile = User.objects.get(pk=profile_id)
            user = User.objects.get(pk=request.user.id)
            follow = Follower.objects.get(user=user, followed_user=profile)
            follow.delete()
            profile.followers_count -= 1
            user.following_count -= 1
            user.save()
            profile.save()
            return JsonResponse({
                    "success": True,
                    "profile": profile.serialize(),
                    "follow": follow.serialize(),
                })
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found."}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)

@login_required
def like_video(request, video_id):
    if request.method == 'POST':
        try:
            video = Video.objects.get(pk=video_id)
            like, created = Like.objects.get_or_create(user=request.user, video=video)
            if created:
                video.like_counter +=1
                video.save()
                return JsonResponse({
                    "success": True,
                    "like": like.serialize(),
                    "video": video.serialize(),
                })
            else:
                like.delete()
                video.like_counter -=1
                video.save()
                return JsonResponse({
                    "success": True,
                    "like": like.serialize(),
                    "video": video.serialize(),
                })
        except Video.DoesNotExist:
            return JsonResponse({"success": False, "error": "Video not found."}, status=404)
    return JsonResponse({"success": False,"error": "Invalid request method."}, status=400)


@login_required
def edit_profile(request, profile_id):
    if request.method == 'POST':
        try:
            profile = User.objects.get(pk=profile_id)
            editedName = request.POST.get('userName', '')
            description = request.POST.get('description', '') 
            redeem_code = request.POST.get('redeemcode', '').strip()
            gender = request.POST.get('gender')
            names = User.objects.all().values_list('username', flat=True)
            # Edited name/desc/gender
            if editedName and editedName in names:
                return JsonResponse({
                    "success": False,
                    "error": "Username already used!"
                })
            if editedName:
                profile.username = editedName
            profile.description = description or ''  # Ensure we never save None
            profile.gender = gender
            profile.save()
            # Reedeem a code
            if redeem_code:
                try:
                    code = RedeemCode.objects.get(code=redeem_code)
                    if ReedemCodeHistory.objects.filter(user=profile, code=code).exists():
                        return JsonResponse({
                            "success": False,
                            "error": "You have already used this code!",
                        })
                    if code.uses <= 0 or profile.premium:
                        return JsonResponse({"success": False, "error": "This code has already been used or you are not eligible!"})
                    ReedemCodeHistory.objects.create(user=profile, code=code)
                    code.uses -= 1
                    code.save()

                    profile.premium = True
                    profile.save()
                    return JsonResponse({
                    "success": True,
                    "redeem_message": "Code used succesfully!",
                    "profile": profile.serialize(),
                    "redeem_successful": True
                    })
                except RedeemCode.DoesNotExist:
                    return JsonResponse({"success": False, "error": "Invalid code."})
            return JsonResponse({
                "success": True,
                "profile": profile.serialize(),
            })
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found."}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)


@login_required
def comment(request, video_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            video = Video.objects.get(pk=video_id)
            user = User.objects.get(pk=request.user.id)
            comment = data.get('comment')
            parent_id = data.get('parent_comment_id', None)
            
            if not comment or not comment.strip():
                return JsonResponse({"success": False, "error": "Comment cannot be empty."}, status=400)
            
            parent_comment = Comment.objects.filter(id=parent_id).first() if parent_id else None
            comment_save = Comment.objects.create(user=user, comment=comment, video=video, parent_comment=parent_comment)
            return JsonResponse({
                "success": True,
                "comment": comment_save.serialize(),
                "count": Comment.objects.filter(video=video).count(),
                "video": video.serialize(),
                "profile": user.serialize()
            })
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON data."}, status=400)
        except Video.DoesNotExist:
            return JsonResponse({"success": False, "error": "Video not found."}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)

@login_required
def comment_like(request, comment_id):
    if request.method == 'POST':
        try:
            comment = Comment.objects.get(pk=comment_id)
            user = User.objects.get(pk=request.user.id)
            like, created = CommentLike.objects.get_or_create(user=user, comment=comment)
            if created:
                comment.like_counter +=1
                comment.save()
                return JsonResponse({
                    "success": True,
                    "like": like.serialize(),
                    "comment": comment.serialize(),
                })
            else:
                like.delete()
                comment.like_counter -=1
                comment.save()
                return JsonResponse({
                    "success": True,
                    "like": like.serialize(),
                    "comment": comment.serialize(),
                })
        except Comment.DoesNotExist:
            return JsonResponse({"success": False, "error": "Comment not found."}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)

@login_required
def delete_video(request, video_id):
    if request.method == 'POST':
        try:
            video = Video.objects.get(pk=video_id)
            user = User.objects.get(pk=request.user.id)
            if video.user != user:
                return JsonResponse({
                    "success": False, 
                    "error": "Unauthorized: You don't own this video."
                }, status=403)
            video.delete()
            return JsonResponse({
                "success": True,
                "message": "Video deleted successfully."
            }) 
        except Video.DoesNotExist:
            return JsonResponse({"success": False, "error": "Video not found or already deleted."}, status=404)
    return JsonResponse({
        "success": False,
        "error": "Invalid request method."
        }, status=400)

@login_required
def video_edit(request, video_id):
    if request.method == 'POST':
        try:
            video = Video.objects.get(pk=video_id)
            user = User.objects.get(pk=request.user.id)
            data = json.loads(request.body)
            new_title = data.get('title')
            new_description = data.get('description')
            new_status = data.get('status')
            new_type = data.get('category')
            video.title = new_title
            video.description = new_description
            video.status = new_status
            video.category = new_type
            video.save()
            return JsonResponse({
                "success": True,
                "video": video.serialize(),
                "message": "Video modified succesfully!"
                })
        except Video.DoesNotExist:
            return JsonResponse({"success": False, "error": "Video not found"}, status=404)
    return JsonResponse({
        "success": False,
        "error": "Invalid request method."
        }, status=400)

def trending_view(request):
    if request.method == 'GET':
        allvideos = Video.objects.all().order_by('-views')
        videos=[]
        for video in allvideos:
            if video.views >= 100:
                videos.append(video)

        return render(request, "youtube/trending.html",{
            "videos": videos
        })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)

@login_required
def view_uploads(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            user = User.objects.get(pk=request.user.id)
            videos = Video.objects.filter(user=user, status='unlisted')
            return render(request, "youtube/uploads.html",{
                "videos": videos
            })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)

def gaming_view(request):
    if request.method == 'GET':
        videos = Video.objects.filter(category='game', status='public')
        return render(request, "youtube/gaming.html",{
            "videos": videos
        })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)
      

def entertainment_view(request):
    if request.method == 'GET':
        videos = Video.objects.filter(category='entertainment', status='public')
        return render(request, "youtube/entertainment.html",{
            "videos": videos
        })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)

def shows_view(request):
    if request.method == 'GET':
        videos = Video.objects.filter(category='shows', status='public')
        return render(request, "youtube/shows.html",{
            "videos": videos
        })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)


def music_view(request):
    if request.method == 'GET':
        videos = Video.objects.filter(category='music', status='public')
        return render(request, "youtube/music.html",{
            "videos": videos
        })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)

@login_required
def comment_delete(request, comment_id):
    if request.method == 'POST':
        try:
            comment = Comment.objects.get(pk=comment_id)
            data =  json.loads(request.body)
            videoId = data.get('videoId')
            video = Video.objects.get(pk=videoId)
            # Check if the user is the video owner or the comment owner (if needed)
            if request.user != comment.video.user and request.user != comment.user:
                return JsonResponse({"success": False, "error": "Permission denied"}, status=403)
            # Check if the comment was pinned
            if comment.isPinned:
                video.hasPinned = False
                video.save()
            comment.delete()
            return JsonResponse({
                "success": True,
                "count": Comment.objects.filter(video=comment.video).count()
            })
        
        except (Comment.DoesNotExist, User.DoesNotExist, Video.DoesNotExist):
            return JsonResponse({"success": False, "error": "Comment/User/Video not found"}, status=404)
    
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)


@login_required
def watch_history(request):
    if request.method == 'GET':
        try:
            user = User.objects.get(pk=request.user.id)
            history = WatchHistory.objects.filter(user=user).select_related('video')
            videos = [entry.video for entry in history]
            return render(request, "youtube/history.html",{
                "videos": videos
            })
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found"}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400) 

@login_required
def feedback(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user = User.objects.get(username=data['userName'])
            rating = int(data['rating'])
            description = data.get('description', '')

            Feedback.objects.create(user=user, star=rating, comment=description)

            return JsonResponse({"success": True, "message": "Feedback submitted successfully!"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Invalid request method."})



@login_required
def create_playlist(request, video_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            video = Video.objects.get(pk=video_id)
            user = request.user  
            title = data.get('title')
            status = data.get('status')

            if not title:
                return JsonResponse({"success": False, "message": "Playlist title is required."})

            # Create the playlist
            playlist = Playlist.objects.create(user=user, name=title, parent_video=video, status=status)
            # Add video to the playlist
            addPlaylist.objects.create(playlist=playlist, video=video, user=user)

            return JsonResponse({"success": True, "message": "Playlist created successfully."})

        except Video.DoesNotExist:
            return JsonResponse({"success": False, "message": "Video not found."})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)

    return JsonResponse({"success": False, "message": "Invalid request method."})


@login_required
def addToPlaylist(request, video_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            video = Video.objects.get(pk=video_id)
            user = request.user
            playlist_id = data.get('id')

            if not playlist_id:
                return JsonResponse({"success": False, "message": "Playlist ID is required."})

            playlist = Playlist.objects.get(pk=playlist_id)

            # Check if video is already in the playlist
            if addPlaylist.objects.filter(playlist=playlist, video=video).exists():
                return JsonResponse({"success": False, "message": "Video already in playlist."})

            # Add video to playlist
            addPlaylist.objects.create(playlist=playlist, user=user, video=video)
            playlist.videosNumber += 1
            playlist.created_at = now()
            playlist.save()

            return JsonResponse({"success": True, "message": "Video added successfully to the playlist."})

        except Playlist.DoesNotExist:
            return JsonResponse({"success": False, "message": "Playlist not found."})
        except Video.DoesNotExist:
            return JsonResponse({"success": False, "message": "Video not found."})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)

    return JsonResponse({"success": False, "message": "Invalid request method."})


@login_required
def view_playlist(request, playlist_id):
    if request.method == 'GET':
        try:
            playlist = Playlist.objects.get(pk=playlist_id)
            videos = addPlaylist.objects.filter(playlist=playlist).order_by('-added_at')
            if playlist.status == 'private' and not request.user == playlist.user:
                return render(request, 'youtube/index.html',{
                    "message": "The playlist is not visible for you!"
                })
            return render(request, "youtube/playlist.html",{
                "videos": videos,
                "playlist": playlist
            })
        except Playlist.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Playlist not found."
            }, status=404)
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)
    return JsonResponse({
        "success": False,
        "message": "Invalid request method."
    }, status=405)

@login_required
def edit_playlist(request, playlist_id):
    if request.method == 'POST':
        try:
            playlist = Playlist.objects.get(pk=playlist_id)
            user = request.user

            # Parse the request body
            data = json.loads(request.body)
            title = data.get('title')
            status = data.get('status')

            # Check if the title or status has changed
            title_changed = title != playlist.name
            status_changed = status != playlist.status

            # If no changes were made, return a response indicating no modifications
            if not title_changed and not status_changed:
                return JsonResponse({
                    "success": True,
                    "message": "No changes were made.",
                    "playlist": playlist.serialize()
                })

            # Check if the new title already exists (only if the title has changed)
            if title_changed and Playlist.objects.filter(user=user, name=title).exists():
                return JsonResponse({
                    "success": False,
                    "message": "Title already exists."
                })

            # Update the playlist fields if they have changed
            if title_changed:
                playlist.name = title
            if status_changed:
                playlist.status = status

            playlist.save()

            return JsonResponse({
                "success": True,
                "message": "Playlist modified successfully!",
                "playlist": playlist.serialize()
            })
        except Playlist.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Playlist not found."
            }, status=404)
        except Exception as e:
            return JsonResponse({
                "success": False,
                "message": str(e)
            }, status=500)
    return JsonResponse({
        "success": False,
        "message": "Invalid request method."
    }, status=405)


# Pin a comment function
@login_required
def pin_comment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            video = Video.objects.get(pk=data.get('video'))
            user = request.user
            comment = Comment.objects.get(pk=data.get('comment'), video=video)
            if comment.isPinned:
                return JsonResponse({
                "success": False,
                "message": "Comment already pinned!",
            })
            if video.hasPinned:
                return JsonResponse({
                "success": False,
                "message": "This video has already a video pinned!",
            })
            comment.isPinned = True
            video.hasPinned = True
            video.save()
            comment.save()
            return JsonResponse({
                "success": True,
                "message": "Comment pinned!",
            }) 
        except Comment.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Playlist not found."
            })
        except Exception as e:
            return JsonResponse({
                "success": False,
                "message": str(e)
            }, status=500)
    return JsonResponse({
        "success": False,
        "message": "Invalid request method."
    }, status=405)
        
@login_required
def unpin_comment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            video = Video.objects.get(pk=data.get('video'))
            user = request.user
            comment = Comment.objects.get(pk=data.get('comment'), video=video)
            # Make sure that the comment is pinned
            if comment.isPinned:
                comment.isPinned = False
                video.hasPinned = False
                video.save()
                comment.save()
                return JsonResponse({
                        "success": True,
                        "message": "Comment unpinned!",
                    })
            return JsonResponse({
                        "success": False,
                        "message": "Comment is not pinned!",
                    })
        except Comment.DoesNotExist:
            return JsonResponse({
                "success": False,
                "message": "Playlist not found."
            })
        except Exception as e:
            return JsonResponse({
                "success": False,
                "message": str(e)
            }, status=500)
    return JsonResponse({
        "success": False,
        "message": "Invalid request method."
    }, status=405)
