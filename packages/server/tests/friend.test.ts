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

describe("Friend system", () => {
  it("completes send -> accept -> list friends flow", async () => {
    const alice = await createVerifiedUser("alicef", "alicef@example.com");
    const bob = await createVerifiedUser("bobf", "bobf@example.com");

    const sendRes = await request(app)
      .post(`/api/v1/friends/requests/${bob.user._id}`)
      .set("Authorization", `Bearer ${alice.token}`);
    expect(sendRes.status).toBe(201);

    const pendingRes = await request(app)
      .get("/api/v1/friends/requests")
      .set("Authorization", `Bearer ${bob.token}`);
    expect(pendingRes.body.data.incoming).toHaveLength(1);

    const requestId = pendingRes.body.data.incoming[0]._id;
    const acceptRes = await request(app)
      .post(`/api/v1/friends/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${bob.token}`);
    expect(acceptRes.status).toBe(200);

    const friendsRes = await request(app).get("/api/v1/friends").set("Authorization", `Bearer ${alice.token}`);
    expect(friendsRes.body.data).toHaveLength(1);
  });

  it("prevents sending a duplicate pending request", async () => {
    const alice = await createVerifiedUser("aliceg", "aliceg@example.com");
    const bob = await createVerifiedUser("bobg", "bobg@example.com");

    await request(app).post(`/api/v1/friends/requests/${bob.user._id}`).set("Authorization", `Bearer ${alice.token}`);
    const dupe = await request(app).post(`/api/v1/friends/requests/${bob.user._id}`).set("Authorization", `Bearer ${alice.token}`);
    expect(dupe.status).toBe(409);
  });
});
