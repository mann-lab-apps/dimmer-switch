Feature: PWA 웹 푸쉬 / 알림 기능
  사용자에게 정기적으로 응원 메시지를 전송하기 위한 알림 허용 요청, 즉시 테스트 발송, 주기적 알림 스케줄링을 명세합니다.

  Background:
    Given 사용자가 홈 화면에 진입했다

  Scenario: 알림 권한이 설정되지 않은 상태에서 권한을 요청하여 허용하는 경우
    Given 알림 권한 상태가 "default" 이다
    When  사용자가 "알림 활성화" 버튼을 클릭한다
    And   브라우저 권한 팝업에서 "허용"을 선택한다
    Then  알림 권한 상태가 "granted" 로 변경된다
    And   "알림이 활성화되었습니다" 메시지가 표시된다
    And   앱 실행 중에 동작하는 '포그라운드 1시간 주기 스케줄러'가 가동된다
    And   '백그라운드 푸시' 스위치 UI가 화면에 표시된다

  Scenario: 알림 권한이 설정되지 않은 상태에서 권한 요청을 거부하는 경우
    Given 알림 권한 상태가 "default" 이다
    When  사용자가 "알림 활성화" 버튼을 클릭한다
    And   브라우저 권한 팝업에서 "거부"를 선택한다
    Then  알림 권한 상태가 "denied" 로 변경된다
    And   "알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요" 메시지가 표시된다

  Scenario: 즉시 테스트 알림 발송을 요청하는 경우
    Given 알림 권한 상태가 "granted" 이다
    When  사용자가 "즉시 테스트 알림 받기" 버튼을 클릭한다
    Then  "화이팅 만마에!" 내용의 로컬 알림이 발송된다

  Scenario: 알림 권한이 이미 허용된 상태에서 홈 화면에 다시 진입하는 경우
    Given 알림 권한 상태가 이미 "granted" 이다
    Then  알림 상태가 "활성화됨"으로 즉시 표시된다
    And   앱 실행 중에 동작하는 '포그라운드 1시간 주기 스케줄러'가 자동으로 가동된다
    And   '백그라운드 푸시' 스위치 UI가 화면에 표시된다

  Scenario Outline: 백그라운드 푸시 알림 설정 토글
    Given 알림 권한 상태가 "granted" 이다
    When  사용자가 "백그라운드 푸시" 스위치를 "<Action>"으로 토글한다
    Then  백그라운드 푸시 설정이 "<State>" 상태로 변경된다
    And   Capacitor Local Notifications의 주기적 스케줄러가 "<ScheduleAction>" 처리된다
    And   "<Message>" 메시지가 표시된다

    Examples:
      | Action | State    | ScheduleAction | Message                      |
      | On     | 활성화   | 등록(Schedule) | 백그라운드 알림이 켜졌습니다 |
      | Off    | 비활성화 | 취소(Cancel)   | 백그라운드 알림이 꺼졌습니다 |

  Scenario: Capacitor 기반 앱이 백그라운드 상태일 때 정해진 주기에 알림 수신
    Given 백그라운드 푸시가 활성화되어 Capacitor Local Notifications 스케줄이 등록되어 있다
    And   앱이 백그라운드 상태이거나 종료되어 있다
    When  기기에 설정된 스케줄 시간이 도래한다
    Then  기기 자체 OS 스케줄러에 의해 "화이팅 만마에!" 내용의 로컬 알림이 시스템에 노출된다
