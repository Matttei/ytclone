from . import views
from django.urls import path

urlpatterns = [
    path('', views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register, name="register"),

    path('upload/', views.upload, name="upload"),
    path('profile/<int:profile_id>/', views.profile, name="user_profile"),
    path('video/<int:video_id>/', views.view_video, name="view_video"),
    path('video/report/<int:video_id>/', views.report_video, name="report_video"),
    path('profile/follow/<int:profile_id>/', views.follow_profile, name="follow_user"),
    path('profile/unfollow/<int:profile_id>/', views.unfollow_profile, name="unfollow_profile"),
    path('video/like/<int:video_id>/', views.like_video, name="like_video"),
    path('profile/edit/<int:profile_id>/', views.edit_profile, name="edit_profile"),
    path('video/comment/<int:video_id>/', views.comment, name="video_comment"),
    path('video/comment/like/<int:comment_id>/', views.comment_like, name="comment_like"),
    path('video/delete/<int:video_id>/', views.delete_video, name="delete_video"),
    path('video/edit/<int:video_id>/', views.video_edit, name="video_edit"),
    path('trending/', views.trending_view, name="trending_view"),
    path('uploads/', views.view_uploads, name="view_uploads"),
    path('gaming/', views.gaming_view, name="view_gaming"),
    path('entertainment/', views.entertainment_view, name="view_entertainment"),
    path('shows/', views.shows_view, name="view_shows"),
    path('music/', views.music_view, name="view_music"),
    path('video/comment/delete/<int:comment_id>/', views.comment_delete, name="detele_comment"),
    path('history/', views.watch_history, name="view_history"),
    path('feedback/', views.feedback, name="feedback"),
    path('video/create_playlist/<int:video_id>/', views.create_playlist, name="create_paylist"),
    path('video/addToPlaylist/<int:video_id>/', views.addToPlaylist, name="addToPlaylist"),
    path('playlist/<int:playlist_id>/', views.view_playlist, name="view_playlist"),
]
