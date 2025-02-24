document.addEventListener('DOMContentLoaded', function () {
    // ----------------------------
    // 1. INITIALIZATION & UTILITIES
    // ----------------------------

    // Utility function to show messages
    function showMessage(message, isSuccess = false) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.innerHTML = message;

        if (isSuccess) {
            messageEl.style.backgroundColor = '#d4edda';
            messageEl.style.color = '#155724';
        }

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    // Check URL parameters for messages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('deleted')) {
        showMessage('🎥 Video deleted successfully!', true);
    } else if (urlParams.has('feedback')) {
        showMessage('📝 Feedback submitted successfully!', true);
    } else if (urlParams.has('redeem')) {
        showMessage('✅ Promocode activated!', true);
    }

    // ----------------------------
    // 2. STAR RATING ANIMATION
    // ----------------------------
    document.querySelectorAll('.star-rating:not(.readonly) label').forEach(star => {
        star.addEventListener('click', function() {
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });

    // ----------------------------
    // 3. DROPDOWN MENU
    // ----------------------------
    const usernameLink = document.querySelector('.nav-link strong');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const menu_closed = document.querySelector('.menu-closed');
    const menu_opened = document.querySelector('.menu-opened');

    if (usernameLink) {
        usernameLink.addEventListener('click', function (e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
            if (menu_closed.classList.contains('d-none')) {
                menu_closed.classList.remove('d-none');
                menu_opened.classList.add('d-none');
            } else {
                menu_closed.classList.add('d-none');
                menu_opened.classList.remove('d-none');
            }
        });
    }

    document.addEventListener('click', function (e) {
        if (!usernameLink.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            menu_closed.classList.remove('d-none');
            menu_opened.classList.add('d-none');
        }
    });

    // ----------------------------
    // 4. MOBILE MENU
    // ----------------------------
    const menuToggle = document.getElementById('menuToggle');
    const Sidebar = document.querySelector('.sidebar');

    if (menuToggle && Sidebar) {
        menuToggle.addEventListener('click', () => {
            Sidebar.classList.toggle("active");
        });

        document.addEventListener('click', function (e) {
            if (!Sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                Sidebar.classList.remove('active');
            }
        });
    }

    // ----------------------------
    // 5. VIDEO UPLOAD FORM
    // ----------------------------
    const videoUploadForm = document.getElementById('video-upload-form');
    if (videoUploadForm) {
        videoUploadForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const formData = new FormData(videoUploadForm);
            const fileInput = document.getElementById('video_file');
            const file = fileInput.files[0];
            const max = 50 * 1024 * 1024; // 50MB

            if (file.size > max) {
                alert('The maximum size is 50MB. Please upload a smaller file.');
                return;
            }

            fetch(videoUploadForm.action, {
                method: 'POST',
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    const successMsg = document.createElement('div');
                    successMsg.className = `alert mt-2 ${data.success ? 'alert-success' : 'alert-danger'}`;
                    successMsg.textContent = data.message;

                    videoUploadForm.appendChild(successMsg);

                    setTimeout(() => {
                        successMsg.remove();
                    }, 3000);
                    window.location.href = '/'
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                });
        });
    }

    // ----------------------------
    // 6. INFINITE SCROLL FOR VIDEOS
    // Regular expressions doc - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions
    // ----------------------------
    if (!/^\/video\/\d+\/?$/.test(window.location.pathname)) {
        let start = 9; // Start loading from the 10th video since first 9 are preloaded
        const quantity = 9;
        let loading = false;
        const profileMatch = window.location.pathname.match(/^\/profile\/(\d+)\/?$/);
        const profileId = profileMatch ? profileMatch[1] : null;
        window.addEventListener('scroll', () => {
            if (loading) return;

            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const viewportHeight = window.innerHeight;

            if (scrollTop + viewportHeight >= documentHeight - 10) {
                loading = true;
                load();
            }
        });

        function load() {
            let url = `/load_videos?start=${start}&end=${start + quantity}`;
            if (profileId){
                url += `&profile_id=${profileId}`;
            }
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.videos.length === 0) return; // Stop if no more videos

                    const videosContainer = document.querySelector('.videos .row');
                    data.videos.forEach(video => {
                        const videoCard = `
                        <div class="col-lg-4 col-md-6 col-sm-12 mb-4 video-card">
                            <a href="/video/${video.id}" class="anchor-card text-decoration-none">
                                <div class="video-container card shadow-sm p-3">
                                    <h4 class="card-title text-center">${video.title}</h4>
                                    ${video.description ? `<p class="card-text mb-3">${video.description}</p>` : ''}
                                    <img src="${video.image_file}" alt="${video.title}" class="card-img-top img-fluid" style="height: 250px; width: 100%; object-fit: cover; border-radius: 8px;">
                                    <hr>
                                    <p class="mb-2 text-muted"><i class="bi bi-eye"></i> ${video.views} views</p>
                                    <p class="mt-2 text-muted">Uploaded at: ${video.uploaded_at} by <a href="/profile/${video.user.id}" class="text-decoration-none text-muted"><strong>${video.user.username}</strong></a>${video.user.premium ? '⭐' : ''}</p>
                                </div>
                            </a>
                        </div>
                    `;
                        videosContainer.insertAdjacentHTML('beforeend', videoCard);
                    });

                    start += quantity; // Move start to the next batch
                })
                .catch(error => console.error('Error fetching videos:', error))
                .finally(() => {
                    loading = false;
                });
        }
    }

    // ----------------------------
    // 7. FOLLOW/UNFOLLOW BUTTONS
    // ----------------------------
    document.querySelectorAll('.follow-button').forEach(button => {
        button.addEventListener('click', function () {
            const profileId = this.getAttribute('data-profile-id');
            const followButton = document.querySelector(`#follow-button-${profileId}`);
            const unfollowButton = document.querySelector(`#unfollow-button-${profileId}`);
            const counter = document.querySelector(`#followers-${profileId}`);

            fetch(`/profile/follow/${profileId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        counter.innerHTML = data.profile.followers_count;
                        followButton.classList.add('d-none');
                        unfollowButton.classList.remove('d-none');
                    } else {
                        console.error(data.error);
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                });
        });
    });

    document.querySelectorAll('.unfollow-button').forEach(button => {
        button.addEventListener('click', function () {
            const profileId = this.getAttribute('data-profile-id');
            const followButton = document.querySelector(`#follow-button-${profileId}`);
            const unfollowButton = document.querySelector(`#unfollow-button-${profileId}`);
            const counter = document.querySelector(`#followers-${profileId}`);

            fetch(`/profile/unfollow/${profileId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        counter.innerHTML = data.profile.followers_count;
                        followButton.classList.remove('d-none');
                        unfollowButton.classList.add('d-none');
                    } else {
                        console.error(data.error);
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                });
        });
    });

    // ----------------------------
    // 8. PLAYLIST FEATURE
    // ----------------------------
    const playlistConfirmation = document.getElementById('createPlaylistSection');
    const playlistSaveForm = document.getElementById('saveform');
    const playlistCancelSave = document.getElementById('cancelSave');
    const createPlaylistButton = document.getElementById('create-playlist');
    const savePlaylistModal = document.getElementById('saveVideoModal');

    if (savePlaylistModal) {
        savePlaylistModal.addEventListener('show.bs.modal', function () {
            playlistSaveForm.style.display = 'block';
            playlistConfirmation.style.display = 'none';
        });
    }

    if (createPlaylistButton) {
        createPlaylistButton.addEventListener('click', (event) => {
            event.preventDefault();
            playlistSaveForm.style.display = 'none';
            playlistConfirmation.style.display = 'block';
        });
    }

    if (playlistCancelSave) {
        playlistCancelSave.addEventListener('click', () => {
            playlistSaveForm.style.display = 'block';
            playlistConfirmation.style.display = 'none';
        });
    }

    const confirmationSave = document.getElementById('create-playlist-confirmation');
    if (confirmationSave) {
        confirmationSave.addEventListener('click', function (e) {
            e.preventDefault();
            const videoId = e.target.getAttribute('data-video-id');
            const playlistTitle = document.getElementById(`newPlaylistName-${videoId}`).value;
            const status = document.getElementById('status_select').value;
            console.log(status);

            fetch(`/video/create_playlist/${videoId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({ title: playlistTitle,
                    status: status,
                 }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const playlistModalInstance = bootstrap.Modal.getOrCreateInstance(savePlaylistModal);
                        playlistModalInstance.hide();
                        showMessage(data.message, true);
                    } else {
                        const playlistModalInstance = bootstrap.Modal.getOrCreateInstance(savePlaylistModal);
                        playlistModalInstance.hide();
                        showMessage(data.message, false);
                    }
                })
                .catch(error => console.error("Error:", error));
        });
    }

    const form = document.querySelector('#saveform');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const playlistSelect = document.querySelector('input[name="playlist"]:checked');
            const videoId = document.querySelector('.add-playlist').getAttribute('data-video-id');

            fetch(`/video/addToPlaylist/${videoId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({ id: playlistSelect.value }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const playlistModalInstance = bootstrap.Modal.getOrCreateInstance(savePlaylistModal);
                        playlistModalInstance.hide();
                        showMessage(data.message, true);
                    } else {
                        const playlistModalInstance = bootstrap.Modal.getOrCreateInstance(savePlaylistModal);
                        playlistModalInstance.hide();
                        showMessage(data.message, false);
                    }
                })
                .catch(error => console.error("Error:", error));
        });
    }

    // ----------------------------
    // 9. TAB SWITCH BUTTONS (PLAYLISTS/PROFILE VIDEOS)
    // ----------------------------
    const videoTabButton = document.getElementById('video-button');
    const playlistTabButton = document.getElementById('playlist-button');
    const videoTabDiv = document.querySelector('.videos-tab');
    const playlistTabDiv = document.querySelector('.playlist-div');

    if (videoTabButton) {
        videoTabButton.addEventListener('click', () => {
            videoTabDiv.classList.remove('d-none');
            playlistTabDiv.classList.add('d-none');

            videoTabButton.classList.remove('btn-outline-danger');
            videoTabButton.classList.add('btn-danger');
            playlistTabButton.classList.add('btn-outline-danger');
            playlistTabButton.classList.remove('btn-danger');
        });
    }

    if (playlistTabButton) {
        playlistTabButton.addEventListener('click', () => {
            playlistTabDiv.classList.remove('d-none');
            videoTabDiv.classList.add('d-none');

            playlistTabButton.classList.add('btn-danger');
            playlistTabButton.classList.remove('btn-outline-danger');
            videoTabButton.classList.add('btn-outline-danger');
            videoTabButton.classList.remove('btn-danger');
        });
    }

    // ----------------------------
    // 10. LIKE/UNLIKE BUTTONS
    // ----------------------------
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', function () {
            const postId = this.getAttribute('data-post-id');
            const likeBtn = document.querySelector(`#like-button-${postId}`);
            const counter = document.querySelector(`#like-counter-${postId}`);
            const unlikeBtn = document.querySelector(`#unlike-button-${postId}`);

            fetch(`/video/like/${postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        counter.innerHTML = data.video.like_counter;
                        likeBtn.classList.add('d-none');
                        unlikeBtn.classList.remove('d-none')
                    } else {
                        console.error("Error:", error)
                    }
                })
                .catch(error => {
                    console.error("Error:", error)
                });
        });
    });

    document.querySelectorAll('.unlike-button').forEach(button => {
        button.addEventListener('click', function () {
            const postId = this.getAttribute('data-post-id');
            const likeBtn = document.querySelector(`#like-button-${postId}`);
            const counter = document.querySelector(`#like-counter-${postId}`);
            const unlikeBtn = document.querySelector(`#unlike-button-${postId}`);

            fetch(`/video/like/${postId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        counter.innerHTML = data.video.like_counter;
                        likeBtn.classList.remove('d-none');
                        unlikeBtn.classList.add('d-none')
                    } else {
                        console.error("Error:", error)
                    }
                })
                .catch(error => {
                    console.error("Error:", error)
                });
        });
    });

    // ----------------------------
    // 11. FEEDBACK MODAL HANDLER
    // ----------------------------
    document.querySelector('.feedback-modal').addEventListener('submit', function (e) {
        e.preventDefault();
        const rating = document.querySelector('input[name="rating"]:checked');
        const description = document.getElementById('feedback-description');
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const userName = document.getElementById('userName').value;

        if (!rating) {
            alert("Please select a rating before submitting!");
            return;
        }

        const formData = {
            rating: rating.value,
            userName: userName,
            description: description.value
        };

        fetch('/feedback/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/?feedback=true';
                } else {
                    alert("Error submitting feedback. Please try again!");
                }
            })
            .catch(error => console.error("Error:", error));
    });

    // ----------------------------
    // 12. EDIT PROFILE FUNCTIONS
    // ----------------------------
    document.querySelectorAll('.edit-profile-modal').forEach(modal => {
        const profileId = modal.getAttribute('data-edit-id');
        const nameInput = document.querySelector(`#profile-name-${profileId}`);
        const descriptionInput = document.querySelector(`#profile-description-${profileId}`);
        const gender = document.querySelector(`#gender-icon-${profileId}`);
        const submitBtn = document.querySelector(`#submit-edit-profile-${profileId}`);
        const genderOptions = document.querySelector(`#gender-option-${profileId}`);
        const genderSpan = document.querySelector(`.gender-span-${profileId}`);
        const redeemcode = document.getElementById(`redeem-code-input-${profileId}`);

        const checkForChanges = () => {
            const nameChanged = nameInput.value !== nameInput.getAttribute('data-original-value');
            const descriptionChanged = descriptionInput.value !== descriptionInput.getAttribute('data-original-value');
            const genderChanged = genderOptions.value !== genderOptions.getAttribute('data-original-value');
            const redeemCodeChanged = redeemcode.value.trim() !== "";

            if (nameChanged || descriptionChanged || genderChanged || redeemCodeChanged) {
                submitBtn.classList.remove('disabled');
            } else {
                submitBtn.classList.add('disabled');
            }
        };

        genderOptions.addEventListener('change', () => {
            const selectedValue = genderOptions.value;

            if (selectedValue === 'male') {
                gender.classList.remove('bi', 'bi-person-circle');
                gender.innerHTML = '🧑';
            } else if (selectedValue === 'female') {
                gender.classList.remove('bi', 'bi-person-circle');
                gender.innerHTML = '👩';
            } else {
                gender.classList.add('bi', 'bi-person-circle');
                gender.innerHTML = '';
            }

            checkForChanges();
        });

        nameInput.addEventListener('input', checkForChanges);
        descriptionInput.addEventListener('input', checkForChanges);
        redeemcode.addEventListener('input', checkForChanges);

        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const formData = new FormData();
            if (nameInput.value !== nameInput.getAttribute('data-original-value')) {
                formData.append('userName', nameInput.value);
            }
            formData.append('description', descriptionInput.value);
            formData.append('gender', genderOptions.value);
            formData.append('redeemcode', redeemcode.value);

            fetch(`/profile/edit/${profileId}/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        document.querySelector(`#profile-username-${profileId}`).innerHTML = data.profile.username;
                        document.getElementById(`menu-name-${profileId}`).innerHTML = data.profile.username;
                        document.querySelectorAll(`.uploaded-div-${profileId}`).forEach(div => {
                            div.innerHTML = data.profile.username;
                        });

                        const descriptionElement = document.querySelector(`#profile-description-text-${profileId}`);
                        if (descriptionElement) {
                            descriptionElement.innerHTML = data.profile.description || 'Add a description to tell people about yourself...';
                        }
                        if (data.profile.gender === 'male') {
                            genderSpan.innerHTML = '🧑';
                        } else if (data.profile.gender === 'female') {
                            genderSpan.innerHTML = '👩';
                        } else {
                            genderSpan.innerHTML = '<i class="bi bi-person-circle"></i>';
                        }

                        nameInput.setAttribute('data-original-value', data.profile.username);
                        descriptionInput.setAttribute('data-original-value', data.profile.description || '');
                        genderOptions.setAttribute('data-original-value', data.profile.gender);

                        submitBtn.classList.add('disabled');

                        const modalInstance = bootstrap.Modal.getInstance(modal);
                        modalInstance.hide();
                        if (data.redeem_successful) {
                            window.location.href = '/?redeem=true';
                        }
                    } else {
                        const modalInstance = bootstrap.Modal.getInstance(modal);
                        modalInstance.hide();
                        showMessage(data.error, false);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to update profile. Please try again.');
                });
        });
    });

    // ----------------------------
    // 13. COMMENT HANDLING
    // ----------------------------
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const videoId = this.getAttribute('data-comment-id');
            const commentTextarea = document.querySelector(`.commentTextarea-${videoId}`);
            const submitBtn = document.querySelector(`.submit-comment-${videoId}`);
            const comment = commentTextarea.value.trim();

            submitBtn.disabled = true;
            commentTextarea.disabled = true;

            fetch(`/video/comment/${videoId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({ comment })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const uploaderUsername = form.closest('.comments-div').getAttribute('data-uploader-username');
                        const commentsList = form.closest('.comments-div').querySelector('.comments-container ul');
                        const noCommentsMessage = commentsList.querySelector('li:only-child');

                        if (noCommentsMessage && noCommentsMessage.textContent.includes("aren't any comments")) {
                            noCommentsMessage.remove();
                        }

                        const newComment = document.createElement('li');
                        const isUploader = data.profile.username === uploaderUsername;
                        newComment.innerHTML = `
                        <li class="mb-3" id="comment-${data.comment.id}" data-comment-id="${data.comment.id}">
                            <div class="comment-card p-3 rounded shadow-sm">
                                <div class="comment-header d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        ${isUploader ? '<span class="uploader-badge me-2">Uploader</span>' : ''}
                                        <strong><a href="/profile/${data.profile.id}" class="text-decoration-none" style="color: black;">${data.profile.username}</a></strong>
                                    </div>
                                    <small class="text-muted">${new Date(data.comment.created_at).toLocaleString()}</small>
                                </div>
                                
                                <div class="comment-body">
                                    <p>${data.comment.comment}</p>
                                </div>
                                
                                <div class="comment-footer d-flex justify-content-between">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-outline-primary btn-sm me-2 like-comment-button" data-comment-id="${data.comment.id}" id="like-comment-button-${data.comment.id}">
                                            👍 Like
                                        </button>
                                        <button class="btn btn-danger btn-sm me-2 unlike-comment-button d-none" data-comment-id="${data.comment.id}" id="unlike-comment-button-${data.comment.id}">
                                            💔🔨
                                        </button>
                                        <span id="comment-like-counter-${data.comment.id}" class="text-muted">0 Likes</span>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <button class="btn btn-outline-secondary btn-sm reply-button mr-2"
                                                data-bs-toggle="collapse" 
                                                data-bs-target="#reply-to-${data.comment.id}" 
                                                aria-expanded="false" 
                                                aria-controls="reply-to-${data.comment.id}">
                                            💬 Reply
                                        </button>
                                        <button class="btn btn-danger btn-sm delete-comment-button" id="delete-comment-button-${data.comment.id}" data-comment-id="${data.comment.id}" data-video-id="${data.video.id}">
                                            DELETE <i class="bi bi-trash"></i>
                                        </button>
                                        ${data.video.hasPinned ? `<button class="btn btn-warning btn-sm unpin-comment-button d-none" id="pin-comment-button-${data.comment.id}" data-comment-id="${data.comment.id}" data-video-id="${data.video.id}">UnPin<i class="bi bi-pin-angle"></i></button>` : `<button class="btn btn-warning btn-sm pin-comment-button" id="pin-comment-button-${data.comment.id}" data-comment-id="${data.comment.id}" data-video-id="${data.video.id}"><i class="bi bi-pin"></i> Pin</button>`}
                                    </div>
                                </div>
                                
                                <div class="collapse reply-section mt-3" id="reply-to-${data.comment.id}">
                                    <textarea 
                                        class="form-control mb-2" 
                                        rows="2" 
                                        placeholder="Write your reply here..." 
                                        id="reply-text-${data.comment.id}"></textarea>
                                    <button
                                    type="submit" 
                                    class="btn btn-primary position-absolute send-btn reply-comment-button mb-3" 
                                    data-comment-id="${data.comment.id}"
                                    data-video-id=${data.video.id}
                                    style="bottom: 1rem; right: 1rem; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-send"></i>
                                </button>
                                    
                                </div>
                        
                                <!-- Replies List -->
                                <ul class="replies-list list-unstyled ms-4"></ul>
                            </div>
                        </li>
                        `;

                        newComment.classList.add('mb-3');
                        commentsList.insertBefore(newComment, commentsList.firstChild);

                        commentTextarea.value = '';
                        document.getElementById(`comment-counter-${videoId}`).innerHTML = data.count;

                        const successMsg = document.createElement('div');
                        successMsg.className = 'alert alert-success mt-2';
                        successMsg.textContent = 'Comment posted successfully!';
                        form.appendChild(successMsg);

                        setTimeout(() => {
                            successMsg.remove();
                        }, 3000);
                    } else {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'alert alert-danger mt-2';
                        errorMsg.textContent = data.error || 'An error occurred while posting your comment.';
                        form.appendChild(errorMsg);

                        setTimeout(() => {
                            errorMsg.remove();
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'alert alert-danger mt-2';
                    errorMsg.textContent = 'An error occurred while posting your comment.';
                    form.appendChild(errorMsg);

                    setTimeout(() => {
                        errorMsg.remove();
                    }, 3000);
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    commentTextarea.disabled = false;
                });
        });
    });

    // ----------------------------
    // 14. COMMENT INTERACTIONS (REPLY, DELETE, LIKE, UNLIKE, PIN, UNPIN)
    // ----------------------------
    const commentsContainer = document.querySelector('.comments-container');
    if (commentsContainer) {
        commentsContainer.addEventListener('click', function (e) {
            // REPLY FEATURE (INFINITE REPLIES)
            if (e.target.classList.contains('reply-comment-button')) {
                const videoId = e.target.getAttribute('data-video-id');
                const parentNodeId = e.target.getAttribute('data-comment-id');
                const replyText = document.getElementById(`reply-text-${parentNodeId}`);
                replyText.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    replyText.focus();
                }, 500);

                if (!replyText || !replyText.value.trim()) {
                    alert("Reply cannot be empty!");
                    return;
                }

                e.target.disabled = true;
                fetch(`/video/comment/${videoId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({
                        comment: replyText.value.trim(),
                        parent_comment_id: parentNodeId
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            const parentComment = document.getElementById(`comment-${parentNodeId}`);
                            if (!parentComment) {
                                console.error(`Parent comment element with ID comment-${parentNodeId} not found.`);
                                return;
                            }

                            let repliesList = parentComment.querySelector('.replies-list');
                            if (!repliesList) {
                                repliesList = document.createElement('ul');
                                repliesList.classList.add('replies-list', 'list-unstyled', 'ms-4');
                                parentComment.querySelector('.comment-card').appendChild(repliesList);
                            }

                            const newReply = document.createElement('li');
                            newReply.setAttribute('id', `reply-${data.comment.id}`);
                            newReply.classList.add('mt-2');
                            newReply.innerHTML = `
                            <li class="mb-3" id="comment-${data.comment.id}" data-comment-id="${data.comment.id}">
                            <div class="comment-card bg-light p-3 rounded">
                                <div class="d-flex justify-content-between">
                                    <strong><a href="/profile/${data.profile.id}" class="text-decoration-none" style="color: black;">${data.profile.username}</a></strong>
                                    <small class="text-muted">${new Date(data.comment.created_at).toLocaleString()}</small>
                                </div>
                                <div class="comment-body">
                                    <p>${data.comment.comment}</p>
                                </div>
                                <div class="comment-footer d-flex justify-content-between">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-outline-primary btn-sm me-2 like-comment-button ${data.comment.liked ? 'd-none' : ''}" 
                                                data-comment-id="${data.comment.id}" 
                                                id="like-comment-button-${data.comment.id}">
                                            👍 Like
                                        </button>
                                        <button class="btn btn-danger btn-sm me-2 unlike-comment-button ${data.comment.liked ? '' : 'd-none'}" 
                                                data-comment-id="${data.comment.id}" 
                                                id="unlike-comment-button-${data.comment.id}">
                                            💔🔨
                                        </button>
                                        <span class="text-muted" id="comment-like-counter-${data.comment.id}">
                                            Likes: ${data.comment.like_counter}
                                        </span>
                                    </div>
                                    <div>
                                        <button class="btn btn-outline-secondary btn-sm reply-button mr-2" 
                                                data-bs-toggle="collapse" 
                                                data-bs-target="#reply-to-${data.comment.id}" 
                                                aria-expanded="false" 
                                                data-comment-id=${data.comment.id}
                                                aria-controls="reply-to-${data.comment.id}">
                                            💬 Reply
                                        </button>
                                        <button class="btn btn-danger btn-sm delete-comment-button" 
                                                data-comment-id="${data.comment.id}"
                                                data-video-id="${data.video.id}">
                                            DELETE <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="collapse reply-section mt-3" id="reply-to-${data.comment.id}">
                                    <textarea 
                                        class="form-control mb-2" 
                                        rows="2" 
                                        placeholder="Write your reply here..." 
                                        id="reply-text-${data.comment.id}"></textarea>
                                    <button
                                    type="submit" 
                                    class="btn btn-primary position-absolute send-btn reply-comment-button mb-3" 
                                    data-comment-id="${data.comment.id}"
                                    data-video-id=${data.video.id}
                                    style="bottom: 1rem; right: 1rem; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-send"></i>
                                </button>
                                </div>
                            </div>
                            </li>
                        `;

                            repliesList.appendChild(newReply);
                            replyText.value = '';
                            document.getElementById(`comment-counter-${videoId}`).innerHTML = data.count;

                            const replyCollapse = bootstrap.Collapse.getInstance(document.getElementById(`reply-to-${parentNodeId}`));
                            if (replyCollapse) {
                                replyCollapse.hide();
                            }
                        } else {
                            console.error('Error:', data.error);
                        }
                    })
                    .catch(error => console.error('Error:', error))
                    .finally(() => {
                        e.target.disabled = false;
                    });
            }
            // DELETE A COMMENT FEATURE
            else if (e.target.classList.contains('delete-comment-button')) {
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                const commentId = e.target.getAttribute('data-comment-id');
                const videoId = e.target.getAttribute('data-video-id');
                const commentDiv = document.getElementById(`comment-${commentId}`);

                fetch(`/video/comment/delete/${commentId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({videoId: videoId}),
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            commentDiv.remove();
                            document.getElementById(`comment-counter-${videoId}`).innerHTML = data.count;
                        } else {
                            console.error("Error:", data.error);
                        }
                    })
                    .catch(error => console.error("Error:", error));
            }
            // LIKE A COMMENT FEATURE
            else if (e.target.classList.contains('like-comment-button')) {
                const commentId = e.target.getAttribute('data-comment-id');
                const likeBtn = document.querySelector(`#like-comment-button-${commentId}`);
                const unlikeBtn = document.querySelector(`#unlike-comment-button-${commentId}`);
                const counter = document.querySelector(`#comment-like-counter-${commentId}`);

                fetch(`/video/comment/like/${commentId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            counter.innerHTML = `Likes: ${data.comment.like_counter}`;
                            likeBtn.classList.add('d-none');
                            unlikeBtn.classList.remove('d-none');
                        } else {
                            console.error("Error:", data.error);
                        }
                    })
                    .catch(error => {
                        console.error("Error:", error);
                    });
            }
            // UNLIKE A COMMENT FEATURE
            else if (e.target.classList.contains('unlike-comment-button')) {
                const commentId = e.target.getAttribute('data-comment-id');
                const likeBtn = document.querySelector(`#like-comment-button-${commentId}`);
                const unlikeBtn = document.querySelector(`#unlike-comment-button-${commentId}`);
                const counter = document.querySelector(`#comment-like-counter-${commentId}`);

                fetch(`/video/comment/like/${commentId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            counter.innerHTML = `Likes: ${data.comment.like_counter}`;
                            likeBtn.classList.remove('d-none');
                            unlikeBtn.classList.add('d-none');
                        } else {
                            console.error("Error:", data.error);
                        }
                    })
                    .catch(error => {
                        console.error("Error:", error);
                    });
            }
            // PIN A COMMENT FEATURE
            else if(e.target.classList.contains('pin-comment-button')){
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                const commentId = e.target.getAttribute('data-comment-id');
                const videoId = e.target.getAttribute('data-video-id');
                const unPinBtn = document.getElementById(`unpin-comment-button-${commentId}`);
                const PinBtn = document.getElementById(`pin-comment-button-${commentId}`);
                const commentContainer = document.getElementById(`comment-${commentId}`);
                const pinText = document.getElementById(`pinned-zone-${commentId}`);
                const commentsList = document.querySelector('.list-unstyled');
                fetch(`/video/pin/`,{
                    method: 'POST',
                    headers:{
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({
                        comment: commentId,
                        video: videoId,
                    })
                })
                .then(res => res.json())
                .then(data =>{
                    if (data.success){
                        showMessage(data.message, true);
                        // Add the Pin text
                        pinText.classList.remove('d-none')
                        // Prepend the comment
                        if (commentsContainer && commentsList){
                            commentsList.prepend(commentContainer);
                        }
                        // Set pin d-none for every comment
                        document.querySelectorAll('.pin-comment-button').forEach(button =>{
                            button.classList.add('d-none');
                        })
                        unPinBtn.classList.remove('d-none');
                    }
                    else{
                        showMessage(data.message, false);
                    }
                })
                .catch(error => console.error("Error:", error));
            }
            //  UNPIN A COMMENT FEATURE
            else if(e.target.classList.contains('unpin-comment-button')){
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                const commentId = e.target.getAttribute('data-comment-id');
                const videoId = e.target.getAttribute('data-video-id');
                const unPinBtn = document.getElementById(`unpin-comment-button-${commentId}`);
                const PinBtn = document.getElementById(`pin-comment-button-${commentId}`);
                const commentContainer = document.getElementById(`comment-${commentId}`);
                const commentsList = document.querySelector('.list-unstyled');
                const pinText = document.getElementById(`pinned-zone-${commentId}`);
                fetch(`/video/unpin/`, {
                    method: 'POST',
                    headers:{
                        'X-CSRFToken': csrfToken,
                    },
                    body:JSON.stringify({video: videoId,
                        comment: commentId,
                    })
                })
                .then(res => res.json())
                .then(data =>{
                    if (data.success){
                        // Remove the pin text
                        pinText.classList.add('d-none');
                        // Remove the Unpin button
                        unPinBtn.classList.add('d-none');
                        // Remove all pin buttons
                        document.querySelectorAll('.pin-comment-button').forEach(button =>{
                            button.classList.remove('d-none');
                        })
                        showMessage(data.message, true);
                    }
                    else{
                        showMessage(data.message, false);
                    }
                })
                .catch(error => console.error("Error:", error));
            }
        });
    }

    // ----------------------------
    // 15.  BUTTON SCROLL
    // ----------------------------
    const commentButton = document.querySelector('.btn-success');
    if (commentButton) {
        commentButton.addEventListener('click', function () {
            const videoId = document.querySelector('.comment-form').getAttribute('data-comment-id');
            const textarea = document.querySelector(`.commentTextarea-${videoId}`);

            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                textarea.focus();
            }, 500);
        });
    }

    // ----------------------------
    // 16. REPORT BUTTON SCROLL
    // ----------------------------
    const reportButton = document.querySelector('.video-page .btn-danger[data-bs-target="#reportModal"]');
    if (reportButton) {
        reportButton.addEventListener('click', () => {
            document.documentElement.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ----------------------------
    // 17. REPLY BUTTON SCROLL
    // ----------------------------
    document.querySelectorAll('.reply-button').forEach(button => {
        button.addEventListener('click', function () {
            const btnId = this.getAttribute('data-comment-id');
            const textArea = document.querySelector(`#reply-text-${btnId}`);
            textArea.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                textArea.focus();
            }, 500);
        });
    });

    // ----------------------------
    // 18. DELETE VIDEO HANDLING
    // ----------------------------
    const deleteBtn = document.getElementById('deleteBtn');
    const cancelBtn = document.getElementById('cancelDelete');
    const editForm = document.getElementById('editForm');
    const deleteConfirmation = document.getElementById('deleteConfirmation');
    const editModal = document.getElementById('editProfileModal');

    if (editModal) {
        editModal.addEventListener('show.bs.modal', function () {
            editForm.style.display = 'block';
            deleteConfirmation.style.display = 'none';
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            editForm.style.display = 'none';
            deleteConfirmation.style.display = 'block';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            editForm.style.display = 'block';
            deleteConfirmation.style.display = 'none';
        });
    }

    document.addEventListener('click', function (e) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        if (e.target.id === 'confirmDelete') {
            const videoId = e.target.getAttribute('data-delete-id');

            fetch(`/video/delete/${videoId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) throw new Error('Network error');
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        window.location.href = '/?deleted=true';
                    } else {
                        showMessage(`❌ Error: ${data.error}`);
                    }
                })
                .catch(error => {
                    showMessage('❌ Deletion failed - please try again');
                });
        } else if (e.target.id === 'saveChanges') {
            e.preventDefault();
            const videoId = e.target.getAttribute('data-video-edit-id');
            const data = {
                title: document.getElementById(`videoTitle-${videoId}`).value,
                description: document.getElementById(`description-${videoId}`).value,
                status: document.getElementById(`status_select-${videoId}`).value,
                category: document.getElementById(`category_select-${videoId}`).value
            };

            fetch(`/video/edit/${videoId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify(data),
            })
                .then(response => {
                    if (!response.ok) throw new Error('Network error');
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        document.querySelectorAll(`.video-title-${videoId}`).forEach(t => {
                            t.innerHTML = data.video.title;
                        });
                        document.getElementById(`video-description-${videoId}`).innerHTML = data.video.description;
                        const editModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
                        editModal.hide();
                        showMessage(data.message, true)
                    } else {
                        console.error("Error:", data.error);
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                });
        }
    });
    // ----------------------------
    // 18. PLAYLIST SETTINGS BUTTON HANDLING
    // ----------------------------
    // Create the Edit Playlist Modal
    document.querySelectorAll('.playlist-settings').forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default behavior

            // Get playlist data from data attributes
            const playlistId = this.getAttribute('data-playlist-id');
            const playlistTitle = this.getAttribute('data-playlist-title');
            const playlistVisibility = this.getAttribute('data-playlist-visibility');

            // Update modal fields
            document.getElementById('playlist-title').value = playlistTitle;
            document.getElementById('playlist-visibility-option').value = playlistVisibility;

            document.getElementById('editPlaylistModal').setAttribute('data-playlist-id', playlistId);
            // Show the modal
            const editModal = new bootstrap.Modal(document.getElementById('editPlaylistModal'));
            editModal.show();
        });
    });
    // Modify the playlist 
    const editPlaylistBtn = document.getElementById('submit-edit-playlist');
    if (editPlaylistBtn){
        editPlaylistBtn.addEventListener('click', function(e){
            e.preventDefault();
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            const title = document.getElementById('playlist-title').value;
            const status = document.getElementById('playlist-visibility-option').value;
            const playlistId = document.getElementById('editPlaylistModal').getAttribute('data-playlist-id');
            
            // Fetch the request
            fetch(`/playlist/edit/${playlistId}/`, {
                method: 'POST',
                headers:{
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({title: title,
                    status: status,
                })
            })
            .then(res => res.json())
            .then(data =>{
                if (data.success){
                    // Change the title if changed
                    document.getElementById(`playlist-title-${playlistId}`).innerHTML = `${data.playlist.name}`;
                    // Change the values in the modal
                    const divBtn = document.getElementById(`divbtn-${playlistId}`);
                    divBtn.setAttribute('data-playlist-title', `${data.playlist.name}`);
                    divBtn.setAttribute('data-playlist-visibility', `${data.playlist.status}`);
                    // Get the modal and close it
                    const editModal = bootstrap.Modal.getInstance(document.getElementById('editPlaylistModal'));
                    editModal.hide();
                    showMessage(data.message, true);
                }
                else{
                    const editModal = bootstrap.Modal.getInstance(document.getElementById('editPlaylistModal'));
                    editModal.hide();
                    showMessage(data.message, false);
                }
            })
            .catch(error => console.error("Error:", error));
        });
    }
});