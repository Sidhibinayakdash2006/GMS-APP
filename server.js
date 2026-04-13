const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

const fs = require("fs");

let users = [];
let posts = [];

try {
    users = JSON.parse(fs.readFileSync("users.json"));
} catch {
    fs.writeFileSync("users.json", "[]");
}

try {
    posts = JSON.parse(fs.readFileSync("posts.json"));
} catch {
    fs.writeFileSync("posts.json", "[]");
}

// 🔥 ADD ID TO OLD POSTS
let updated = false;

posts.forEach((p, index) => {
    if (!p.id) {
        p.id = Date.now() + index; // unique id
        updated = true;
    }
});

// SAVE ONLY IF CHANGES MADE
if (updated) {
    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));
    console.log("Old posts updated with IDs");
}

// LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (user) {
        res.json({ success: true, role: user.role });
    } else {
        res.json({ success: false });
    }
});

// CREATE USER (ADMIN)
app.post("/create-user", (req, res) => {
    const { username, password } = req.body;

    // 🔒 check if user already exists
    const exists = users.find(u => u.username === username);

    if (exists) {
        return res.json({ success: false, message: "User already exists" });
    }

    users.push({ username, password, role: "user" });

    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

    res.json({ success: true });
});

const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post("/add-post", upload.single("image"), (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { title, desc } = req.body;

    if (!title) {
        return res.json({ success: false, message: "Title missing" });
    }

    const newPost = {
        id: Date.now(),
        title,
        desc,
        image: req.file ? req.file.filename : null
    };

    posts.push(newPost);

    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

    console.log("Post added:", newPost);

    res.json({ success: true });
});

app.post("/delete-post", (req, res) => {
    console.log("Delete request:", req.body);

    const { id } = req.body;

    posts = posts.filter(p => p.id != id); // ✅ use != (important)

    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

    res.json({ success: true });
});
app.post("/edit-post", upload.single("image"), (req, res) => {
    console.log("Edit request:", req.body);

    const { id, title, desc } = req.body;

    posts = posts.map(p => {
        if (p.id == id) {
            return {
                ...p,
                title,
                desc,
                image: req.file ? req.file.filename : p.image // 🔥 update image if new
            };
        }
        return p;
    });

    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

    res.json({ success: true });
});
// GET POSTS
app.get("/posts", (req, res) => {
    res.json(posts);
});

// RECOVER PASSWORD
app.post("/recover", (req, res) => {
    const { answer } = req.body;

    if (answer === "BiNu") {
        res.json({ password: "Sidhi@993744" });
    } else {
        res.json({ error: "Wrong answer" });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Server running on port " + PORT));