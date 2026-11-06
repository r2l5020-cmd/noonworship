# 정오의 찬양 · 추억의 디모데홀

일곱 친구가 자기 캐릭터로 입장해 움직이고, 표정을 바꾸고, 대화하고, 작은 악기를 연주하는 웹 합주실입니다.

방 안에는 접속한 캐릭터만 불투명하게 표시하고, 미접속 멤버는 왼쪽 목록에 표시합니다. 피아노·기타·벨·드럼은 각각 다른 방식으로 소리를 합성합니다.

화면은 **GitHub Pages**, 방의 상태와 실시간 통신은 **Supabase**가 담당합니다. 공개 사이트는 https://r2l5020-cmd.github.io/noonworship/ 입니다. `docs/site-config.js`의 공개 연결 설정과 게스트 입장, 비공개 Realtime 채널이 연결되어 있습니다. 입장에는 별도로 전달받은 초대코드가 필요합니다.

## 게시

이 저장소에는 완성된 화면 파일이 `docs/`에 포함되어 있습니다. GitHub 저장소의 **Settings → Pages → Deploy from a branch → main /docs → Save**로 게시할 수 있습니다. 별도의 빌드 서버가 필요하지 않습니다.

## 실시간 합주실 연결

1. Supabase의 무료 프로젝트를 하나 준비합니다. 이 앱 전용 프로젝트를 권장합니다.
2. 프로젝트 SQL Editor에서 `supabase/001_studio.sql`을 한 번 실행합니다. 이미 적용된 SQL을 다시 실행하지 마세요.
3. Auth에서 Anonymous sign-ins를 켭니다. 새 사용자 생성에 대한 속도 제한과 CAPTCHA 설정도 운영 상황에 맞게 검토합니다.
4. SQL Editor에서 다음을 실행합니다. **아래 코드는 공개 저장소에 실제 초대코드를 넣지 말고 SQL Editor에서만 수정해 실행하세요.**

```sql
insert into public.studio_rooms(name,invite_hash)
values ('일곱의 합주실', extensions.crypt('여기에-길고-무작위인-12자-이상의-초대코드',extensions.gen_salt('bf',10)));
```

5. Realtime 설정에서 private channels를 사용하도록 Allow public access를 끕니다. 이 마이그레이션은 `realtime.messages`에 SELECT 정책만 추가하며, 기존 테이블 자체의 소유권이나 설정은 바꾸지 않습니다.
6. 프로젝트의 URL과 `sb_publishable_...` 키만 `docs/site-config.js`에 입력합니다. `sb_secret`, service role 키, 비밀번호와 초대코드는 절대 저장소에 넣지 마세요.
7. 웹사이트에서 초대코드를 입력하고 서로 다른 브라우저 창에서 다른 캐릭터로 입장합니다. 채팅·표정·이동·합주 상태가 전달되는지 확인합니다.
8. 입장 후 ‘방 링크 복사’를 누르면 초대코드가 URL fragment에 포함됩니다. 초대 링크는 멤버들에게만 공유합니다. 링크를 가진 사람은 입장할 수 있으므로 멤버 본인임을 증명하는 인증 수단은 아닙니다.

## 동작

- Supabase 게스트 인증과 서버 측 방 가입 확인을 사용합니다.
- 캐릭터 소유권은 서버에서 원자적으로 확보하며, 브라우저별 세션 ID도 확인합니다.
- 회원·채팅·위치 테이블에 브라우저가 직접 쓰는 권한은 없습니다. 허용된 RPC만 사용합니다.
- Realtime private channel은 방 구성원만 수신하며, 화면 상태 이벤트는 서버가 작성합니다.
- 마지막 80개 메시지를 표시하고 방별 최대 300개를 보존합니다.
- 이동은 끝 위치를 놓치지 않도록 마지막 요청을 모아 전송합니다.
- 일정 시간 통신이 없는 캐릭터는 접속 목록에서 사라집니다. 웹 브라우저의 백그라운드 제한으로 접속이 끊어질 수 있습니다.
- 합주는 공통 시작 시각을 기준으로 각 브라우저가 반주를 재생합니다. 악기 입력은 네트워크 지연이 있으며, 마이크 음성 합주 기능은 없습니다.

## 개발

Node.js를 설치한 뒤 `npm install`, `npm run check`, `npm run build`를 실행합니다. `src/`가 원본이며 빌드 결과는 `docs/app.js`, `docs/app.css`입니다. Supabase JS 2.107.0은 고정된 CDN URL로 불러옵니다.

공식 문서:
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://supabase.com/docs/guides/realtime/authorization
- https://supabase.com/docs/guides/realtime/broadcast
- https://supabase.com/docs/guides/auth/auth-anonymous

무료 한도와 휴면 정책은 각 서비스의 최신 요금 안내를 확인하세요. 유료 요금제로 자동 전환하는 로직은 없습니다.

## 검증 범위

타입 검사와 이벤트 중복 처리·순서·재연결 버퍼·이동 전송 테스트를 통과했습니다. 2026-11-06 공개 사이트의 두 브라우저 탭에서 다른 캐릭터로 입장해 양방향 채팅, 위치·표정 동기화, 합주 시작과 악기 이벤트 수신을 확인했습니다. 실제 소리 출력과 서로 다른 물리적 기기에서의 지연 시간은 별도 확인이 필요합니다. 서버에서는 다른 세션의 캐릭터 조작, 다른 방 조회, 잘못된 초대코드를 거부하는지 검증했습니다.
