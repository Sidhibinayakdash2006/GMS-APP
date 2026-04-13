const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ Ensure uploads folder exists
const uploadPath = "public/uploads";
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// ✅ Load data safely
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

// ✅ Add ID to old posts
let updated = false;

posts.forEach((p, index) => {
    if (!p.id) {
        p.id = Date.now() + index;
        updated = true;
    }
});

if (updated) {
    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));
}

// ================= LOGIN =================
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

// ================= CREATE USER =================
app.post("/create-user", (req, res) => {
    const { username, password } = req.body;

    const exists = users.find(u => u.username === username);

    if (exists) {
        return res.json({ success: false, message: "User already exists" });
    }

    users.push({ username, password, role: "user" });

    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

    res.json({ success: true });
});

// ================= MULTER (UPLOAD) =================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// ================= ADD POST =================
app.post("/add-post", upload.single("image"), (req, res) => {
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

    res.json({ success: true });
});

// ================= DELETE POST =================
app.post("/delete-post", (req, res) => {
    const { id } = req.body;

    posts = posts.filter(p => p.id != id);

    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

    res.json({ success: true });
});

// ================= EDIT POST =================
app.post("/edit-post", upload.single("image"), (req, res) => {
    const { id, title, desc } = req.body;

    posts = posts.map(p => {
        if (p.id == id) {
            return {
                ...p,
                title,
                desc,
                image: req.file ? req.file.filename : p.image
            };
        }
        return p;
    });

    fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

    res.json({ success: true });
});

// ================= GET POSTS =================
app.get("/posts", (req, res) => {
    res.json(posts);
});

// ================= RECOVER PASSWORD =================
app.post("/recover", (req, res) => {
    const { answer } = req.body;

    if (answer === "BiNu") {
        res.json({ password: "Sidhi@993744" });
    } else {
        res.json({ error: "Wrong answer" });
    }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});