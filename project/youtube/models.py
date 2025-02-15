import os
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
# Create your models here.

class User(AbstractUser):
    GENDER_CHOICES = [
        ('none', 'None'),
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    followers_count = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    allowed = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True, default='')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='none')

    def serialize(self):
        return {
            "id": self.id,
            "followers_count": self.followers_count,
            "username": self.username,
            "description": self.description or '',
            "gender": self.gender,
        }

def validate_video_size(value):
    max_size = 50 * 1024 * 1024  # 50MB
    if value.size > max_size:
        raise ValidationError("The video file size cannot exceed 50MB.")

# models.py

class Video(models.Model):
    CATEGORY_CHOICES=[
        ('other', 'Other'),
        ('game', 'Game'),
        ('entertainment', 'Entertainment'),
        ('music', 'Music'),
        ('shows', 'Shows'),
    ]
    STATUS_CHOICES=[
        ('public', 'Public'),
        ('unlisted', 'Unlisted'),
        ('private', 'Private'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_file = models.FileField(upload_to='videos/', validators=[validate_video_size])
    image_file = models.FileField(upload_to='images/')
    views = models.IntegerField(default=0)
    like_counter = models.IntegerField(default=0)  
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='public')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')

    def serialize(self):
        return{
            "id": self.id,
            "views": self.views,
            "user": self.user.serialize(),
            "title": self.title,
            "category": self.category,
            "uploaded_at": self.uploaded_at,
            "like_counter": self.like_counter,
            "description": self.description,
        }
    def delete(self, *args, **kwargs):
        # Delete the associated video file
        if self.video_file:
            video_file_path = os.path.join(settings.MEDIA_ROOT, self.video_file.name)
            if os.path.exists(video_file_path):
                os.remove(video_file_path)

        # Delete the associated image file only if it's not the default thumbnail
        if self.image_file and self.image_file.name != 'images/default/default.png':
            image_file_path = os.path.join(settings.MEDIA_ROOT, self.image_file.name)
            if os.path.exists(image_file_path):
                os.remove(image_file_path)

        # Call the parent class's delete method to delete the database record
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"Uploaded by {self.user} at {self.uploaded_at.strftime('%H:%M:%S')} with id '{self.id}'"

class Report(models.Model):
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    issue_minute = models.FloatField()
    uploaded_file = models.FileField(upload_to='reports/', blank=True, null=True)
    reported_at = models.DateTimeField(auto_now_add=True)
    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    def __str__(self):
        return f"{self.user} reported video id '{self.video.id}' at {self.reported_at.strftime('%H:%M:%S')}"
    


class Follower(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    followed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)
    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.serialize(),
            "followed_user": self.followed_user.id,
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    def __str__(self):
        return f"{self.user.username} followed {self.followed_user.username} on {self.created_at.strftime('%H:%M:%S')}"
    


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment")
    comment = models.TextField()
    like_counter = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="commented_video")
    parent_comment = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.serialize(),
            "video": self.video.serialize(),
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "comment": self.comment,
            "like_counter": self.like_counter,
            "parent_comment": self.parent_comment.id if self.parent_comment else None,
            "replies": [reply.serialize() for reply in self.replies.all()]
        }

    def __str__(self):
        return f"{self.user.username} commented on video with id '{self.video.id}' on {self.created_at.strftime('%H:%M:%S')}"
    

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="liked_video")
    created_at = models.DateTimeField(auto_now_add=True)
    def serialize(self):
        return{
            "id": self.id,
            "user": self.user.serialize(),
            "video": self.video.serialize(),
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        }
    def __str__(self):
        return f"{self.user.username} liked post id '{self.video.id}' on {self.created_at.strftime('%H:%M:%S')}"
    

class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment_likes")
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)
    def serialize(self):
        return{
            "id": self.id,
            "user": self.user.serialize(),
            "comment": self.comment.serialize(),
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        }

    def __str__(self):
        return f"User '{self.user.username}' liked comment id '{self.comment.id}' from video id '{self.comment.video.id}'"
    

class WatchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    watched_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-watched_at"]  

class Feedback(models.Model):
    STAR_CHOICES=[
        (1, '★☆☆☆☆ 1 Star'),
        (2, '★★☆☆☆ 2 Stars'),
        (3, '★★★☆☆ 3 Stars'),
        (4, '★★★★☆ 4 Stars'),
        (5, '★★★★★ 5 Stars'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    star = models.IntegerField(choices=STAR_CHOICES, default=5)
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.star} Stars"