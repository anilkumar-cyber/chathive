import request from "supertest";
import { createApp } from "../src/app";
import { User } from "../src/models";

const app = createApp();

describe("Auth flow", () => {
  const credentials = {
    username: "johndoe",
    email: "john@example.com",
    password: "Password123",
    confirmPassword: "Password123",
  };

  it("registers a new user and does not return the password", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(credentials.email);
  });

  it("rejects duplicate registration", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    const res = await request(app).post("/api/v1/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("rejects mismatched password confirmation", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...credentials, email: "other@example.com", confirmPassword: "Different123" });
    expect(res.status).toBe(400);
  });

  it("logs in a verified user and issues an access token", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    await User.updateOne({ email: credentials.email }, { isVerified: true });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ emailOrUsername: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ emailOrUsername: credentials.email, password: "WrongPassword1" });
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user from /me", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    await User.updateOne({ email: credentials.email }, { isVerified: true });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ emailOrUsername: credentials.email, password: credentials.password });

    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.username).toBe(credentials.username);
  });

  it("rejects /me without a token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
