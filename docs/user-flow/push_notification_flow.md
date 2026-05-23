# User Flow: PWA 웹 푸쉬 / 알림 기능 (U01)

## 🎯 목적
사용자에게 정기적으로 "화이팅 만마에!"라는 응원 로컬 알림을 발송하여 긍정적이고 자신감 넘치는 마인드셋을 가질 수 있도록 유도합니다.
> **타겟 환경 명시**: 본 서비스는 사용자의 주 기기인 **iPhone Xs (iOS)** 환경에 최적화되어 동작해야 합니다. 앱 종료 시 백그라운드 푸시를 위해서는 기기의 "홈 화면에 추가"가 필수적입니다.

## 🔗 관련 요구사항 (RTM 추적)
- **P01**: 홈 화면
- **F01**: 알림 권한 요청 및 상태 표시
- **F02**: 즉시 테스트 알림 발송 ("화이팅 만마에!")
- **F03**: 1시간 주기 응원 알림 스케줄링 (포그라운드/백그라운드 통합)
- **F04**: 백그라운드 푸시 켜기/끄기 스위치 UI 제공
- **F05**: Capacitor Local Notifications 기반 스케줄링 및 권한 제어

## 🔄 사용자 흐름 (Mermaid Diagram)

### 1. 알림 권한 허용 및 스케줄러 흐름 (Flowchart)
```mermaid
flowchart TD
    A["홈 화면 진입"] --> B{"알림 권한 확인"}
    B -- "권한 없음(default)" --> C["알림 권한 허용 버튼 클릭"]
    C --> D["Capacitor 권한 요청 팝업"]
    D -- "허용" --> E["권한 상태 허용 변경"]
    D -- "거부" --> F["권한 상태 거부 표시 및 안내 메시지"]
    B -- "이미 허용됨" --> E
    E --> I["백그라운드 푸시 스위치 UI 노출"]
    I -- "스위치 ON" --> G["Capacitor 스케줄 호출(1시간 주기)"]
    I -- "스위치 OFF" --> J["Capacitor 스케줄 취소 호출"]
    G --> H["OS가 매 주기마다 알림 발생"]
```

### 2. 알림 발송 흐름 (Sequence Diagram)
```mermaid
sequenceDiagram
    participant User as 사용자
    participant App as 앱 (React/Capacitor)
    participant OS as 기기 OS (iOS/Android)
    
    User->>App: 알림 권한 허용
    App->>User: 백그라운드 푸시 스위치 노출
    
    %% 백그라운드 푸시 On
    User->>App: 스위치 ON 토글
    App->>OS: LocalNotifications.schedule() (매 1시간)
    OS-->>App: 스케줄 등록 완료
    App->>User: "백그라운드 알림이 켜졌습니다" 표시

    %% 스케줄 알림 발송
    Note over OS: 1시간 경과 (앱 상태 무관)
    OS->>User: "화이팅 만마에!" 시스템 알림 노출
```

## 📝 BDD 시나리오 참조
구체적인 동작 명세(Given/When/Then)는 다음 파일을 참조하십시오:
- [docs/user-flow/push_notification.feature](file:///Users/jaemankim/Desktop/privates/coding/dimmer-switch/docs/user-flow/push_notification.feature)
