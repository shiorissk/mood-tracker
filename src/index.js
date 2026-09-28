import "dotenv/config"
import express from "express";

const app = express(); // create app object

const PORT = process.env.PORT || 3000;

app.get("/health", (request, response) => {
    response.json({
        status: "ok"
    });
})

// Start listening
app.listen(PORT, (request, response) => {
    console.log("Server is running");
    console.log(`http://localhost:${PORT}/health`);
});
