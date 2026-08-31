const CACHE_NAME = 'monthly-budget-v20260901-0838';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json'
];


/* =========================================
   설치
   ========================================= */

self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache => {

          return cache.addAll(
            APP_FILES
          );

        })

    );

    /*
      기존 SW를 기다리지 않고
      바로 새 SW 적용
    */

    self.skipWaiting();
  }
);


/* =========================================
   활성화
   ========================================= */

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(cacheNames => {

          return Promise.all(

            cacheNames
              .filter(
                name =>
                  name !== CACHE_NAME
              )
              .map(
                name =>
                  caches.delete(name)
              )
          );

        })
        .then(() => {

          /*
            현재 열려 있는 PWA에도
            새 SW 즉시 적용
          */

          return self.clients.claim();

        })

    );
  }
);


/* =========================================
   요청 처리
   ========================================= */

self.addEventListener(
  'fetch',
  event => {

    const request =
      event.request;

    /*
      GET 요청만 처리
    */

    if (
      request.method !== 'GET'
    ) {
      return;
    }


    /*
      index.html은
      항상 네트워크 우선

      → HTML 수정사항이 바로 반영됨
    */

    const url =
      new URL(
        request.url
      );

    if (
      url.pathname.endsWith(
        '/index.html'
      ) ||
      url.pathname === '/'
    ) {

      event.respondWith(

        fetch(request)
          .then(response => {

            /*
              새 index.html 저장
            */

            const responseClone =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache => {

                cache.put(
                  request,
                  responseClone
                );

              });

            return response;

          })
          .catch(() => {

            /*
              인터넷/서버가 안 될 경우
              캐시 사용
            */

            return caches.match(
              request
            );

          })

      );

      return;
    }


    /*
      나머지 파일
      캐시 우선
    */

    event.respondWith(

      caches
        .match(request)
        .then(cachedResponse => {

          if (
            cachedResponse
          ) {
            return cachedResponse;
          }

          return fetch(request)
            .then(response => {

              /*
                정상 응답만 캐시
              */

              if (
                response &&
                response.status === 200 &&
                response.type !==
                  'opaque'
              ) {

                const responseClone =
                  response.clone();

                caches
                  .open(
                    CACHE_NAME
                  )
                  .then(cache => {

                    cache.put(
                      request,
                      responseClone
                    );

                  });
              }

              return response;
            });

        })

    );

  }
);
