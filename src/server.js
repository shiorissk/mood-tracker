import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Start listening
app.listen(PORT, () => {
    console.log("Server is running");
    console.log(`http://localhost:${PORT}/health`);
});
