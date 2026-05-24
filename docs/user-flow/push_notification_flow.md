# User Flow: PWA 웹 푸쉬 / 알림 기능 (U01)

## 🎯 목적
사용자에게 정기적으로 혹은 필요할 때 "화이팅 만마에!"라는 기본 응원 메시지 및 사용자가 직접 작성하여 등록한 커스텀 응원 메시지를 랜덤으로 발송하여 긍정적이고 자신감 넘치는 마인드셋을 가질 수 있도록 유도합니다.
> **타겟 환경 명시**: 본 서비스는 사용자의 주 기기인 **iPhone Xs (iOS)** 환경에 최적화되어 동작해야 합니다. 앱 종료 시 백그라운드 푸시를 위해서는 기기의 "홈 화면에 추가"가 필수적입니다.

## 🔗 관련 요구사항 (RTM 추적)
- **P01**: 홈 화면
- **F01**: 알림 권한 요청 및 상태 표시
- **F02**: 즉시 응원 알림 받기 (등록 메시지 없을 시 기본 메시지, 있을 시 기본+등록 메시지 중 랜덤 발송)
- **F03**: 1시간 주기 응원 알림 스케줄링 (포그라운드/백그라운드 통합)
- **F04**: 백그라운드 푸시 켜기/끄기 스위치 UI 제공
- **F05**: Capacitor Local Notifications 기반 스케줄링 및 권한 제어
- **F06**: 응원 메시지 등록 및 목록 관리 (추가 및 삭제)

## 🔄 사용자 흐름 (Mermaid Diagram)

### 1. 응원 메시지 등록, 관리 및 즉시 알림 받기 흐름 (Flowchart)
```mermaid
flowchart TD
    A["홈 화면 진입"] --> B{"알림 권한 확인"}
    B -- "권한 없음(default)" --> C["알림 권한 허용 버튼 클릭"]
    C --> D["Capacitor 권한 요청 팝업"]
    D -- "허용" --> E["권한 상태 허용 변경"]
    D -- "거부" --> F["권한 상태 거부 표시 및 안내 메시지"]
    B -- "이미 허용됨" --> E
    
    E --> G["응원 메시지 관리 영역 노출"]
    E --> H["백그라운드 푸시 스위치 UI 노출"]
    
    %% 응원 메시지 관리
    G --> I["응원 메시지 입력 및 등록 버튼 클릭"]
    I --> J["localStorage에 메시지 저장 및 목록 갱신"]
    G --> K["등록된 메시지 목록에서 삭제 클릭"]
    K --> L["localStorage에서 제거 및 목록 갱신"]
    
    %% 즉시 응원 알림 받기
    E --> M["'응원 메시지 받기' 버튼 클릭"]
    M --> N{"등록된 커스텀 메시지가 존재하는가?"}
    N -- "아니오" --> O["기본 메시지 ('화이팅 만마에!') 발송 준비"]
    N -- "예" --> P["기본 메시지 + 등록된 커스텀 메시지 목록 구성"]
    P --> Q["목록 중 1개의 메시지를 무작위(Random) 선택하여 발송 준비"]
    O --> R["Capacitor LocalNotifications.schedule 호출 (5초 뒤 발송)"]
    Q --> R
    R --> S["사용자에게 알림 전송 및 수신"]
```

### 2. 응원 메시지 동작 흐름 (Sequence Diagram)
```mermaid
sequenceDiagram
    participant User as 사용자
    participant App as 앱 (React/Capacitor/localStorage)
    participant OS as 기기 OS (iOS/Android)
    
    %% 1. 메시지 등록
    User->>App: 커스텀 응원 메시지 입력 후 등록
    App->>App: localStorage에 새 메시지 추가 저장
    App-->>User: 갱신된 등록 메시지 목록 표시
    
    %% 2. 알림 받기 요청
    User->>App: "응원 메시지 받기" 버튼 클릭
    App->>App: localStorage에서 커스텀 메시지 목록 조회
    alt 커스텀 메시지 목록이 비어 있음
        App->>App: 기본 메시지 선택 ("화이팅 만마에!")
    else 커스텀 메시지 목록이 존재함
        App->>App: 기본 메시지 및 커스텀 메시지 목록 합산
        App->>App: 목록 중 무작위(Random) 1개 선택
    end
    
    App->>OS: LocalNotifications.schedule() (5초 뒤 선택된 메시지 전송)
    OS-->>App: 스케줄 완료 알림
    App-->>User: "5초 뒤 응원 알림이 발송됩니다" 피드백 메시지 표시
    
    Note over OS: 5초 경과 (사용자가 홈 화면으로 이동하거나 백그라운드 전환됨)
    OS->>User: 선택된 응원 메시지로 로컬 알림 노출
```

## 📝 BDD 시나리오 참조
구체적인 동작 명세(Given/When/Then)는 다음 파일을 참조하십시오:
- [docs/user-flow/push_notification.feature](file:///Users/gimjaeman/Desktop/coding/mannlab/dimmer-switch/docs/user-flow/push_notification.feature)

