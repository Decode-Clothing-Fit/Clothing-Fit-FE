import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import {
  BODY_TYPE_LABEL,
  GENDERS,
  fallbackImage,
  type Gender,
} from '@/features/auth/constants/avatars';
import type { Character } from '@/features/characters/api';
import { cn } from '@/utils/cn';

type AvatarStepProps = {
  gender: Gender;
  characters: Character[];
  selectedId: string | null;
  isLoading: boolean;
  isError: boolean;
  /** 업로드한 사진 미리보기 uri (있으면 캐릭터 대신 사진을 표시) */
  uploadedUri: string | null;
  isUploading: boolean;
  /** 현재 설정된 내 아바타 이미지 URL. 새로 고르거나 업로드하기 전엔 이걸 미리보기로 보여준다. */
  currentAvatarUrl?: string | null;
  /** 현재 아바타의 성별. 그 성별 탭의 캐릭터 목록 맨 뒤에 '내 아바타' 썸네일을 추가한다. */
  avatarGender?: Gender | null;
  onChangeGender: (next: Gender) => void;
  onSelectId: (id: string) => void;
  /** '내 아바타' 썸네일을 눌렀을 때(현재 아바타 유지로 되돌림) */
  onSelectCurrent?: () => void;
  onPickAlbum: () => void;
  onPickCamera: () => void;
};

export function AvatarStep({
  gender,
  characters,
  selectedId,
  isLoading,
  isError,
  uploadedUri,
  isUploading,
  currentAvatarUrl,
  avatarGender,
  onChangeGender,
  onSelectId,
  onSelectCurrent,
  onPickAlbum,
  onPickCamera,
}: AvatarStepProps) {
  // 사용자가 이 화면에서 명시적으로 고른 캐릭터(없으면 null). 기본값으로 첫 캐릭터를 쓰지 않는다.
  const explicitlySelected = selectedId
    ? (characters.find((c) => c.id === selectedId) ?? null)
    : null;
  const fallbackChar = characters[0];
  // 현재 탭이 내 아바타 성별과 같을 때만 '내 아바타' 썸네일을 맨 뒤에 노출.
  const showCurrentThumb = !!currentAvatarUrl && avatarGender === gender;
  // 캐릭터/사진을 새로 고르지 않았으면 '내 아바타'가 선택된 상태로 본다.
  const currentActive = !explicitlySelected && !uploadedUri;

  return (
    <View className="flex-1 gap-4">
      {/* 성별 토글 */}
      <View className="flex-row self-center rounded-full bg-surface p-1">
        {GENDERS.map((g) => {
          const active = gender === g.value;
          return (
            <Pressable
              key={g.value}
              onPress={() => onChangeGender(g.value)}
              className={cn('rounded-full px-8 py-2', active && 'bg-primary')}
            >
              <Text className={cn('font-sans-medium', active ? 'text-white' : 'text-muted')}>
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 소스 버튼 + 캐릭터 썸네일 */}
      <View className="flex-row gap-3">
        <View className="gap-2">
          <SourceButton
            icon="image-outline"
            label="앨범"
            onPress={onPickAlbum}
            disabled={isUploading}
          />
          <SourceButton
            icon="camera-outline"
            label="사진 촬영"
            onPress={onPickCamera}
            disabled={isUploading}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 pr-2"
        >
          {characters.map((c) => {
            const active = selectedId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => onSelectId(c.id)}
                className={cn(
                  'h-[7.7rem] w-20 overflow-hidden rounded-xl border bg-surface',
                  active ? 'border-primary' : 'border-border',
                )}
              >
                <Image
                  source={c.imageUrl}
                  placeholder={fallbackImage(gender, c.bodyType)}
                  contentFit="contain"
                  transition={0}
                  className="w-full h-full bg-transparent"
                />
                {active && (
                  <View className="absolute right-1 top-1">
                    <Ionicons name="checkmark-circle" size={18} color="#111827" />
                  </View>
                )}
              </Pressable>
            );
          })}

          {/* 내 아바타 썸네일 — 해당 성별 탭의 캐릭터 목록 맨 뒤에 노출 */}
          {showCurrentThumb && (
            <Pressable
              onPress={onSelectCurrent}
              className={cn(
                'h-[7.7rem] w-20 overflow-hidden rounded-xl border bg-surface',
                currentActive ? 'border-primary' : 'border-border',
              )}
            >
              <Image
                source={currentAvatarUrl!}
                contentFit="contain"
                transition={0}
                className="w-full h-full bg-transparent"
              />
              {currentActive && (
                <View className="absolute right-1 top-1">
                  <Ionicons name="checkmark-circle" size={18} color="#111827" />
                </View>
              )}
              <View className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5">
                <Text
                  className="text-center text-[12px] text-white"
                  style={{ includeFontPadding: false, lineHeight: 13 }}
                >
                  내 아바타
                </Text>
              </View>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* 큰 미리보기 / 상태 */}
      <View className="flex-1 rounded-2xl border border-border p-4">
        {isUploading ? (
          <View className="flex-1 items-center justify-center gap-2">
            <ActivityIndicator />
            <Text variant="caption">사진 업로드 중...</Text>
          </View>
        ) : uploadedUri ? (
          <>
            <Text variant="label" className="text-base">
              내 사진
            </Text>
            <Image
              source={uploadedUri}
              contentFit="contain"
              transition={0}
              className="flex-1 w-full bg-transparent"
            />
          </>
        ) : isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center">
            <Text variant="caption">캐릭터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
          </View>
        ) : explicitlySelected ? (
          // 이 화면에서 캐릭터를 새로 고른 경우
          <>
            <Text variant="label" className="text-base">
              {BODY_TYPE_LABEL[explicitlySelected.bodyType]}
            </Text>
            <Image
              source={explicitlySelected.imageUrl}
              placeholder={fallbackImage(gender, explicitlySelected.bodyType)}
              contentFit="contain"
              transition={0}
              className="flex-1 w-full bg-transparent"
            />
          </>
        ) : currentAvatarUrl ? (
          // 새로 고르거나 업로드한 게 없으면 현재 내 아바타를 보여준다
          <>
            <Text variant="label" className="text-base">
              내 아바타
            </Text>
            <Image
              source={currentAvatarUrl}
              contentFit="contain"
              transition={0}
              className="flex-1 w-full bg-transparent"
            />
          </>
        ) : fallbackChar ? (
          <>
            <Text variant="label" className="text-base">
              {BODY_TYPE_LABEL[fallbackChar.bodyType]}
            </Text>
            <Image
              source={fallbackChar.imageUrl}
              placeholder={fallbackImage(gender, fallbackChar.bodyType)}
              contentFit="contain"
              transition={0}
              className="flex-1 w-full bg-transparent"
            />
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text variant="caption">표시할 캐릭터가 없어요.</Text>
          </View>
        )}
      </View>

      <Text variant="caption" className="text-center text-md leading-none">
        업로드된 사진을 기반으로 ai모델을 생성합니다.
      </Text>
    </View>
  );
}

function SourceButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'h-[52px] w-16 items-center justify-center gap-1 rounded-xl bg-surface',
        disabled && 'opacity-50',
      )}
    >
      <Ionicons name={icon} size={20} color="#6a7282" />
      <Text variant="label" className="text-sm leading-none">
        {label}
      </Text>
    </Pressable>
  );
}
