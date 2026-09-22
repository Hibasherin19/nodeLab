const express = require("express");
const fs = require("fs");
const EventEmitter = require("events");

const app = express();
const PORT = 3000;

const usersFile = "./users.json";

// Middleware
app.use(express.json());
app.use(express.static("public"));

// -------------------------
// Read users from users.json
// -------------------------
function getUsers() {
    const data = fs.readFileSync(usersFile, "utf8");
    return JSON.parse(data);
}

// -------------------------
// Save users to users.json
// -------------------------
function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );
}

// -------------------------
// EventEmitter
// -------------------------
const userEvents = new EventEmitter();

// Signup event
userEvents.on("signup", (user) => {
    const message =
        `${new Date().toISOString()} - SIGNUP: ${user.email}\n`;

    fs.appendFileSync("audit.log", message);
});

// Login event
userEvents.on("login", (user) => {
    const message =
        `${new Date().toISOString()} - LOGIN: ${user.email}\n`;

    fs.appendFileSync("audit.log", message);
});

// -------------------------
// SIGN UP
// -------------------------
app.post("/signup", (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields."
            });
        }

        const users = getUsers();

        // Check if email already exists
        const existingUser = users.find(
            user => user.email.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered."
            });
        }

        // Create new user
        const newUser = {
            name: name,
            email: email,
            password: password
        };

        // Add user
        users.push(newUser);

        // Save to users.json
        saveUsers(users);

        // Emit signup event
        userEvents.emit("signup", newUser);

        res.json({
            success: true,
            message: "Account created successfully!"
        });

    } catch (error) {
        console.error("Signup error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during signup."
        });
    }
});

// -------------------------
// LOGIN
// -------------------------
app.post("/login", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        const users = getUsers();

        // Find matching user
        const user = users.find(
            user =>
                user.email.toLowerCase() === email.toLowerCase() &&
                user.password === password
        );

        // User not found
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Login successful
        userEvents.emit("login", user);

        res.json({
            success: true,
            message: "Login successful!",
            name: user.name
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
});

// -------------------------
// START SERVER
// -------------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});