const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
let commentDeleteBtns = document.querySelectorAll(".deleteCommentBtn");

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.classList.add("video__comment");
  newComment.dataset.id = id;
  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const span = document.createElement("span");
  span.innerText = ` ${text}`;
  const span2 = document.createElement("span");
  span2.innerText = "❌";
  span2.classList.add("deleteCommentBtn");
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);
  commentDeleteBtns = document.querySelectorAll(".deleteCommentBtn");
  for (let commentDeleteBtn of commentDeleteBtns) {
    commentDeleteBtn.addEventListener("click", handleCommentDeleteBtnClick);
  }
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
  }
};

const deleteComment = (event) => {
  const commentContainer = document.querySelector(".video__comments ul");
  const commentList = event.target.parentNode;
  commentContainer.removeChild(commentList);
};

const handleCommentDeleteBtnClick = async (event) => {
  const commentList = event.target.parentNode;
  const commentId = commentList.dataset.id;
  const videoId = videoContainer.dataset.id;
  console.log(commentId, videoId);

  const response = await fetch(`/api/comments/${commentId}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId }),
  });
  if (response.status === 201) {
    deleteComment(event);
  }
  if (response.status === 403) {
    alert("댓글 주인이 아닙니다.");
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}

for (let commentDeleteBtn of commentDeleteBtns) {
  commentDeleteBtn.addEventListener("click", handleCommentDeleteBtnClick);
}
