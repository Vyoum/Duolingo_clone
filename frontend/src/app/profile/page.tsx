import { AppShell } from "@/components/layout/AppShell";
import { LiveRewards } from "@/components/learn/LiveRewards";
import {
  FriendSuggestions,
  FriendsSection,
  InviteFriendsCard,
} from "@/components/profile/Friends";
import {
  AvatarCard,
  IdentityRow,
  LinkedInBanner,
  ProfileHeader,
} from "@/components/profile/ProfileTop";
import { PROFILE } from "@/lib/profile-data";

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileHeader />
      <AvatarCard />
      <IdentityRow
        displayName={PROFILE.displayName}
        username={PROFILE.username}
        joined={PROFILE.joined}
        friendsCount={PROFILE.friendsCount}
      />
      <LinkedInBanner />
      <LiveRewards profile />
      <FriendSuggestions suggestions={PROFILE.suggestions} />
      <FriendsSection following={PROFILE.following} />
      <InviteFriendsCard />
    </AppShell>
  );
}
