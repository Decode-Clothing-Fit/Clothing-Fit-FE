import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

import { ScreenShell } from '@/components/blocks/screen-shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CATEGORIES } from '@/features/webview/constants/categories';
import { MALLS } from '@/features/webview/constants/malls';
import { useCopySession } from '@/features/webview/hooks/use-copy-session';
import {
  getRegionSelectInjectScript,
  getScrapeInjectScript,
  type InjectMessage,
} from '@/features/webview/inject';

export function ExploreBrowserScreen() {
  const { session, selectCategory, clearCategory, resetSession } = useCopySession('29cm');

  const mall = MALLS.find((m) => m.id === session.mallId) ?? MALLS[0];

  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState(mall.homeUrl);
  const [pageTitle, setPageTitle] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [lastScrape, setLastScrape] = useState<{ texts: number; images: number } | null>(null);

  const injectedJavaScript = useMemo(() => getScrapeInjectScript(mall.id), [mall.id]);

  const startRegionSelect = () => {
    setSelecting(true);
    webViewRef.current?.injectJavaScript(getRegionSelectInjectScript());
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg: InjectMessage = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'page-info') {
        setCurrentUrl(msg.url);
        setPageTitle(msg.title);
        if (__DEV__) console.log('[WebView page-info]', msg);
      } else if (msg.type === 'region-scrape') {
        setSelecting(false);
        setLastScrape({ texts: msg.texts.length, images: msg.images.length });
        if (__DEV__) console.log('[WebView region-scrape]', msg);
      } else if (msg.type === 'region-cancel') {
        setSelecting(false);
        if (__DEV__) console.log('[WebView region-cancel]');
      } else if (msg.type === 'inject-error') {
        setSelecting(false);
        if (__DEV__) console.warn('[WebView inject-error]', msg.message);
      }
    } catch (e) {
      if (__DEV__) console.warn('[WebView onMessage parse failed]', e);
    }
  };

  const handleNavigationStateChange = (nav: WebViewNavigation) => {
    setCurrentUrl(nav.url);
    if (nav.title) setPageTitle(nav.title);
  };

  return (
    <ScreenShell title="WebView COPY" showBack>
      <View className="flex-row px-2 py-2 gap-2 border-b border-border">
        {MALLS.map((m) => (
          <Pressable
            key={m.id}
            className={`px-3 py-2 rounded-full ${session.mallId === m.id ? 'bg-primary' : 'bg-surface'}`}
            onPress={() => resetSession(m.id)}
          >
            <Text className={session.mallId === m.id ? 'text-white text-xs' : 'text-xs'}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="px-3 py-2 border-b border-border">
        <Text variant="caption" numberOfLines={1}>
          {currentUrl}
        </Text>
        {pageTitle ? (
          <Text variant="caption" numberOfLines={1} className="text-muted">
            {pageTitle}
          </Text>
        ) : null}
        {lastScrape ? (
          <Text variant="caption" numberOfLines={1} className="text-primary">
            스크랩 완료 · 텍스트 {lastScrape.texts}개 · 이미지 {lastScrape.images}개
          </Text>
        ) : null}
      </View>

      <View className="flex-1 flex-row">
        <View className="flex-1 m-2 rounded-xl overflow-hidden bg-gray-100">
          <WebView
            key={mall.id}
            ref={webViewRef}
            source={{ uri: mall.homeUrl }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            injectedJavaScript={injectedJavaScript}
            onMessage={handleMessage}
            onNavigationStateChange={handleNavigationStateChange}
            allowsBackForwardNavigationGestures
            startInLoadingState
          />
        </View>

        {session.sidebarVisible && (
          <View className="w-14 bg-gray-900 py-3 items-center gap-3">
            {CATEGORIES.map((cat) => {
              const done = session.slots[cat.id].status === 'done';
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => (done ? clearCategory(cat.id) : selectCategory(cat.id))}
                  className={`items-center ${session.activeCategory === cat.id ? 'opacity-100' : 'opacity-70'}`}
                >
                  <View
                    className={`w-10 h-10 rounded-lg border-2 items-center justify-center ${done ? 'border-green-400' : 'border-white'}`}
                  >
                    <Text className="text-white text-[10px] font-sans-medium">{cat.label[0]}</Text>
                  </View>
                  {done && <Text className="text-green-400 text-[8px]">✓</Text>}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-2 p-3 border-t border-border bg-white">
        <Button
          label={selecting ? '영역 선택 중…' : 'COPY'}
          className="flex-1"
          disabled={selecting}
          onPress={startRegionSelect}
        />
        <Button
          label="SAVE"
          variant="secondary"
          className="flex-1"
          onPress={() => router.push('/(tabs)/fitting/confirm')}
        />
        <Button label="취소" variant="ghost" className="px-3" onPress={() => resetSession()} />
      </View>
    </ScreenShell>
  );
}
