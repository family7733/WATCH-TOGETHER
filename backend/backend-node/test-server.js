// Simple test to verify server can start
import express from "express";

const app = express();
app.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Server is working!" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log("If you see this, the server started successfully!");
});

