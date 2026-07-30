// 앱을 열 때마다(마운트마다) 랜덤으로 하나 골라 상단 배너에 "{이름}, ~~" 형태로 보여줄 응원 문구.
// {name}이 문자열 맨 앞에 오는 걸 가정한 문구들이라 다른 위치엔 넣지 않았음.
const CHEER_TEMPLATES: string[] = [
  "{name}, 오늘도 화이팅! 💪",
  "{name}, 오늘 하루도 잘 해낼 거예요! 🌱",
  "{name}, 시작이 반이에요. 오늘도 힘내요! ✨",
  "{name}, 오늘의 퀘스트도 클리어해봐요! 🎮",
  "{name}, 작은 한 걸음도 멋진 진전이에요! 👣",
  "{name}, 오늘도 최고의 하루 보내요! 🌟",
  "{name}, 커피 한 잔과 함께 힘내봐요! ☕",
  "{name}, 천천히 그리고 꾸준히! 🐢",
  "{name}, 오늘도 잔디 심으러 가볼까요? 🌱",
  "{name}, 오늘 하루도 응원할게요! 📣",
  "{name}, 잘 하고 있어요, 조금만 더! 🍀",
  "{name}, 오늘도 좋은 일만 가득하길! 🍯",
];

export function pickRandomCheerTemplate(): string {
  return CHEER_TEMPLATES[Math.floor(Math.random() * CHEER_TEMPLATES.length)];
}

export function fillCheerTemplate(template: string, name: string): string {
  return template.replace("{name}", name);
}
