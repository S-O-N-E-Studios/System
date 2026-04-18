const request = require("supertest");
const app = require("../src/app");

describe("health", () => {
  it("GET /api/v1/health returns ok", async () => {
    const res = await request(app).get("/api/v1/health").expect(200);
    expect(res.body).toEqual({ success: true, status: "ok" });
  });
});

