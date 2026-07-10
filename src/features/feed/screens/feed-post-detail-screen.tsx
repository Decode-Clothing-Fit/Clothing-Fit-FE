import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { ImageModal } from '@/components/ui/image-modal';

import { useGetPostsId } from '@/api/generated/endpoints/posts/posts';
import { GetPostByIdResponse } from '@/api/generated/schemas';
import { ScreenShell } from '@/components/blocks/screen-shell';
import { BookmarkIcon } from '@/components/ui/bookmark-icon';
import { Divider } from '@/components/ui/divider';
import { HeartIcon } from '@/components/ui/heart-icon';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { ClosetViewer3D } from '@/features/closet/components/closet-viewer-3d';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { getUserId } from '@/lib/auth-storage';
import { formatDate } from '@/lib/format';
import { ClothInfo } from '../components/cloth-info';
import { FollowButton } from '../components/follow-button';
import { OtherPosts } from '../components/other-posts';
import { usePostBookmark } from '../hooks/use-post-bookmark';
import { usePostLike } from '../hooks/use-post-like';
import { useUserFollow } from '../hooks/use-user-follow';

function FeedPostDetailContent({
  post,
  refetch,
  isRefetching,
}: {
  post: GetPostByIdResponse;
  refetch: () => void;
  isRefetching: boolean;
}) {
  const userId = post.user.id;
  const [imageVisible, setImageVisible] = useState(false);
  const [is3d, setIs3d] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null | undefined>(undefined);
  const has3d = !!post.model3dUrl;

  useEffect(() => {
    getUserId().then(setMyUserId);
  }, []);

  const isMe = !!myUserId && myUserId === userId;

  const { isFollowing, toggle: toggleFollow } = useUserFollow({
    userId,
    isFollowing: post.user.isFollowing,
  });

  const {
    isLiked,
    likeCount,
    toggle: toggleLike,
  } = usePostLike({
    id: post.id,
    isLiked: post.isLiked,
    likeCount: post.likeCount,
  });

  const { isBookmarked, toggle: toggleBookmark } = usePostBookmark({
    id: post.id,
    isBookmarked: post.isBookmarked,
  });
  return (
    <ScreenShell title={post.title} edges={['top', 'bottom']}>
      <ImageModal
        uri={post.image2dUrl}
        visible={imageVisible}
        onClose={() => setImageVisible(false)}
      />
      <ScrollView
        className="flex-1"
        scrollEnabled={scrollEnabled}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} enabled={!is3d} />
        }
      >
        <ProfileHeader
          nickname={post.user.nickname ?? ''}
          imageUrl={post.user.imageUrl}
          action={
            myUserId !== undefined && !isMe ? (
              <FollowButton isFollowing={isFollowing} onPress={toggleFollow} />
            ) : undefined
          }
          imgSize="md"
          onPress={() => router.push({ pathname: '/user/[userId]', params: { userId } })}
        >
          {(post.user.height != null || post.user.weight != null) && (
            <Text variant="caption" className="text-md leading-normal mt-[-0.3rem]">
              {[
                post.user.height != null ? `${post.user.height}cm` : null,
                post.user.weight != null ? `${post.user.weight}kg` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
        </ProfileHeader>
        {is3d && has3d ? (
          <View style={{ height: 500 }}>
            <ClosetViewer3D
              modelUrl={post.model3dUrl!}
              onScrollLock={(locked) => setScrollEnabled(!locked)}
            />
          </View>
        ) : (
          <Pressable onPress={() => setImageVisible(true)} className="bg-[#ECECEB]">
            <Image source={{ uri: post.image2dUrl }} style={{ height: 500 }} resizeMode="contain" />
          </Pressable>
        )}

        <View className="flex-row justify-between px-4 py-2 gap-4 items-center">
          <Text>{formatDate(post.createdAt)}</Text>
          <View className="flex-row gap-4 items-center">
            {has3d && (
              <Toggle labelLeft="2D" labelRight="3D" value={is3d} onValueChange={setIs3d} />
            )}
            <HeartIcon
              isLiked={isLiked}
              onPress={toggleLike}
              iconSize={26}
              color="#111827"
              count={likeCount}
            />
            <BookmarkIcon
              isBookmarked={isBookmarked}
              size={24}
              color="#111827"
              onPress={toggleBookmark}
            />
          </View>
        </View>
        <Divider className="bg-surface" />
        <Text variant="subtitle" className="px-4 mt-4 mb-3">
          착용 제품
        </Text>
        {post.items.map((item, index) => (
          <ClothInfo key={index} item={item} />
        ))}
        <Divider className="mt-4 bg-surface" />
        <View className="px-4 pt-4 pb-3 flex-row">
          <Text className="font-sans-bold text-xl">{post.user.nickname ?? ''}</Text>
          <Text className="font-sans-medium text-muted text-xl">님의 다른 스타일</Text>
        </View>

        <View className="pb-3">
          <OtherPosts posts={post.otherPosts} />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

export function FeedPostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { data, isLoading, isError, refetch, isRefetching } = useGetPostsId(postId, {
    query: { enabled: !!postId },
  });

  if (isLoading) {
    return (
      <ScreenShell title="게시물" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </ScreenShell>
    );
  }

  if (isError || !data) {
    return (
      <ScreenShell title="게시물" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center gap-2">
          <Ionicons name="alert-circle-outline" size={48} color="#888" />
          <Text variant="caption">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</Text>
        </View>
      </ScreenShell>
    );
  }

  return <FeedPostDetailContent post={data} refetch={refetch} isRefetching={isRefetching} />;
}
