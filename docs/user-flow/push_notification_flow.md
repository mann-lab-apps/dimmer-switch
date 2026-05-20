# User Flow: PWA 웹 푸쉬 / 알림 기능 (U01)

## 🎯 목적
사용자에게 정기적으로 "화이팅 만마에!"라는 응원 로컬 알림을 발송하여 긍정적이고 자신감 넘치는 마인드셋을 가질 수 있도록 유도합니다.
> **타겟 환경 명시**: 본 서비스는 사용자의 주 기기인 **iPhone Xs (iOS)** 환경에 최적화되어 동작해야 합니다. 앱 종료 시 백그라운드 푸시를 위해서는 기기의 "홈 화면에 추가"가 필수적입니다.

## 🔗 관련 요구사항 (RTM 추적)
- **P01**: 홈 화면
- **F01**: 알림 권한 요청 및 상태 표시
- **F02**: 즉시 테스트 알림 발송 ("화이팅 만마에!")
- **F03**: 1시간 주기 응원 알림 스케줄링
- **F04**: 백그라운드 푸시 켜기/끄기 스위치 UI 제공

## 🔄 사용자 흐름 (Mermaid Diagram)

### 1. 알림 권한 허용 및 스케줄러 흐름 (Flowchart)
```mermaid
flowchart TD
    A[홈 화면 진입] --> B{알림 권한 확인}
    B -- 권한 없음 (default/prompted) --> C[알림 권한 허용 버튼 클릭]
    C --> D[브라우저 권한 요청 팝업]
    D -- 허용 --> E[권한 상태 '허용' 변경]
    D -- 거부 --> F[권한 상태 '거부' 표시 및 안내 메시지]
    B -- 이미 허용됨 --> E
    E --> K[포그라운드 1시간 스케줄러 기본 활성화]
    K --> I[백그라운드 푸시 스위치 UI 노출]
    I -- 스위치 ON --> G[백그라운드 스케줄러 활성화]
    I -- 스위치 OFF --> J[백그라운드 스케줄러 비활성화]
    G --> H[앱 종료 시에도 백그라운드에서 알림 발송]
    J --> L[앱 실행 중에만 포그라운드 알림 발송 유지]
```

### 2. 알림 발송 흐름 (Sequence Diagram)
```mermaid
sequenceDiagram
    participant User as 사용자
    participant Front as 프론트엔드 (Next.js)
    participant SW as 서비스 워커 (Service Worker)
    participant OS as 브라우저/OS 알림 시스템
    
    User->>Front: 알림 권한 허용
    Front->>Front: 포그라운드 1시간 스케줄러 등록
    Front->>User: 백그라운드 푸시 스위치 노출
    User->>Front: 스위치 ON 토글
    Front->>SW: 서비스 워커 스케줄러/푸시 구독 등록
    
    alt 포그라운드 상태 (스위치 무관)
        Note over Front: 1시간 간격 발생
        Front->>OS: showNotification("화이팅 만마에!") 호출
        OS->>User: 알림 카드 노출
    else 스위치 ON & 백그라운드 상태
        Note over SW: 푸시 서버로부터 알림 수신
        SW->>SW: push 이벤트 트리거
        SW->>OS: showNotification("화이팅 만마에!") 호출
        OS->>User: 알림 카드 노출 ("화이팅 만마에!")
    end
```

## 📝 BDD 시나리오 참조
구체적인 동작 명세(Given/When/Then)는 다음 파일을 참조하십시오:
- [docs/user-flow/push_notification.feature](file:///Users/gimjaeman/Desktop/coding/mannlab/dimmer-switch/docs/user-flow/push_notification.feature)
