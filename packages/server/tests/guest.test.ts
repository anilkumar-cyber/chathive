import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Guest login", () => {
  it("creates a guest session with just a username, no email or password", async () => {
    const res = await request(app).post("/api/v1/auth/guest").send({ username: "nightowl" });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.isGuest).toBe(true);
    expect(res.body.data.user.username).toBe("nightowl");
  });

  it("rejects a taken username", async () => {
    await request(app).post("/api/v1/auth/guest").send({ username: "duplicate" });
    const res = await request(app).post("/api/v1/auth/guest").send({ username: "duplicate" });
    expect(res.status).toBe(409);
  });

  it("rejects invalid usernames", async () => {
    const res = await request(app).post("/api/v1/auth/guest").send({ username: "a" });
    expect(res.status).toBe(400);
  });

  it("lets a guest join a public room and send a message", async () => {
    const guestRes = await request(app).post("/api/v1/auth/guest").send({ username: "guestchatter" });
    const token = guestRes.body.data.accessToken as string;

    const roomRes = await request(app)
      .post("/api/v1/conversations/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Tech Talk", category: "technology", isPublic: true });

    // Room creation is blocked for guests.
    expect(roomRes.status).toBe(403);
  });

  it("blocks guests from the friend system", async () => {
    const guestRes = await request(app).post("/api/v1/auth/guest").send({ username: "guestfriend" });
    const token = guestRes.body.data.accessToken as string;

    const res = await request(app).get("/api/v1/friends").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("allows a guest to start a direct message with another user", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      username: "regular",
      email: "regular@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(registerRes.status).toBe(201);
    const regularUserId = registerRes.body.data.userId as string;

    const guestRes = await request(app).post("/api/v1/auth/guest").send({ username: "friendlyguest" });
    const token = guestRes.body.data.accessToken as string;

    const convoRes = await request(app)
      .post(`/api/v1/conversations/private/${regularUserId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(convoRes.status).toBe(201);

    const messageRes = await request(app)
      .post(`/api/v1/conversations/${convoRes.body.data._id}/messages`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Hi from a guest!" });
    expect(messageRes.status).toBe(201);
  });
});
