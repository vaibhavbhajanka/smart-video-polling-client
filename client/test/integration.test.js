const { spawn } = require("child_process");
const path = require("path");

const {
    StatusFetcher,
    AdaptivePollingStrategy,
    StatusChecker,
} = require("../src/translationClient");

let serverProcess;

beforeAll((done) => {
    // Start the server process before running tests
    const serverPath = path.join(__dirname, "../../server/server.js");
    serverProcess = spawn("node", [serverPath]);

    // Wait for server to be ready before starting tests
    serverProcess.stdout.on("data", (data) => {
        if (data.toString().includes("Server running")) {
            done();
        }
    });

    // Log any server errors during startup
    serverProcess.stderr.on("data", (data) => {
        console.error(`Server error: ${data}`);
    });
}, 10000); // Timeout after 10 seconds if server does not start

afterAll(() => {
    // Terminate the server process after tests are complete
    serverProcess.kill();
});

test("Client library should fetch the final status correctly", async () => {
    // Create instances of the fetcher, strategy, and checker
    const fetcher = new StatusFetcher("http://localhost:5001/status");
    const strategy = new AdaptivePollingStrategy();
    const checker = new StatusChecker(fetcher, strategy);

    // Use the StatusChecker to get the final status of the translation job
    const finalStatus = await checker.checkStatus();

    // Expect the final status to be one of the possible outcomes
    expect(["completed", "error", "pending"]).toContain(finalStatus);
    console.log(`Integration Test Final Status: ${finalStatus}`);
}, 3600000); // Allow up to 1 hour for the test to complete if necessary