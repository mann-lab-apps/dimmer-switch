# 📌 백그라운드 푸시 구현 정리 및 캐패시터(Capacitor) 전환 의사 결정

## 1. 최근 대화 및 백그라운드 푸시 구현 요약 (현재 상태)
* **목표**: PWA 앱이 백그라운드 및 종료 상태일 때도 매시간 정각 응원 알림을 신뢰성 있게 수신.
* **아키텍처**:
  * **프론트엔드**: 스위치 조작에 따라 브라우저 Web Push 구독 정보를 서버 백엔드로 동기화.
  * **백엔드**: `/api/push/subscribe`, `unsubscribe`, `send-hourly` 라우트 핸들러 구축.
  * **데이터베이스**: Upstash Redis(서버리스 DB)에 구독 정보를 저장하고, 에러난 구독 정보는 자가 청소.
* **검증**: Vitest 테스트 스위트 통과 완료 (12개 테스트 케이스 100% 통과).

---

## 2. 직면한 문제 및 캐패시터(Capacitor) 전환 이유

### ① Vercel Hobby(무료) 플랜의 Cron 기능 제한
* Vercel 무료 플랜은 **하루 최대 1회(Once per day)**의 크론 스케줄링만 허용합니다.
* 매시간 푸시(`0 * * * *`)를 보낼 경우 빌드/배포 단계에서 제한 오류가 납니다.
* **대안(외부 크론 서비스)**: `cron-job.org`와 같은 외부 서비스를 사용할 수는 있으나 별도 관리 공수가 듭니다.

### ② 푸시 알림의 시간 정밀도 및 비용 이슈
* 알림 앱의 경우 정확한 정각(또는 설정한 특정 시분)에 알림이 와야 하지만, 웹 푸시는 네트워크 상황과 스마트폰 OS의 최적화 정책에 의해 지연(Delay)이 생길 수 있습니다.
* 정확한 1시간 간격을 유지하려면 백엔드 기능이 매 분 단위로 크론 연동을 해야 하는데, 이는 서버리스 연동 횟수 제한과 비용을 급격히 상승시킵니다.

### ③ 캐패시터(Capacitor) 전환을 통한 해결
* **로컬 네이티브 알림(Local Notifications)** 사용:
  * 웹 화면(React/Next.js) 소스를 그대로 쓰되, 스마트폰 OS의 네이티브 알림 매니저와 연동.
  * 스마트폰 OS에 직접 타이머를 등록하여 **인터넷 연결이 필요 없고(오프라인 가능), 1초의 지연도 없이 정확한 시간에 알림을 작동**시킵니다.
  * **서버, DB, 크론 스케줄러가 전혀 필요 없어** 서버 운영비가 `0원`이 됩니다.

---

## 3. 향후 캐패시터 전환 및 설정 가이드

### 1단계: Next.js 정적 내보내기 설정
Capacitor가 정적 웹뷰 소스로 사용하도록 `next.config.ts` 파일에 다음 설정을 활성화해야 합니다:
```typescript
// next.config.ts
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  }
};
```

### 2단계: Capacitor 초기 세팅 및 설치
```bash
# 1. 의존성 패키지 설치
npm install @capacitor/core @capacitor/cli

# 2. 캐패시터 프로젝트 초기화 (out 디렉토리를 웹 빌드 경로로 지정)
npx cap init dimmer-switch com.mannmae.dimmerswitch --web-dir=out

# 3. iOS 플랫폼 추가
npm install @capacitor/ios
npx cap add ios
```

### 3단계: 로컬 알림 플러그인 연동 및 코드 수정
```bash
# 로컬 알림 플러그인 설치
npm install @capacitor/local-notifications
```
* **수정 코드**: [page.tsx](file:///Users/jaemankim/Desktop/privates/coding/dimmer-switch/src/app/page.tsx)에서 기존 `fetch` 및 `setInterval` 코드를 걷어내고 `@capacitor/local-notifications` 모듈의 `schedule` API로 로컬 스케줄을 OS에 직접 예약합니다.

### 4단계: 빌드 및 Xcode 실행 프로세스
```bash
npm run build      # Next.js 정적 빌드 수행 (out/ 생성)
npx cap sync       # 빌드된 정적 소스를 iOS 네이티브 프로젝트에 연동
npx cap open ios    # Xcode를 실행해 기기/시뮬레이터에서 최종 빌드
```
