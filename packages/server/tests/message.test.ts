import request from "supertest";
import { createApp } from "../src/app";
import { User } from "../src/models";

const app = createApp();

async function createVerifiedUser(username: string, email: string) {
  await request(app).post("/api/v1/auth/register").send({
    username,
    email,
    password: "Password123",
    confirmPassword: "Password123",
  });
  await User.updateOne({ email }, { isVerified: true });
  const loginRes = await request(app).post("/api/v1/auth/login").send({ emailOrUsername: email, password: "Password123" });
  return { token: loginRes.body.data.accessToken as string, user: loginRes.body.data.user };
}

describe("Messaging", () => {
  it("creates a private conversation and exchanges messages", async () => {
    const alice = await createVerifiedUser("alice", "alice@example.com");
    const bob = await createVerifiedUser("bob", "bob@example.com");

    const convoRes = await request(app)
      .post(`/api/v1/conversations/private/${bob.user._id}`)
      .set("Authorization", `Bearer ${alice.token}`);
    expect(convoRes.status).toBe(201);
    const conversationId = convoRes.body.data._id;

    const sendRes = await request(app)
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ content: "Hello Bob!" });
    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.content).toBe("Hello Bob!");

    const historyRes = await request(app)
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${bob.token}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data).toHaveLength(1);
  });

  it("blocks a non-participant from reading messages", async () => {
    const alice = await createVerifiedUser("alice2", "alice2@example.com");
    const bob = await createVerifiedUser("bob2", "bob2@example.com");
    const carol = await createVerifiedUser("carol2", "carol2@example.com");

    const convoRes = await request(app)
      .post(`/api/v1/conversations/private/${bob.user._id}`)
      .set("Authorization", `Bearer ${alice.token}`);
    const conversationId = convoRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${carol.token}`);
    expect(res.status).toBe(403);
  });

  it("allows editing only your own message", async () => {
    const alice = await createVerifiedUser("alice3", "alice3@example.com");
    const bob = await createVerifiedUser("bob3", "bob3@example.com");

    const convoRes = await request(app)
      .post(`/api/v1/conversations/private/${bob.user._id}`)
      .set("Authorization", `Bearer ${alice.token}`);
    const conversationId = convoRes.body.data._id;

    const sendRes = await request(app)
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ content: "Original" });
    const messageId = sendRes.body.data._id;

    const forbidden = await request(app)
      .patch(`/api/v1/messages/${messageId}`)
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ content: "Hacked" });
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .patch(`/api/v1/messages/${messageId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ content: "Edited" });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.isEdited).toBe(true);
  });
});
