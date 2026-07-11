import { UserRole, UserStatus } from "@nexuschat/shared";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env, googleAuthEnabled } from "./env";
import { User } from "../models";

if (googleAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: env.GOOGLE_CALLBACK_URL as string,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("Google account has no email"));

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

          if (!user) {
            const baseUsername = (profile.displayName || email.split("@")[0]).replace(/[^a-zA-Z0-9_.]/g, "").slice(0, 20) || "user";
            let username = baseUsername;
            let suffix = 0;
            // eslint-disable-next-line no-await-in-loop
            while (await User.exists({ username })) {
              suffix += 1;
              username = `${baseUsername}${suffix}`;
            }
            user = await User.create({
              username,
              email,
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isVerified: true,
              role: UserRole.USER,
              status: UserStatus.ONLINE,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

export { passport };
