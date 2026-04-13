let role = "";

document.getElementById("username").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        document.getElementById("password").focus();
    }
});

function login() {
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                role = data.role;
                loginBox.style.display = "none";
                dashboard.style.display = "block";

                if (role === "admin") {
                    adminPanel.style.display = "block";
                } else {
                    // 👇 USER VIEW
                    content.innerHTML = `
            <h3>Information</h3>
            <div id="posts"></div>
        `;
                }

                loadPosts(); // 🔥 IMPORTANT
            } else {
                alert("Wrong login");
            }
        });
}

function logout() {
    location.reload();
}

function showCreateUser() {
    content.innerHTML = `
        <input id="newUser" placeholder="Username">
        <input id="newPass" placeholder="Password">
        <button onclick="createUser()">Create</button>
    `;
}

function createUser() {
    fetch("/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: newUser.value,
            password: newPass.value
        })
    });
    alert("User Created");
}

function showInfo() {
    content.innerHTML = `
        <h3>Add Information</h3>

        <input id="title" placeholder="Heading"><br><br>

        <input type="file" id="image"><br><br>

        <textarea id="desc" placeholder="Write description (press Enter for new line)"></textarea><br><br>

        <button onclick="addPost()">Add</button>

        <hr>

        <div class="container">
            <div id="posts"></div>
        </div>
    `;

    loadPosts();
}

function addPost() {
    alert("Button Clicked");

    if (!title.value) {
        alert("Please enter heading");
        return;
    }

    let formData = new FormData();
    formData.append("title", title.value);
    formData.append("desc", desc.value);

    // ✅ SAFE IMAGE CHECK
    if (image.files.length > 0) {
        formData.append("image", image.files[0]);
    }

    fetch("/add-post", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            console.log("Server Response:", data);
            alert("Sent to server");
            loadPosts();
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Error sending data");
        });
}

function loadPosts() {
    fetch("/posts")
        .then(res => res.json())
        .then(data => {
            let html = "";

            data.forEach(p => {

                console.log("POST:", p);

                if (p && p.title) {
                    html += `
                     <div class="bullet">
                     ${p.image ? `<img src="uploads/${p.image}" class="post-img">` : ""}
                     <div>• <span class="heading">${p.title}</span></div>
                     <p>${(p.desc || "").replace(/\n/g, "<br>")}</p>

                     ${role === "admin" ? `
                           <button onclick="deletePost(${p.id})">Delete</button>
                           <button onclick="showEditForm(${p.id})">Edit</button>
                     ` : ""}
                     </div>
                    `;
                }

            }); // ✅ properly closed forEach

            if (document.getElementById("posts")) {
                document.getElementById("posts").innerHTML = html;
            }
        });
}

function recover() {
    let ans = prompt("Security Question: What is the answer");

    fetch("/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: ans })
    })
        .then(res => res.json())
        .then(data => {
            if (data.password) {
                alert("Password: " + data.password);
            } else {
                alert("Wrong Answer");
            }
        });
}

function deletePost(id) {
    console.log("Deleting:", id);

    if (!id || id === 0) {
        alert("ID missing");
        return;
    }

    fetch("/delete-post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: id })
    })
        .then(res => res.json())
        .then(data => {
            console.log("Delete response:", data);
            loadPosts();
        })
        .catch(err => console.error(err));
}

function editPost(id) {
    console.log("Editing:", id);

    let newTitle = prompt("Enter new title:");
    let newDesc = prompt("Enter new description:");

    if (!newTitle) return;

    fetch("/edit-post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: id,   // ✅ no Number()
            title: newTitle,
            desc: newDesc
        })
    })
        .then(res => res.json())
        .then(data => {
            console.log("Edit response:", data);
            loadPosts();
        })
        .catch(err => console.error(err));
}

function showEditForm(id) {

    fetch("/posts")
        .then(res => res.json())
        .then(data => {

            const post = data.find(p => p.id == id);

            if (!post) {
                alert("Post not found");
                return;
            }

            content.innerHTML = `
                <h3>Edit Post</h3>

                <input id="editTitle" value="${post.title}"><br><br>

                <input type="file" id="editImage"><br><br>

                <textarea id="editDesc">${post.desc || ""}</textarea><br><br>

                <button onclick="updatePost(${post.id})">Save</button>
                <button onclick="showInfo()">Cancel</button>
            `;
        });
}

function updatePost(id) {

    let formData = new FormData();
    formData.append("id", id);
    formData.append("title", editTitle.value);
    formData.append("desc", editDesc.value);

    if (editImage.files.length > 0) {
        formData.append("image", editImage.files[0]);
    }

    fetch("/edit-post", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            alert("Post Updated");
            showInfo(); // go back
        })
        .catch(err => console.error(err));
}