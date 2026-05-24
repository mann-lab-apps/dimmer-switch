import { render, fireEvent, act } from "@testing-library/react";
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
    window.localStorage.clear();
    
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

  it("등록된 커스텀 응원 메시지가 없는 상태에서 응원 메시지 받기를 요청하는 경우", async () => {
    // Given 알림 권한 상태가 "granted" 이다
    mockCheckPermissions.mockResolvedValue({ display: "granted" });
    // And 등록된 커스텀 응원 메시지가 없다
    window.localStorage.clear();

    const { getByRole } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    // When 사용자가 "응원 메시지 받기" 버튼을 클릭한다
    const testBtn = getByRole("button", { name: "응원 메시지 받기" });
    await act(async () => {
      fireEvent.click(testBtn);
    });

    // Then "화이팅 만마에!" 내용의 로컬 알림이 발송된다
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

  it("등록된 커스텀 응원 메시지가 있는 상태에서 응원 메시지 받기를 요청하는 경우", async () => {
    // Given 알림 권한 상태가 "granted" 이다
    mockCheckPermissions.mockResolvedValue({ display: "granted" });
    // And "오늘 하루도 힘내자!" 라는 커스텀 응원 메시지가 등록되어 있다
    window.localStorage.setItem("cheer_messages", JSON.stringify(["오늘 하루도 힘내자!"]));

    const { getByRole } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    // When 사용자가 "응원 메시지 받기" 버튼을 클릭한다
    const testBtn = getByRole("button", { name: "응원 메시지 받기" });
    await act(async () => {
      fireEvent.click(testBtn);
    });

    // Then 기본 메시지 "화이팅 만마에!" 또는 등록된 커스텀 메시지 중 무작위(Random) 1개의 로컬 알림이 발송된다
    expect(mockSchedule).toHaveBeenCalled();
    const scheduledNotification = mockSchedule.mock.calls[0][0].notifications[0];
    const possibleTitles = ["화이팅 만마에!", "오늘 하루도 힘내자!"];
    expect(possibleTitles).toContain(scheduledNotification.title);
  });

  it("커스텀 응원 메시지를 등록하는 경우", async () => {
    // Given 알림 권한 상태가 "granted" 이다
    mockCheckPermissions.mockResolvedValue({ display: "granted" });
    window.localStorage.clear();

    const { getByRole, getByPlaceholderText, getByText } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    // When 사용자가 응원 메시지 입력 필드에 "오늘 하루도 행복하자!"를 입력한다
    const input = getByPlaceholderText("응원 메시지 입력");
    fireEvent.change(input, { target: { value: "오늘 하루도 행복하자!" } });

    // And "추가" 버튼을 클릭한다
    const addBtn = getByRole("button", { name: "추가" });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    // Then 등록된 커스텀 응원 메시지 목록에 "오늘 하루도 행복하자!"가 추가된다
    expect(getByText("오늘 하루도 행복하자!")).toBeInTheDocument();

    // And localStorage에 "오늘 하루도 행복하자!"가 저장된다
    const stored = JSON.parse(window.localStorage.getItem("cheer_messages") || "[]");
    expect(stored).toContain("오늘 하루도 행복하자!");
  });

  it("등록된 커스텀 응원 메시지를 삭제하는 경우", async () => {
    // Given 알림 권한 상태가 "granted" 이다
    mockCheckPermissions.mockResolvedValue({ display: "granted" });
    // And "오늘 하루도 행복하자!" 라는 커스텀 응원 메시지가 등록되어 있다
    window.localStorage.setItem("cheer_messages", JSON.stringify(["오늘 하루도 행복하자!"]));

    const { queryByText, container } = render(<Home />);
    await act(async () => { await Promise.resolve(); });

    // When 사용자가 등록된 메시지 목록에서 "오늘 하루도 행복하자!"의 "삭제" 버튼을 클릭한다
    const messageItem = container.querySelector(".cheer-message-item");
    expect(messageItem).toHaveTextContent("오늘 하루도 행복하자!");
    const deleteBtn = messageItem?.querySelector("button");
    expect(deleteBtn).toHaveTextContent("삭제");

    await act(async () => {
      if (deleteBtn) fireEvent.click(deleteBtn);
    });

    // Then 등록된 커스텀 응원 메시지 목록에서 "오늘 하루도 행복하자!"가 제거된다
    expect(queryByText("오늘 하루도 행복하자!")).not.toBeInTheDocument();

    // And localStorage에서 "오늘 하루도 행복하자!"가 삭제된다
    const stored = JSON.parse(window.localStorage.getItem("cheer_messages") || "[]");
    expect(stored).not.toContain("오늘 하루도 행복하자!");
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
