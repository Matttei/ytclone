from django.contrib import admin
from .models import User, Video, Report, Follower, Comment, Like, CommentLike, WatchHistory, Feedback, RedeemCode, ReedemCodeHistory, Playlist, addPlaylist
# Register your models here.
admin.site.register(User)
admin.site.register(Video)
admin.site.register(Report)
admin.site.register(Follower)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(CommentLike)
admin.site.register(WatchHistory)
admin.site.register(Feedback)
admin.site.register(RedeemCode)
admin.site.register(ReedemCodeHistory)
admin.site.register(Playlist)
admin.site.register(addPlaylist)