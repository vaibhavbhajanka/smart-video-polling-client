const axios = require("axios");

class StatusFetcher {
    constructor(url) {
        this.url = url; // URL endpoint for the translation status API
    }

    async fetchStatus() {
        try {
            // Make an HTTP GET request to fetch the status of the translation job
            const response = await axios.get(this.url);
            // Expected response should include { status, progress, expectedTime }
            return response.data;
        } catch (error) {
            console.error("Error fetching status:", error.message);
            // Return default error status in case of a failure
            return { status: "error", progress: 0, expectedTime: 0 };
        }
    }
}

class AdaptivePollingStrategy {
    constructor(transitionProgress = 60) {
        this.transitionProgress = transitionProgress; // The progress percentage to switch from backoff to decay strategy
    }

    getInterval(attempt, progress, expectedTime) {
        // Adjust maxInterval and baseInterval dynamically based on the expected time
        const dynamicMaxInterval = expectedTime / 3.5; // Dynamic max interval for polling based on expected completion time
        const dynamicBaseInterval = expectedTime / 30;  // Dynamic base interval for polling based on expected completion time

        if (progress < this.transitionProgress) {
            // Exponential Backoff Phase - Increase polling interval exponentially during early progress
            const backoffInterval = Math.min(dynamicBaseInterval * (2 ** attempt), dynamicMaxInterval);
            return backoffInterval;
        } else {
            // Progress-Based Linear Decay Phase - Reduce polling interval as progress nears completion
            const progressFactor = (progress - this.transitionProgress) / (100 - this.transitionProgress); // Normalize progress between 0 and 1
            // Apply a more aggressive decay factor to make polling faster towards the end
            const decayInterval = dynamicBaseInterval + (dynamicMaxInterval - dynamicBaseInterval) * Math.exp(-progressFactor * 2.5);
            return Math.max(dynamicBaseInterval, Math.min(decayInterval, dynamicMaxInterval));
        }
    }
}

class StatusChecker {
    constructor(fetcher, strategy) {
        this.fetcher = fetcher;   // Instance of StatusFetcher to get translation status
        this.strategy = strategy; // Instance of AdaptivePollingStrategy to determine polling intervals
    }

    async checkStatus() {
        let attempt = 0;
        while (true) {
            // Fetch the current status, progress, and expected time of the translation job
            const { status, progress, expectedTime } = await this.fetcher.fetchStatus();
            console.log(`Attempt ${attempt + 1}: Status - ${status}, Progress - ${progress}%, Expected Time - ${expectedTime}ms`);

            if (status === "completed" || status === "error") {
                // Stop polling if the status is either "completed" or "error"
                return status;
            }

            // Calculate the polling interval considering the current attempt, progress, and expected time
            const interval = this.strategy.getInterval(attempt, progress, expectedTime);
            console.log(`Waiting for ${interval / 1000} seconds before retrying...`);
            // Wait for the calculated interval before retrying
            await new Promise((resolve) => setTimeout(resolve, interval));
            attempt++;
        }
    }
}

module.exports = {
    StatusFetcher,
    AdaptivePollingStrategy,
    StatusChecker,
};
