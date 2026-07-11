import { ConversationType, FriendRequestStatus, GroupRole, RoomCategory, UserRole, UserStatus } from "@nexuschat/shared";
import { connectDB, disconnectDB } from "../config/db";
import { logger } from "../config/logger";
import { BlockedWord, Conversation, FriendRequest, Message, Notification, User } from "../models";

const DEMO_PASSWORD = "Password123";

const demoUsers = [
  { username: "admin", email: "admin@nexuschat.app", role: UserRole.ADMIN, bio: "Platform administrator", country: "United States" },
  { username: "alice", email: "alice@nexuschat.app", bio: "Coffee, code, and cats.", country: "Canada", age: 28, gender: "female" },
  { username: "bob", email: "bob@nexuschat.app", bio: "Gamer & guitarist.", country: "United Kingdom", age: 24, gender: "male" },
  { username: "carol", email: "carol@nexuschat.app", bio: "Travel photographer.", country: "Australia", age: 31, gender: "female" },
  { username: "dave", email: "dave@nexuschat.app", bio: "Full-stack developer.", country: "Germany", age: 27, gender: "male" },
];

const demoRooms = [
  { name: "General Chat", category: RoomCategory.GENERAL, description: "Talk about anything." },
  { name: "Tech Talk", category: RoomCategory.TECHNOLOGY, description: "Latest in tech." },
  { name: "Gaming Lounge", category: RoomCategory.GAMING, description: "LFG and gaming chat." },
  { name: "Music Corner", category: RoomCategory.MUSIC, description: "Share and discover music." },
  { name: "AI & ML", category: RoomCategory.AI, description: "Artificial intelligence discussion." },
  { name: "Programming", category: RoomCategory.PROGRAMMING, description: "Code, frameworks, and bugs." },
];

const blockedWords = ["badword1", "badword2", "slur1"];

async function seed() {
  await connectDB();
  logger.info("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    FriendRequest.deleteMany({}),
    Notification.deleteMany({}),
    BlockedWord.deleteMany({}),
  ]);

  logger.info("Creating users...");
  const users = await User.create(
    demoUsers.map((u) => ({
      ...u,
      password: DEMO_PASSWORD,
      isVerified: true,
      status: UserStatus.OFFLINE,
      languages: ["English"],
      interests: ["Technology", "Music"],
    }))
  );

  const [admin, alice, bob, carol, dave] = users;

  logger.info("Creating friendships...");
  await FriendRequest.create([
    { from: alice._id, to: bob._id, status: FriendRequestStatus.ACCEPTED },
    { from: alice._id, to: carol._id, status: FriendRequestStatus.ACCEPTED },
    { from: dave._id, to: alice._id, status: FriendRequestStatus.PENDING },
  ]);

  logger.info("Creating a private conversation with messages...");
  const privateConvo = await Conversation.create({
    type: ConversationType.PRIVATE,
    participants: [alice._id, bob._id],
  });
  const messages = await Message.create([
    { conversation: privateConvo._id, sender: alice._id, content: "Hey Bob! 👋", seenBy: [alice._id, bob._id], deliveredTo: [alice._id, bob._id] },
    { conversation: privateConvo._id, sender: bob._id, content: "Hey Alice! How's it going?", seenBy: [alice._id, bob._id], deliveredTo: [alice._id, bob._id] },
  ]);
  privateConvo.lastMessage = messages[messages.length - 1]._id;
  privateConvo.lastMessageAt = messages[messages.length - 1].createdAt;
  await privateConvo.save();

  logger.info("Creating a group chat...");
  await Conversation.create({
    type: ConversationType.GROUP,
    name: "Weekend Trip Planning",
    description: "Where are we going this time?",
    createdBy: alice._id,
    participants: [alice._id, bob._id, carol._id],
    members: [
      { user: alice._id, role: GroupRole.OWNER, joinedAt: new Date() },
      { user: bob._id, role: GroupRole.MEMBER, joinedAt: new Date() },
      { user: carol._id, role: GroupRole.MEMBER, joinedAt: new Date() },
    ],
  });

  logger.info("Creating public rooms...");
  await Conversation.create(
    demoRooms.map((r, i) => ({
      type: ConversationType.ROOM,
      name: r.name,
      slug: `${r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-seed`,
      description: r.description,
      category: r.category,
      isPublic: true,
      createdBy: admin._id,
      participants: [admin._id, users[i % users.length]._id],
      members: [{ user: admin._id, role: GroupRole.OWNER, joinedAt: new Date() }],
    }))
  );

  logger.info("Seeding blocked words...");
  await BlockedWord.create(blockedWords.map((word) => ({ word })));

  logger.info("Seed complete. Demo login: alice@nexuschat.app / Password123 (all demo users share this password).");
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
