# Requirements Traceability Matrix (RTM)

본 문서는 Dimmer Switch (긍정전환 유도 PWA) 프로젝트의 요구사항(Feature) 상태와 테스트 케이스 추적을 위한 마스터 문서입니다.

## 0. Target Environment (타겟 환경)
- **주요 타겟 기기**: iPhone Xs (iOS)
- **주요 제약사항**: iOS에서 백그라운드 푸시 알림을 수신하기 위해서는 반드시 PWA를 **"홈 화면에 추가(Install)"** 한 상태여야 하며, iOS 버전이 16.4 이상이어야 합니다.

## 1. Page List (P)
| ID  | Page Name | Description | Status | Notes |
|:----|:----------|:------------|:-------|:------|
| P01 | 홈 화면 | 부정적 생각을 입력하고 긍정전환을 유도하며, 응원 알림 설정을 관리하는 메인 화면 | Done | |

## 2. Feature List (F) & Mapping
| ID  | Category | Feature (Requirement) | Page ID | Priority | Status | Test Case |
|:----|:---------|:----------------------|:--------|:---------|:-------|:----------|
| F01 | 알림 | 알림 권한 요청 및 상태 표시 | P01 | P0 | Done | `tests/app/push_notification.test.tsx` |
| F02 | 알림 | 즉시 테스트 알림 발송 ("화이팅 만마에!") | P01 | P0 | Done | `tests/app/push_notification.test.tsx` |
| F03 | 알림 | 1시간 주기 응원 알림 스케줄링 | P01 | P0 | WIP | `tests/app/push_notification.test.tsx` |
| F04 | 알림 | 백그라운드 푸시 켜기/끄기 스위치 UI 제공 | P01 | P0 | WIP | `tests/app/push_notification.test.tsx` |
| F05 | 알림 | 서비스 워커 백그라운드 푸시 이벤트 수신 및 처리 | P01 | P0 | Done | `tests/sw/push_notification.test.ts` |
| F06 | 알림 | 백엔드 웹 푸시 구독 등록 및 해제 API | P01 | P0 | WIP | `tests/app/backend_push.test.ts` |
| F07 | 알림 | 매 정각 백엔드 푸시 스케줄러 발송 API | P01 | P0 | WIP | `tests/app/backend_push.test.ts` |

> **Status 속성 가이드:**
> - `Pending`: 작업 전
> - `WIP`: 테스트 작성 및 구현 진행 중
> - `Done`: 테스트 Pass 및 구현 완료
>
