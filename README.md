# Dimmer Switch (긍정전환 유도 PWA)

마음이 지칠 때 빛을 켜듯 긍정을 켭니다. 매 시간 당신에게 따뜻한 응원을 전송하는 PWA 프로젝트입니다.

## 핵심 기능 (Features)
- **포그라운드 응원 알림**: 앱이 켜져 있을 때 1시간 주기로 응원 메시지 발송
- **백그라운드 푸시 알림**: 브라우저/앱이 꺼져 있어도 웹 푸시(Service Worker)를 통해 응원 메시지 수신
- **PWA 환경 지원**: 모바일(iPhone Xs 등) 홈 화면 추가 시 네이티브 앱처럼 동작

## 백그라운드 푸시 로컬 테스트 방법
1. `npm run dev` 로 로컬 서버 실행 후 `http://localhost:3000` 접속
2. 브라우저 개발자 도구(Console) 오픈
3. 화면의 "백그라운드 푸시" 스위치를 **On**으로 클릭
4. 콘솔에 출력된 `subscription` JSON 객체를 전체 복사
5. `scripts/send_push.js` 파일 내부의 `pushSubscription` 변수에 복사한 JSON 붙여넣기
6. **(중요)** 브라우저 탭을 완전히 종료
7. 터미널에서 `node scripts/send_push.js` 실행 시 OS 기본 알림 도착!

## 기술 스택
- **프레임워크**: Next.js (React)
- **핵심 기술**: PWA (Service Worker), Web Push API (VAPID)
- **테스트 (BDD-TDD)**: Vitest, Testing Library
