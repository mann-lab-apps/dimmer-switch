const webPush = require("web-push");

// 방금 발급한 VAPID 키 설정
const vapidPublicKey = "BHgu5aPshcrPQ-2jjoaT4g-z5zs3VG1imvdctF5WhUx9ubRGCi2HKG19sOhkFwBe0CnBg8eZw0XpWdcGqsc7DHU";
const vapidPrivateKey = "z4lmf8m7vRV6j0vFYtgZe47IHimTSqX5TlAOftnfPAw";

webPush.setVapidDetails(
  "mailto:test@example.com",
  vapidPublicKey,
  vapidPrivateKey
);

// 브라우저 콘솔에서 복사한 구독 객체를 여기에 넣습니다.
// 예: const pushSubscription = {"endpoint":"...","expirationTime":null,"keys":{"p256dh":"...","auth":"..."}}
// const pushSubscription = null; // <--- 여기에 복사한 JSON을 붙여넣으세요!
const pushSubscription = { "endpoint": "https://fcm.googleapis.com/fcm/send/dD8kxBmwRl4:APA91bFbZWiV8ZKUjlC9rCRRNnXPk_fJhqS5W0ZRBv03m9BxIefMiRvYI8OEru59vGuFCEB2k2sR0PcuoVWBrhNkJDbqD4ZUxGKgOu4Z1tenyTlHJHB01oZMJ0afylmpQK83RCtKe32y", "expirationTime": null, "keys": { "p256dh": "BJV2HNi-jz3MmPcExwsFjrFSbqacMDGu0zhSmtLBXy7zN3lW_goBPEpxHp8FGj3q_Jn5wI6wO2AJJ9slA2fTJ9o", "auth": "h9vvZAUVvDIhsZJNhUmXxg" } }

if (!pushSubscription) {
  console.error("❌ 에러: pushSubscription 객체가 비어있습니다. 브라우저 콘솔에서 구독 정보를 복사해 코드를 수정해주세요.");
  process.exit(1);
}

const payload = JSON.stringify({
  title: "백그라운드 푸시 테스트 🚀",
  body: "브라우저가 꺼져있어도 도착했습니다! 화이팅 만마에!"
});

webPush.sendNotification(pushSubscription, payload)
  .then(response => console.log("✅ 백그라운드 푸시 발송 성공!", response))
  .catch(error => console.error("❌ 백그라운드 푸시 발송 실패:", error));
