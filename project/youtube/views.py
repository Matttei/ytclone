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
from .models import User, Video, validate_video_size, Report, Follower, Like, Comment, CommentLike, WatchHistory
from django.contrib import messages
import requests
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from ipware import get_client_ip
def index(request):
    try:
        ip, is_routable = get_client_ip(request)
        print("Retrieved IP:", ip)
        token = "98d1607a25f0ca"  

        url = f"https://www.ipinfo.io/{ip}?token={token}"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()  
            region = data.get('country', 'Country not found') 
        else:
            region = f"Error: Unable to fetch data (status code {response.status_code})"
    except Exception as e:
        region = f"Error: {e}"
    
    fvideos = []
    if request.user.is_authenticated:
        followed_profiles = Follower.objects.filter(user=request.user).values_list('followed_user', flat=True)
        fvideos = Video.objects.filter(user__id__in=followed_profiles).order_by('-uploaded_at')
    return render(request, "youtube/index.html", 
                  {"region": region,
                   "videos": Video.objects.filter(status='public').order_by('-uploaded_at'),
                   "fvideos": fvideos
                   })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
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



def profile(request, profile_id):
    if request.method == "GET":
        try:
            profile = User.objects.get(pk=profile_id)
            videos = Video.objects.filter(user=profile, status = 'public').order_by('-uploaded_at')
            followed = []
            if request.user.is_authenticated:
                followed = Follower.objects.filter(user=request.user).values_list('followed_user', flat=True)  
            return render(request, "youtube/profile.html", {
                "profile": profile,
                "videos": videos,
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
            liked_comments = []
            if request.user.is_authenticated:
                liked = Like.objects.filter(user=request.user).values_list('video__id', flat=True)
                liked_comments = CommentLike.objects.filter(user=request.user).values_list('comment__id', flat=True)
                WatchHistory.objects.update_or_create(user=user, video=video, defaults={"watched_at": now()})
            return render(request, "youtube/video.html",{
            "video": video,
            "liked": liked,
            "liked_comments": liked_comments,
            "comments": Comment.objects.filter(video=video, parent_comment=None)
        })
        except Video.DoesNotExist:
            return render(request, "youtube/index.html",{
                "message": "Video doesn't exist!"
            })
    return HttpResponseRedirect(reverse('index'))



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



def edit_profile(request, profile_id):
    if request.method == 'POST':
        try:
            profile = User.objects.get(pk=profile_id)
            editedName = request.POST.get('userName')
            description = request.POST.get('description', '')  # Default to empty string if None
            gender = request.POST.get('gender')
            
            if not editedName:
                return JsonResponse({
                    "success": False,
                    "error": "Provide the new name!"
                }, status=400)
            
            profile.username = editedName
            profile.description = description or ''  # Ensure we never save None
            profile.gender = gender
            profile.save()
            
            return JsonResponse({
                "success": True,
                "profile": profile.serialize(),
            })
        except User.DoesNotExist:
            return JsonResponse({"success": False, "error": "User not found."}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)



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
                "video": video.serialize(),
                "profile": user.serialize()
            })
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON data."}, status=400)
        except Video.DoesNotExist:
            return JsonResponse({"success": False, "error": "Video not found."}, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)


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
                })
        except Video.DoesNotExist:
            return JsonResponse({"success": False, "error": "Video not found"}, status=404)
    return JsonResponse({
        "success": False,
        "error": "Invalid request method."
        }, status=400)

def trending_view(request):
    if request.method == 'GET':
        videos = Video.objects.filter().order_by('-views')
        return render(request, "youtube/trending.html",{
            "videos": videos
        })
    return JsonResponse({
    "success": False,
    "error": "Invalid request method."
    }, status=400)


def view_uploads(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            user = User.objects.get(pk=request.user.id)
            videos = Video.objects.filter(user=user)
            return render(request, "youtube/uploads.html",{
                "videos": videos
            })
        else:
            return render(request, "youtube/uploads.html",{
                "message": "You must be logged in in order to see this page!"
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


def comment_delete(request, comment_id):
    if request.method == 'POST':
        try:
            comment = Comment.objects.get(pk=comment_id)
            
            # Check if the user is the video owner or the comment owner (if needed)
            if request.user != comment.video.user and request.user != comment.user:
                return JsonResponse({"success": False, "error": "Permission denied"}, status=403)
            
            comment.delete()
            return JsonResponse({"success": True})
        
        except (Comment.DoesNotExist, User.DoesNotExist):
            return JsonResponse({"success": False, "error": "Comment/User not found"}, status=404)
    
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=400)



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
