import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Home from "@/app/page";

// Capacitor Local Notifications Mock
const mockRequestPermissions = vi.fn().mockResolvedValue({ display: "granted" });
const mockCheckPermissions = vi.fn().mockResolvedValue({ display: "prompt" });
const mockSchedule = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn().mockResolvedValue(undefined);

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: (...args: any[]) => mockRequestPermissions(...args),
    checkPermissions: (...args: any[]) => mockCheckPermissions(...args),
    schedule: (...args: any[]) => mockSchedule(...args),
    cancel: (...args: any[]) => mockCancel(...args),
  },
}));

describe("Capacitor PWA 푸쉬 / 알림 기능 테스트", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRequestPermissions.mockClear();
    mockCheckPermissions.mockClear();
    mockSchedule.mockClear();
    mockCancel.mockClear();
    
    // Default mock behavior
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "granted" });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("알림 권한이 설정되지 않은 상태에서 권한을 요청하여 허용하는 경우", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    
    const { getByRole, getByText, getByLabelText } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    const enableBtn = getByRole("button", { name: "알림 활성화" });
    
    await act(async () => {
      fireEvent.click(enableBtn);
    });

    expect(mockRequestPermissions).toHaveBeenCalled();
    expect(getByText("알림이 활성화되었습니다")).toBeInTheDocument();

    const toggleSwitch = getByLabelText("백그라운드 푸시");
    expect(toggleSwitch).toBeInTheDocument();
  });

  it("알림 권한이 설정되지 않은 상태에서 권한 요청을 거부하는 경우", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "prompt" });
    mockRequestPermissions.mockResolvedValue({ display: "denied" });

    const { getByRole, getByText } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    const enableBtn = getByRole("button", { name: "알림 활성화" });

    await act(async () => {
      fireEvent.click(enableBtn);
    });

    expect(mockRequestPermissions).toHaveBeenCalled();
    expect(
      getByText("알림 권한이 거부되었습니다. 브라우저/기기 설정에서 허용해주세요")
    ).toBeInTheDocument();
  });

  it("즉시 테스트 알림 발송을 요청하는 경우", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "granted" });
    
    const { getByRole } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    const testBtn = getByRole("button", { name: "즉시 테스트 알림 받기" });
    await act(async () => {
      fireEvent.click(testBtn);
    });

    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            title: "화이팅 만마에!",
          }),
        ]),
      })
    );
  });

  it("알림 권한이 이미 허용된 상태에서 홈 화면에 진입하는 경우", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "granted" });

    const { getByText, getByLabelText } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    expect(getByText("알림 상태: 활성화됨")).toBeInTheDocument();
    
    const toggleSwitch = getByLabelText("백그라운드 푸시");
    expect(toggleSwitch).toBeInTheDocument();
  });

  it("백그라운드 푸시 알림 설정 토글 (On/Off)", async () => {
    mockCheckPermissions.mockResolvedValue({ display: "granted" });

    const { getByLabelText, getByText } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    const toggleSwitch = getByLabelText("백그라운드 푸시") as HTMLInputElement;

    // === On 동작 테스트 ===
    await act(async () => {
      fireEvent.click(toggleSwitch);
    });

    expect(toggleSwitch).toBeChecked();
    expect(getByText("백그라운드 알림이 켜졌습니다")).toBeInTheDocument();
    
    // 스케줄러 등록 확인
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            id: 1, // 정해진 ID 사용
            title: "화이팅 만마에!",
            schedule: expect.objectContaining({
              every: "hour",
            })
          })
        ])
      })
    );

    // === Off 동작 테스트 ===
    await act(async () => {
      fireEvent.click(toggleSwitch);
    });

    expect(toggleSwitch).not.toBeChecked();
    expect(getByText("백그라운드 알림이 꺼졌습니다")).toBeInTheDocument();
    
    expect(mockCancel).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            id: 1
          })
        ])
      })
    );
  });
});
