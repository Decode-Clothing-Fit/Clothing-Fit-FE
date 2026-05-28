import type { MallId } from '../constants/malls';

export type RegionScrapeRect = { x: number; y: number; width: number; height: number };
export type RegionScrapedImage = { src: string; alt: string | null };

export type InjectMessage =
  | {
      type: 'page-info';
      url: string;
      title: string;
      ogTitle: string | null;
      ogImage: string | null;
      ogPrice: string | null;
    }
  | {
      type: 'region-scrape';
      url: string;
      rect: RegionScrapeRect;
      texts: string[];
      images: RegionScrapedImage[];
      html: string;
    }
  | { type: 'region-cancel' }
  | { type: 'inject-error'; message: string };

/** 쇼핑몰별 inject 스크립트 — musinsa.ts, cm29.ts 등 추가 예정. 지금은 공통 page-info만. */
export function getScrapeInjectScript(_mallId: MallId): string {
  return `
    (function() {
      try {
        function meta(prop) {
          var el = document.querySelector('meta[property="' + prop + '"]')
            || document.querySelector('meta[name="' + prop + '"]');
          return el ? el.getAttribute('content') : null;
        }
        var payload = {
          type: 'page-info',
          url: location.href,
          title: document.title || '',
          ogTitle: meta('og:title'),
          ogImage: meta('og:image'),
          ogPrice: meta('product:price:amount') || meta('og:price:amount'),
        };
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'inject-error',
          message: String(e && e.message ? e.message : e),
        }));
      }
    })();
    true;
  `;
}

/**
 * 미리 떠 있는 선택 박스를 화면에 띄우고, 사용자가 박스를 드래그-이동하거나
 * 모서리 핸들로 크기를 조절한 뒤 '가져오기'를 누르면 그 영역과 교차하는
 * DOM에서 텍스트/이미지를 추출해 postMessage 한다.
 */
