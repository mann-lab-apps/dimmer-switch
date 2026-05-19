import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Home from "@/app/page";

// Browser Notification Mock
const mockPermission = { value: "default" };
const mockRequestPermission = vi.fn().mockImplementation(() => {
  return Promise.resolve(mockPermission.value);
});

// Service Worker & Push Mock
const mockShowNotification = vi.fn();
const mockServiceWorker = {
  ready: Promise.resolve({
    showNotification: mockShowNotification,
    pushManager: {
      subscribe: vi.fn().mockResolvedValue({ endpoint: "mock-endpoint" }),
      getSubscription: vi.fn().mockResolvedValue(null),
    },
  }),
};

describe("PWA 웹 푸쉬 / 알림 기능 테스트", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: mockRequestPermission,
    });
    vi.stubGlobal("navigator", {
      serviceWorker: mockServiceWorker,
    });
    mockPermission.value = "default";
    mockRequestPermission.mockClear();
    mockShowNotification.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("알림 권한이 설정되지 않은 상태에서 권한을 요청하여 허용하는 경우", async () => {
    // Given 사용자가 홈 화면에 진입했다
    // Given 알림 권한 상태가 "default" 이다
    mockPermission.value = "default";
    const { getByRole, getByText } = render(<Home />);

    // When 사용자가 "알림 활성화" 버튼을 클릭한다
    const enableBtn = getByRole("button", { name: "알림 활성화" });
    
    // And 브라우저 권한 팝업에서 "허용"을 선택한다
    mockPermission.value = "granted";
    await act(async () => {
      fireEvent.click(enableBtn);
    });

    // Then 알림 권한 상태가 "granted" 로 변경된다
    expect(mockRequestPermission).toHaveBeenCalled();
    
    // And "알림이 활성화되었습니다" 메시지가 표시된다
    expect(getByText("알림이 활성화되었습니다")).toBeInTheDocument();

    // And 1시간 주기 응원 알림 스케줄러가 가동된다
    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockShowNotification).toHaveBeenCalledWith(
      "화이팅 만마에!",
      expect.any(Object)
    );
  });

  it("알림 권한이 설정되지 않은 상태에서 권한 요청을 거부하는 경우", async () => {
    // Given 사용자가 홈 화면에 진입했다
    // Given 알림 권한 상태가 "default" 이다
    mockPermission.value = "default";
    const { getByRole, getByText } = render(<Home />);

    // When 사용자가 "알림 활성화" 버튼을 클릭한다
    const enableBtn = getByRole("button", { name: "알림 활성화" });

    // And 브라우저 권한 팝업에서 "거부"를 선택한다
    mockPermission.value = "denied";
    await act(async () => {
      fireEvent.click(enableBtn);
    });

    // Then 알림 권한 상태가 "denied" 로 변경된다
    expect(mockRequestPermission).toHaveBeenCalled();

    // And "알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요" 메시지가 표시된다
    expect(
      getByText("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요")
    ).toBeInTheDocument();
  });

  it("즉시 테스트 알림 발송을 요청하는 경우", async () => {
    // Given 사용자가 홈 화면에 진입했다
    // Given 알림 권한 상태가 "granted" 이다
    vi.stubGlobal("Notification", {
      permission: "granted",
      requestPermission: mockRequestPermission,
    });
    mockPermission.value = "granted";
    
    const { getByRole } = render(<Home />);

    // When 사용자가 "즉시 테스트 알림 받기" 버튼을 클릭한다
    const testBtn = getByRole("button", { name: "즉시 테스트 알림 받기" });
    await act(async () => {
      fireEvent.click(testBtn);
    });

    // Then "화이팅 만마에!" 내용의 로컬 알림이 발송된다
    expect(mockShowNotification).toHaveBeenCalledWith(
      "화이팅 만마에!",
      expect.any(Object)
    );
  });

  it("알림 권한이 이미 허용된 상태에서 홈 화면에 다시 진입하는 경우", async () => {
    // Given 사용자가 홈 화면에 진입했다
    // Given 알림 권한 상태가 이미 "granted" 이다
    vi.stubGlobal("Notification", {
      permission: "granted",
      requestPermission: mockRequestPermission,
    });
    mockPermission.value = "granted";

    const { getByText } = render(<Home />);

    // Then 알림 상태가 "활성화됨"으로 즉시 표시된다
    expect(getByText("알림 상태: 활성화됨")).toBeInTheDocument();

    // And 1시간 주기 응원 알림 스케줄러가 자동으로 가동된다
    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockShowNotification).toHaveBeenCalledWith(
      "화이팅 만마에!",
      expect.any(Object)
    );
  });
});
