document.addEventListener('DOMContentLoaded', function () {
    // Message at video delete
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('deleted')) {
        showMessage('🎥 Video deleted successfully!', true);
    }
    
    // Dropdown Menu
    const usernameLink = document.querySelector('.nav-link strong');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const menu_closed = document.querySelector('.menu-closed');
    const menu_opened = document.querySelector('.menu-opened');

    if (usernameLink){
        usernameLink.addEventListener('click', function (e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
            if (menu_closed.classList.contains('d-none')){
                menu_closed.classList.remove('d-none');
                menu_opened.classList.add('d-none');
            }
            else{
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

    const videoUploadForm = document.getElementById('video-upload-form');
    if (videoUploadForm) {
        videoUploadForm.addEventListener('submit', function(event) {
            event.preventDefault();
    
            const formData = new FormData(videoUploadForm);
            const fileInput = document.getElementById('video_file');
            const file = fileInput.files[0];
            const max = 50 * 1024 * 1024; // 50MB max size
    
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
    
                // Remove success/error message after 3 seconds
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
    

    document.querySelectorAll('.follow-button').forEach(button => {
        button.addEventListener('click', function() {
            const profileId = this.getAttribute('data-profile-id');  // Use profileId here
            const followButton = document.querySelector(`#follow-button-${profileId}`);
            const unfollowButton = document.querySelector(`#unfollow-button-${profileId}`);
            const counter = document.querySelector(`#followers-${profileId}`);
            // Post request
            fetch(`/profile/follow/${profileId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
            .then(response => response.json())
            .then(data =>{
                if (data.success){
                    counter.innerHTML =  data.profile.followers_count;
                    followButton.classList.add('d-none');
                    unfollowButton.classList.remove('d-none');
                }
                else{
                    console.error(data.error);
                }
            })
            .catch(error =>{
                console.error("Error:", error);
            });
        });
    });


    document.querySelectorAll('.unfollow-button').forEach(button => {
        button.addEventListener('click', function() {
            const profileId = this.getAttribute('data-profile-id');  // Use profileId here
            const followButton = document.querySelector(`#follow-button-${profileId}`);
            const unfollowButton = document.querySelector(`#unfollow-button-${profileId}`);
            const counter = document.querySelector(`#followers-${profileId}`);
            // Post request



            fetch(`/profile/unfollow/${profileId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
            .then(response => response.json())
            .then(data =>{
                if (data.success){
                    counter.innerHTML =  data.profile.followers_count;
                    followButton.classList.remove('d-none');
                    unfollowButton.classList.add('d-none');
                }
                else{
                    console.error(data.error);
                }
            })
            .catch(error =>{
                console.error("Error:", error);
            });
        });
    });
    document.querySelectorAll('.following').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();

            const currentPath = window.location.pathname;
            const indexSection = document.querySelector('.index');
            const followingTab = document.querySelector('.following-tab');
            const buttonText = this.textContent.trim(); // Use textContent for comparison

            if (currentPath === '/') {
                if (indexSection && followingTab) {
                    if (buttonText === 'Subscriptions') {
                        indexSection.classList.add('d-none');
                        followingTab.classList.remove('d-none');
                        this.innerHTML = '<i class="bi bi-house mr-2"></i> Index';
                    } else {
                        indexSection.classList.remove('d-none');
                        followingTab.classList.add('d-none');
                        this.innerHTML = '<i class="bi bi-person-check mr-2"></i> Subscriptions';
                    }
                }
            } else {
                // Redirect based on button state
                window.location.href = buttonText === 'Subscriptions'
                    ? '/?tab=following'
                    : '/';
            }
        });
    })
    const tab = urlParams.get('tab');

    if (tab === 'following' && window.location.pathname === '/') {
        const indexSection = document.querySelector('.index');
        const followingTab = document.querySelector('.following-tab');

        if (indexSection && followingTab) {
            indexSection.classList.add('d-none');
            followingTab.classList.remove('d-none');

            document.querySelectorAll('.following').forEach(button => {
                button.innerHTML = '<i class="bi bi-house mr-2"></i> Index';
            });
        }
    }
    // Like-buttons handling
    document.querySelectorAll('.like-button').forEach(button=>{
        button.addEventListener('click', function(){
            const postId = this.getAttribute('data-post-id');
            const likeBtn = document.querySelector(`#like-button-${postId}`);
            const counter = document.querySelector(`#like-counter-${postId}`);
            const unlikeBtn = document.querySelector(`#unlike-button-${postId}`);

            //Fetch
            fetch(`/video/like/${postId}/`,{
                method: 'POST',
                headers:{
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
            .then(response => response.json())
            .then(data =>{
                if (data.success){
                    counter.innerHTML = data.video.like_counter;
                    likeBtn.classList.add('d-none');
                    unlikeBtn.classList.remove('d-none')
                    console.log("Video liked succesfully!");
                }
                else{
                    console.error("Error:", error)
                }
            })
            .catch(error=>{
                console.error("Error:", error)
            });
        });
    })

    // Unlike buttons handling
    
    document.querySelectorAll('.unlike-button').forEach(button =>{
        button.addEventListener('click', function(){
            const postId = this.getAttribute('data-post-id');
            const likeBtn = document.querySelector(`#like-button-${postId}`);
            const counter = document.querySelector(`#like-counter-${postId}`);
            const unlikeBtn = document.querySelector(`#unlike-button-${postId}`);

            //Fetch
            fetch(`/video/like/${postId}/`,{
                method: 'POST',
                headers:{
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                }
            })
            .then(response => response.json())
            .then(data =>{
                if (data.success){
                    counter.innerHTML = data.video.like_counter;
                    likeBtn.classList.remove('d-none');
                    unlikeBtn.classList.add('d-none')
                    console.log("Video liked succesfully!");
                }
                else{
                    console.error("Error:", error)
                }
            })
            .catch(error=>{
                console.error("Error:", error)
            });
        });
    });

    // Edit profile functions
    document.querySelectorAll('.edit-profile-modal').forEach(modal => {
        const profileId = modal.getAttribute('data-edit-id');
        const nameInput = document.querySelector(`#profile-name-${profileId}`);
        const descriptionInput = document.querySelector(`#profile-description-${profileId}`);
        const gender = document.querySelector(`#gender-icon-${profileId}`);
        const submitBtn = document.querySelector(`#submit-edit-profile-${profileId}`);
        const genderOptions = document.querySelector(`#gender-option-${profileId}`);
        const genderSpan = document.querySelector(`.gender-span-${profileId}`);
        
        // Check for changes in inputs
        const checkForChanges = () => {
            const nameChanged = nameInput.value !== nameInput.getAttribute('data-original-value');
            const descriptionChanged = descriptionInput.value !== descriptionInput.getAttribute('data-original-value');
            const genderChanged = genderOptions.value !== genderOptions.getAttribute('data-original-value');
            
            if (nameChanged || descriptionChanged || genderChanged) {
                submitBtn.classList.remove('disabled');
            } else {
                submitBtn.classList.add('disabled');
            }
        };
        genderOptions.addEventListener('change', () => {
            const selectedValue = genderOptions.value;
        
            if (selectedValue === 'male') {
                gender.classList.remove('bi', 'bi-person-circle'); // Remove Bootstrap default classes
                gender.innerHTML = '🧑'; // Male icon
            } else if (selectedValue === 'female') {
                gender.classList.remove('bi', 'bi-person-circle'); // Remove Bootstrap default classes
                gender.innerHTML = '👩'; // Female icon
            } else {
                gender.classList.add('bi', 'bi-person-circle'); // Add Bootstrap default classes
                gender.innerHTML = ''; // Clear any custom icon
            }
        
            checkForChanges();
        });
        
        // Add event listeners to inputs
        nameInput.addEventListener('input', checkForChanges);
        descriptionInput.addEventListener('input', checkForChanges);
        
        // Handle form submission
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('userName', nameInput.value);
            formData.append('description', descriptionInput.value);
            formData.append('gender', genderOptions.value);
            fetch(`/profile/edit/${profileId}/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                // Remove any Content-Type header to let the browser set it automatically
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Update the profile username in the UI
                    document.querySelector(`#profile-username-${profileId}`).innerHTML = data.profile.username;
                    
                    // Update the description in the UI
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
     
                    // Update the original values to match the new values
                    nameInput.setAttribute('data-original-value', data.profile.username);
                    descriptionInput.setAttribute('data-original-value', data.profile.description || '');
                    genderOptions.setAttribute('data-original-value', data.profile.gender);
                    
                    // Disable the submit button since changes are now saved
                    submitBtn.classList.add('disabled');
                    
                    // Close the modal
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                } else {
                    alert(data.error || 'Failed to update profile');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to update profile. Please try again.');
            });
        });
    });

    // Like and Unlike a comment using event delegation
    document.querySelector('.comments-container').addEventListener('click', function (e) {
        if (e.target.classList.contains('like-comment-button')) {
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
        } else if (e.target.classList.contains('unlike-comment-button')) {
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
    });
 // SA inteleg asta! !!! !! !
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent default form submission
    
            const videoId = this.getAttribute('data-comment-id');
            const commentTextarea = document.querySelector(`.commentTextarea-${videoId}`);
            const submitBtn = document.querySelector(`.submit-comment-${videoId}`);
            const comment = commentTextarea.value.trim();
    
            // Disable form while submitting
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
                    // Get uploader's username
                    const uploaderUsername = form.closest('.comments-div').getAttribute('data-uploader-username');
    
                    // Create new comment element
                    const commentsList = form.closest('.comments-div').querySelector('.comments-container ul');
                    const noCommentsMessage = commentsList.querySelector('li:only-child');
    
                    // Remove "no comments" message if it exists
                    if (noCommentsMessage && noCommentsMessage.textContent.includes("aren't any comments")) {
                        noCommentsMessage.remove();
                    }
    
                    // Create and append new comment
                    const newComment = document.createElement('li');
                    const isUploader = data.profile.username === uploaderUsername;
                    newComment.innerHTML = `
                    <div class="comment-card">
                        <div class="comment-header">
                            <div class="d-flex align-items-center">
                                ${isUploader ? '<span class="uploader-badge me-2">Uploader</span>' : ''}
                                <strong>${data.profile.username}</strong>
                            </div>
                            <small class="text-muted">${new Date().toLocaleString()}</small>
                        </div>
                        
                        <div class="comment-body">
                            <p class="card-text text-dark">${data.comment.comment}</p>
                        </div>
                        
                        <div class="comment-footer">
                            <div class="comment-actions">
                                <div class="d-flex align-items-center">
                                    <button class="btn btn-outline-primary btn-sm me-2 like-comment-button" data-comment-id="${data.comment.id}" id="like-comment-button-${data.comment.id}">
                                        👍 Like
                                    </button>
                                    <button class="btn btn-danger btn-sm me-2 unlike-comment-button d-none" data-comment-id="${data.comment.id }" id="unlike-comment-button-${data.comment.id}">
                                        💔🔨
                                    </button>
                                    <span id="comment-like-counter-${data.comment.id}" class="text-muted">0 Likes</span>
                                </div>
                                
                                <button class="btn btn-outline-secondary btn-sm reply-button" 
                                        data-bs-toggle="collapse" 
                                        data-bs-target="#reply-to-${data.comment.id}" 
                                        aria-expanded="false" 
                                        aria-controls="reply-to-${data.comment.id}">
                                    💬 Reply
                                </button>
                            </div>
                            
                            <div class="collapse reply-section mt-3" id="reply-to-${data.comment.id}">
                                <textarea 
                                    class="form-control mb-2" 
                                    rows="2" 
                                    placeholder="Write your reply here..." 
                                    id="reply-text-${data.comment.id}"></textarea>
                                <button 
                                    class="btn btn-success btn-sm post-reply-button" 
                                    data-comment-id="${data.comment.id}">
                                    Post Reply
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                    newComment.classList.add('mb-3');
                    commentsList.insertBefore(newComment, commentsList.firstChild);
    
                    // Clear textarea
                    commentTextarea.value = '';
    
                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.className = 'alert alert-success mt-2';
                    successMsg.textContent = 'Comment posted successfully!';
                    form.appendChild(successMsg);
    
                    // Remove success message after 3 seconds
                    setTimeout(() => {
                        successMsg.remove();
                    }, 3000);
                } else {
                    // Handle error
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
                // Re-enable form
                submitBtn.disabled = false;
                commentTextarea.disabled = false;
            });
        });
    });
    
    const commentButton = document.querySelector('.btn-success');
    
    commentButton.addEventListener('click', function() {
        // Get the video ID from the nearest comment form
        const videoId = document.querySelector('.comment-form').getAttribute('data-comment-id');
        
        // Get the textarea
        const textarea = document.querySelector(`.commentTextarea-${videoId}`);
        
        // Scroll to the textarea smoothly
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll to complete before focusing
        setTimeout(() => {
            textarea.focus();
        }, 500); // 500ms delay to ensure smooth scroll completes
    });
    const reportButton = document.querySelector('.video-page .btn-danger[data-bs-target="#reportModal"]');
    
    if (reportButton) {
        reportButton.addEventListener('click', () => {
            document.documentElement.scrollIntoView({ behavior: 'smooth' });
        });
    }
    document.querySelectorAll('.reply-button').forEach(button=>{
        button.addEventListener('click', function(){
            btnId = this.getAttribute('data-comment-id');
            const textArea = document.querySelector(`#reply-text-${btnId}`);
            textArea.scrollIntoView({behavior: 'smooth'});
            setTimeout(() => {
                textArea.focus();
            }, 500); // 500ms delay to ensure smooth scroll completes
        })
    });


    // Delete Video 
    const deleteBtn = document.getElementById('deleteBtn');
    const cancelBtn = document.getElementById('cancelDelete');
    const editForm = document.getElementById('editForm');
    const deleteConfirmation = document.getElementById('deleteConfirmation');
    const editModal = document.getElementById('editProfileModal');

    // Reset to edit form when modal is shown
    editModal.addEventListener('show.bs.modal', function() {
        editForm.style.display = 'block';
        deleteConfirmation.style.display = 'none';
    });

    // Delete button handler
    deleteBtn.addEventListener('click', function() {
        editForm.style.display = 'none';
        deleteConfirmation.style.display = 'block';
    });

    // Cancel button handler
    cancelBtn.addEventListener('click', function() {
        editForm.style.display = 'block';
        deleteConfirmation.style.display = 'none';
    });
    // Use event delegation for dynamic buttons
    document.addEventListener('click', function(e) {
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
        }
        else if (e.target.id === 'saveChanges') {
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
                    document.querySelectorAll(`.video-title-${videoId}`).forEach(t =>{
                        t.innerHTML = data.video.title;
                    });
                    document.getElementById(`video-description-${videoId}`).innerHTML = data.video.description;
                    const editModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
                    editModal.hide();
                } else {
                    console.error("Error:", data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
        }
    });
});

function showMessage(message, isSuccess = false) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.innerHTML = message;
    
    // Optional: Add success styling if needed
    if (isSuccess) {
        messageEl.style.backgroundColor = '#d4edda';
        messageEl.style.color = '#155724';
    }
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);

}
// Sa adaug sistem de disable si enable la buton cand se fac modificari