export function getRegionSelectInjectScript(): string {
  return `
    (function() {
      try {
        var OVERLAY_ID = '__rn_region_overlay__';
        if (document.getElementById(OVERLAY_ID)) return true;

        var vw = window.innerWidth;
        var vh = window.innerHeight;

        var overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = [
          'position:fixed','inset:0','z-index:2147483647',
          'touch-action:none','user-select:none','-webkit-user-select:none'
        ].join(';');

        var boxW = Math.min(vw * 0.7, 320);
        var boxH = Math.min(vh * 0.35, 360);
        var boxX = (vw - boxW) / 2;
        var boxY = (vh - boxH) / 2;

        var box = document.createElement('div');
        box.style.cssText = [
          'position:fixed','z-index:1','border:2px solid #3b82f6',
          'box-shadow:0 0 0 9999px rgba(0,0,0,0.4)',
          'box-sizing:border-box','cursor:move','touch-action:none'
        ].join(';');
        overlay.appendChild(box);

        var hint = document.createElement('div');
        hint.textContent = '박스를 옮기고 크기를 조절한 뒤 가져오기를 누르세요';
        hint.style.cssText = [
          'position:absolute','z-index:2','top:16px','left:50%','transform:translateX(-50%)',
          'background:rgba(0,0,0,0.78)','color:#fff','padding:8px 16px',
          'border-radius:20px','font-size:13px','white-space:nowrap',
          'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
          'pointer-events:none'
        ].join(';');
        overlay.appendChild(hint);

        var cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = [
          'position:absolute','z-index:2','top:12px','right:12px',
          'background:#fff','color:#111','border:0','border-radius:18px',
          'padding:8px 14px','font-size:13px','font-weight:600',
          'font-family:-apple-system,BlinkMacSystemFont,sans-serif'
        ].join(';');
        overlay.appendChild(cancelBtn);

        var captureBtn = document.createElement('button');
        captureBtn.textContent = '가져오기';
        captureBtn.style.cssText = [
          'position:absolute','z-index:2','bottom:24px','left:50%','transform:translateX(-50%)',
          'background:#3b82f6','color:#fff','border:0','border-radius:22px',
          'padding:12px 28px','font-size:15px','font-weight:700',
          'box-shadow:0 4px 12px rgba(0,0,0,0.3)',
          'font-family:-apple-system,BlinkMacSystemFont,sans-serif'
        ].join(';');
        overlay.appendChild(captureBtn);

        function applyBox() {
          box.style.left = boxX + 'px';
          box.style.top = boxY + 'px';
          box.style.width = boxW + 'px';
          box.style.height = boxH + 'px';
        }
        applyBox();

        var handleDefs = [['nw',0,0],['ne',1,0],['sw',0,1],['se',1,1]];
        for (var hi = 0; hi < handleDefs.length; hi++) {
          (function(def) {
            var corner = def[0];
            var h = document.createElement('div');
            h.style.cssText = [
              'position:absolute','width:22px','height:22px',
              'background:#fff','border:2px solid #3b82f6','border-radius:50%',
              'box-sizing:border-box','touch-action:none',
              'cursor:' + ((corner === 'nw' || corner === 'se') ? 'nwse-resize' : 'nesw-resize')
            ].join(';');
            h.style.left = def[1] ? 'calc(100% - 11px)' : '-11px';
            h.style.top = def[2] ? 'calc(100% - 11px)' : '-11px';
            h.addEventListener('mousedown', onHandleDown(corner));
            h.addEventListener('touchstart', onHandleDown(corner), { passive: false });
            box.appendChild(h);
          })(handleDefs[hi]);
        }

        document.body.appendChild(overlay);

        var mode = null;
        var resizeCorner = null;
        var startPointer = null;
        var startBox = null;

        function getPoint(e) {
          var t = (e.touches && e.touches[0])
            || (e.changedTouches && e.changedTouches[0])
            || e;
          return { x: t.clientX, y: t.clientY };
        }

        function intersects(a, b) {
          return !(a.right < b.x || a.left > b.x + b.width
            || a.bottom < b.y || a.top > b.y + b.height);
        }

        function cleanup() {
          var node = document.getElementById(OVERLAY_ID);
          if (node && node.parentNode) node.parentNode.removeChild(node);
        }

        function onBoxDown(e) {
          if (e.cancelable) e.preventDefault();
          mode = 'move';
          startPointer = getPoint(e);
          startBox = { x: boxX, y: boxY, w: boxW, h: boxH };
        }

        function onHandleDown(corner) {
          return function(e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            mode = 'resize';
            resizeCorner = corner;
            startPointer = getPoint(e);
            startBox = { x: boxX, y: boxY, w: boxW, h: boxH };
          };
        }

        function onMove(e) {
          if (!mode) return;
          if (e.cancelable) e.preventDefault();
          var p = getPoint(e);
          var dx = p.x - startPointer.x;
          var dy = p.y - startPointer.y;
          if (mode === 'move') {
            boxX = Math.max(0, Math.min(startBox.x + dx, vw - boxW));
            boxY = Math.max(0, Math.min(startBox.y + dy, vh - boxH));
          } else {
            var MIN = 40;
            var nx = startBox.x, ny = startBox.y, nw = startBox.w, nh = startBox.h;
            if (resizeCorner.indexOf('e') >= 0) nw = Math.max(MIN, startBox.w + dx);
            if (resizeCorner.indexOf('s') >= 0) nh = Math.max(MIN, startBox.h + dy);
            if (resizeCorner.indexOf('w') >= 0) { nw = Math.max(MIN, startBox.w - dx); nx = startBox.x + startBox.w - nw; }
            if (resizeCorner.indexOf('n') >= 0) { nh = Math.max(MIN, startBox.h - dy); ny = startBox.y + startBox.h - nh; }
            boxX = nx; boxY = ny; boxW = nw; boxH = nh;
          }
          applyBox();
        }

        function onUp() {
          mode = null;
          resizeCorner = null;
        }

        function doCapture() {
          var b = box.getBoundingClientRect();
          var rect = { x: b.left, y: b.top, width: b.width, height: b.height };
          if (rect.width < 8 || rect.height < 8) return;

          overlay.style.display = 'none';

          var scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
          var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

          var texts = [];
          var images = [];
          var seenText = Object.create(null);
          var seenImg = Object.create(null);

          var imgEls = document.querySelectorAll('img');
          for (var i = 0; i < imgEls.length && images.length < 30; i++) {
            var r = imgEls[i].getBoundingClientRect();
            if (!intersects(r, rect)) continue;
            var src = imgEls[i].currentSrc || imgEls[i].src || '';
            if (!src || seenImg[src]) continue;
            seenImg[src] = 1;
            images.push({ src: src, alt: imgEls[i].getAttribute('alt') });
          }

          var textEls = document.querySelectorAll(
            'h1,h2,h3,h4,h5,p,span,a,strong,em,li,dd,dt,button,label,div'
          );
          for (var j = 0; j < textEls.length && texts.length < 50; j++) {
            var el = textEls[j];
            if (el.children && el.children.length > 0) continue;
            var rr = el.getBoundingClientRect();
            if (!intersects(rr, rect)) continue;
            var t = (el.textContent || '').replace(/\\s+/g, ' ').trim();
            if (!t || t.length > 200 || seenText[t]) continue;
            seenText[t] = 1;
            texts.push(t);
          }

          var html = '';
          var cx = rect.x + rect.width / 2;
          var cy = rect.y + rect.height / 2;
          var pierced = document.elementsFromPoint
            ? document.elementsFromPoint(cx, cy)
            : [document.elementFromPoint(cx, cy)];
          for (var k = 0; k < pierced.length; k++) {
            var node = pierced[k];
            if (!node) continue;
            var nr = node.getBoundingClientRect();
            if (nr.left >= rect.x - 2 && nr.top >= rect.y - 2
                && nr.right <= rect.x + rect.width + 2
                && nr.bottom <= rect.y + rect.height + 2) {
              html = node.outerHTML || '';
              break;
            }
          }
          if (html.length > 5000) html = html.slice(0, 5000);

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'region-scrape',
            url: location.href,
            rect: {
              x: rect.x + scrollX,
              y: rect.y + scrollY,
              width: rect.width,
              height: rect.height,
            },
            texts: texts,
            images: images,
            html: html,
          }));

          cleanup();
        }

        function cancel(e) {
          if (e) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'region-cancel' }));
          cleanup();
        }

        var finished = false;
        function onceCapture(e) {
          if (finished) return;
          finished = true;
          if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); }
          doCapture();
        }

        cancelBtn.addEventListener('click', cancel);
        cancelBtn.addEventListener('touchend', cancel);
        captureBtn.addEventListener('click', onceCapture);
        captureBtn.addEventListener('touchend', onceCapture);

        box.addEventListener('mousedown', onBoxDown);
        box.addEventListener('touchstart', onBoxDown, { passive: false });
        overlay.addEventListener('mousemove', onMove);
        overlay.addEventListener('mouseup', onUp);
        overlay.addEventListener('touchmove', onMove, { passive: false });
        overlay.addEventListener('touchend', onUp);
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'inject-error',
          message: String(e && e.message ? e.message : e),
        }));
      }
      return true;
    })();
    true;
  `;
}
