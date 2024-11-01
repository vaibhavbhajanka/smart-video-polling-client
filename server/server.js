const express = require("express");

class TranslationStatusServer {
    constructor(delay) {
        this.delay = delay * 1000; // Convert the delay from seconds to milliseconds
        this.startTime = Date.now(); // Record the start time of the translation
        this.status = "pending"; // Initial status of the translation job
        this.progress = 0; // Start with 0% progress
        this.expectedTime = this.delay; // Set the expected time for completion based on the provided delay
        this.setStatusAfterDelay(); // Set up the function to update status after the delay has passed
    }

    setStatusAfterDelay() {
        // Set a timeout to update the status to either "completed" or "error" after the delay
        setTimeout(() => {
            this.status = Math.random() > 0.5 ? "completed" : "error"; // Randomly decide if the job is "completed" or "error" to simulate a real world scenario
            this.progress = 100; // Set progress to 100% when done
        }, this.delay);
    }

    getStatus() {
        // Calculate the elapsed time since the translation started
        const elapsedTime = Date.now() - this.startTime;
        // Calculate progress based on elapsed time and total delay
        this.progress = Math.min(100, Math.floor((elapsedTime / this.delay) * 100));
        // Return the current status, progress, and expected time for completion
        return {
            status: elapsedTime < this.delay ? "pending" : this.status,
            progress: this.progress,
            expectedTime: this.expectedTime
        };
    }
}

const app = express();
// Choosing a random Translation Time between 1 minute (60 seconds) and 3 minutes (180 seconds)
const randomTranslationTime = 60 + Math.random() * (180 - 60);
// Create a new TranslationStatusServer instance with the random delay
const server = new TranslationStatusServer(Math.floor(randomTranslationTime));

// Define an endpoint to get the current status of the translation job
app.get("/status", (req, res) => {
    res.json(server.getStatus());
});

// Start the server on port 5001
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
