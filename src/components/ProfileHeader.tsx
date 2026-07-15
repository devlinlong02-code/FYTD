"use client";

import Avatar from "@/components/Avatar";
import FollowStatsRow from "@/components/FollowStatsRow";

interface ProfileHeaderProps {
  avatar?: string | null;
  displayName: string;
  username: string;
  bio: string;
  location?: string;
  styleTags: string[];
  stats: {
    outfits: number;
    followers: number;
    following: number;
  };
  userId: string;
  isOwnProfile: boolean;
  currentUserId?: string;
  isFollowing?: boolean;
  socialLinks?: {
    instagram_url?: string | null;
    tiktok_url?: string | null;
    website_url?: string | null;
  };
}

export default function ProfileHeader({
  avatar,
  displayName,
  username,
  bio,
  location,
  styleTags,
  stats,
  userId,
  isOwnProfile,
  currentUserId,
  socialLinks,
}: ProfileHeaderProps) {
  return (
    <div className="px-4 pt-6 pb-5 profile-header-section">
      {/* Avatar + name row */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar
          avatarUrl={avatar}
          displayName={displayName}
          size={80}
          className="shrink-0"
        />
        <div className="flex-1 pt-1">
          <h1 className="profile-name leading-tight mb-1">{displayName}</h1>
          <p className="profile-handle mb-2">@{username}</p>
          {location && (
            <p className="profile-location-text flex items-center gap-1">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {location}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && <p className="profile-bio mb-3">{bio}</p>}

      {/* Social links */}
      {(socialLinks?.instagram_url || socialLinks?.tiktok_url || socialLinks?.website_url) && (
        <div className="flex items-center gap-3 mb-3">
          {socialLinks?.instagram_url && (
            <a href={socialLinks.instagram_url} target="_blank" rel="noopener noreferrer" className="profile-social-link flex items-center gap-1.5" aria-label="Instagram">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
              Instagram
            </a>
          )}
          {socialLinks?.tiktok_url && (
            <a href={socialLinks.tiktok_url} target="_blank" rel="noopener noreferrer" className="profile-social-link flex items-center gap-1.5" aria-label="TikTok">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
              </svg>
              TikTok
            </a>
          )}
          {socialLinks?.website_url && (
            <a href={socialLinks.website_url} target="_blank" rel="noopener noreferrer" className="profile-social-link flex items-center gap-1.5" aria-label="Website">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Website
            </a>
          )}
        </div>
      )}

      {/* Style tags */}
      {styleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {styleTags.map((tag) => (
            <span key={tag} className="profile-style-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <FollowStatsRow
        outfits={stats.outfits}
        initialFollowers={stats.followers}
        initialFollowing={stats.following}
        userId={userId}
        isOwnProfile={isOwnProfile}
        currentUserId={currentUserId}
        followerCountOverride={stats.followers}
      />
    </div>
  );
}
